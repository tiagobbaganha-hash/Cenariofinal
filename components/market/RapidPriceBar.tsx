'use client'

import { RefreshCw } from 'lucide-react'

interface Asset { id: string; symbol: string; name: string; icon: string; color: string }
interface Props {
  prices: Record<string, { brl: number; usd?: number; brl_24h_change?: number }>
  assets: Asset[]
  loading: boolean
  onRefresh: () => void
}

export function RapidPriceBar({ prices, assets, loading, onRefresh }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preços ao vivo</p>
        <button onClick={onRefresh} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/50">
        {assets.map(asset => {
          const price = prices[asset.id]
          const change = price?.brl_24h_change || 0
          const positive = change >= 0
          return (
            <div key={asset.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-lg font-bold ${asset.color}`}>{asset.icon}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{asset.symbol}</p>
                  <p className="text-[10px] text-muted-foreground">{asset.name}</p>
                </div>
              </div>
              {loading || !price ? (
                <div className="h-5 w-24 rounded-md bg-muted animate-pulse" />
              ) : (
                <>
                  <p className="text-sm font-bold text-foreground font-mono">
                    R$ {price.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[10px] font-semibold mt-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
                    {positive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% 24h
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
