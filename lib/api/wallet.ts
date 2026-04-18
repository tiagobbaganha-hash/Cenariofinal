import { supabase } from '@/lib/supabase'

export interface UserBalance {
  userId: string
  balance: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalDeposited: number
  totalWithdrawn: number
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'bet_stake' | 'bet_payout' | 'fee'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description: string
  createdAt: string
  reference?: string
}

export async function getUserBalance(userId: string): Promise<UserBalance | null> {
  try {
    // Buscar saldo atual via ledger
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('debit, credit')
      .eq('user_id', userId)

    if (error) throw error

    const entries = data || []
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)
    const balance = totalCredit - totalDebit

    // Buscar depósitos/saques pendentes
    const { data: pending, error: pendingError } = await supabase
      .from('ledger_entries')
      .select('debit, credit, entry_type')
      .eq('user_id', userId)
      .in('entry_type', ['deposit', 'withdrawal'])
      .eq('status', 'pending')

    if (pendingError) throw pendingError

    const pendingEntries = pending || []
    const pendingDeposits = pendingEntries
      .filter((e) => e.entry_type === 'deposit')
      .reduce((sum, e) => sum + (e.credit || 0), 0)
    const pendingWithdrawals = pendingEntries
      .filter((e) => e.entry_type === 'withdrawal')
      .reduce((sum, e) => sum + (e.debit || 0), 0)

    return {
      userId,
      balance,
      pendingDeposits,
      pendingWithdrawals,
      totalDeposited: totalCredit,
      totalWithdrawn: totalDebit,
    }
  } catch (error) {
    console.error('[getUserBalance]', error)
    return null
  }
}

export async function getUserTransactions(userId: string, limit = 20): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('id, entry_type, debit, credit, created_at, reference_id, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((entry) => ({
      id: entry.id,
      type: entry.entry_type as Transaction['type'],
      amount: entry.credit || entry.debit || 0,
      status: 'completed' as const,
      description: getTransactionDescription(entry.entry_type, entry.metadata),
      createdAt: entry.created_at,
      reference: entry.reference_id,
    }))
  } catch (error) {
    console.error('[getUserTransactions]', error)
    return []
  }
}

function getTransactionDescription(type: string, metadata: any): string {
  const descriptions: Record<string, string> = {
    deposit: 'Depósito',
    withdrawal: 'Saque',
    bet_stake: 'Aposta realizada',
    bet_payout: 'Retorno de aposta',
    fee: 'Taxa',
    adjustment: 'Ajuste',
  }

  return descriptions[type] || 'Transação'
}

export async function requestWithdrawal(userId: string, amount: number, pixKey: string) {
  try {
    if (amount <= 0) throw new Error('Valor deve ser positivo')

    // Verificar saldo
    const balance = await getUserBalance(userId)
    if (!balance || balance.balance < amount) {
      throw new Error('Saldo insuficiente')
    }

    // Criar registro de saque
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert([
        {
          user_id: userId,
          entry_type: 'withdrawal',
          debit: amount,
          credit: 0,
          reference_type: 'withdrawal_request',
          metadata: { pix_key: pixKey },
        },
      ])
      .select()

    if (error) throw error

    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
