-- ============================================================
-- CENÁRIOX — AI RESOLUTION & NEWS FEED
-- ============================================================

-- Log de resoluções automáticas
CREATE TABLE IF NOT EXISTS ai_resolution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES markets(id),
  resolution_source text, -- 'ai_claude', 'coingecko', 'manual'
  ai_reasoning text,
  resolved_option_id uuid REFERENCES market_options(id),
  confidence numeric, -- 0-1
  raw_response text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_resolution_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS resolution_log_admin ON ai_resolution_log;
CREATE POLICY resolution_log_admin ON ai_resolution_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
DROP POLICY IF EXISTS resolution_log_select ON ai_resolution_log;
CREATE POLICY resolution_log_select ON ai_resolution_log FOR SELECT USING (true);

-- Tabela de feeds de notícias para geração automática
CREATE TABLE IF NOT EXISTS news_market_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL,
  source text,
  url text,
  category text DEFAULT 'Geral',
  ai_generated_market jsonb, -- mercado gerado pela IA
  status text DEFAULT 'pending', -- pending, approved, rejected, published
  market_id uuid REFERENCES markets(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news_market_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS news_queue_admin ON news_market_queue;
CREATE POLICY news_queue_admin ON news_market_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

SELECT '✅ AI Resolution configurado!' as resultado;
