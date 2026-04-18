'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserBet {
  id: string
  market_id: string
  market_title: string
  option_id: string
  option_label: string
  stake: number
  odds: number
  potential_return: number
  status: 'pending' | 'won' | 'lost' | 'void'
  created_at: string
  resolved_at?: string
}

export interface PlaceBetResult {
  success: boolean
  orderId?: string
  error?: string
}

// Fazer aposta
export async function placeBet(optionId: string, stake: number): Promise<PlaceBetResult> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Usuario nao autenticado' }
  }
  
  if (stake < 1) {
    return { success: false, error: 'Valor minimo de R$ 1,00' }
  }
  
  // Chamar RPC place_order
  const { data, error } = await supabase.rpc('place_order', {
    p_market_option_id: optionId,
    p_stake: stake,
  })
  
  if (error) {
    console.error('[placeBet] Error:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, orderId: data?.order_id }
}

// Buscar apostas do usuario
export async function fetchUserBets(limit = 50): Promise<UserBet[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      stake,
      status,
      created_at,
      market_options (
        id,
        title,
        odds,
        markets (
          id,
          title
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[fetchUserBets]', error)
    return []
  }

  return (data || []).map((order: any) => ({
    id: order.id,
    market_id: order.market_options?.markets?.id,
    market_title: order.market_options?.markets?.title || 'Mercado',
    option_id: order.market_options?.id,
    option_label: order.market_options?.title || 'Opcao',
    stake: parseFloat(order.stake || '0'),
    odds: parseFloat(order.market_options?.odds || '1'),
    potential_return: parseFloat(order.stake || '0') * parseFloat(order.market_options?.odds || '1'),
    status: order.status || 'pending',
    created_at: order.created_at,
  }))
}

// Buscar estatisticas de apostas do usuario
export async function fetchUserBetStats() {
  const bets = await fetchUserBets(1000)

  const total_bets = bets.length
  const total_staked = bets.reduce((sum, b) => sum + b.stake, 0)
  const total_potential = bets.reduce((sum, b) => sum + b.potential_return, 0)
  const won_bets = bets.filter(b => b.status === 'won').length
  const win_rate = total_bets > 0 ? (won_bets / total_bets) * 100 : 0

  return {
    total_bets,
    total_staked,
    total_potential,
    won_bets,
    win_rate,
    average_odds: total_bets > 0 ? total_potential / total_staked : 0,
  }
}

// Buscar saldo do usuario
export async function getUserBalance(): Promise<number> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  
  const { data } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()
  
  return parseFloat(data?.balance || '0')
}
