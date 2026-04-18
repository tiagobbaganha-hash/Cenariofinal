import { supabase } from '@/lib/supabase'

export interface FrontMarket {
  id: string
  title: string
  slug: string
  category: string
  description: string
  status: string
  featured: boolean
  closes_at: string | null
  resolves_at: string | null
  options_count: number
  total_volume?: number
  yes_volume?: number
  no_volume?: number
  yes_odds?: number
  no_odds?: number
}

export async function getFrontMarkets(limit = 100): Promise<FrontMarket[]> {
  try {
    // Use v_front_markets_v4 (or v3 if not available)
    const { data, error } = await supabase
      .from('v_front_markets_v4')
      .select('*')
      .order('featured', { ascending: false })
      .order('closes_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[getFrontMarkets error]', error)
      // Fallback to v3 if v4 doesn't exist
      const { data: fallback, error: fbError } = await supabase
        .from('v_front_markets_v3')
        .select('id, title, slug, category, description, status_text as status, featured, closes_at, resolves_at, options_count')
        .order('featured', { ascending: false })
        .order('closes_at', { ascending: true })
        .limit(limit)

      if (fbError) throw fbError
      return fallback || []
    }

    return data || []
  } catch (error) {
    console.error('[getFrontMarkets]', error)
    return []
  }
}

export async function getFeaturedMarkets(limit = 3): Promise<FrontMarket[]> {
  try {
    const { data, error } = await supabase
      .from('v_front_markets_v4')
      .select('*')
      .eq('featured', true)
      .eq('status', 'open')
      .order('closes_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[getFeaturedMarkets]', error)
    return []
  }
}

export async function getMarketById(id: string): Promise<FrontMarket | null> {
  try {
    const { data, error } = await supabase
      .from('v_front_markets_v4')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('[getMarketById]', error)
    return null
  }
}

export async function getMarketOptions(marketId: string) {
  try {
    const { data, error } = await supabase
      .from('market_options')
      .select('id, title, description, volume, odds, is_winning')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[getMarketOptions]', error)
    return []
  }
}
