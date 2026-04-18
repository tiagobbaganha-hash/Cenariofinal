import type { Order, Trade, MatchResult } from './types'
import { OrderBook } from './orderBook'

export class MatchingEngine {
  private orderBook: OrderBook

  constructor(orderBook: OrderBook) {
    this.orderBook = orderBook
  }

  async matchNewOrder(order: Order): Promise<MatchResult> {
    const trades: Trade[] = []
    const orders_affected: string[] = []

    let remaining = order.quantity

    if (order.side === 'buy') {
      // Tentar dar match com ordens de venda (asks)
      const asks = this.orderBook.getAsks()

      for (const level of asks) {
        if (remaining <= 0) break
        if (order.price < level.price) break // Preço não é compatível

        // Encontrar ordens neste nível de preço
        // TODO: Implementar matching com ordens específicas
        const match_quantity = Math.min(remaining, level.quantity)
        remaining -= match_quantity

        orders_affected.push(...[]) // IDs das ordens matched
      }
    } else {
      // Tentar dar match com ordens de compra (bids)
      const bids = this.orderBook.getBids()

      for (const level of bids) {
        if (remaining <= 0) break
        if (order.price > level.price) break // Preço não é compatível

        const match_quantity = Math.min(remaining, level.quantity)
        remaining -= match_quantity

        orders_affected.push(...[])
      }
    }

    // Adicionar ordem ao order book se ainda houver quantidade
    if (remaining > 0) {
      this.orderBook.addOrder({
        ...order,
        filled_quantity: order.quantity - remaining,
        status: remaining === 0 ? 'filled' : 'partial',
      })
    }

    return {
      trades,
      orders_affected,
      timestamp: new Date().toISOString(),
    }
  }

  getMarketPrice(option_id: string): number | null {
    // Retorna mid price do order book
    return this.orderBook.getMidPrice()
  }

  estimateFillPrice(side: 'buy' | 'sell', quantity: number): number | null {
    // Estima preço de execução para um market order
    const spread = this.orderBook.getSpread()
    if (!spread) return null

    if (side === 'buy') {
      // Pega o ask (seller) mais baixo
      return spread.ask
    } else {
      // Pega o bid (buyer) mais alto
      return spread.bid
    }
  }
}
