import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type KycLevel = 'none' | 'pending' | 'approved' | 'rejected'

export interface RiskLimit {
  dailyDepositLimit: number
  dailyWithdrawalLimit: number
  monthlyDepositLimit: number
  monthlyWithdrawalLimit: number
  maxTransactionSize: number
  maxBetAmount: number
  minBetAmount: number
}

export const RISK_LIMITS: Record<KycLevel, RiskLimit> = {
  none: {
    dailyDepositLimit: 0,
    dailyWithdrawalLimit: 0,
    monthlyDepositLimit: 0,
    monthlyWithdrawalLimit: 0,
    maxTransactionSize: 0,
    maxBetAmount: 100, // Apenas apostas com saldo virtual
    minBetAmount: 1,
  },
  pending: {
    dailyDepositLimit: 500,
    dailyWithdrawalLimit: 0,
    monthlyDepositLimit: 2000,
    monthlyWithdrawalLimit: 0,
    maxTransactionSize: 500,
    maxBetAmount: 500,
    minBetAmount: 1,
  },
  approved: {
    dailyDepositLimit: 50000,
    dailyWithdrawalLimit: 50000,
    monthlyDepositLimit: 500000,
    monthlyWithdrawalLimit: 500000,
    maxTransactionSize: 50000,
    maxBetAmount: 100000,
    minBetAmount: 1,
  },
  rejected: {
    dailyDepositLimit: 0,
    dailyWithdrawalLimit: 0,
    monthlyDepositLimit: 0,
    monthlyWithdrawalLimit: 0,
    maxTransactionSize: 0,
    maxBetAmount: 100,
    minBetAmount: 1,
  },
}

// Obter limits para um usuário
export async function getUserRiskLimits(userId: string): Promise<RiskLimit | null> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_status')
      .eq('id', userId)
      .single()

    if (!profile) return null

    const kycLevel = (profile.kyc_status as KycLevel) || 'none'
    return RISK_LIMITS[kycLevel]
  } catch (error) {
    console.error('[getUserRiskLimits]', error)
    return null
  }
}

// Verificar se depósito excede limit
export async function checkDepositLimit(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const limits = await getUserRiskLimits(userId)
    if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }

    // Verificar limite de transação
    if (amount > limits.maxTransactionSize) {
      return {
        allowed: false,
        reason: `Limite máximo por transação é R$ ${limits.maxTransactionSize.toLocaleString('pt-BR')}`,
      }
    }

    // Verificar limite diário
    const todayDeposits = await getTodayDeposits(userId)
    if (todayDeposits + amount > limits.dailyDepositLimit) {
      const remaining = limits.dailyDepositLimit - todayDeposits
      return {
        allowed: false,
        reason: `Limite diário atingido. Restante: R$ ${remaining.toLocaleString('pt-BR')}`,
      }
    }

    // Verificar limite mensal
    const monthDeposits = await getMonthDeposits(userId)
    if (monthDeposits + amount > limits.monthlyDepositLimit) {
      const remaining = limits.monthlyDepositLimit - monthDeposits
      return {
        allowed: false,
        reason: `Limite mensal atingido. Restante: R$ ${remaining.toLocaleString('pt-BR')}`,
      }
    }

    return { allowed: true }
  } catch (error: any) {
    console.error('[checkDepositLimit]', error)
    return { allowed: false, reason: 'Erro ao verificar limite' }
  }
}

// Verificar se saque excede limit
export async function checkWithdrawalLimit(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const limits = await getUserRiskLimits(userId)
    if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }

    // Verificar se KYC está aprovado
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_status')
      .eq('id', userId)
      .single()

    if (profile?.kyc_status !== 'approved') {
      return { allowed: false, reason: 'KYC é necessário para fazer saques' }
    }

    // Verificar limite de transação
    if (amount > limits.maxTransactionSize) {
      return {
        allowed: false,
        reason: `Limite máximo por transação é R$ ${limits.maxTransactionSize.toLocaleString('pt-BR')}`,
      }
    }

    // Verificar limite diário
    const todayWithdrawals = await getTodayWithdrawals(userId)
    if (todayWithdrawals + amount > limits.dailyWithdrawalLimit) {
      const remaining = limits.dailyWithdrawalLimit - todayWithdrawals
      return {
        allowed: false,
        reason: `Limite diário atingido. Restante: R$ ${remaining.toLocaleString('pt-BR')}`,
      }
    }

    // Verificar limite mensal
    const monthWithdrawals = await getMonthWithdrawals(userId)
    if (monthWithdrawals + amount > limits.monthlyWithdrawalLimit) {
      const remaining = limits.monthlyWithdrawalLimit - monthWithdrawals
      return {
        allowed: false,
        reason: `Limite mensal atingido. Restante: R$ ${remaining.toLocaleString('pt-BR')}`,
      }
    }

    return { allowed: true }
  } catch (error: any) {
    console.error('[checkWithdrawalLimit]', error)
    return { allowed: false, reason: 'Erro ao verificar limite' }
  }
}

// Verificar se valor da aposta é permitido
export async function checkBetLimit(userId: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const limits = await getUserRiskLimits(userId)
    if (!limits) return { allowed: false, reason: 'Usuário não encontrado' }

    if (amount < limits.minBetAmount) {
      return {
        allowed: false,
        reason: `Aposta mínima é R$ ${limits.minBetAmount.toLocaleString('pt-BR')}`,
      }
    }

    if (amount > limits.maxBetAmount) {
      return {
        allowed: false,
        reason: `Aposta máxima é R$ ${limits.maxBetAmount.toLocaleString('pt-BR')}`,
      }
    }

    return { allowed: true }
  } catch (error: any) {
    console.error('[checkBetLimit]', error)
    return { allowed: false, reason: 'Erro ao verificar limite' }
  }
}

// Helpers para calcular totais
async function getTodayDeposits(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ledger_entries')
      .select('credit')
      .eq('user_id', userId)
      .eq('entry_type', 'deposit')
      .gte('created_at', today.toISOString())

    return data?.reduce((sum, entry) => sum + (entry.credit || 0), 0) ?? 0
  } catch (error) {
    console.error('[getTodayDeposits]', error)
    return 0
  }
}

async function getTodayWithdrawals(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ledger_entries')
      .select('debit')
      .eq('user_id', userId)
      .eq('entry_type', 'withdrawal')
      .gte('created_at', today.toISOString())

    return data?.reduce((sum, entry) => sum + (entry.debit || 0), 0) ?? 0
  } catch (error) {
    console.error('[getTodayWithdrawals]', error)
    return 0
  }
}

async function getMonthDeposits(userId: string): Promise<number> {
  try {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ledger_entries')
      .select('credit')
      .eq('user_id', userId)
      .eq('entry_type', 'deposit')
      .gte('created_at', monthStart.toISOString())

    return data?.reduce((sum, entry) => sum + (entry.credit || 0), 0) ?? 0
  } catch (error) {
    console.error('[getMonthDeposits]', error)
    return 0
  }
}

async function getMonthWithdrawals(userId: string): Promise<number> {
  try {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('ledger_entries')
      .select('debit')
      .eq('user_id', userId)
      .eq('entry_type', 'withdrawal')
      .gte('created_at', monthStart.toISOString())

    return data?.reduce((sum, entry) => sum + (entry.debit || 0), 0) ?? 0
  } catch (error) {
    console.error('[getMonthWithdrawals]', error)
    return 0
  }
}
