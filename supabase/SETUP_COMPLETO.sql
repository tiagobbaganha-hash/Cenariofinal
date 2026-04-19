-- ============================================================
-- CENÁRIOX — SQL COMPLETO DE SETUP
-- Execute TUDO de uma vez no Supabase SQL Editor
-- Seguro para re-executar (IF NOT EXISTS em tudo)
-- ============================================================

-- ===========================================================
-- 1. ROLES DE USUÁRIO (free, pro, influencer, admin)
-- ===========================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS influencer_id uuid;

-- Atualizar admins existentes
UPDATE profiles SET role = 'admin' WHERE role IS NULL OR role = 'user';

-- ===========================================================
-- 2. ASSINATURAS (PRO + INFLUENCER)
-- ===========================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'pro', -- pro, influencer
  status text DEFAULT 'active',      -- active, cancelled, expired
  price_monthly numeric(10,2),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan)
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sub_own ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sub_admin ON subscriptions FOR ALL TO service_role USING (true);

-- View: plano atual do usuário
CREATE OR REPLACE VIEW v_my_plan AS
SELECT 
  p.id,
  p.role,
  p.plan,
  p.plan_expires_at,
  CASE 
    WHEN p.role IN ('admin', 'super_admin') THEN true
    WHEN s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > now()) THEN true
    ELSE false
  END as is_pro,
  CASE
    WHEN p.role IN ('admin', 'super_admin') THEN true
    WHEN p.role = 'influencer' THEN true
    ELSE false
  END as is_influencer,
  CASE
    WHEN p.role IN ('admin', 'super_admin') THEN true
    ELSE false
  END as is_admin
FROM profiles p
LEFT JOIN subscriptions s ON s.user_id = p.id AND s.plan = 'pro' AND s.status = 'active'
WHERE p.id = auth.uid();

-- ===========================================================
-- 3. INFLUENCER COMO ROLE DE USUÁRIO
-- ===========================================================
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS email text;

-- Garantir que influencer sempre tem user_id
-- Quando admin cria influencer, vincula ao usuário

-- Tabela de comissão por mercado
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
CREATE POLICY imc_admin ON influencer_market_commission FOR ALL TO service_role USING (true);
CREATE POLICY imc_select ON influencer_market_commission FOR SELECT TO authenticated USING (true);
CREATE POLICY imc_admin_rw ON influencer_market_commission FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- ===========================================================
-- 4. COMENTÁRIOS NOS MERCADOS
-- ===========================================================
CREATE TABLE IF NOT EXISTS community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  market_id uuid REFERENCES markets(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES community_comments(id),
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_select ON community_comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON community_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY comments_delete ON community_comments FOR DELETE USING (
  author_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
CREATE INDEX IF NOT EXISTS idx_comments_market ON community_comments(market_id);

-- ===========================================================
-- 5. PROPOSTAS DE MERCADO (usuários e influencers)
-- ===========================================================
CREATE TABLE IF NOT EXISTS market_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  category text DEFAULT 'Geral',
  fonte_resolucao text,
  suggested_options text[],
  status text DEFAULT 'pending', -- pending, approved, rejected
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_market_id uuid REFERENCES markets(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE market_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposals_own ON market_proposals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY proposals_insert ON market_proposals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY proposals_admin ON market_proposals FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

-- ===========================================================
-- 6. CACHE IA (análises + sugestões + insights admin)
-- ===========================================================
CREATE TABLE IF NOT EXISTS market_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL,
  analysis jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '6 hours'),
  UNIQUE(market_id)
);
ALTER TABLE market_ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_analysis_read ON market_ai_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY ai_analysis_write ON market_ai_analysis FOR ALL TO service_role USING (true);

CREATE TABLE IF NOT EXISTS user_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestions jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '3 hours'),
  UNIQUE(user_id)
);
ALTER TABLE user_ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY uas_own ON user_ai_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY uas_write ON user_ai_suggestions FOR ALL TO service_role USING (true);

CREATE TABLE IF NOT EXISTS admin_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insights jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);
ALTER TABLE admin_ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY aai_write ON admin_ai_insights FOR ALL TO service_role USING (true);

-- ===========================================================
-- 7. VIEW: MERCADOS VINCULADOS A INFLUENCER
-- ===========================================================
CREATE OR REPLACE VIEW v_influencer_markets AS
SELECT 
  i.id as influencer_id, i.name as influencer_name, i.photo_url,
  i.commission_percent as default_commission,
  m.id as market_id, m.title as market_title, m.category, m.status as market_status,
  COALESCE(imc.commission_percent, i.commission_percent) as effective_commission,
  COALESCE(imc.total_volume, 0) as market_volume,
  COALESCE(imc.total_commission, 0) as market_commission
FROM influencers i
LEFT JOIN influencer_market_commission imc ON imc.influencer_id = i.id
LEFT JOIN markets m ON m.id = imc.market_id;

-- ===========================================================
-- 8. FUNÇÃO: verificar se usuário tem plano PRO
-- ===========================================================
CREATE OR REPLACE FUNCTION is_pro()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN subscriptions s ON s.user_id = p.id AND s.plan = 'pro' AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > now())
    WHERE p.id = auth.uid()
    AND (
      p.role IN ('admin', 'super_admin', 'influencer')
      OR s.id IS NOT NULL
    )
  )
$$;

CREATE OR REPLACE FUNCTION is_influencer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','influencer')
  )
$$;

SELECT '✅ Setup completo do CenárioX executado com sucesso!' as resultado;
