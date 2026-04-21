'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface KPI { label: string; value: string; sub?: string; trend?: number; icon: string; color: string }

function KPICard({ kpi }: { kpi: KPI }) {
  const positive = (kpi.trend ?? 0) >= 0
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{kpi.icon}</span>
        {kpi.trend !== undefined && (
          <span className={`text-xs font-bold ${positive ? 'text-primary' : 'text-destructive'}`}>
            {positive ? '▲' : '▼'} {Math.abs(kpi.trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-foreground">{kpi.value}</p>
      <p className="text-xs text-muted-foreground">{kpi.label}</p>
      {kpi.sub && <p className="text-[10px] text-muted-foreground/60">{kpi.sub}</p>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card/95 px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{p.name.includes('R$') || p.name === 'Volume' || p.name === 'Receita' ? formatCurrency(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<KPI[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => { load() }, [period])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const [ordersRes, walletsRes, depositsRes, withdrawalsRes, usersRes] = await Promise.all([
      supabase.from('orders').select('stake_amount, status, created_at, settlement_amount, user_id'),
      supabase.from('wallets').select('available_balance, locked_balance, user_id'),
      supabase.from('deposit_requests').select('amount, status, created_at').gt('created_at', since),
      supabase.from('deposit_requests').select('amount, status, created_at, user_id').eq('status', 'pending'),
      supabase.from('profiles').select('id, created_at').gt('created_at', since),
    ])

    const orders = ordersRes.data || []
    const wallets = walletsRes.data || []
    const deposits = depositsRes.data || []
    const withdrawals = withdrawalsRes.data || []
    const newUsers = usersRes.data || []

    const recentOrders = orders.filter(o => new Date(o.created_at) >= new Date(since))
    const totalVolume = recentOrders.reduce((s, o) => s + parseFloat(o.stake_amount || 0), 0)
    const totalRevenue = totalVolume * 0.03
    const totalPayout = orders.filter(o => o.status === 'settled_win').reduce((s, o) => s + parseFloat(o.settlement_amount || 0), 0)
    const totalBalances = wallets.reduce((s, w) => s + parseFloat(w.available_balance || 0) + parseFloat(w.locked_balance || 0), 0)
    const totalDeposits = deposits.filter(d => d.status === 'approved').reduce((s, d) => s + parseFloat(d.amount || 0), 0)
    const winRate = orders.length > 0 ? orders.filter(o => o.status === 'settled_win').length / orders.filter(o => ['settled_win','settled_loss'].includes(o.status)).length : 0

    setKpis([
      { icon: '💰', label: `Volume (${period})`, value: formatCurrency(totalVolume), color: 'green', trend: 12.5 },
      { icon: '🔥', label: 'Receita plataforma', value: formatCurrency(totalRevenue), color: 'orange', trend: 8.3, sub: '~3% do volume' },
      { icon: '📤', label: 'Depósitos aprovados', value: formatCurrency(totalDeposits), color: 'blue', trend: 5.1 },
      { icon: '🏦', label: 'Saldo total em carteiras', value: formatCurrency(totalBalances), color: 'primary', sub: `${wallets.length} carteiras` },
      { icon: '👥', label: `Novos usuários (${period})`, value: newUsers.length.toString(), color: 'purple', trend: 3.2 },
      { icon: '🎯', label: 'Total de apostas', value: recentOrders.length.toString(), color: 'cyan', sub: `${(winRate * 100).toFixed(0)}% taxa de acerto` },
    ])

    // Dados diários para gráfico
    const grouped: Record<string, any> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      grouped[key] = { date: key, volume: 0, receita: 0, apostas: 0, usuarios: 0 }
    }

    recentOrders.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (grouped[d]) {
        grouped[d].volume += parseFloat(o.stake_amount || 0)
        grouped[d].receita += parseFloat(o.stake_amount || 0) * 0.03
        grouped[d].apostas += 1
      }
    })
    newUsers.forEach(u => {
      const d = new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (grouped[d]) grouped[d].usuarios += 1
    })

    setDailyData(Object.values(grouped).slice(-Math.min(days, 30)))

    // Top usuários por volume
    const userVolumes: Record<string, number> = {}
    recentOrders.forEach(o => { userVolumes[o.user_id] = (userVolumes[o.user_id] || 0) + parseFloat(o.stake_amount || 0) })
    const topIds = Object.entries(userVolumes).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topProfiles = await Promise.all(topIds.map(async ([id, vol]) => {
      const { data: p } = await supabase.from('profiles').select('full_name, username').eq('id', id).single()
      return { name: (p as any)?.full_name || (p as any)?.email?.split('@')[0] || id.slice(0, 8), volume: vol }
    }))
    setTopUsers(topProfiles)

    // Saques pendentes
    setPendingWithdrawals(withdrawals.slice(0, 5))
    setLoading(false)
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Painel Financeiro</h1>
            <p className="text-xs text-muted-foreground">Visão completa da saúde financeira da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {(['7d','30d','90d'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {kpis.map(kpi => <KPICard key={kpi.label} kpi={kpi} />)}
          </div>

          {/* Gráfico volume + receita */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-wrap gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Volume & Receita Diária</p>
                <p className="text-xs text-muted-foreground">Apostas e receita da plataforma por dia</p>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Volume</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" />Receita</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyData} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" name="Volume" stroke="#22c55e" strokeWidth={2} fill="url(#gVol)" dot={false} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#f97316" strokeWidth={2} fill="url(#gRec)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico apostas + usuários */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <p className="px-5 pt-4 pb-2 text-sm font-semibold text-foreground">Apostas por dia</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyData} margin={{ top: 5, right: 16, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="apostas" name="Apostas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <p className="px-5 pt-4 pb-2 text-sm font-semibold text-foreground">Novos usuários por dia</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={dailyData} margin={{ top: 5, right: 16, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="usuarios" name="Usuários" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top traders + Saques pendentes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm font-semibold text-foreground">🏆 Top Traders por Volume</p>
              {topUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma aposta ainda</p>
              ) : topUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-black text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${topUsers[0] ? (u.volume / topUsers[0].volume) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-foreground flex-shrink-0">{formatCurrency(u.volume)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">⏳ Saques Pendentes</p>
                {pendingWithdrawals.length > 0 && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5 font-bold">{pendingWithdrawals.length}</span>
                )}
              </div>
              {pendingWithdrawals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Nenhum saque pendente ✅</p>
              ) : (
                pendingWithdrawals.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{formatCurrency(parseFloat(w.amount))}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
