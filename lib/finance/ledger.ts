import { supabase } from '@/lib/supabase'

export type LedgerEntryType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'bet_stake' 
  | 'bet_payout' 
  | 'fee' 
  | 'adjustment'

export interface LedgerEntry {
  id: string
  user_id: string
  entry_type: LedgerEntryType
  debit: number
  credit: number
  balance_after: number
  currency: string
  reference_type?: string
  reference_id?: string
  idempotency_key?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface LedgerTransaction {
  amount: number
  type: LedgerEntryType
  userId: string
  referenceType?: string
  referenceId?: string
  metadata?: Record<string, any>
  idempotencyKey?: string
}

// Registrar uma entrada de débito
export async function recordDebit(
  userId: string,
  amount: number,
  type: LedgerEntryType,
  options?: {
    referenceType?: string
    referenceId?: string
    metadata?: Record<string, any>
    idempotencyKey?: string
  }
) {
  return recordLedgerEntry({
    userId,
    amount,
    type,
    isDebit: true,
    ...options,
  })
}

// Registrar uma entrada de crédito
export async function recordCredit(
  userId: string,
  amount: number,
  type: LedgerEntryType,
  options?: {
    referenceType?: string
    referenceId?: string
    metadata?: Record<string, any>
    idempotencyKey?: string
  }
) {
  return recordLedgerEntry({
    userId,
    amount,
    type,
    isDebit: false,
    ...options,
  })
}

// Registrar transação (usar para operações simples)
async function recordLedgerEntry(
  params: {
    userId: string
    amount: number
    type: LedgerEntryType
    isDebit: boolean
    referenceType?: string
    referenceId?: string
    metadata?: Record<string, any>
    idempotencyKey?: string
  }
) {
  try {
    // Se houver idempotency key, verificar se já existe
    if (params.idempotencyKey) {
      const { data: existing } = await supabase
        .from('ledger_entries')
        .select('id')
        .eq('idempotency_key', params.idempotencyKey)
        .single()

      if (existing) {
        console.log('[recordLedgerEntry] Idempotency key já existe, retornando entrada existente')
        return { data: existing, error: null }
      }
    }

    // Buscar saldo atual do usuário
    const { data: latestEntry } = await supabase
      .from('ledger_entries')
      .select('balance_after')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const currentBalance = latestEntry?.balance_after ?? 0
    const debit = params.isDebit ? params.amount : 0
    const credit = !params.isDebit ? params.amount : 0
    const balanceAfter = currentBalance - debit + credit

    // Verificar se o saldo ficaria negativo (para débitos)
    if (params.isDebit && balanceAfter < 0) {
      throw new Error('Saldo insuficiente para esta operação')
    }

    // Inserir entrada de ledger
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert([
        {
          user_id: params.userId,
          entry_type: params.type,
          debit,
          credit,
          balance_after: balanceAfter,
          currency: 'BRL',
          reference_type: params.referenceType,
          reference_id: params.referenceId,
          idempotency_key: params.idempotencyKey,
          metadata: params.metadata,
        },
      ])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Obter saldo atual de um usuário
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    return data?.balance ?? 0
  } catch (error) {
    console.error('[getUserBalance]', error)
    return 0
  }
}

// Obter histórico de ledger de um usuário
export async function getUserLedgerHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<LedgerEntry[]> {
  try {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[getUserLedgerHistory]', error)
    return []
  }
}

// Obter estatísticas de ledger
export async function getLedgerStats(userId: string) {
  try {
    const { data: entries } = await supabase
      .from('ledger_entries')
      .select('entry_type, debit, credit')
      .eq('user_id', userId)

    if (!entries) return null

    const stats = {
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalBetStake: 0,
      totalBetPayout: 0,
      totalFees: 0,
    }

    entries.forEach((entry) => {
      switch (entry.entry_type) {
        case 'deposit':
          stats.totalDeposits += entry.credit
          break
        case 'withdrawal':
          stats.totalWithdrawals += entry.debit
          break
        case 'bet_stake':
          stats.totalBetStake += entry.debit
          break
        case 'bet_payout':
          stats.totalBetPayout += entry.credit
          break
        case 'fee':
          stats.totalFees += entry.debit
          break
      }
    })

    return stats
  } catch (error) {
    console.error('[getLedgerStats]', error)
    return null
  }
}
