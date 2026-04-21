-- ============================================================
-- CENÁRIOX — SQLs CRÍTICOS para o MVP funcionar
-- Cole e rode TUDO no Supabase SQL Editor
-- ============================================================

-- 1. Garantir wallet para usuário
CREATE OR REPLACE FUNCTION public.ensure_wallet_for(p_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, available_balance, locked_balance)
  VALUES (p_uid, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;$$;

-- 2. Função principal de aposta
CREATE OR REPLACE FUNCTION public.rpc_place_bet(p_option_id uuid, p_stake numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid;
  v_market_id uuid;
  v_market_status text;
  v_odds numeric;
  v_before numeric;
  v_order_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_stake IS NULL OR p_stake <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;

  PERFORM public.ensure_wallet_for(v_uid);

  SELECT mo.market_id, m.status::text, mo.odds
  INTO v_market_id, v_market_status, v_odds
  FROM public.market_options mo
  JOIN public.markets m ON m.id = mo.market_id
  WHERE mo.id = p_option_id LIMIT 1;

  IF v_market_id IS NULL THEN RAISE EXCEPTION 'Opção não encontrada'; END IF;
  IF v_market_status != 'open' THEN RAISE EXCEPTION 'Mercado fechado'; END IF;

  SELECT available_balance INTO v_before
  FROM public.wallets WHERE user_id = v_uid FOR UPDATE;

  IF v_before < p_stake THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  UPDATE public.wallets SET
    available_balance = available_balance - p_stake,
    locked_balance = locked_balance + p_stake,
    updated_at = now()
  WHERE user_id = v_uid;

  INSERT INTO public.orders (
    user_id, market_id, option_id, stake_amount, potential_payout, status
  ) VALUES (
    v_uid, v_market_id, p_option_id, p_stake, (p_stake * COALESCE(v_odds, 2.0)), 'open'
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.wallet_ledger (user_id, entry_type, direction, amount, reference_id)
  VALUES (v_uid, 'bet_place', 'debit', p_stake, v_order_id);

  -- Atualizar volume do mercado
  UPDATE public.markets SET
    total_volume = COALESCE(total_volume, 0) + p_stake,
    bet_count = COALESCE(bet_count, 0) + 1,
    updated_at = now()
  WHERE id = v_market_id;

  RETURN jsonb_build_object('order_id', v_order_id, 'success', true);
END;$$;

-- 3. Adicionar colunas se não existem
ALTER TABLE markets ADD COLUMN IF NOT EXISTS total_volume numeric DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS bet_count integer DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_type text DEFAULT 'standard';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS rapid_config jsonb;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS live_config jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- 4. Garantir RLS nas wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallets_own ON wallets;
CREATE POLICY wallets_own ON wallets FOR ALL USING (user_id = auth.uid());

-- 5. RLS nos orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_own ON orders;
CREATE POLICY orders_own ON orders FOR ALL USING (user_id = auth.uid());

-- 6. RLS público nas market_options
ALTER TABLE market_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS options_public ON market_options;
CREATE POLICY options_public ON market_options FOR SELECT USING (true);

-- 7. RLS público nos markets
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS markets_public ON markets;
CREATE POLICY markets_public ON markets FOR SELECT USING (true);

-- 8. Notificações
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL, body text NOT NULL,
  link text, read_at timestamptz, created_at timestamptz DEFAULT now()
);
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notif_own ON user_notifications;
DROP POLICY IF EXISTS notif_insert ON user_notifications;
CREATE POLICY notif_own ON user_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY notif_insert ON user_notifications FOR INSERT WITH CHECK (true);

-- 9. Chat dos mercados
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

-- 10. Realtime
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'market_chat') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE market_chat;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
  END IF;
END$$;

SELECT '✅ Todos os SQLs críticos aplicados!' as resultado;
