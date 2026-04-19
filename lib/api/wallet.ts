'use server'

import { createClient } from '@/lib/supabase/server'

export interface WalletData {
  balance: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalDeposited: number
  totalWithdrawn: number
}

export interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout' | 'bonus' | 'fee'
  amount: number
  status: 'pending' | 'completed' | 'failed'
  description: string
  created_at: string
}

// Buscar dados da carteira
export async function getWalletData(): Promise<WalletData | null> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('balance, total_deposited, total_withdrawn')
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    // Criar wallet se nao existir
    await supabase
      .from('wallets')
      .insert({ user_id: user.id, balance: 0 })
    
    return {
      balance: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
    }
  }
  
  const { data: pendingDep } = await supabase
    .from('deposit_requests')
    .select('amount')
    .eq('user_id', user.id)
    .eq('status', 'pending')
  
  const { data: pendingWith } = await supabase
    .from('withdrawal_requests')
    .select('amount')
    .eq('user_id', user.id)
    .eq('status', 'pending')
  
  return {
    balance: parseFloat(wallet?.available_balance || '0'),
    pendingDeposits: (pendingDep || []).reduce((s, d) => s + parseFloat(d.amount || '0'), 0),
    pendingWithdrawals: (pendingWith || []).reduce((s, w) => s + parseFloat(w.amount || '0'), 0),
    totalDeposited: parseFloat(wallet?.total_deposited || '0'),
    totalWithdrawn: parseFloat(wallet?.total_withdrawn || '0'),
  }
}

// Buscar transacoes
export async function getTransactions(limit = 50): Promise<Transaction[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) return []
  
  const descriptions: Record<string, string> = {
    deposit: 'Deposito PIX',
    withdrawal: 'Saque PIX',
    bet: 'Aposta',
    payout: 'Ganho',
    bonus: 'Bonus',
    fee: 'Taxa',
  }
  
  return (data || []).map((t: any) => ({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.credit || t.debit || '0'),
    status: 'completed',
    description: descriptions[t.type] || 'Transacao',
    created_at: t.created_at,
  }))
}

// Solicitar deposito
export async function requestDeposit(amount: number): Promise<{ success: boolean; pixCode?: string; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }
  
  if (amount < 10) return { success: false, error: 'Minimo R$ 10,00' }
  
  const { error } = await supabase
    .from('deposit_requests')
    .insert({ user_id: user.id, amount, status: 'pending', payment_method: 'pix' })
  
  if (error) return { success: false, error: error.message }
  
  // Mock PIX code
  const pixCode = `00020126580014br.gov.bcb.pix0136${user.id.slice(0, 36)}520400005303986540${amount.toFixed(2)}5802BR5925CENARIOX6009SAO PAULO62070503***6304`
  
  return { success: true, pixCode }
}

// Solicitar saque
export async function requestWithdrawal(amount: number, pixKey: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Nao autenticado' }
  
  if (amount < 20) return { success: false, error: 'Minimo R$ 20,00' }
  
  const wallet = await getWalletData()
  if (!wallet || wallet.available_balance < amount) {
    return { success: false, error: 'Saldo insuficiente' }
  }
  
  const { error } = await supabase
    .from('withdrawal_requests')
    .insert({ user_id: user.id, amount, pix_key: pixKey, status: 'pending' })
  
  if (error) return { success: false, error: error.message }
  
  return { success: true }
}
