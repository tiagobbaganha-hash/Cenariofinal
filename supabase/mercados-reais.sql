-- ============================================================
-- CENÁRIOX — 20 MERCADOS REAIS BRASILEIROS
-- Execute no SQL Editor do Supabase
-- ============================================================

DO $$
DECLARE m uuid;
BEGIN

-- ==================== POLÍTICA ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'lula-reeleito-2026-' || left(m::text,4), 'Lula será reeleito presidente em 2026?', 'Resolve como SIM se Luiz Inácio Lula da Silva vencer a eleição presidencial de 2026 (1º ou 2º turno). Pesquisa Quaest/abril 2026: Lula lidera 1º turno com 5 pontos de vantagem sobre Flávio Bolsonaro. Fonte: TSE resultado oficial.', 'Política', 'open', true, '2026-10-04 23:59:00', '2026-10-30 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 2.50, 0.40, 0), (m, 'no', 'NÃO', 1.67, 0.60, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'flavio-bolsonaro-presidente-' || left(m::text,4), 'Flávio Bolsonaro será presidente em 2026?', 'Resolve como SIM se Flávio Bolsonaro (PL) vencer a eleição presidencial de 2026. Pesquisas mostram empate técnico com Lula no 2º turno. Jair Bolsonaro está inelegível até 2030. Fonte: TSE resultado oficial.', 'Política', 'open', true, '2026-10-04 23:59:00', '2026-10-30 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 3.33, 0.30, 0), (m, 'no', 'NÃO', 1.43, 0.70, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'caiado-segundo-turno-' || left(m::text,4), 'Caiado chega ao segundo turno em 2026?', 'Resolve como SIM se Ronaldo Caiado (PSD) estiver entre os 2 mais votados no 1º turno da eleição presidencial de 2026. Datafolha/abril: empata com Lula no 2º turno. Fonte: TSE.', 'Política', 'open', false, '2026-10-04 23:59:00', '2026-10-08 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 5.00, 0.20, 0), (m, 'no', 'NÃO', 1.25, 0.80, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'segundo-turno-2026-' || left(m::text,4), 'Haverá segundo turno nas eleições 2026?', 'Resolve como SIM se nenhum candidato obtiver mais de 50% dos votos válidos no 1º turno presidencial. Historicamente, houve 2º turno em todas as eleições desde 2002. Fonte: TSE.', 'Política', 'open', true, '2026-10-04 23:59:00', '2026-10-08 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 1.18, 0.85, 0), (m, 'no', 'NÃO', 6.67, 0.15, 1);

-- ==================== ECONOMIA ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'selic-abaixo-14-dezembro-' || left(m::text,4), 'Selic estará abaixo de 14% em dezembro de 2026?', 'Resolve como SIM se a taxa Selic meta definida pelo COPOM estiver abaixo de 14,00% ao ano na última reunião de 2026. Atualmente em 14,25%. Fonte: BCB/COPOM.', 'Economia', 'open', true, '2026-12-15 23:59:00', '2026-12-20 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 2.00, 0.50, 0), (m, 'no', 'NÃO', 2.00, 0.50, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'dolar-abaixo-550-junho-' || left(m::text,4), 'Dólar fecha abaixo de R$5,50 em junho de 2026?', 'Resolve como SIM se a PTAX de venda do último dia útil de junho/2026 estiver abaixo de R$5,50. Fonte: BCB PTAX.', 'Economia', 'open', false, '2026-06-28 23:59:00', '2026-07-02 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 3.33, 0.30, 0), (m, 'no', 'NÃO', 1.43, 0.70, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'ipca-acima-5-2026-' || left(m::text,4), 'IPCA acumulado ficará acima de 5% em 2026?', 'Resolve como SIM se o IPCA acumulado de janeiro a dezembro de 2026 superar 5,00%. Fonte: IBGE.', 'Economia', 'open', false, '2026-12-28 23:59:00', '2027-01-15 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 1.67, 0.60, 0), (m, 'no', 'NÃO', 2.50, 0.40, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'ibovespa-150k-2026-' || left(m::text,4), 'Ibovespa atinge 150.000 pontos em 2026?', 'Resolve como SIM se o Ibovespa fechar acima de 150.000 pontos em qualquer dia de 2026. Fonte: B3.', 'Economia', 'open', false, '2026-12-28 23:59:00', '2027-01-05 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 2.22, 0.45, 0), (m, 'no', 'NÃO', 1.82, 0.55, 1);

