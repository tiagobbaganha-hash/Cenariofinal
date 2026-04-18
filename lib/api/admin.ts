import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  totalMarkets: number
  activeMarkets: number
  totalUsers: number
  totalVolume: number
}

export interface Market {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: 'draft' | 'open' | 'suspended' | 'closed' | 'resolved' | 'cancelled'
  opens_at: string | null
  closes_at: string | null
  resolves_at: string | null
  featured: boolean
  created_at: string
  created_by: string | null
  total_volume?: number
  bet_count?: number
}

export interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export interface Activity {
  id: string
  type: string
  user_email: string
  market_title: string
  created_at: string
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Usar v_admin_kpis_final para dashboard stats
    const { data: kpis, error } = await supabase
      .from('v_admin_kpis_final')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching KPIs:', error)
      return {
        totalMarkets: 0,
        activeMarkets: 0,
        totalUsers: 0,
        totalVolume: 0,
      }
    }

    return {
      totalMarkets: kpis?.total_markets ?? 0,
      activeMarkets: kpis?.active_markets ?? 0,
      totalUsers: kpis?.total_users ?? 0,
      totalVolume: parseFloat(kpis?.total_volume ?? '0'),
    }
  } catch (error) {
    console.error('[fetchDashboardStats]', error)
    return {
      totalMarkets: 0,
      activeMarkets: 0,
      totalUsers: 0,
      totalVolume: 0,
    }
  }
}

export async function fetchMarkets(limit = 50): Promise<Market[]> {
  try {
    // Usar v_admin_markets_extended para listagem admin
    const { data, error } = await supabase
      .from('v_admin_markets_extended')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    
    return (data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      category: m.category,
      status: m.status,
      opens_at: m.opens_at,
      closes_at: m.closes_at,
      resolves_at: m.resolves_at,
      featured: m.featured,
      created_at: m.created_at,
      created_by: m.created_by,
      total_volume: m.total_volume,
      bet_count: m.bet_count,
    }))
  } catch (error) {
    console.error('[fetchMarkets]', error)
    return []
  }
}

export async function fetchMarketById(id: string): Promise<Market | null> {
  try {
    const { data, error } = await supabase
      .from('v_admin_markets_extended')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('[fetchMarketById]', error)
    return null
  }
}

export async function fetchUsers(limit = 50): Promise<User[]> {
  try {
    // Usar v_admin_users para listagem de usuários
    const { data, error } = await supabase
      .from('v_admin_users')
      .select('id, email, created_at, last_sign_in_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[fetchUsers]', error)
    return []
  }
}

export async function fetchRecentActivity(limit = 10): Promise<Activity[]> {
  try {
    // Usar admin_audit_log para atividade recente
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((log: any) => ({
      id: log.id,
      type: log.action,
      user_email: log.admin_email || 'Sistema',
      market_title: log.resource_id || 'N/A',
      created_at: log.created_at,
    }))
  } catch (error) {
    console.error('[fetchRecentActivity]', error)
    return []
  }
}

export async function createMarket(market: Partial<Market>) {
  try {
    const { data, error } = await supabase
      .from('markets')
      .insert([market])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateMarket(id: string, updates: Partial<Market>) {
  try {
    const { data, error } = await supabase
      .from('markets')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function deleteMarket(id: string) {
  try {
    const { error } = await supabase
      .from('markets')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function archiveMarket(id: string) {
  return updateMarket(id, { status: 'cancelled' })
}

export async function resolveMarket(id: string, winningOptionId: string) {
  try {
    const { data, error } = await supabase
      .rpc('admin_resolve_market_v3', {
        p_market_id: id,
        p_winning_option_id: winningOptionId,
      })

    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
