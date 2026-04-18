import { supabase } from '@/lib/supabase'

export interface Position {
  market_id: string
  market_title: string
  option_id: string
  option_label: string
  quantity: number
  avg_price: number
  current_price: number
  unrealized_pnl: number
  unrealized_pnl_percentage: number
}

export interface PortfolioSummary {
  total_invested: number
  total_value: number
  total_unrealized_pnl: number
  total_unrealized_pnl_percentage: number
  positions: Position[]
}

export async function fetchUserPortfolio(user_id: string): Promise<PortfolioSummary> {
  try {
    // Buscar posições do usuário
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        markets(title),
        market_options(label)
      `)
      .eq('user_id', user_id)
      .gt('quantity', 0)

    if (error) throw error

    const formatted: Position[] = positions?.map((p: any) => ({
      market_id: p.market_id,
      market_title: p.markets?.title || 'Unknown',
      option_id: p.option_id,
      option_label: p.market_options?.label || 'Unknown',
      quantity: p.quantity,
      avg_price: p.avg_price,
      current_price: p.current_price || p.avg_price,
      unrealized_pnl: (p.current_price - p.avg_price) * p.quantity,
      unrealized_pnl_percentage: ((p.current_price - p.avg_price) / p.avg_price) * 100,
    })) || []

    const total_invested = formatted.reduce((sum, p) => sum + (p.avg_price * p.quantity), 0)
    const total_value = formatted.reduce((sum, p) => sum + (p.current_price * p.quantity), 0)
    const total_unrealized_pnl = total_value - total_invested
    const total_unrealized_pnl_percentage = (total_unrealized_pnl / total_invested) * 100

    return {
      total_invested,
      total_value,
      total_unrealized_pnl,
      total_unrealized_pnl_percentage,
      positions: formatted,
    }
  } catch (error) {
    console.error('[fetchUserPortfolio]', error)
    return {
      total_invested: 0,
      total_value: 0,
      total_unrealized_pnl: 0,
      total_unrealized_pnl_percentage: 0,
      positions: [],
    }
  }
}
