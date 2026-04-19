-- ============================================================
-- CENÁRIOX — FASE 6: VERIFICAÇÃO E CORREÇÃO DE RLS
-- Execute no SQL Editor
-- ============================================================

-- 1. Garantir RLS ativo em tabelas sensíveis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- 2. Profiles: usuário lê/edita só o próprio
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
    CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
  END IF;
END $$;

-- 3. Wallets: usuário lê só a própria
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'wallets_select_own') THEN
    CREATE POLICY wallets_select_own ON wallets FOR SELECT USING (user_id = auth.uid() OR is_admin());
  END IF;
END $$;

-- 4. Orders: usuário lê só as próprias
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_select_own') THEN
    CREATE POLICY orders_select_own ON orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
  END IF;
END $$;

-- 5. Notifications: usuário lê só as próprias
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_notifications' AND policyname = 'notifications_select_own') THEN
    CREATE POLICY notifications_select_own ON user_notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

SELECT 'RLS verificado e corrigido!' as resultado;
