-- ============================================================
-- CENÁRIOX — SPRINT 1: HISTÓRICO DE PREÇOS + STORAGE
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de histórico de preços (para gráficos)
CREATE TABLE IF NOT EXISTS public.market_price_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  probability_yes numeric(5,4) NOT NULL DEFAULT 0.5,
  probability_no numeric(5,4) NOT NULL DEFAULT 0.5,
  volume_cumulative numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mph_market_time ON market_price_history (market_id, created_at);

-- RLS
ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY mph_select_public ON market_price_history FOR SELECT USING (true);

-- 2. Trigger: registrar probabilidade a cada aposta
CREATE OR REPLACE FUNCTION public.record_market_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_market_id uuid;
  v_prob_yes numeric;
  v_prob_no numeric;
  v_volume numeric;
BEGIN
  -- Get market_id from the option
  SELECT mo.market_id, mo.probability 
  INTO v_market_id, v_prob_yes
  FROM market_options mo 
  WHERE mo.id = NEW.option_id AND mo.option_key = 'yes';

  IF v_market_id IS NULL THEN
    -- The bet was on 'no', get market_id differently
    SELECT mo.market_id INTO v_market_id
    FROM market_options mo WHERE mo.id = NEW.option_id;
  END IF;

  IF v_market_id IS NULL THEN RETURN NEW; END IF;

  -- Get current probabilities
  SELECT 
    COALESCE(MAX(CASE WHEN option_key = 'yes' THEN probability END), 0.5),
    COALESCE(MAX(CASE WHEN option_key = 'no' THEN probability END), 0.5)
  INTO v_prob_yes, v_prob_no
  FROM market_options WHERE market_id = v_market_id;

  -- Get cumulative volume
  SELECT COALESCE(SUM(stake_amount), 0) INTO v_volume
  FROM orders WHERE market_id = v_market_id;

  -- Record
  INSERT INTO market_price_history (market_id, probability_yes, probability_no, volume_cumulative)
  VALUES (v_market_id, v_prob_yes, v_prob_no, v_volume);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_price ON orders;
CREATE TRIGGER trg_record_price
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION record_market_price();

-- 3. Seed: inserir histórico inicial para mercados existentes
INSERT INTO market_price_history (market_id, probability_yes, probability_no, volume_cumulative, created_at)
SELECT 
  m.id,
  COALESCE(MAX(CASE WHEN mo.option_key = 'yes' THEN mo.probability END), 0.5),
  COALESCE(MAX(CASE WHEN mo.option_key = 'no' THEN mo.probability END), 0.5),
  COALESCE((SELECT SUM(stake_amount) FROM orders WHERE market_id = m.id), 0),
  m.created_at
FROM markets m
JOIN market_options mo ON mo.market_id = m.id
WHERE m.status IN ('open', 'closed', 'resolved')
GROUP BY m.id, m.created_at;

-- 4. Criar bucket de storage para imagens de mercados
-- (Isso precisa ser feito via Dashboard: Storage → New Bucket → 'market-images' → público)

SELECT 'Sprint 1 SQL concluído! Agora crie o bucket market-images no Storage.' as resultado;
