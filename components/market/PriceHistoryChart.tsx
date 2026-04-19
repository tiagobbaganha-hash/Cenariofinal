'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface PricePoint {
  date: string
  yes: number
  no: number
}

export function PriceHistoryChart({ marketId }: { marketId: string }) {
  const [data, setData] = useState<PricePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: history } = await supabase
        .from('market_price_history')
        .select('probability_yes, probability_no, created_at')
        .eq('market_id', marketId)
        .order('created_at', { ascending: true })
        .limit(200)

      if (history && history.length > 0) {
        setData(history.map((h: any) => ({
          date: new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          yes: Math.round(parseFloat(h.probability_yes) * 100),
          no: Math.round(parseFloat(h.probability_no) * 100),
        })))
      }
      setLoading(false)
    }
    load()
  }, [marketId])

  if (loading) {
    return (
      <div className="h-48 rounded-xl bg-card border border-border flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Carregando gráfico...</p>
      </div>
    )
  }

  if (data.length < 2) {
    return (
      <div className="h-48 rounded-xl bg-card border border-border flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Histórico disponível após mais apostas</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">Histórico de Probabilidade</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradYes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradNo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#71717a' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#111827',
              border: '1px solid #1e1e2a',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'yes' ? 'SIM' : 'NÃO'
            ]}
          />
          <Area type="monotone" dataKey="yes" stroke="#22c55e" strokeWidth={2} fill="url(#gradYes)" name="yes" />
          <Area type="monotone" dataKey="no" stroke="#ef4444" strokeWidth={1.5} fill="url(#gradNo)" name="no" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
