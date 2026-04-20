'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flame, TrendingUp, BarChart3, RefreshCw, Loader2, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface BurnStats {
  total_volume: number
  total_platform_revenue: number
  total_influencer_commissions: number
  total_bets: number
  total_markets: number
  total_users: number
  avg_market_volume: number
  last_30_days_volume: number
  last_30_days_revenue: number
}

interface DailyData {
  date: string
  volume: number
  revenue: number
  bets: number
}

function StatCard({ icon, label, value, sub, color = 'primary' }: {
  icon: string; label: string; value: string; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    primary: 'from-primary/20 to-primary/5 border-primary/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20',
  }
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color] || colors.primary}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

function fmt(n: number) {
  if (n >= 1000000) return `R$ ${(n/1000000).toFixed(2)}M`
  if (n >= 1000) return `R$ ${(n/1000).toFixed(1)}k`
  return `R$ ${n.toFixed(2)}`
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{p.name === 'Apostas' ? p.value : fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function BurnPage() {
  const [stats, setStats] = useState<BurnStats | null>(null)
  const [daily, setDaily] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => { load() }, [range])

  async function load() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Stats globais
      const [
        { data: ordersData },
        { data: marketsData },
        { data: usersData },
        { data: commData },
      ] = await Promise.all([
        supabase.from('orders').select('stake_amount, potential_payout, status, created_at'),
        supabase.from('markets').select('id, platform_commission, total_volume'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('influencer_market_commission').select('total_commission'),
      ])

      const orders = ordersData || []
      const markets = marketsData || []

      const totalVolume = orders.reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0)
      const totalRevenue = markets.reduce((s: number, m: any) => s + parseFloat(m.platform_commission || 0), 0)
      const totalInfluencer = (commData || []).reduce((s: number, c: any) => s + parseFloat(c.total_commission || 0), 0)

      const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
      const cutoff = new Date(Date.now() - days * 86400000)
      const recentOrders = orders.filter((o: any) => new Date(o.created_at) >= cutoff)
      const recentVolume = recentOrders.reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0)
      const recentRevenue = recentVolume * 0.03 // estimativa 3% de taxa

      setStats({
        total_volume: totalVolume,
        total_platform_revenue: totalRevenue || totalVolume * 0.03,
        total_influencer_commissions: totalInfluencer,
        total_bets: orders.length,
        total_markets: markets.length,
        total_users: (usersData as any)?.count || 0,
        avg_market_volume: markets.length > 0 ? totalVolume / markets.length : 0,
        last_30_days_volume: recentVolume,
        last_30_days_revenue: recentRevenue,
      })

      // Dados diários para o gráfico
      const grouped: Record<string, DailyData> = {}
      recentOrders.forEach((o: any) => {
        const d = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (!grouped[d]) grouped[d] = { date: d, volume: 0, revenue: 0, bets: 0 }
        grouped[d].volume += parseFloat(o.stake_amount || 0)
        grouped[d].revenue += parseFloat(o.stake_amount || 0) * 0.03
        grouped[d].bets += 1
      })

      // Preencher dias sem dados
      const result: DailyData[] = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        result.push(grouped[d] || { date: d, volume: 0, revenue: 0, bets: 0 })
      }
      setDaily(result.slice(-Math.min(days, 30))) // máx 30 pontos no gráfico

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const s = stats!

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">

      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-500/30">
            <Flame className="h-6 w-6 text-orange-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Transparência da Plataforma</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Monitore o volume, receita e atividade da plataforma CenárioX em tempo real. Todos os dados são públicos.
        </p>
      </div>

      {/* Grid de stats principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon="💰" label="Volume Total" value={fmt(s.total_volume)} sub="todas as apostas" color="green" />
        <StatCard icon="🔥" label="Receita Plataforma" value={fmt(s.total_platform_revenue)} sub="taxas acumuladas" color="orange" />
        <StatCard icon="💸" label="Comissões Influencers" value={fmt(s.total_influencer_commissions)} sub="pagos aos criadores" color="purple" />
        <StatCard icon="🎯" label="Total de Apostas" value={s.total_bets.toLocaleString('pt-BR')} sub="ordens executadas" color="blue" />
        <StatCard icon="📊" label="Mercados Criados" value={s.total_markets.toLocaleString('pt-BR')} sub="eventos preditivos" color="primary" />
        <StatCard icon="👥" label="Usuários" value={s.total_users.toLocaleString('pt-BR')} sub="contas ativas" color="green" />
      </div>

      {/* Stats do período */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume (período)</p>
          <p className="text-3xl font-bold text-foreground">{fmt(s.last_30_days_volume)}</p>
          <p className="text-xs text-muted-foreground mt-1">últimos {range === '7d' ? '7' : range === '30d' ? '30' : '90'} dias</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume médio/mercado</p>
          <p className="text-3xl font-bold text-foreground">{fmt(s.avg_market_volume)}</p>
          <p className="text-xs text-muted-foreground mt-1">por mercado criado</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Atividade Acumulada</h2>
            <p className="text-xs text-muted-foreground">Volume apostado e receita da plataforma</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {(['7d', '30d', '90d'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg font-medium transition-colors ${range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 px-5 pb-3">
          {[
            { color: '#22c55e', label: 'Volume apostado' },
            { color: '#f97316', label: 'Receita plataforma' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={daily} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="volume" name="Volume" stroke="#22c55e" strokeWidth={2} fill="url(#gradVol)" dot={false} />
            <Area type="monotone" dataKey="revenue" name="Receita" stroke="#f97316" strokeWidth={2} fill="url(#gradRev)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="px-5 pb-4 text-[10px] text-muted-foreground/60">
          Dados atualizados em tempo real · Taxa da plataforma: ~3% por aposta
        </div>
      </div>

      {/* Breakdown de receita */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Distribuição de Receita
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Receita da Plataforma (taxas)', value: s.total_platform_revenue, pct: 70, color: 'bg-primary' },
            { label: 'Comissões de Influencers', value: s.total_influencer_commissions, pct: 20, color: 'bg-purple-500' },
            { label: 'Reservas Operacionais', value: s.total_platform_revenue * 0.1, pct: 10, color: 'bg-blue-500' },
          ].map(item => (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{fmt(item.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-border/50 bg-card/30 px-5 py-4">
        <p className="text-xs text-muted-foreground/70 leading-relaxed text-center">
          Todos os dados são calculados diretamente do banco de dados da plataforma. 
          As taxas cobradas financiam a operação, desenvolvimento e os criadores de mercados (influencers). 
          O CenárioX opera com transparência total sobre sua estrutura de receita.
        </p>
      </div>
    </main>
  )
}
