-- ============================================================
-- CENÁRIOX — AI FEATURES SQL
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Cache de análises IA por mercado (expira em 6h)
CREATE TABLE IF NOT EXISTS market_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL,
  analysis jsonb NOT NULL,
  model text DEFAULT 'claude-sonnet-4',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '6 hours'),
  UNIQUE(market_id)
);

ALTER TABLE market_ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem análises" ON market_ai_analysis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role gerencia análises" ON market_ai_analysis
  FOR ALL TO service_role USING (true);

-- 2. Sugestões IA por usuário (expira em 3h)
CREATE TABLE IF NOT EXISTS user_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestions jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '3 hours'),
  UNIQUE(user_id)
);

ALTER TABLE user_ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprias sugestões" ON user_ai_suggestions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role gerencia sugestões" ON user_ai_suggestions
  FOR ALL TO service_role USING (true);

-- 3. Cache insights admin IA (expira em 1h)
CREATE TABLE IF NOT EXISTS admin_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insights jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour')
);

ALTER TABLE admin_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role gerencia insights" ON admin_ai_insights
  FOR ALL TO service_role USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_market_ai_market_id ON market_ai_analysis(market_id);
CREATE INDEX IF NOT EXISTS idx_market_ai_expires ON market_ai_analysis(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_ai_user_id ON user_ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_ai_expires ON admin_ai_insights(expires_at);
