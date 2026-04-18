import { useEffect, useState } from 'react'
import type { OrderBookSnapshot } from '@/lib/trading/types'
import { subscribeToOrderBook } from '@/lib/realtime/subscriptions'

export function useRealtimeOrderBook(market_id: string, option_id: string) {
  const [snapshot, setSnapshot] = useState<OrderBookSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    const subscription = subscribeToOrderBook(
      market_id,
      option_id,
      (data) => {
        setSnapshot(data)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [market_id, option_id])

  return { snapshot, loading, error }
}
