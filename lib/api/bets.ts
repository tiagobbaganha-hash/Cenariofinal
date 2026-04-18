import { supabase } from '@/lib/supabase'

export interface UserBet {
  id: string
  market_title: string
  option_label: string
  stake: number
  odds: number
  potential_return: number
  status: 'pending' | 'won' | 'lost' | 'void'
  created_at: string
  resolved_at?: string
}

export async function fetchUserBets(userId: string, limit = 50): Promise<UserBet[]> {
  try {
    // Query para buscar apostas do usuário
    // Assumindo estrutura: orders -> contains user_id, option_id, stake
    // market_options -> contains market_id
    // markets -> contains title
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        stake,
        created_at,
        market_options(
          odds,
          label,
          market_id,
          markets(title)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Mapear dados para formato UserBet
    return (data || []).map((order: any) => ({
      id: order.id,
      market_title: order.market_options?.markets?.title || 'Mercado desconhecido',
      option_label: order.market_options?.label || 'Opção desconhecida',
      stake: order.stake,
      odds: order.market_options?.odds || 1,
      potential_return: (order.stake || 0) * (order.market_options?.odds || 1),
      status: 'pending' as const,
      created_at: order.created_at,
    }))
  } catch (error) {
    console.error('[fetchUserBets]', error)
    return []
  }
}

export async function fetchUserBetStats(userId: string) {
  try {
    const bets = await fetchUserBets(userId, 1000)

    const total_bets = bets.length
    const total_staked = bets.reduce((sum, b) => sum + b.stake, 0)
    const total_potential = bets.reduce((sum, b) => sum + b.potential_return, 0)

    return {
      total_bets,
      total_staked,
      total_potential,
      average_odds: total_bets > 0 ? total_potential / total_staked : 0,
    }
  } catch (error) {
    console.error('[fetchUserBetStats]', error)
    return {
      total_bets: 0,
      total_staked: 0,
      total_potential: 0,
      average_odds: 0,
    }
  }
}
