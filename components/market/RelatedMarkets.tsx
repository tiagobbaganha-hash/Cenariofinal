'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface RelatedMarket {
  id: string
  slug: string
  title: string
  category: string
  image_url: string | null
  prob_yes: number
}

export function RelatedMarkets({ marketId, category }: { marketId: string; category: string }) {
  const [markets, setMarkets] = useState<RelatedMarket[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('v_front_markets_v5')
        .select('id, slug, title, category, image_url, options')
        .eq('category', category)
        .neq('id', marketId)
        .limit(4)

      if (data) {
        setMarkets(data.map((m: any) => {
          const opts = m.options || []
          const yes = opts.find((o: any) => o.option_key === 'yes')
          return { ...m, prob_yes: yes?.probability ? Math.round(yes.probability * 100) : 50 }
        }))
      }
    }
    load()
  }, [marketId, category])

  if (markets.length === 0) return null

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4" /> Mercados Relacionados
      </h3>
      <div className="space-y-2">
        {markets.map(m => (
          <Link key={m.id} href={`/mercados/${m.slug}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
            {m.image_url ? (
              <img src={m.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.category}</p>
            </div>
            <span className="text-sm font-bold text-green-400 flex-shrink-0">{m.prob_yes}%</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
