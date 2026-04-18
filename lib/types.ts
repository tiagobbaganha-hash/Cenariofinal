export type MarketOption = {
  id: string
  odds: number
  label: string
  is_active: boolean
  option_key: 'yes' | 'no'
  sort_order: number
  probability: number | null
}

export type FrontMarket = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  image_url: string | null
  status_text: string
  featured: boolean
  opens_at: string | null
  closes_at: string | null
  resolves_at: string | null
  options: MarketOption[]
  options_count: number
}

export type LeaderRow = {
  user_id: string
  name: string | null
  total_stake: number
  total_bets: number
}