-- ==================== ESPORTES ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'brasil-copa-2026-' || left(m::text,4), 'Brasil vence a Copa do Mundo 2026?', 'Resolve como SIM se a Seleção Brasileira vencer a final da Copa do Mundo FIFA 2026 (EUA/México/Canadá). Fonte: FIFA.', 'Esportes', 'open', true, '2026-07-19 20:00:00', '2026-07-20 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 7.14, 0.14, 0), (m, 'no', 'NÃO', 1.16, 0.86, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'flamengo-brasileirao-2026-' || left(m::text,4), 'Flamengo será campeão do Brasileirão 2026?', 'Resolve como SIM se o Flamengo vencer o Campeonato Brasileiro Série A de 2026. Fonte: CBF.', 'Esportes', 'open', false, '2026-12-05 23:59:00', '2026-12-10 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 5.00, 0.20, 0), (m, 'no', 'NÃO', 1.25, 0.80, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'palmeiras-libertadores-2026-' || left(m::text,4), 'Palmeiras chega à final da Libertadores 2026?', 'Resolve como SIM se o Palmeiras disputar a final da Copa Libertadores 2026. Fonte: CONMEBOL.', 'Esportes', 'open', false, '2026-11-20 23:59:00', '2026-11-25 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 4.00, 0.25, 0), (m, 'no', 'NÃO', 1.33, 0.75, 1);

-- ==================== TECNOLOGIA / CRIPTO ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'bitcoin-100k-maio-' || left(m::text,4), 'Bitcoin atinge US$100K em maio de 2026?', 'Resolve como SIM se o preço do BTC/USD ultrapassar US$100.000 em qualquer momento de maio/2026. Fonte: CoinGecko.', 'Cripto', 'open', false, '2026-05-31 23:59:00', '2026-06-02 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 1.54, 0.65, 0), (m, 'no', 'NÃO', 2.86, 0.35, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'drex-lancamento-2026-' || left(m::text,4), 'DREX (Real Digital) será lançado ao público em 2026?', 'Resolve como SIM se o Banco Central do Brasil lançar oficialmente o DREX para uso do público geral até 31/12/2026. Fase piloto em andamento. Fonte: BCB.', 'Tecnologia', 'open', false, '2026-12-28 23:59:00', '2027-01-10 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 3.33, 0.30, 0), (m, 'no', 'NÃO', 1.43, 0.70, 1);

-- ==================== GEOPOLÍTICA ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'cessar-fogo-russia-ucrania-' || left(m::text,4), 'Haverá cessar-fogo entre Rússia e Ucrânia até dezembro de 2026?', 'Resolve como SIM se houver acordo formal de cessar-fogo entre Rússia e Ucrânia até 31/12/2026, reconhecido pela ONU. Fonte: ONU/agências internacionais.', 'Geopolítica', 'open', false, '2026-12-28 23:59:00', '2027-01-05 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 3.57, 0.28, 0), (m, 'no', 'NÃO', 1.39, 0.72, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'trump-impeachment-2026-' || left(m::text,4), 'Trump sofre impeachment até dezembro de 2026?', 'Resolve como SIM se a Câmara dos Representantes dos EUA votar pelo impeachment de Donald Trump até 31/12/2026. Fonte: Congresso dos EUA.', 'Geopolítica', 'open', false, '2026-12-28 23:59:00', '2027-01-05 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 10.00, 0.10, 0), (m, 'no', 'NÃO', 1.11, 0.90, 1);

-- ==================== ENTRETENIMENTO ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'bbb-27-audiencia-' || left(m::text,4), 'BBB 27 terá audiência média acima de 20 pontos?', 'Resolve como SIM se a audiência média do BBB 27 (Ibope/Kantar) ficar acima de 20 pontos de média. BBB 26 teve audiência sólida. Fonte: Kantar Ibope.', 'Entretenimento', 'open', false, '2027-04-30 23:59:00', '2027-05-15 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 2.00, 0.50, 0), (m, 'no', 'NÃO', 2.00, 0.50, 1);

-- ==================== GERAL ====================

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'populacao-brasil-210m-' || left(m::text,4), 'Censo 2026 confirmará população acima de 210 milhões?', 'Resolve como SIM se o IBGE divulgar resultado do Censo com população brasileira acima de 210 milhões de habitantes. Censo 2022: 203 milhões. Fonte: IBGE.', 'Geral', 'open', false, '2026-12-28 23:59:00', '2027-06-30 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 1.82, 0.55, 0), (m, 'no', 'NÃO', 2.22, 0.45, 1);

m := gen_random_uuid();
INSERT INTO markets (id, slug, title, description, category, status, featured, closes_at, resolves_at)
VALUES (m, 'pix-internacional-2026-' || left(m::text,4), 'PIX internacional estará funcionando até dezembro de 2026?', 'Resolve como SIM se o Banco Central lançar oficialmente o PIX para transferências internacionais até 31/12/2026. Fonte: BCB.', 'Tecnologia', 'open', false, '2026-12-28 23:59:00', '2027-01-10 23:59:00');
INSERT INTO market_options (market_id, option_key, label, odds, probability, sort_order) VALUES
  (m, 'yes', 'SIM', 2.50, 0.40, 0), (m, 'no', 'NÃO', 1.67, 0.60, 1);

END $$;

SELECT COUNT(*) as mercados_criados FROM markets WHERE status = 'open';
