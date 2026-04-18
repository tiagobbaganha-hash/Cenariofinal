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
    // Buscar total de mercados
    const { count: totalMarkets } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })

    // Buscar mercados ativos (status = 'open')
    const { count: activeMarkets } = await supabase
      .from('markets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    // Buscar total de usuarios via auth
    const { count: totalUsers } = await supabase.auth.admin.listUsers()

    // TODO: Calcular volume total de apostas
    const totalVolume = 0

    return {
      totalMarkets: totalMarkets ?? 0,
      activeMarkets: activeMarkets ?? 0,
      totalUsers: totalUsers ?? 0,
      totalVolume,
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

export async function fetchMarkets(limit = 10): Promise<Market[]> {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[fetchMarkets]', error)
    return []
  }
}

export async function fetchUsers(limit = 10): Promise<User[]> {
  try {
    // TODO: Implementar quando houver endpoint REST de usuarios
    // Por enquanto, retorna array vazio
    return []
  } catch (error) {
    console.error('[fetchUsers]', error)
    return []
  }
}

export async function fetchRecentActivity(limit = 10): Promise<Activity[]> {
  try {
    // Buscar trades recentes com informacoes de usuario e mercado
    const { data, error } = await supabase
      .from('trades')
      .select('id, created_at, orders(user_id), market_options(market_id)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // TODO: Mapear para formato de Activity
    return []
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
