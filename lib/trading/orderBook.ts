import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import type { Order, OrderBookLevel, OrderBookSnapshot, Trade } from './types'

export class OrderBook {
  private market_id: string
  private option_id: string
  private bids: Map<number, { quantity: number; orders: Order[] }> = new Map()
  private asks: Map<number, { quantity: number; orders: Order[] }> = new Map()

  constructor(market_id: string, option_id: string) {
    this.market_id = market_id
    this.option_id = option_id
  }

  async initialize(): Promise<void> {
    // Carregar ordens pendentes do Supabase
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', this.market_id)
      .eq('option_id', this.option_id)
      .in('status', ['pending', 'partial'])
      .order('price', { ascending: true })

    if (error) throw error

    data?.forEach(order => this.addOrder(order))
  }

  addOrder(order: Order): void {
    const remaining = order.quantity - order.filled_quantity

    if (order.side === 'buy') {
      if (!this.bids.has(order.price)) {
        this.bids.set(order.price, { quantity: 0, orders: [] })
      }
      const level = this.bids.get(order.price)!
      level.quantity += remaining
      level.orders.push(order)
    } else {
      if (!this.asks.has(order.price)) {
        this.asks.set(order.price, { quantity: 0, orders: [] })
      }
      const level = this.asks.get(order.price)!
      level.quantity += remaining
      level.orders.push(order)
    }
  }

  removeOrder(order_id: string): void {
    // Remove ordem dos bids e asks
    for (const level of this.bids.values()) {
      const idx = level.orders.findIndex(o => o.id === order_id)
      if (idx !== -1) {
        const order = level.orders[idx]
        level.quantity -= (order.quantity - order.filled_quantity)
        level.orders.splice(idx, 1)
        break
      }
    }

    for (const level of this.asks.values()) {
      const idx = level.orders.findIndex(o => o.id === order_id)
      if (idx !== -1) {
        const order = level.orders[idx]
        level.quantity -= (order.quantity - order.filled_quantity)
        level.orders.splice(idx, 1)
        break
      }
    }
  }

  getBids(): OrderBookLevel[] {
    const levels: OrderBookLevel[] = []
    const prices = Array.from(this.bids.keys()).sort((a, b) => b - a) // Maior preço primeiro

    prices.forEach(price => {
      const level = this.bids.get(price)!
      levels.push({
        price,
        quantity: level.quantity,
        count: level.orders.length,
      })
    })

    return levels.slice(0, 20) // Top 20 níveis
  }

  getAsks(): OrderBookLevel[] {
    const levels: OrderBookLevel[] = []
    const prices = Array.from(this.asks.keys()).sort((a, b) => a - b) // Menor preço primeiro

    prices.forEach(price => {
      const level = this.asks.get(price)!
      levels.push({
        price,
        quantity: level.quantity,
        count: level.orders.length,
      })
    })

    return levels.slice(0, 20) // Top 20 níveis
  }

  getSnapshot(): OrderBookSnapshot {
    return {
      market_id: this.market_id,
      option_id: this.option_id,
      bids: this.getBids(),
      asks: this.getAsks(),
      timestamp: new Date().toISOString(),
    }
  }

  getSpread(): { bid: number; ask: number; spread: number } | null {
    const highestBid = Math.max(...Array.from(this.bids.keys()))
    const lowestAsk = Math.min(...Array.from(this.asks.keys()))

    if (!isFinite(highestBid) || !isFinite(lowestAsk)) {
      return null
    }

    return {
      bid: highestBid,
      ask: lowestAsk,
      spread: lowestAsk - highestBid,
    }
  }

  getMidPrice(): number | null {
    const spread = this.getSpread()
    if (!spread) return null
    return (spread.bid + spread.ask) / 2
  }
}
