import { supabase } from '@/lib/supabase'

export interface PlatformAnalytics {
  daily_active_users: number
  new_users_today: number
  total_volume_today: number
  total_volume_all_time: number
  avg_trade_value: number
  markets_by_status: {
    draft: number
    open: number
    closed: number
    resolved: number
  }
  top_markets: Array<{
    id: string
    title: string
    volume: number
    trades: number
  }>
  user_retention: {
    day_1: number
    day_7: number
    day_30: number
  }
}

export async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // DAU - Daily Active Users
    const { count: dau } = await supabase
      .from('ledger_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Novos usuários hoje
    const { count: new_users } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    // Volume hoje
    const { data: volume_today } = await supabase
      .from('ledger_entries')
      .select('debit')
      .eq('entry_type', 'bet_stake')
      .gte('created_at', today.toISOString())

    // Volume total
    const { data: volume_all } = await supabase
      .from('ledger_entries')
      .select('debit')
      .eq('entry_type', 'bet_stake')

    // Mercados por status
    const { data: markets_status } = await supabase
      .from('markets')
      .select('status')

    // Top mercados
    const { data: top_markets_data } = await supabase
      .from('markets')
      .select('id, title')
      .order('featured', { ascending: false })
      .limit(5)

    const total_volume_today = (volume_today || []).reduce((sum, v) => sum + (v.debit || 0), 0)
    const total_volume_all_time = (volume_all || []).reduce((sum, v) => sum + (v.debit || 0), 0)

    const markets_by_status = {
      draft: markets_status?.filter(m => m.status === 'draft').length || 0,
      open: markets_status?.filter(m => m.status === 'open').length || 0,
      closed: markets_status?.filter(m => m.status === 'closed').length || 0,
      resolved: markets_status?.filter(m => m.status === 'resolved').length || 0,
    }

    return {
      daily_active_users: dau || 0,
      new_users_today: new_users || 0,
      total_volume_today,
      total_volume_all_time,
      avg_trade_value: total_volume_today > 0 ? total_volume_today / (dau || 1) : 0,
      markets_by_status,
      top_markets: (top_markets_data || []).map(m => ({
        id: m.id,
        title: m.title,
        volume: 0, // TODO: calcular volume por mercado
        trades: 0,
      })),
      user_retention: {
        day_1: 0, // TODO: calcular retention
        day_7: 0,
        day_30: 0,
      },
    }
  } catch (error) {
    console.error('[fetchPlatformAnalytics]', error)
    return {
      daily_active_users: 0,
      new_users_today: 0,
      total_volume_today: 0,
      total_volume_all_time: 0,
      avg_trade_value: 0,
      markets_by_status: { draft: 0, open: 0, closed: 0, resolved: 0 },
      top_markets: [],
      user_retention: { day_1: 0, day_7: 0, day_30: 0 },
    }
  }
}
