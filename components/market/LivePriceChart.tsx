'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

interface PricePoint {
  time: number
  price: number
}

interface LivePriceChartProps {
  assetId: string
  assetSymbol: string
  initialPrice: number
  targetPrice?: number // preço alvo para resolução
  closesAt?: string
}

export function LivePriceChart({ assetId, assetSymbol, initialPrice, targetPrice, closesAt }: LivePriceChartProps) {
  const [points, setPoints] = useState<PricePoint[]>([{ time: Date.now(), price: initialPrice }])
  const [currentPrice, setCurrentPrice] = useState(initialPrice)
  const [loading, setLoading] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      const assetData = data[assetId]
      if (!assetData?.value) return
      const price = assetData.value
      setCurrentPrice(price)
      setPoints(prev => {
        const now = Date.now()
        const newPoints = [...prev, { time: now, price }]
        // Manter últimos 60 pontos (10 min com fetch a cada 10s)
        return newPoints.slice(-60)
      })
    } catch (_) {}
    setLoading(false)
  }, [assetId])

  useEffect(() => {
    fetchPrice()
    const interval = setInterval(fetchPrice, 10000) // atualiza a cada 10s
    return () => clearInterval(interval)
  }, [fetchPrice])

  // Calcular variação em relação ao preço inicial
  const change = currentPrice - initialPrice
  const changePct = ((change / initialPrice) * 100)
  const isUp = change >= 0

  // Calcular tempo restante
  const timeLeft = closesAt ? Math.max(0, new Date(closesAt).getTime() - Date.now()) : null
  const timeLeftStr = timeLeft !== null
    ? timeLeft > 60000
      ? `${Math.floor(timeLeft / 60000)}m ${Math.floor((timeLeft % 60000) / 1000)}s`
      : `${Math.floor(timeLeft / 1000)}s`
    : null

  // Construir path do SVG
  const W = 320, H = 80
  const prices = points.map(p => p.price)
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const rangeP = maxP - minP || 1

  const toX = (i: number) => (i / Math.max(points.length - 1, 1)) * W
  const toY = (p: number) => H - ((p - minP) / rangeP) * (H - 8) - 4

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.price).toFixed(1)}`).join(' ')
  const fillD = `${pathD} L ${W} ${H} L 0 ${H} Z`

  // Linha do preço inicial
  const initY = toY(initialPrice)

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">{assetSymbol}</span>
            <span className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isUp ? '+' : ''}{changePct.toFixed(2)}%
            </span>
          </div>
          <p className="text-lg font-mono font-bold text-foreground">
            R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          {timeLeftStr && (
            <div className="flex items-center gap-1.5 justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs font-mono text-rose-400 font-semibold">{timeLeftStr}</span>
            </div>
          )}
          <button onClick={() => { setLoading(true); fetchPrice() }}
            className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Gráfico SVG */}
      <div className="relative">
        <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          <defs>
            <linearGradient id={`grad-${assetId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Linha do preço inicial (referência) */}
          {points.length > 1 && (
            <>
              <line x1="0" y1={initY} x2={W} y2={initY}
                stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
              <text x="4" y={initY - 3} fontSize="8" fill="#6b7280">
                R$ {initialPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </text>
            </>
          )}

          {/* Área preenchida */}
          {points.length > 1 && (
            <path d={fillD} fill={`url(#grad-${assetId})`} />
          )}

          {/* Linha principal */}
          {points.length > 1 && (
            <path d={pathD} fill="none"
              stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Ponto atual */}
          {points.length > 0 && (
            <circle
              cx={toX(points.length - 1)}
              cy={toY(currentPrice)}
              r="4"
              fill={isUp ? '#10b981' : '#ef4444'}
            >
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
      </div>

      {/* Footer: inicial vs atual */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Inicial: <span className="font-mono text-foreground">R$ {initialPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
        <span className={`font-mono font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isUp ? '▲' : '▼'} R$ {Math.abs(change).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
