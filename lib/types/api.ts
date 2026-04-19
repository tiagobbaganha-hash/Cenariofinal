// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Market types
export interface Market {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  status: MarketStatus
  featured: boolean
  opens_at: string | null
  closes_at: string | null
  resolves_at: string | null
  resolution_source: string | null
  winning_option_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type MarketStatus = 'draft' | 'open' | 'suspended' | 'closed' | 'resolved' | 'cancelled'

export interface MarketOption {
  id: string
  market_id: string
  label: string
  option_key: string
  sort_order: number
  is_active: boolean
}

export interface CreateMarketInput {
  title: string
  description?: string
  category: string
  closes_at: string
  resolves_at: string
  resolution_source?: string
  options: { label: string; key: string }[]
}

// User types
export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  kyc_status: KycStatus
  balance: number
  created_at: string
  updated_at: string
}

export type UserRole = 'user' | 'admin' | 'super_admin'
export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected'

// Transaction types
export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  method: PaymentMethod
  reference: string | null
  created_at: string
  updated_at: string
}

export type TransactionType = 'deposit' | 'withdrawal'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type PaymentMethod = 'pix' | 'card' | 'crypto'

// Ledger types
export interface LedgerEntry {
  id: string
  user_id: string
  entry_type: LedgerEntryType
  debit: number
  credit: number
  balance_after: number
  reference_type: string | null
  reference_id: string | null
  idempotency_key: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export type LedgerEntryType = 'deposit' | 'withdrawal' | 'bet_stake' | 'bet_payout' | 'fee' | 'adjustment'

// Order types
export interface Order {
  id: string
  user_id: string
  market_id: string
  option_id: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit'
  price: number | null
  quantity: number
  filled_quantity: number
  status: OrderStatus
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled'
