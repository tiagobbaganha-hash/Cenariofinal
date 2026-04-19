-- ============================================================
-- CENÁRIOX — AMM (AUTOMATED MARKET MAKER)
-- Odds dinâmicas que mudam conforme o volume de apostas
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Função que recalcula odds baseado no volume total por lado
CREATE OR REPLACE FUNCTION public.recalc_market_odds(p_market_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_yes numeric;
  v_total_no numeric;
  v_total numeric;
  v_prob_yes numeric;
  v_prob_no numeric;
  v_min_prob numeric := 0.02;
  v_max_prob numeric := 0.98;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN side = 'yes' THEN stake_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN side = 'no' THEN stake_amount ELSE 0 END), 0)
  INTO v_total_yes, v_total_no
  FROM orders
  WHERE market_id = p_market_id
  AND status = 'open';

  v_total := v_total_yes + v_total_no;

  IF v_total < 1 THEN
    RETURN;
  END IF;

  v_prob_yes := GREATEST(v_min_prob, LEAST(v_max_prob, v_total_yes / v_total));
  v_prob_no := 1 - v_prob_yes;

  UPDATE market_options
  SET probability = v_prob_yes,
      odds = ROUND(1.0 / v_prob_yes, 2)
  WHERE market_id = p_market_id
  AND option_key = 'yes';

  UPDATE market_options
  SET probability = v_prob_no,
      odds = ROUND(1.0 / v_prob_no, 2)
  WHERE market_id = p_market_id
  AND option_key = 'no';
END;
$$;

-- 2. Atualizar rpc_place_bet para recalcular odds após cada aposta
CREATE OR REPLACE FUNCTION public.rpc_place_bet(p_option_id uuid, p_stake numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_market_id uuid;
  v_side_text text;
  v_side public.order_side;
  v_odds numeric;
  v_before numeric;
  v_after numeric;
  v_order_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nao autenticado';
  END IF;
  IF p_stake IS NULL OR p_stake <= 0 THEN
    RAISE EXCEPTION 'Stake invalida';
  END IF;

  PERFORM public.ensure_wallet_for(v_uid);

  SELECT mo.market_id, mo.option_key::text, mo.odds
  INTO v_market_id, v_side_text, v_odds
  FROM public.market_options mo
  JOIN public.markets m ON m.id = mo.market_id
  WHERE mo.id = p_option_id
  AND m.status = 'open'::public.market_status
  LIMIT 1;

  IF v_market_id IS NULL THEN
    RAISE EXCEPTION 'Mercado invalido ou fechado';
  END IF;

  v_side := v_side_text::public.order_side;

  SELECT available_balance
  INTO v_before
  FROM public.wallets
  WHERE user_id = v_uid
  FOR UPDATE;

  IF v_before < p_stake THEN
    RAISE EXCEPTION 'Saldo insuficiente';
  END IF;

  v_after := v_before - p_stake;

  UPDATE public.wallets
  SET available_balance = v_after,
      locked_balance = locked_balance + p_stake,
      updated_at = now()
  WHERE user_id = v_uid;

  INSERT INTO public.orders (
    user_id, market_id, option_id, side, order_type,
    stake_amount, potential_payout, status, created_at, updated_at
  ) VALUES (
    v_uid, v_market_id, p_option_id, v_side, 'market'::public.order_type,
    p_stake, (p_stake * v_odds), 'open'::public.order_status, now(), now()
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.wallet_ledger(
    user_id, entry_type, direction, amount,
    balance_before, balance_after,
    reference_type, reference_id, metadata, created_at
  ) VALUES (
    v_uid, 'bet_lock', 'debit', p_stake,
    v_before, v_after, 'order', v_order_id,
    jsonb_build_object('market_id', v_market_id, 'option_id', p_option_id), now()
  );

  INSERT INTO public.positions(user_id, market_id, side, total_stake, potential_payout, realized_pnl, created_at, updated_at)
  VALUES (v_uid, v_market_id, v_side, p_stake, (p_stake * v_odds), 0, now(), now())
  ON CONFLICT (user_id, market_id, side)
  DO UPDATE SET
    total_stake = public.positions.total_stake + excluded.total_stake,
    potential_payout = public.positions.potential_payout + excluded.potential_payout,
    updated_at = now();

  -- AMM: recalcular odds apos a aposta
  PERFORM public.recalc_market_odds(v_market_id);

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'market_id', v_market_id,
    'side', v_side_text,
    'stake', p_stake,
    'odds', v_odds,
    'balance_before', v_before,
    'balance_after', v_after
  );
END;
$$;

SELECT 'AMM implementado!' as resultado;
