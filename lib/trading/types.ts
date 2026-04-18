export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  market_id: string
  option_id: string
  side: OrderSide
  type: OrderType
  price: number // 0-1 para probability markets
  quantity: number
  filled_quantity: number
  status: OrderStatus
  created_at: string
  updated_at: string
}

export interface Trade {
  id: string
  market_id: string
  option_id: string
  buy_order_id: string
  sell_order_id: string
  price: number
  quantity: number
  executed_at: string
}

export interface OrderBookLevel {
  price: number
  quantity: number
  count: number // número de ordens neste preço
}

export interface OrderBookSnapshot {
  market_id: string
  option_id: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
  timestamp: string
}

export interface MatchResult {
  trades: Trade[]
  orders_affected: string[]
  timestamp: string
}
