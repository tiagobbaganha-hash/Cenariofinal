'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, Trophy, Clock, AlertCircle, 
  Loader2, ArrowRight, CheckCircle, XCircle, RefreshCw 
} from 'lucide-react'

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
  option_label: string
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Aberta', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  settled_win: { label: 'Ganhou', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: Trophy },
  settled_loss: { label: 'Perdeu', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  canceled: { label: 'Cancelada', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: AlertCircle },
}

export default function MinhasApostas() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'settled'>('all')

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

      if (error) { console.error(error); setLoading(false); return }

      // Fetch market info for each order
      const marketIds = [...new Set((data || []).map(o => o.market_id))]
      const { data: markets } = await supabase
        .from('markets')
        .select('id, title, slug, status')
        .in('id', marketIds.length > 0 ? marketIds : ['none'])

      // Fetch option labels
      const optionIds = [...new Set((data || []).map(o => o.option_id).filter(Boolean))]
      const { data: opts } = await supabase
        .from('market_options')
        .select('id, label')
        .in('id', optionIds.length > 0 ? optionIds : ['none'])

      const marketMap = new Map((markets || []).map(m => [m.id, m]))
      const optMap = new Map((opts || []).map(o => [o.id, o.label]))

      const enriched: Order[] = (data || []).map((o: any) => {
        const m = marketMap.get(o.market_id)
        return {
          ...o,
          market_title: m?.title || 'Mercado',
          market_slug: m?.slug || o.market_id,
          market_status: m?.status || 'open',
          option_label: optMap.get(o.option_id) || o.side?.toUpperCase() || '?',
        }
      })

      setOrders(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  const filtered = orders.filter(o => {
    if (filter === 'open') return o.status === 'open'
    if (filter === 'settled') return o.status !== 'open'
    return true
  })

  const totalStaked = orders.reduce((s, o) => s + o.stake_amount, 0)
  const totalWon = orders.filter(o => o.status === 'settled_win').reduce((s, o) => s + (o.settlement_amount || 0), 0)
  const openCount = orders.filter(o => o.status === 'open').length

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Minhas Apostas</h1>
      <p className="text-muted-foreground mb-6">Acompanhe suas previsões e resultados</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{openCount}</p>
            <p className="text-xs text-muted-foreground">Abertas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">R$ {totalWon.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Ganhos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'open', 'settled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border hover:bg-accent'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Resolvidas'}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhuma aposta ainda</p>
            <p className="text-sm text-muted-foreground mb-4">Explore os mercados e faça sua primeira previsão!</p>
            <Link href="/mercados">
              <Button>
                Ver mercados <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const st = statusMap[order.status] || statusMap.open
            const StatusIcon = st.icon
            const pnl = order.status === 'settled_win' 
              ? (order.settlement_amount || 0) - order.stake_amount
              : order.status === 'settled_loss'
              ? -order.stake_amount
              : null

            return (
              <Link key={order.id} href={`/mercados/${order.market_slug}`}>
                <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{order.market_title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${st.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {st.label}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {order.option_label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-mono">R$ {order.stake_amount.toFixed(2)}</p>
                        {order.status === 'open' && (
                          <p className="text-xs text-muted-foreground">
                            Retorno: R$ {order.potential_payout.toFixed(2)}
                          </p>
                        )}
                        {pnl !== null && (
                          <p className={`text-sm font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}R$ {pnl.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
