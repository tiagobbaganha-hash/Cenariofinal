-- ============================================================
-- CENÁRIOX — MERCADOS DE INFLUENCIADORES
-- Execute no SQL Editor
-- ============================================================

-- Adicionar campo de influenciador no mercado
ALTER TABLE markets ADD COLUMN IF NOT EXISTS influencer_id uuid REFERENCES influencers(id);
ALTER TABLE markets ADD COLUMN IF NOT EXISTS influencer_commission_pct numeric(5,2) DEFAULT 0;

-- Atualizar view para incluir dados do influenciador
CREATE OR REPLACE VIEW v_front_markets_v5 AS
SELECT 
  m.id, m.slug, m.title, m.description, m.category, m.image_url,
  m.status, m.status::text AS status_text,
  m.featured, m.opens_at, m.closes_at, m.resolves_at,
  m.created_at, m.updated_at, m.result_option_id,
  m.resolution_outcome, m.resolution_outcome::text AS resolution_outcome_text,
  m.influencer_id,
  i.name AS influencer_name,
  i.social_url AS influencer_social,
  i.referral_code AS influencer_code,
  (SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', mo.id, 'option_key', mo.option_key::text, 'label', mo.label,
    'odds', mo.odds, 'probability', mo.probability,
    'is_active', mo.is_active, 'sort_order', mo.sort_order
  ) ORDER BY mo.sort_order), '[]'::jsonb)
  FROM market_options mo WHERE mo.market_id = m.id AND mo.is_active = true) AS options,
  (SELECT count(*) FROM market_options mo WHERE mo.market_id = m.id AND mo.is_active = true) AS options_count
FROM markets m
LEFT JOIN influencers i ON i.id = m.influencer_id
WHERE m.status = ANY(ARRAY['open','closed','resolved','canceled']::market_status[])
ORDER BY m.featured DESC, m.opens_at DESC NULLS LAST, m.created_at DESC;

SELECT 'Mercados de influenciadores OK!' as resultado;
