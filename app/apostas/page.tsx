'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShareBet } from '@/components/market/ShareBet'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, TrendingDown, Trophy, Clock, AlertCircle,
  Loader2, CheckCircle, XCircle, RefreshCw, BarChart3,
  Target, Wallet, Activity, ChevronRight, Search, Filter
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Order {
  id: string
  market_id: string
  side: string
  stake_amount: number
  potential_payout: number
  status: string
  created_at: string
  settled_at: string | null
  settlement_amount: number | null
  market_title: string
  market_slug: string
  market_status: string
  market_category: string
  option_label: string
  option_probability?: number
  current_value?: number
  pnl?: number
  pnl_pct?: number
}

const STATUS = {
  open:         { label: 'Aberta',    color: 'text-blue-400   bg-blue-500/10   border-blue-500/20',   icon: Clock },
  pending:      { label: 'Pendente',  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
  settled_win:  { label: 'Ganhou',    color: 'text-green-400  bg-green-500/10  border-green-500/20',  icon: Trophy },
  settled_loss: { label: 'Perdeu',    color: 'text-red-400    bg-red-500/10    border-red-500/20',    icon: XCircle },
  sold:         { label: 'Vendida',   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: TrendingDown },
  canceled:     { label: 'Cancelada', color: 'text-gray-400   bg-gray-500/10   border-gray-500/20',   icon: AlertCircle },
} as const

const TABS = ['Previsões', 'Em aberto', 'Encerrados'] as const
const CATEGORY_ICONS: Record<string, string> = {
  Política: '🏛️', Economia: '📈', Esportes: '⚽', Tecnologia: '💻',
  Cripto: '₿', Entretenimento: '🎬', Geopolítica: '🌍', Geral: '🎯',
}

export default function PortfolioPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<typeof TABS[number]>('Previsões')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Todas')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('orders')
        .select('id, market_id, side, stake_amount, potential_payout, status, created_at, settled_at, settlement_amount, option_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) { setLoading(false); return }

      const marketIds = [...new Set((data || []).map((o: any) => o.market_id))]
      const optionIds = [...new Set((data || []).map((o: any) => o.option_id).filter(Boolean))]

      const [{ data: markets }, { data: opts }] = await Promise.all([
        supabase.from('markets').select('id, title, slug, status, category').in('id', marketIds.length ? marketIds : ['none']),
        supabase.from('market_options').select('id, label, probability').in('id', optionIds.length ? optionIds : ['none']),
      ])

      const mMap = new Map((markets || []).map((m: any) => [m.id, m]))
      const oMap = new Map((opts || []).map((o: any) => [o.id, o]))

      const enriched: Order[] = (data || []).map((o: any) => {
        const m = mMap.get(o.market_id) as any
        const opt = oMap.get(o.option_id) as any
        const prob = opt?.probability ? parseFloat(opt.probability) : 0.5
        const stake = parseFloat(o.stake_amount)
        const currentValue = ['open', 'pending'].includes(o.status)
          ? parseFloat((stake * prob * 0.95).toFixed(2))
          : (o.settlement_amount ? parseFloat(o.settlement_amount) : 0)
        const pnl = ['open', 'pending'].includes(o.status)
          ? currentValue - stake
          : (o.status === 'settled_win' ? (parseFloat(o.settlement_amount || 0) - stake) : -stake)
        return {
          ...o,
          stake_amount: stake,
          market_title: m?.title || 'Mercado',
          market_slug: m?.slug || o.market_id,
          market_status: m?.status || 'open',
          market_category: m?.category || 'Geral',
          option_label: opt?.label || o.side?.toUpperCase() || '?',
          option_probability: prob,
          current_value: currentValue,
          pnl,
          pnl_pct: stake > 0 ? (pnl / stake) * 100 : 0,
        }
      })

      setOrders(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  // KPIs
  const openOrders   = orders.filter(o => ['open','pending'].includes(o.status))
  const closedOrders = orders.filter(o => !['open','pending'].includes(o.status))
  const wins         = closedOrders.filter(o => o.status === 'settled_win')
  const totalStaked  = orders.reduce((s, o) => s + o.stake_amount, 0)
  const totalPnl     = orders.reduce((s, o) => s + (o.pnl || 0), 0)
  const portfolioVal = openOrders.reduce((s, o) => s + (o.current_value || 0), 0)
  const winRate      = closedOrders.length > 0 ? (wins.length / closedOrders.length) * 100 : 0
  const openByCategory = openOrders.reduce((acc, o) => {
    acc[o.market_category] = (acc[o.market_category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const categories = ['Todas', ...Object.keys(openByCategory)]

  const filtered = orders.filter(o => {
    const matchTab = tab === 'Em aberto'
      ? ['open','pending'].includes(o.status)
      : tab === 'Encerrados'
        ? !['open','pending'].includes(o.status)
        : true
    const matchSearch = !search || o.market_title.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'Todas' || o.market_category === catFilter
    return matchTab && matchSearch && matchCat
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">

      {/* HERO — Portfólio */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Valor do portfólio */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Valor do Portfólio</p>
            <p className="text-4xl font-bold text-foreground">{formatCurrency(portfolioVal)}</p>
            <div className={`flex items-center gap-1.5 mt-1 text-sm font-medium ${totalPnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {totalPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)} (P&L total)</span>
            </div>
          </div>

          {/* KPIs */}
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalStaked)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total investido</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{winRate.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Taxa de acerto</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{openOrders.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Posições abertas</p>
            </div>
          </div>
        </div>

        {/* Categorias abertas */}
        {Object.keys(openByCategory).length > 0 && (
          <div className="flex gap-2 flex-wrap pt-2 border-t border-border/50">
            {Object.entries(openByCategory).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? 'Todas' : cat)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${catFilter === cat ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
              >
                <span>{CATEGORY_ICONS[cat] || '🎯'}</span>
                {cat}
                <span className="bg-primary/20 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {t === 'Em aberto' && openOrders.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-bold">{openOrders.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* BUSCA */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Buscar por mercado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* LISTA */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/50 p-12 text-center space-y-3">
          <Activity className="h-10 w-10 mx-auto text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {tab === 'Em aberto' ? 'Nenhuma posição aberta' : tab === 'Encerrados' ? 'Nenhuma previsão encerrada' : 'Nenhuma previsão ainda'}
          </p>
          <p className="text-xs text-muted-foreground">
            {tab !== 'Encerrados' && <Link href="/mercados" className="text-primary hover:underline">Explorar mercados →</Link>}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const statusInfo = STATUS[order.status as keyof typeof STATUS] || STATUS.canceled
            const Icon = statusInfo.icon
            const isOpen = ['open', 'pending'].includes(order.status)
            const pnlColor = (order.pnl || 0) >= 0 ? 'text-primary' : 'text-destructive'
            const prob = order.option_probability || 0.5

            return (
              <div key={order.id} className="rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Ícone categoria */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                      {CATEGORY_ICONS[order.market_category] || '🎯'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <Link href={`/mercados/${order.market_slug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {order.market_title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusInfo.color}`}>
                              <Icon className="h-2.5 w-2.5" />
                              {statusInfo.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {order.market_category}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        {/* P&L */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${pnlColor}`}>
                            {(order.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(order.pnl || 0)}
                          </p>
                          <p className={`text-[10px] font-medium ${pnlColor}`}>
                            {(order.pnl_pct || 0) >= 0 ? '+' : ''}{(order.pnl_pct || 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Posição */}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Previu:</span>
                          <span className="text-xs font-semibold text-foreground bg-primary/10 rounded-md px-2 py-0.5">{order.option_label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Entrada:</span>
                          <span className="text-xs font-mono text-foreground">{formatCurrency(order.stake_amount)}</span>
                        </div>
                        {isOpen && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Agora:</span>
                            <span className="text-xs font-mono text-foreground">{formatCurrency(order.current_value || 0)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Max:</span>
                          <span className="text-xs font-mono text-primary">{formatCurrency(order.potential_payout)}</span>
                        </div>
                      </div>

                      {/* Barra de probabilidade atual */}
                      {isOpen && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">Probabilidade atual</span>
                            <span className="text-[10px] font-bold text-foreground">{Math.round(prob * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${prob * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer com ações */}
                {isOpen && (
                  <div className="border-t border-border/50 px-4 py-2.5 flex items-center justify-between bg-muted/20">
                    <span className="text-[10px] text-muted-foreground">
                      Retorno máx: {formatCurrency(order.potential_payout)}
                    </span>
                    <Link
                      href={`/mercados/${order.market_slug}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      Ver mercado <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}

                {order.status === 'settled_win' && (
                  <div className="border-t border-green-500/20 px-4 py-2.5 bg-green-500/5 flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      Ganho: {formatCurrency(order.settlement_amount || 0)} · {new Date(order.settled_at || '').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
