-- ============================================================
-- CENÁRIOX — FIX GERAL: Comentários + Influencer + Comissão
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. COMENTÁRIOS: recriar tabela e policies corretamente
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  market_id uuid REFERENCES markets(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES community_comments(id),
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select ON community_comments;
DROP POLICY IF EXISTS comments_insert ON community_comments;
DROP POLICY IF EXISTS comments_delete ON community_comments;

CREATE POLICY comments_select ON community_comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON community_comments FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);
CREATE POLICY comments_delete ON community_comments FOR DELETE 
  USING (author_id = auth.uid() OR is_admin());

CREATE INDEX IF NOT EXISTS idx_comments_market ON community_comments(market_id);

-- 2. INFLUENCER: garantir colunas necessárias
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Policies influencers
DROP POLICY IF EXISTS influencers_select_public ON influencers;
DROP POLICY IF EXISTS influencers_insert_admin ON influencers;
DROP POLICY IF EXISTS influencers_update_admin ON influencers;

CREATE POLICY influencers_select ON influencers FOR SELECT USING (true);
CREATE POLICY influencers_all_admin ON influencers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
-- Influencer pode ver/editar seu próprio perfil
CREATE POLICY influencers_own ON influencers FOR SELECT
  USING (user_id = auth.uid());

-- 3. TABELA DE COMISSÃO POR MERCADO
CREATE TABLE IF NOT EXISTS influencer_market_commission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  commission_percent numeric(5,2) NOT NULL DEFAULT 5.00,
  status text DEFAULT 'active',
  total_volume numeric DEFAULT 0,
  total_commission numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(influencer_id, market_id)
);

ALTER TABLE influencer_market_commission ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS imc_admin ON influencer_market_commission;
DROP POLICY IF EXISTS imc_select ON influencer_market_commission;
DROP POLICY IF EXISTS imc_admin_rw ON influencer_market_commission;

CREATE POLICY imc_select ON influencer_market_commission FOR SELECT USING (true);
CREATE POLICY imc_admin_all ON influencer_market_commission FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 4. COMISSÃO: trigger completo de comissionamento por mercado
-- Quando usuário aposta, verifica comissão do influencer DO MERCADO
CREATE OR REPLACE FUNCTION calc_influencer_commission_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_influencer_id uuid;
  v_commission_pct numeric;
  v_commission numeric;
  v_inf_user_id uuid;
BEGIN
  -- Buscar influencer vinculado ao MERCADO
  SELECT imc.influencer_id, imc.commission_percent, i.user_id
  INTO v_influencer_id, v_commission_pct, v_inf_user_id
  FROM influencer_market_commission imc
  JOIN influencers i ON i.id = imc.influencer_id
  WHERE imc.market_id = NEW.market_id AND imc.status = 'active' AND i.is_active = true
  LIMIT 1;

  -- Fallback: influencer do perfil do usuário (indicação)
  IF v_influencer_id IS NULL THEN
    SELECT p.referred_by_influencer, i.commission_percent, i.user_id
    INTO v_influencer_id, v_commission_pct, v_inf_user_id
    FROM profiles p
    JOIN influencers i ON i.id = p.referred_by_influencer
    WHERE p.id = NEW.user_id AND i.is_active = true;
  END IF;

  IF v_influencer_id IS NULL OR v_commission_pct <= 0 THEN RETURN NEW; END IF;

  v_commission := NEW.stake_amount * (v_commission_pct / 100.0);

  -- Atualizar totais do vínculo mercado-influencer
  UPDATE influencer_market_commission
  SET total_volume = total_volume + NEW.stake_amount,
      total_commission = total_commission + v_commission
  WHERE influencer_id = v_influencer_id AND market_id = NEW.market_id;

  -- Atualizar totais gerais do influencer
  UPDATE influencers
  SET total_volume = total_volume + NEW.stake_amount,
      total_commission = total_commission + v_commission
  WHERE id = v_influencer_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_influencer_commission ON orders;
CREATE TRIGGER trg_influencer_commission
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calc_influencer_commission_v2();

-- 5. PROFILES: vincular influencer ao role do usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS influencer_id uuid REFERENCES influencers(id);

-- Quando admin seta role = influencer, atualizar automaticamente
CREATE OR REPLACE FUNCTION sync_influencer_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Se virou influencer, garantir entrada na tabela influencers
  IF NEW.role::text = 'influencer' AND OLD.role::text != 'influencer' THEN
    INSERT INTO influencers (user_id, name, referral_code, commission_percent)
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)),
      upper(replace(split_part(COALESCE(NEW.full_name, NEW.email), '@', 1), ' ', '')) || substr(md5(NEW.id::text), 1, 4),
      5.00
    )
    ON CONFLICT DO NOTHING;
    
    -- Atualizar influencer_id no perfil
    UPDATE profiles SET influencer_id = (SELECT id FROM influencers WHERE user_id = NEW.id LIMIT 1)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_influencer ON profiles;
CREATE TRIGGER trg_sync_influencer
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_influencer_role();

-- 6. BRANDING: garantir colunas necessárias
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS favicon_url text;
ALTER TABLE branding_settings ADD COLUMN IF NOT EXISTS brand_name text;

SELECT '✅ Todos os fixes aplicados com sucesso!' as resultado;
