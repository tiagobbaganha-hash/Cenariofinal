-- ============================================================
-- CENÁRIOX — SPRINT 2: SISTEMA DE INFLUENCIADORES
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela de influenciadores
CREATE TABLE IF NOT EXISTS public.influencers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  social_url text,
  referral_code text UNIQUE NOT NULL,
  commission_percent numeric(5,2) DEFAULT 5.00,
  is_active boolean DEFAULT true,
  total_referred integer DEFAULT 0,
  total_volume numeric DEFAULT 0,
  total_commission numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencers_code ON influencers(referral_code);
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY influencers_select_public ON influencers FOR SELECT USING (true);
CREATE POLICY influencers_insert_admin ON influencers FOR INSERT WITH CHECK (is_admin());
CREATE POLICY influencers_update_admin ON influencers FOR UPDATE USING (is_admin());

-- 2. Adicionar campo de influencer no perfil do usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_influencer uuid REFERENCES influencers(id);

-- 3. Trigger: quando usuário aposta, calcular comissão do influencer
CREATE OR REPLACE FUNCTION public.calc_influencer_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_influencer_id uuid;
  v_commission_pct numeric;
  v_commission numeric;
  v_inf_user_id uuid;
BEGIN
  -- Verificar se o usuário que apostou foi indicado por influencer
  SELECT p.referred_by_influencer INTO v_influencer_id
  FROM profiles p WHERE p.id = NEW.user_id;

  IF v_influencer_id IS NULL THEN RETURN NEW; END IF;

  -- Buscar % de comissão e user_id do influencer
  SELECT commission_percent, user_id INTO v_commission_pct, v_inf_user_id
  FROM influencers WHERE id = v_influencer_id AND is_active = true;

  IF v_commission_pct IS NULL OR v_commission_pct <= 0 THEN RETURN NEW; END IF;

  -- Calcular comissão
  v_commission := NEW.stake_amount * (v_commission_pct / 100);

  -- Se influencer tem conta, creditar na wallet
  IF v_inf_user_id IS NOT NULL THEN
    PERFORM ensure_wallet_for(v_inf_user_id);
    
    UPDATE wallets 
    SET available_balance = available_balance + v_commission
    WHERE user_id = v_inf_user_id;

    INSERT INTO wallet_ledger (user_id, entry_type, direction, amount, reference_type, reference_id, metadata)
    VALUES (v_inf_user_id, 'bonus', 'credit', v_commission, 'order', NEW.id,
      jsonb_build_object('type', 'influencer_commission', 'influencer_id', v_influencer_id, 'bettor_id', NEW.user_id));
  END IF;

  -- Atualizar stats do influencer
  UPDATE influencers 
  SET total_volume = total_volume + NEW.stake_amount,
      total_commission = total_commission + v_commission,
      updated_at = now()
  WHERE id = v_influencer_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_influencer_commission ON orders;
CREATE TRIGGER trg_influencer_commission
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION calc_influencer_commission();

-- 4. Atualizar contagem de indicados quando perfil é vinculado
CREATE OR REPLACE FUNCTION public.update_influencer_referred_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.referred_by_influencer IS NOT NULL AND 
     (OLD.referred_by_influencer IS NULL OR OLD.referred_by_influencer != NEW.referred_by_influencer) THEN
    UPDATE influencers SET total_referred = total_referred + 1 WHERE id = NEW.referred_by_influencer;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_influencer_count ON profiles;
CREATE TRIGGER trg_update_influencer_count
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_influencer_referred_count();

SELECT 'Sistema de influenciadores criado!' as resultado;
