'use server'

import { createClient } from '@/lib/supabase/server'

export interface FrontMarket {
  id: string
  title: string
  slug: string
  category: string
  description: string
  status: string
  featured: boolean
  image_url?: string
  closes_at: string | null
  resolves_at: string | null
  opens_at: string | null
  options_count: number
  total_volume?: number
  yes_volume?: number
  no_volume?: number
  yes_odds?: number
  no_odds?: number
}

export interface MarketOption {
  id: string
  title: string
  description?: string
  volume: number
  odds: number
  is_winning?: boolean
}

export async function getFrontMarkets(limit = 100, category?: string): Promise<FrontMarket[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('v_front_markets_v4')
    .select('*')
    .eq('status', 'open')
    .order('featured', { ascending: false })
    .order('total_volume', { ascending: false })
    .limit(limit)
  
  if (category && category !== 'todos') {
    query = query.eq('category', category)
  }
  
  const { data, error } = await query

  if (error) {
    console.error('[getFrontMarkets error]', error)
    // Fallback to markets table
    const { data: fallback } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'open')
      .order('featured', { ascending: false })
      .limit(limit)
    return fallback || []
  }

  return data || []
}

export async function getFeaturedMarkets(limit = 6): Promise<FrontMarket[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('v_front_markets_v4')
    .select('*')
    .eq('featured', true)
    .eq('status', 'open')
    .order('total_volume', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getFeaturedMarkets]', error)
    return []
  }
  return data || []
}

export async function getMarketById(id: string): Promise<FrontMarket | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('v_front_markets_v4')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getMarketById]', error)
    return null
  }
  return data || null
}

export async function getMarketBySlug(slug: string): Promise<FrontMarket | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('v_front_markets_v4')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    // Fallback: try markets table
    const { data: fallback } = await supabase
      .from('markets')
      .select('*')
      .eq('slug', slug)
      .single()
    return fallback || null
  }
  return data || null
}

export async function getMarketOptions(marketId: string): Promise<MarketOption[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('market_options')
    .select('id, title, description, volume, odds, is_winning')
    .eq('market_id', marketId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getMarketOptions]', error)
    return []
  }
  return data || []
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('markets')
    .select('category')
    .eq('status', 'open')
  
  if (error) return []
  
  const categories = [...new Set((data || []).map(m => m.category))]
  return categories.filter(Boolean)
}

export async function getPlatformStats() {
  const supabase = await createClient()
  
  const { data: kpis } = await supabase
    .from('v_admin_kpis_final')
    .select('*')
    .single()
  
  if (kpis) {
    return {
      totalMarkets: kpis.total_markets || 0,
      activeMarkets: kpis.active_markets || 0,
      totalUsers: kpis.total_users || 0,
      totalVolume: parseFloat(kpis.total_volume || '0'),
    }
  }
  
  const { count: totalMarkets } = await supabase
    .from('markets')
    .select('*', { count: 'exact', head: true })
  
  const { count: activeMarkets } = await supabase
    .from('markets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
  
  return {
    totalMarkets: totalMarkets || 0,
    activeMarkets: activeMarkets || 0,
    totalUsers: 0,
    totalVolume: 0,
  }
}
