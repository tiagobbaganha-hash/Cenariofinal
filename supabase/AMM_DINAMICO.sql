-- ============================================================
-- CENÁRIOX — AMM DINÂMICO
-- Odds mudam conforme volume de apostas em cada opção
-- Formula: odds = total_pool / (aposta_na_opcao * (1 - margem))
-- ============================================================

-- 1. Adicionar campos de liquidez nas opções
ALTER TABLE market_options ADD COLUMN IF NOT EXISTS total_staked numeric DEFAULT 0;
ALTER TABLE market_options ADD COLUMN IF NOT EXISTS liquidity_pool numeric DEFAULT 100;

-- 2. Função AMM - calcula odds dinâmicas
CREATE OR REPLACE FUNCTION calculate_amm_odds(
  p_market_id uuid,
  p_option_id uuid,
  p_stake numeric DEFAULT 0
) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE
  v_total_pool numeric;
  v_option_pool numeric;
  v_margin numeric := 0.05; -- 5% margem da plataforma
  v_min_odds numeric := 1.05;
  v_max_odds numeric := 50.0;
  v_odds numeric;
BEGIN
  -- Total apostado em TODAS as opções do mercado
  SELECT COALESCE(SUM(total_staked + liquidity_pool), 200)
  INTO v_total_pool
  FROM market_options WHERE market_id = p_market_id;

  -- Total apostado na opção específica (incluindo nova aposta)
  SELECT COALESCE(total_staked + liquidity_pool, 100) + p_stake
  INTO v_option_pool
  FROM market_options WHERE id = p_option_id;

  IF v_option_pool <= 0 THEN RETURN 2.0; END IF;

  -- Formula AMM: odds = (total_pool / option_pool) * (1 - margem)
  v_odds := (v_total_pool / v_option_pool) * (1 - v_margin);

  -- Limitar odds entre min e max
  v_odds := GREATEST(v_min_odds, LEAST(v_max_odds, v_odds));

  RETURN ROUND(v_odds::numeric, 2);
END;$$;

-- 3. Função principal de aposta COM AMM
CREATE OR REPLACE FUNCTION public.rpc_place_bet(p_option_id uuid, p_stake numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid;
  v_market_id uuid;
  v_status text;
  v_odds numeric;
  v_before numeric;
  v_order_id uuid;
  v_payout numeric;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_stake <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;

  INSERT INTO wallets(user_id, available_balance, locked_balance)
  VALUES(v_uid, 0, 0) ON CONFLICT(user_id) DO NOTHING;

  SELECT mo.market_id, m.status::text
  INTO v_market_id, v_status
  FROM market_options mo
  JOIN markets m ON m.id = mo.market_id
  WHERE mo.id = p_option_id LIMIT 1;

  IF v_market_id IS NULL THEN RAISE EXCEPTION 'Opção não encontrada'; END IF;
  IF v_status != 'open' THEN RAISE EXCEPTION 'Mercado fechado'; END IF;

  -- Calcular odds AMM antes da aposta entrar
  v_odds := calculate_amm_odds(v_market_id, p_option_id, 0);
  v_payout := p_stake * v_odds;

  SELECT available_balance INTO v_before
  FROM wallets WHERE user_id = v_uid FOR UPDATE;

  IF v_before < p_stake THEN
    RAISE EXCEPTION 'Saldo insuficiente (disponível: R$ %)', ROUND(v_before, 2);
  END IF;

  -- Debitar saldo
  UPDATE wallets SET
    available_balance = available_balance - p_stake,
    locked_balance = locked_balance + p_stake,
    updated_at = now()
  WHERE user_id = v_uid;

  -- Criar ordem
  INSERT INTO orders(user_id, market_id, option_id, stake_amount, potential_payout, status)
  VALUES(v_uid, v_market_id, p_option_id, p_stake, v_payout, 'open')
  RETURNING id INTO v_order_id;

  -- Ledger
  INSERT INTO wallet_ledger(user_id, entry_type, direction, amount, reference_id)
  VALUES(v_uid, 'bet_stake', 'debit', p_stake, v_order_id);

  -- Atualizar pool da opção (AMM)
  UPDATE market_options SET
    total_staked = COALESCE(total_staked, 0) + p_stake
  WHERE id = p_option_id;

  -- Recalcular odds de TODAS as opções do mercado
  UPDATE market_options SET
    odds = calculate_amm_odds(v_market_id, id, 0),
    probability = CASE 
      WHEN calculate_amm_odds(v_market_id, id, 0) > 0 
      THEN ROUND((1.0 / calculate_amm_odds(v_market_id, id, 0))::numeric, 4)
      ELSE 0.5 
    END
  WHERE market_id = v_market_id;

  -- Atualizar volume do mercado
  UPDATE markets SET
    total_volume = COALESCE(total_volume, 0) + p_stake,
    bet_count = COALESCE(bet_count, 0) + 1
  WHERE id = v_market_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'odds', v_odds,
    'payout', v_payout,
    'success', true
  );
END;$$;

-- 4. Função para obter odds preview (sem fazer aposta)
CREATE OR REPLACE FUNCTION public.rpc_get_odds_preview(
  p_option_id uuid,
  p_stake numeric DEFAULT 10
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_market_id uuid;
  v_current_odds numeric;
  v_new_odds numeric;
BEGIN
  SELECT market_id INTO v_market_id FROM market_options WHERE id = p_option_id;
  IF v_market_id IS NULL THEN RETURN jsonb_build_object('error', 'Opção não encontrada'); END IF;

  v_current_odds := calculate_amm_odds(v_market_id, p_option_id, 0);
  v_new_odds := calculate_amm_odds(v_market_id, p_option_id, p_stake);

  RETURN jsonb_build_object(
    'current_odds', v_current_odds,
    'after_bet_odds', v_new_odds,
    'payout', p_stake * v_current_odds,
    'price_impact', ROUND(((v_current_odds - v_new_odds) / v_current_odds * 100)::numeric, 2)
  );
END;$$;

SELECT '✅ AMM Dinâmico configurado!' as resultado;
