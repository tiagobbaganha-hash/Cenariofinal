-- ================================================================
-- CENÁRIOX — FIX PENDÊNCIAS FINAIS
-- Roda no Supabase SQL Editor → New Query → Cole tudo → Run
-- ================================================================
-- PENDÊNCIA 1: Volume R$0
-- PENDÊNCIA 2: Trigger comissão influencer (bug reference_type)
-- PENDÊNCIA 3: Funções core (ensure_wallet, rpc_place_bet)
-- ================================================================


-- ================================================================
-- PARTE 1: COLUNAS QUE PODEM ESTAR FALTANDO
-- ================================================================

-- wallet_ledger: adicionar reference_type e metadata (bug do trigger)
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS reference_type text;
ALTER TABLE wallet_ledger ADD COLUMN IF NOT EXISTS metadata jsonb;

-- markets: colunas de volume e tipo
ALTER TABLE markets ADD COLUMN IF NOT EXISTS total_volume   numeric  DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS bet_count      integer  DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_type    text     DEFAULT 'standard';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS rapid_config   jsonb;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS live_config    jsonb;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS influencer_id  uuid;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS influencer_commission_pct numeric(5,2) DEFAULT 0;

-- profiles: indicação
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_influencer uuid;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by            uuid;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accepted_terms_at      timestamptz;

SELECT '✅ Colunas verificadas' AS passo;


-- ================================================================
-- PARTE 2: FUNÇÕES CORE
-- ================================================================

