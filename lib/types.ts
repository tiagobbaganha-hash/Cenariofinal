// Supabase view contracts

export interface MarketOption {
  id: string
  label: string
  odds?: number | null
  probability?: number | null
  volume?: number | null
  option_key?: string | null
  sort_order?: number | null
  is_active?: boolean | null
  is_winning?: boolean | null
}

export interface FrontMarket {
  id: string
  slug: string
  title: string
  description?: string | null
  category?: string | null
  image_url?: string | null
  status?: string | null
  status_text?: string | null
  featured?: boolean | null
  opens_at?: string | null
  closes_at?: string | null
  resolves_at?: string | null
  options?: MarketOption[] | null
  options_count?: number | null
  total_volume?: number | null
  bet_count?: number | null
}

export interface LeaderboardRow {
  rank?: number
  user_id: string
  username?: string | null
  name?: string | null
  avatar_url?: string | null
  total_stake?: number
  total_bets?: number
  volume?: number
  wins?: number
  losses?: number
  pnl?: number
  accuracy?: number | null
}

export interface MeProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  username?: string | null
  kyc_status?: 'pending' | 'approved' | 'rejected' | 'not_started' | null
  balance?: number | null
  available_balance?: number | null
  balance_locked?: number | null
  created_at?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body?: string | null
  type: string
  read: boolean
  created_at: string
  link?: string | null
}

export interface AdminKpis {
  total_users: number
  total_markets: number
  active_markets: number
  total_volume: number
  total_deposits: number
  total_withdrawals: number
  total_bets: number
  pending_kyc: number
  pending_deposits: number
  pending_withdrawals: number
}

export interface AdminUser {
  id: string
  email: string
  full_name?: string | null
  username?: string | null
  status?: string
  role?: string
  kyc_status?: string
  balance?: number
  created_at: string
  last_sign_in_at?: string | null
}

export interface CmsPage {
  id: string
  slug: string
  title: string
  content?: string | null
  published: boolean
  updated_at: string
}

export interface AdminBet {
  id: string
  user_id: string
  user_email: string
  market_id: string
  market_title: string
  option_label: string
  stake: number
  odds: number
  potential_return: number
  status: string
  created_at: string
}

export interface AdminTransaction {
  id: string
  user_id: string
  user_email?: string
  type: string
  amount: number
  status: string
  method?: string
  created_at: string
}

export interface AdminWithdrawal {
  id: string
  user_id: string
  user_email?: string
  amount: number
  pix_key?: string
  status: string
  created_at: string
  processed_at?: string | null
}

export interface AdminKycItem {
  id: string
  user_id: string
  user_email: string
  status: string
  documents_url?: string | null
  submitted_at: string
  reviewed_at?: string | null
  rejection_reason?: string | null
}

export interface AdminPromoCode {
  id: string
  code: string
  type: string
  value: number
  active: boolean
  valid_until?: string | null
  uses_count: number
  max_uses?: number | null
  created_at: string
}

export interface AdminReferral {
  id: string
  referrer_id: string
  referrer_email?: string
  referred_id: string
  referred_email?: string
  bonus_paid: number
  created_at: string
}

export interface AdminAsset {
  id: string
  url: string
  filename: string
  mime_type?: string
  size_bytes?: number
  tags?: string[]
  active: boolean
  created_at: string
}

export interface AdminAudit {
  id: string
  admin_id?: string | null
  admin_email?: string | null
  action: string
  resource_type?: string | null
  resource_id?: string | null
  metadata?: any
  created_at: string
}

export type RankingRow = LeaderboardRow
