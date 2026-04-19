-- ============================================================
-- CENÁRIOX — SPRINT 6: INFLUENCER FOTO + MERCADOS
-- Execute no Supabase SQL Editor
-- ============================================================

-- Adicionar foto ao influencer
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS email text;

-- Tabela de comissão por mercado (proposta do admin)
CREATE TABLE IF NOT EXISTS influencer_market_commission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  commission_percent numeric(5,2) NOT NULL DEFAULT 5.00,
  status text DEFAULT 'active', -- active, paused
  total_volume numeric DEFAULT 0,
  total_commission numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(influencer_id, market_id)
);

ALTER TABLE influencer_market_commission ENABLE ROW LEVEL SECURITY;
CREATE POLICY imc_admin ON influencer_market_commission FOR ALL USING (is_admin());
CREATE POLICY imc_select ON influencer_market_commission FOR SELECT USING (true);

-- View: influencer com mercados vinculados
CREATE OR REPLACE VIEW v_influencer_markets AS
SELECT 
  i.id as influencer_id,
  i.name as influencer_name,
  i.photo_url,
  i.commission_percent as default_commission,
  m.id as market_id,
  m.title as market_title,
  m.category,
  m.status as market_status,
  COALESCE(imc.commission_percent, i.commission_percent) as effective_commission,
  COALESCE(imc.total_volume, 0) as market_volume,
  COALESCE(imc.total_commission, 0) as market_commission
FROM influencers i
LEFT JOIN influencer_market_commission imc ON imc.influencer_id = i.id
LEFT JOIN markets m ON m.id = imc.market_id
WHERE i.is_active = true;

SELECT 'Sprint 6 configurado!' as resultado;
