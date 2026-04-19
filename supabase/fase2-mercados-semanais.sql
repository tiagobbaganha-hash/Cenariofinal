-- ============================================================
-- CENÁRIOX — MERCADOS SEMANAIS (resolução rápida)
-- Execute no SQL Editor
-- ============================================================

DO $$
DECLARE m_id uuid;
BEGIN

m_id := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, opens_at, closes_at, featured)
VALUES (m_id, 'dolar-acima-580-sexta-' || left(m_id::text, 4), 'Dólar fecha acima de R$5,80 nesta sexta?', 'Resolve como SIM se PTAX venda fechar acima de R$5,80 na sexta-feira. Fonte: BCB.', 'Economia', 'open', now(), now() + interval '5 days', false);
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m_id, 'yes', 'SIM', 2.10, 0.48, 0), (m_id, 'no', 'NÃO', 1.90, 0.52, 1);

m_id := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, opens_at, closes_at, featured)
VALUES (m_id, 'ibovespa-semana-alta-' || left(m_id::text, 4), 'Ibovespa fecha a semana em alta?', 'Resolve como SIM se Ibovespa fechar sexta acima do fechamento de segunda. Fonte: B3.', 'Economia', 'open', now(), now() + interval '5 days', false);
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m_id, 'yes', 'SIM', 1.85, 0.54, 0), (m_id, 'no', 'NÃO', 2.15, 0.46, 1);

m_id := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, opens_at, closes_at, featured)
VALUES (m_id, 'bitcoin-acima-90k-semana-' || left(m_id::text, 4), 'Bitcoin fica acima de US$90K esta semana?', 'Resolve como SIM se BTC não cair abaixo de $90.000 até domingo. Fonte: CoinGecko.', 'Cripto', 'open', now(), now() + interval '7 days', false);
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m_id, 'yes', 'SIM', 1.65, 0.60, 0), (m_id, 'no', 'NÃO', 2.50, 0.40, 1);

m_id := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, opens_at, closes_at, featured)
VALUES (m_id, 'chuva-sp-semana-' || left(m_id::text, 4), 'Chove em São Paulo nesta semana?', 'Resolve como SIM se houver registro de chuva (>1mm) em qualquer dia até domingo na capital SP. Fonte: INMET.', 'Geral', 'open', now(), now() + interval '7 days', false);
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m_id, 'yes', 'SIM', 1.25, 0.80, 0), (m_id, 'no', 'NÃO', 5.00, 0.20, 1);

m_id := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, opens_at, closes_at, featured)
VALUES (m_id, 'flamengo-vence-proximo-' || left(m_id::text, 4), 'Flamengo vence o próximo jogo do Brasileirão?', 'Resolve como SIM se Flamengo vencer (90 minutos). Empate = NÃO. Fonte: CBF.', 'Esportes', 'open', now(), now() + interval '7 days', true);
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m_id, 'yes', 'SIM', 1.75, 0.57, 0), (m_id, 'no', 'NÃO', 2.30, 0.43, 1);

END $$;

SELECT 'Mercados semanais criados!' as resultado;
