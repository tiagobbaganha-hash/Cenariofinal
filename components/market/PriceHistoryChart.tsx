'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface Props {
  marketId: string
  options?: Array<{ label: string; option_key: string; probability?: number }>
}

type Range = '1D' | '1W' | '1M' | 'ALL'

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-foreground font-medium">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export function PriceHistoryChart({ marketId, options = [] }: Props) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>('ALL')
  const [optionKeys, setOptionKeys] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: history } = await supabase
        .from('market_price_history')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: true })
        .limit(500)

      if (history && history.length > 0) {
        // Detectar as colunas disponíveis
        const sample = history[0]
        const keys = Object.keys(sample).filter(k =>
          k.startsWith('probability_') && k !== 'probability_yes' ||
          k === 'probability_yes' || k === 'probability_no'
        ).map(k => k.replace('probability_', ''))

        setOptionKeys(keys.length > 0 ? keys : ['yes', 'no'])

        const now = Date.now()
        const rangeMs: Record<Range, number> = {
          '1D': 86400000, '1W': 604800000, '1M': 2592000000, 'ALL': Infinity
        }

        const filtered = history.filter(h =>
          range === 'ALL' || now - new Date(h.created_at).getTime() <= rangeMs[range]
        )

        // Agrupar por hora se > 100 pontos
        const grouped = filtered.length > 100
          ? filtered.filter((_, i) => i % Math.ceil(filtered.length / 100) === 0)
          : filtered

        setData(grouped.map((h: any) => {
          const point: any = {
            date: new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            time: new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            full: new Date(h.created_at).toLocaleString('pt-BR'),
          }
          keys.forEach(k => {
            const val = h[`probability_${k}`]
            if (val !== undefined) point[k] = Math.round(parseFloat(val) * 100)
          })
          return point
        }))
      }
      setLoading(false)
    }
    load()
  }, [marketId, range])

  const displayOptions = options.length > 0
    ? options
    : optionKeys.map(k => ({ label: k === 'yes' ? 'SIM' : k === 'no' ? 'NÃO' : k, option_key: k }))

  if (loading) {
    return (
      <div className="h-52 rounded-2xl bg-card border border-border flex items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (data.length < 2) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center">
        <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
        <p className="text-xs text-muted-foreground">Histórico disponível após mais apostas</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Probabilidade ao longo do tempo</h3>
        <div className="flex gap-1">
          {(['1D', '1W', '1M', 'ALL'] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-colors ${range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 px-5 pb-2">
        {displayOptions.map((opt, i) => (
          <div key={opt.option_key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] || '#94a3b8' }} />
            <span className="text-xs text-muted-foreground font-medium">{opt.label}</span>
            {opt.probability !== undefined && (
              <span className="text-xs font-bold" style={{ color: COLORS[i] || '#94a3b8' }}>
                {Math.round(opt.probability * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 16, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" />
          {displayOptions.map((opt, i) => (
            <Line
              key={opt.option_key}
              type="monotone"
              dataKey={opt.option_key}
              name={opt.label}
              stroke={COLORS[i] || '#94a3b8'}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Volume info */}
      <div className="px-5 pb-4 text-[10px] text-muted-foreground/60">
        {data.length} pontos de dados · atualizado em tempo real
      </div>
    </div>
  )
}
