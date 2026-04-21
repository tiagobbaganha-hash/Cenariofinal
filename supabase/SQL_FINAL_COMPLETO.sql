-- ============================================================
-- CENÁRIOX — SQL FINAL COMPLETO
-- Cole e execute TODO no Supabase SQL Editor
-- ============================================================

-- 1. Tabela de comentários dos mercados
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES markets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  author_name text,
  author_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comments_select ON community_comments;
DROP POLICY IF EXISTS comments_insert ON community_comments;
DROP POLICY IF EXISTS comments_delete ON community_comments;
CREATE POLICY comments_select ON community_comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY comments_delete ON community_comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- 2. Tabela de posts da comunidade
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  market_id uuid REFERENCES markets(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS posts_select ON community_posts;
DROP POLICY IF EXISTS posts_insert ON community_posts;
CREATE POLICY posts_select ON community_posts FOR SELECT USING (true);
CREATE POLICY posts_insert ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. View de posts da comunidade
CREATE OR REPLACE VIEW v_community_posts AS
SELECT 
  cp.id, cp.title, cp.content, cp.is_pinned, cp.created_at, cp.market_id,
  p.full_name AS author_name, p.username AS author_username,
  m.title AS market_title, m.slug AS market_slug,
  (SELECT COUNT(*) FROM community_comments cc WHERE cc.market_id = cp.id) AS comments_count
FROM community_posts cp
LEFT JOIN profiles p ON p.id = cp.user_id
LEFT JOIN markets m ON m.id = cp.market_id
ORDER BY cp.is_pinned DESC, cp.created_at DESC;

-- 4. Chat ao vivo nos mercados
CREATE TABLE IF NOT EXISTS market_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(message) >= 1 AND length(message) <= 500),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE market_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_select ON market_chat;
DROP POLICY IF EXISTS chat_insert ON market_chat;
CREATE POLICY chat_select ON market_chat FOR SELECT USING (true);
CREATE POLICY chat_insert ON market_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Notificações
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_own ON user_notifications;
DROP POLICY IF EXISTS notif_insert ON user_notifications;
CREATE POLICY notif_own ON user_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY notif_insert ON user_notifications FOR INSERT WITH CHECK (true);

-- 6. Colunas necessárias nas tabelas
ALTER TABLE markets ADD COLUMN IF NOT EXISTS total_volume numeric DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS bet_count integer DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_type text DEFAULT 'standard';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS rapid_config jsonb;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS live_config jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address jsonb;

-- 7. Função principal de aposta
CREATE OR REPLACE FUNCTION public.rpc_place_bet(p_option_id uuid, p_stake numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid; v_market_id uuid; v_status text;
  v_odds numeric; v_before numeric; v_order_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_stake <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  
  INSERT INTO wallets(user_id, available_balance, locked_balance)
  VALUES(v_uid, 0, 0) ON CONFLICT(user_id) DO NOTHING;
  
  SELECT mo.market_id, m.status::text, mo.odds
  INTO v_market_id, v_status, v_odds
  FROM market_options mo
  JOIN markets m ON m.id = mo.market_id
  WHERE mo.id = p_option_id LIMIT 1;
  
  IF v_market_id IS NULL THEN RAISE EXCEPTION 'Opção não encontrada'; END IF;
  IF v_status != 'open' THEN RAISE EXCEPTION 'Mercado fechado'; END IF;
  
  SELECT available_balance INTO v_before
  FROM wallets WHERE user_id = v_uid FOR UPDATE;
  
  IF v_before < p_stake THEN RAISE EXCEPTION 'Saldo insuficiente (disponível: R$ %)', v_before; END IF;
  
  UPDATE wallets SET
    available_balance = available_balance - p_stake,
    locked_balance = locked_balance + p_stake,
    updated_at = now()
  WHERE user_id = v_uid;
  
  INSERT INTO orders(user_id, market_id, option_id, stake_amount, potential_payout, status)
  VALUES(v_uid, v_market_id, p_option_id, p_stake, p_stake * COALESCE(v_odds, 2.0), 'open')
  RETURNING id INTO v_order_id;
  
  INSERT INTO wallet_ledger(user_id, entry_type, direction, amount, reference_id)
  VALUES(v_uid, 'bet_place', 'debit', p_stake, v_order_id);
  
  UPDATE markets SET
    total_volume = COALESCE(total_volume, 0) + p_stake,
    bet_count = COALESCE(bet_count, 0) + 1
  WHERE id = v_market_id;
  
  RETURN jsonb_build_object('order_id', v_order_id, 'success', true);
END;$$;

-- 8. Atualizar entry_type nulo no ledger existente
UPDATE wallet_ledger SET entry_type = 
  CASE 
    WHEN direction = 'credit' AND entry_type IS NULL THEN 'deposit'
    WHEN direction = 'debit' AND entry_type IS NULL THEN 'bet_place'
    ELSE entry_type
  END
WHERE entry_type IS NULL;

-- 9. Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'market_chat') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE market_chat;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  END IF;
END$$;

-- 10. RLS básica nos mercados
DROP POLICY IF EXISTS markets_public ON markets;
CREATE POLICY markets_public ON markets FOR SELECT USING (true);
DROP POLICY IF EXISTS options_public ON market_options;  
CREATE POLICY options_public ON market_options FOR SELECT USING (true);

SELECT '✅ Tudo configurado! Apostas, comentários e chat prontos.' as resultado;
