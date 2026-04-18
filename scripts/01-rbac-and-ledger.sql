-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis de Usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'none',
  kyc_verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  CONSTRAINT valid_kyc_status CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected'))
);

-- Tabela de Audit Log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created_at (created_at)
);

-- Tabela de Ledger (Double-Entry Accounting)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL,
  debit NUMERIC(20, 8) NOT NULL DEFAULT 0,
  credit NUMERIC(20, 8) NOT NULL DEFAULT 0,
  balance_after NUMERIC(20, 8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  reference_type VARCHAR(50),
  reference_id UUID,
  idempotency_key VARCHAR(255) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  INDEX idx_ledger_user_id (user_id),
  INDEX idx_ledger_created_at (created_at),
  INDEX idx_ledger_idempotency_key (idempotency_key)
);

-- View para saldo atual por usuário
CREATE OR REPLACE VIEW public.user_balances AS
SELECT 
  user_id,
  SUM(CASE WHEN entry_type IN ('deposit', 'bet_payout') THEN credit ELSE 0 END) -
  SUM(CASE WHEN entry_type IN ('withdrawal', 'bet_stake', 'fee') THEN debit ELSE 0 END) as balance
FROM ledger_entries
GROUP BY user_id;

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Policies para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Super admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.user_profiles WHERE role = 'super_admin')
  );

-- Policies para audit_logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'super_admin'))
  );

-- Policies para ledger_entries
CREATE POLICY "Users can view own ledger" ON public.ledger_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ledgers" ON public.ledger_entries
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.user_profiles WHERE role IN ('admin', 'super_admin'))
  );
