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
    // Buscar saldo atual via wallets table
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, total_deposited, total_withdrawn')
      .eq('user_id', userId)
      .single()

    if (walletError) {
      console.error('Wallet not found, creating one:', walletError)
      // Garantir que wallet existe
      const { data: newWallet } = await supabase
        .rpc('ensure_wallet_for', { p_user_id: userId })
      
      return {
        userId,
        balance: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
      }
    }

    // Buscar depósitos/saques pendentes
    const { data: pending } = await supabase
      .from('deposit_requests')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending')

    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending')

    const pendingDeposits = (pending || []).reduce((sum, d) => sum + (d.amount || 0), 0)
    const pendingWithdrawals = (withdrawals || []).reduce((sum, w) => sum + (w.amount || 0), 0)

    return {
      userId,
      balance: wallet?.balance ?? 0,
      pendingDeposits,
      pendingWithdrawals,
      totalDeposited: wallet?.total_deposited ?? 0,
      totalWithdrawn: wallet?.total_withdrawn ?? 0,
    }
  } catch (error) {
    console.error('[getUserBalance]', error)
    return null
  }
}

export async function getUserTransactions(userId: string, limit = 20): Promise<Transaction[]> {
  try {
    // Usar wallet_ledger para histórico completo
    const { data, error } = await supabase
      .from('wallet_ledger')
      .select('id, type, debit, credit, created_at, reference_id, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((entry: any) => ({
      id: entry.id,
      type: entry.type as Transaction['type'],
      amount: entry.credit || entry.debit || 0,
      status: 'completed' as const,
      description: getTransactionDescription(entry.type, entry.metadata),
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

    // Usar RPC para request withdrawal
    const { data, error } = await supabase
      .rpc('request_withdrawal_v2', {
        p_amount: amount,
        p_pix_key: pixKey,
      })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function requestDeposit(userId: string, amount: number) {
  try {
    if (amount <= 0) throw new Error('Valor deve ser positivo')

    // Criar deposit_request
    const { data, error } = await supabase
      .from('deposit_requests')
      .insert([
        {
          user_id: userId,
          amount,
          status: 'pending',
        },
      ])
      .select()

    if (error) throw error

    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
