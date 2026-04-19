import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { OrderBookSnapshot, Trade } from '@/lib/trading/types'

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => Promise<void>
}

export function subscribeToOrderBook(
  market_id: string,
  option_id: string,
  onSnapshot: (snapshot: OrderBookSnapshot) => void,
  onError: (error: Error) => void
): RealtimeSubscription {
  const channel = supabase.channel(`order_book:${market_id}:${option_id}`)

  channel
    .on('broadcast', { event: 'snapshot' }, (payload) => {
      const snapshot = payload.payload as OrderBookSnapshot
      onSnapshot(snapshot)
    })
    .on('broadcast', { event: 'error' }, (payload) => {
      onError(new Error(payload.payload.message))
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[realtime] Subscribed to order book')
      } else if (status === 'CLOSED') {
        console.log('[realtime] Closed order book subscription')
      }
    })

  return {
    channel,
    unsubscribe: async () => {
      await supabase.removeChannel(channel)
    },
  }
}

export function subscribeToTrades(
  market_id: string,
  option_id: string,
  onTrade: (trade: Trade) => void,
  onError: (error: Error) => void
): RealtimeSubscription {
  const channel = supabase.channel(`trades:${market_id}:${option_id}`)

  channel
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'trades',
      filter: `market_id=eq.${market_id},option_id=eq.${option_id}`,
    }, (payload) => {
      const trade = payload.new as Trade
      onTrade(trade)
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[realtime] Subscribed to trades')
      }
    })

  return {
    channel,
    unsubscribe: async () => {
      await supabase.removeChannel(channel)
    },
  }
}

export function subscribeToMarketUpdates(
  market_id: string,
  onUpdate: (data: any) => void
): RealtimeSubscription {
  const channel = supabase.channel(`market:${market_id}`)

  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'markets',
      filter: `id=eq.${market_id}`,
    }, (payload) => {
      onUpdate(payload.new || payload.old)
    })
    .subscribe()

  return {
    channel,
    unsubscribe: async () => {
      await supabase.removeChannel(channel)
    },
  }
}
