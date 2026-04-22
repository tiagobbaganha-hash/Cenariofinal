'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, TrendingUp, TrendingDown, RefreshCw, Plus } from 'lucide-react'
import { RapidMarketCard } from '@/components/market/RapidMarketCard'
import { RapidPriceBar } from '@/components/market/RapidPriceBar'
import Link from 'next/link'

interface RapidMarket {
  id: string
  title: string
  slug: string
  status: string
  status_text: string
  closes_at: string
  rapid_config: {
    asset: string
    asset_symbol: string
    vs_currency: string
    duration_minutes: number
    price_at_creation: number
    direction?: string
  }
  opt_up_id: string
  opt_up_label: string
  opt_up_odds: number
  opt_up_prob: number
  opt_down_id: string
  opt_down_label: string
  opt_down_odds: number
  opt_down_prob: number
  total_volume?: number
  bet_count?: number
}

interface LivePrice {
  [asset: string]: { brl: number; usd: number; brl_24h_change?: number }
}

const ASSETS = [
  { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',   icon: '₿',  color: 'text-orange-400' },
  { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',  icon: 'Ξ',  color: 'text-blue-400'   },
  { id: 'solana',      symbol: 'SOL',  name: 'Solana',    icon: '◎',  color: 'text-purple-400' },
  { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',       icon: '◆',  color: 'text-yellow-400' },
  { id: 'ripple',      symbol: 'XRP',  name: 'XRP',       icon: '✦',  color: 'text-cyan-400'   },
  { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin',  icon: 'Ð',  color: 'text-amber-400'  },
  { id: 'USD',         symbol: 'USD',  name: 'Dólar',     icon: '$',  color: 'text-green-400'  },
  { id: 'EUR',         symbol: 'EUR',  name: 'Euro',      icon: '€',  color: 'text-blue-300'   },
  { id: 'GOLD',        symbol: 'OURO', name: 'Ouro',      icon: '🥇', color: 'text-yellow-300' },
  { id: 'WTI',         symbol: 'WTI',  name: 'Petróleo',  icon: '🛢️', color: 'text-slate-300'  },
]

const COINGECKO_IDS = 'bitcoin,ethereum,solana,binancecoin,ripple,dogecoin'

export default function MercadosRapidosPage() {
  const [markets, setMarkets] = useState<RapidMarket[]>([])
  const [prices, setPrices] = useState<LivePrice>({})
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [priceLoading, setPriceLoading] = useState(true)

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const result: LivePrice = {}
        for (const [id, v] of Object.entries(data as any)) {
          result[id] = { brl: (v as any).value, usd: 0, brl_24h_change: (v as any).change }
        }
        setPrices(result)
      }
    } catch (_) {}
    setPriceLoading(false)
  }, [])

  async function loadMarkets() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(['admin', 'super_admin'].includes((profile as any)?.role || ''))
    }

    const { data } = await supabase
      .from('v_rapid_markets')
      .select('*')
      .in('status', ['open', 'closed'])
      .limit(20)

    setMarkets((data || []) as RapidMarket[])
    setLoading(false)
  }

  useEffect(() => {
    loadMarkets()
    fetchPrices()
    const priceInterval = setInterval(fetchPrices, 15000) // atualiza a cada 15s
    return () => clearInterval(priceInterval)
  }, [fetchPrices])

  const openMarkets = markets.filter(m => m.status === 'open' || m.status_text === 'open')
  const closedMarkets = markets.filter(m => m.status !== 'open' && m.status_text !== 'open')

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Mercados Rápidos</h1>
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Preveja se o preço sobe ou desce em 5 minutos</p>
        </div>
        {isAdmin && (
          <Link href="/admin/mercados-rapidos"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Criar mercado rápido
          </Link>
        )}
      </div>

      {/* Barra de preços ao vivo */}
      <RapidPriceBar prices={prices} assets={ASSETS} loading={priceLoading} onRefresh={fetchPrices} />

      {/* Mercados abertos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : openMarkets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-14 text-center space-y-3">
          <Zap className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">Nenhum mercado rápido ativo agora</p>
          <p className="text-xs text-muted-foreground">Novos mercados são criados durante o dia. Volte em breve!</p>
          {isAdmin && (
            <Link href="/admin/mercados-rapidos" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2">
              <Plus className="h-3.5 w-3.5" /> Criar o primeiro mercado rápido
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ao vivo — {openMarkets.length} mercado{openMarkets.length !== 1 ? 's' : ''}
          </p>
          {openMarkets.map(market => (
            <RapidMarketCard
              key={market.id}
              market={market}
              livePrice={prices[market.rapid_config?.asset]}
              onExpired={loadMarkets}
            />
          ))}
        </div>
      )}

      {/* Mercados encerrados recentes */}
      {closedMarkets.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Encerrados recentemente</p>
          {closedMarkets.slice(0, 5).map(market => (
            <RapidMarketCard
              key={market.id}
              market={market}
              livePrice={prices[market.rapid_config?.asset]}
              onExpired={() => {}}
              isEnded
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground/50">
        Preços via CoinGecko · atualizado a cada 15s · Aposte com responsabilidade
      </p>
    </main>
  )
}
