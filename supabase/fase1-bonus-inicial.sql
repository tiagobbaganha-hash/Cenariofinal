-- ============================================================
-- CENÁRIOX — FASE 1: SALDO INICIAL R$50 PARA NOVOS USUÁRIOS
-- Execute no Supabase SQL Editor
-- ============================================================

-- Função que credita R$50 quando uma wallet é criada
CREATE OR REPLACE FUNCTION public.grant_initial_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Creditar R$50 na wallet
  UPDATE wallets 
  SET available_balance = available_balance + 50
  WHERE user_id = NEW.user_id;

  -- Registrar no ledger
  INSERT INTO wallet_ledger (
    user_id, entry_type, direction, amount, 
    balance_before, balance_after,
    reference_type, metadata
  ) VALUES (
    NEW.user_id, 'bonus', 'credit', 50,
    0, 50,
    'signup_bonus',
    '{"description": "Bônus de boas-vindas R$50"}'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Trigger: dispara quando nova wallet é inserida
DROP TRIGGER IF EXISTS trg_grant_initial_bonus ON wallets;
CREATE TRIGGER trg_grant_initial_bonus
  AFTER INSERT ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION grant_initial_bonus();

SELECT 'Trigger de bônus R$50 criado!' as resultado;
