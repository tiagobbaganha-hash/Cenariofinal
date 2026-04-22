'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, RefreshCw } from 'lucide-react'

interface Option {
  id: string
  label: string
  odds: number
  probability: number
  option_key: string
}

interface MarketLiveProps {
  marketId: string
  initialOptions: Option[]
  initialVolume: number
  initialBetCount: number
  isResolved: boolean
  winnerOptionId?: string | null
}

export function MarketLive({
  marketId,
  initialOptions,
  initialVolume,
  initialBetCount,
  isResolved,
  winnerOptionId,
}: MarketLiveProps) {
  const [options, setOptions] = useState<Option[]>(initialOptions)
  const [volume, setVolume] = useState(initialVolume)
  const [betCount, setBetCount] = useState(initialBetCount)
  const [pulse, setPulse] = useState(false)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const [{ data: opts }, { data: mkt }] = await Promise.all([
      supabase
        .from('market_options')
        .select('id, label, odds, probability, option_key')
        .eq('market_id', marketId)
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('markets')
        .select('total_volume, bet_count')
        .eq('id', marketId)
        .single(),
    ])
    if (opts) setOptions(opts as Option[])
    if (mkt) {
      setVolume(mkt.total_volume ?? 0)
      setBetCount(mkt.bet_count ?? 0)
    }
    setPulse(true)
    setTimeout(() => setPulse(false), 600)
  }, [marketId])

  useEffect(() => {
    const supabase = createClient()

    // Supabase Realtime — escuta novos orders no mercado
    const channel = supabase
      .channel(`market-live-${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        () => { refresh() }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'market_options',
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          setOptions(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          )
          setPulse(true)
          setTimeout(() => setPulse(false), 600)
        }
      )
      .subscribe()

    // Polling a cada 20s como fallback
    const interval = setInterval(refresh, 20000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [marketId, refresh])

  const COLORS = [
    { bar: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
    { bar: 'bg-rose-500',    text: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'    },
    { bar: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10'    },
    { bar: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10'   },
    { bar: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10'  },
    { bar: 'bg-cyan-500',    text: 'text-cyan-400',    border: 'border-cyan-500/30',    bg: 'bg-cyan-500/10'    },
  ]

  return (
    <div className="space-y-4">
      {/* Stats ao vivo */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span className={`font-semibold text-foreground transition-all ${pulse ? 'text-primary scale-105' : ''}`}>
            {formatCurrency(volume)}
          </span>
          <span>apostado</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="font-semibold text-foreground">{betCount}</span>
          <span>aposta{betCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/50">
          <RefreshCw className={`h-3 w-3 ${pulse ? 'animate-spin text-primary' : ''}`} />
          ao vivo
        </div>
      </div>

      {/* Opções com barras */}
      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const c = COLORS[i % COLORS.length]
          const prob = typeof opt.probability === 'number' ? opt.probability : 0.5
          const isWinner = isResolved && opt.id === winnerOptionId
          return (
            <div
              key={opt.id}
              className={`rounded-xl border p-3.5 transition-all ${
                isWinner
                  ? 'border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20'
                  : `${c.border} ${c.bg}`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold text-sm flex items-center gap-2 ${isWinner ? 'text-emerald-400' : c.text}`}>
                  {opt.label}
                  {isWinner && <span className="text-xs font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-full">✓ VENCEDOR</span>}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{Number(opt.odds ?? 0).toFixed(2)}x</span>
                  <span className={`font-mono text-base font-bold tabular-nums ${pulse ? 'scale-110' : ''} transition-transform ${isWinner ? 'text-emerald-400' : c.text}`}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full transition-all duration-700 ease-out ${isWinner ? 'bg-emerald-500' : c.bar}`}
                  style={{ width: `${Math.min(100, prob * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
