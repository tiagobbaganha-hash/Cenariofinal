import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MarketUpdate {
  id: string
  status?: string
  featured?: boolean
}

export function useRealtimeMarkets() {
  const [updates, setUpdates] = useState<MarketUpdate[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('all_markets')

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'markets',
      }, (payload) => {
        const update = payload.new as MarketUpdate
        setUpdates((prev) => [update, ...prev.filter((m) => m.id !== update.id)].slice(0, 10))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return updates
}