-- 2a. ensure_wallet
CREATE OR REPLACE FUNCTION public.ensure_wallet_for(p_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, available_balance, locked_balance)
  VALUES (p_uid, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;$$;

-- 2b. rpc_place_bet — principal função de aposta
CREATE OR REPLACE FUNCTION public.rpc_place_bet(p_option_id uuid, p_stake numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid          uuid;
  v_market_id    uuid;
  v_market_status text;
  v_odds         numeric;
  v_before       numeric;
  v_order_id     uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_stake IS NULL OR p_stake <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;

  PERFORM public.ensure_wallet_for(v_uid);

  SELECT mo.market_id, m.status::text, mo.odds
    INTO v_market_id, v_market_status, v_odds
  FROM public.market_options mo
  JOIN public.markets m ON m.id = mo.market_id
  WHERE mo.id = p_option_id LIMIT 1;

  IF v_market_id IS NULL THEN RAISE EXCEPTION 'Opção não encontrada'; END IF;
  IF v_market_status != 'open'  THEN RAISE EXCEPTION 'Mercado fechado'; END IF;

  SELECT available_balance INTO v_before
  FROM public.wallets WHERE user_id = v_uid FOR UPDATE;

  IF v_before < p_stake THEN RAISE EXCEPTION 'Saldo insuficiente'; END IF;

  UPDATE public.wallets SET
    available_balance = available_balance - p_stake,
    locked_balance    = locked_balance    + p_stake,
    updated_at        = now()
  WHERE user_id = v_uid;

  INSERT INTO public.orders (user_id, market_id, option_id, stake_amount, potential_payout, status)
  VALUES (v_uid, v_market_id, p_option_id, p_stake, (p_stake * COALESCE(v_odds, 2.0)), 'open')
  RETURNING id INTO v_order_id;

  INSERT INTO public.wallet_ledger (user_id, entry_type, direction, amount, reference_id)
  VALUES (v_uid, 'bet_place', 'debit', p_stake, v_order_id);

  -- Atualizar volume e contador do mercado
  UPDATE public.markets SET
    total_volume = COALESCE(total_volume, 0) + p_stake,
    bet_count    = COALESCE(bet_count, 0) + 1,
    updated_at   = now()
  WHERE id = v_market_id;

  RETURN jsonb_build_object('order_id', v_order_id, 'success', true);
END;$$;

SELECT '✅ Funções core instaladas' AS passo;


-- ================================================================
-- PARTE 3: RECALCULAR VOLUME DOS MERCADOS EXISTENTES
-- (corrige o R$0 retroativamente em apostas já feitas)
-- ================================================================

UPDATE public.markets m
SET
  total_volume = COALESCE((
    SELECT SUM(stake_amount) FROM public.orders o
    WHERE o.market_id = m.id AND o.status != 'cancelled'
  ), 0),
  bet_count = COALESCE((
    SELECT COUNT(*) FROM public.orders o
    WHERE o.market_id = m.id AND o.status != 'cancelled'
  ), 0);

SELECT '✅ Volume dos mercados recalculado' AS passo;


-- ================================================================
-- PARTE 4: TRIGGER DE COMISSÃO DO INFLUENCER (CORRIGIDO)
-- Bug anterior: usava colunas reference_type/metadata que não existiam
-- ================================================================

CREATE OR REPLACE FUNCTION public.calc_influencer_commission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_influencer_id uuid;
  v_commission_pct numeric;
  v_commission     numeric;
  v_inf_user_id    uuid;
BEGIN
  -- Buscar influencer que indicou o apostador
  SELECT p.referred_by_influencer INTO v_influencer_id
  FROM profiles p WHERE p.id = NEW.user_id;

  IF v_influencer_id IS NULL THEN RETURN NEW; END IF;

  -- Buscar % de comissão e user_id do influencer
  SELECT commission_percent, user_id INTO v_commission_pct, v_inf_user_id
  FROM influencers WHERE id = v_influencer_id AND is_active = true;

  IF v_commission_pct IS NULL OR v_commission_pct <= 0 THEN RETURN NEW; END IF;

  v_commission := NEW.stake_amount * (v_commission_pct / 100.0);

  -- Creditar na wallet do influencer (se ele tem conta)
  IF v_inf_user_id IS NOT NULL THEN
    PERFORM ensure_wallet_for(v_inf_user_id);

    UPDATE wallets
    SET available_balance = available_balance + v_commission
    WHERE user_id = v_inf_user_id;

    -- INSERT com colunas corretas (reference_type e metadata agora existem)
    INSERT INTO wallet_ledger (
      user_id, entry_type, direction, amount,
      reference_id, reference_type, metadata
    ) VALUES (
      v_inf_user_id, 'bonus', 'credit', v_commission,
      NEW.id, 'order',
      jsonb_build_object(
        'type',           'influencer_commission',
        'influencer_id',  v_influencer_id,
        'bettor_id',      NEW.user_id,
        'commission_pct', v_commission_pct
      )
    );
  END IF;

  -- Atualizar stats do influencer
  UPDATE influencers
  SET total_volume    = total_volume    + NEW.stake_amount,
      total_commission = total_commission + v_commission,
      updated_at       = now()
  WHERE id = v_influencer_id;

  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_influencer_commission ON orders;
CREATE TRIGGER trg_influencer_commission
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calc_influencer_commission();

-- Trigger de contagem de indicados
CREATE OR REPLACE FUNCTION public.update_influencer_referred_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.referred_by_influencer IS NOT NULL AND
     (OLD.referred_by_influencer IS NULL OR OLD.referred_by_influencer != NEW.referred_by_influencer)
  THEN
    UPDATE influencers SET total_referred = total_referred + 1
    WHERE id = NEW.referred_by_influencer;
  END IF;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_update_influencer_count ON profiles;
CREATE TRIGGER trg_update_influencer_count
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_referred_count();

SELECT '✅ Trigger de comissão corrigido e instalado' AS passo;


-- ================================================================
-- PARTE 5: RLS — GARANTIR POLICIES CORRETAS
-- ================================================================

-- Wallets: só o dono
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS wallets_own  ON wallets;
CREATE POLICY wallets_own  ON wallets FOR ALL USING (user_id = auth.uid());

-- Orders: dono + admin (SELECT público não necessário — volume está em markets)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_own   ON orders;
DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_own ON orders FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Markets: leitura pública
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS markets_public ON markets;
CREATE POLICY markets_public ON markets FOR SELECT USING (true);

-- Market options: leitura pública
ALTER TABLE market_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS options_public ON market_options;
CREATE POLICY options_public ON market_options FOR SELECT USING (true);

-- Wallet ledger: só o dono
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_own   ON wallet_ledger;
CREATE POLICY ledger_own ON wallet_ledger FOR ALL USING (user_id = auth.uid());

-- Influencers: leitura pública, escrita admin
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS influencers_select ON influencers;
DROP POLICY IF EXISTS influencers_all_admin ON influencers;
DROP POLICY IF EXISTS influencers_select_public ON influencers;
DROP POLICY IF EXISTS influencers_insert_admin ON influencers;
DROP POLICY IF EXISTS influencers_update_admin ON influencers;
CREATE POLICY influencers_select    ON influencers FOR SELECT USING (true);
CREATE POLICY influencers_all_admin ON influencers FOR ALL    USING (is_admin());

SELECT '✅ RLS configurado' AS passo;


-- ================================================================
-- PARTE 6: REALTIME
-- ================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'market_chat'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE market_chat; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications; END IF;
END$$;

SELECT '✅ Realtime ativo' AS passo;


-- ================================================================
-- RESULTADO FINAL
-- ================================================================

SELECT
  '🎯 TODAS AS PENDÊNCIAS RESOLVIDAS!' AS status,
  (SELECT COUNT(*) FROM public.markets WHERE total_volume > 0) AS mercados_com_volume,
  (SELECT COUNT(*) FROM public.orders)                         AS total_apostas,
  (SELECT COALESCE(SUM(total_volume), 0) FROM public.markets)  AS volume_total_plataforma;
