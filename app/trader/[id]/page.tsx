'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Trophy, TrendingUp, Target, BarChart3, Loader2, ArrowLeft } from 'lucide-react'

interface TraderProfile {
  id: string
  name: string
  created_at: string
  total_bets: number
  total_staked: number
  total_won: number
  win_rate: number
  pnl: number
  recent_bets: any[]
}

export default function TraderPage() {
  const params = useParams()
  const traderId = params.id as string
  const [trader, setTrader] = useState<TraderProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('id', traderId)
        .single()

      if (!profile) { setLoading(false); return }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, market_id, side, stake_amount, potential_payout, status, settlement_amount, created_at')
        .eq('user_id', traderId)
        .order('created_at', { ascending: false })
        .limit(50)

      const allOrders = orders || []
      const wins = allOrders.filter(o => o.status === 'settled_win')
      const losses = allOrders.filter(o => o.status === 'settled_loss')
      const settled = wins.length + losses.length

      const totalStaked = allOrders.reduce((s, o) => s + parseFloat(o.stake_amount || '0'), 0)
      const totalWon = wins.reduce((s, o) => s + parseFloat(o.settlement_amount || o.potential_payout || '0'), 0)
      const totalLost = losses.reduce((s, o) => s + parseFloat(o.stake_amount || '0'), 0)

      // Get market titles for recent bets
      const marketIds = [...new Set(allOrders.slice(0, 10).map(o => o.market_id))]
      const { data: markets } = await supabase
        .from('markets')
        .select('id, title, slug')
        .in('id', marketIds.length > 0 ? marketIds : ['none'])
      const marketMap = new Map((markets || []).map(m => [m.id, m]))

      setTrader({
        id: (profile as any).id,
        name: (profile as any).full_name || (profile as any).email?.split('@')[0] || 'Trader',
        created_at: (profile as any).created_at,
        total_bets: allOrders.length,
        total_staked: totalStaked,
        total_won: totalWon,
        win_rate: settled > 0 ? (wins.length / settled) * 100 : 0,
        pnl: totalWon - totalLost,
        recent_bets: allOrders.slice(0, 10).map(o => ({
          ...o,
          market_title: marketMap.get(o.market_id)?.title || 'Mercado',
          market_slug: marketMap.get(o.market_id)?.slug || o.market_id,
        }))
      })
      setLoading(false)
    }
    load()
  }, [traderId])

  if (loading) return <div className="flex min-h-[60vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (!trader) return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-lg font-medium">Trader não encontrado</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Leaderboard
      </Link>

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-background">
          {trader.name[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{trader.name}</h1>
          <p className="text-sm text-muted-foreground">Membro desde {new Date(trader.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card><CardContent className="p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto text-blue-400 mb-1" />
          <p className="text-2xl font-bold">{trader.total_bets}</p>
          <p className="text-xs text-muted-foreground">Apostas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto text-green-400 mb-1" />
          <p className="text-2xl font-bold">{trader.win_rate.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-yellow-400 mb-1" />
          <p className="text-2xl font-bold">R$ {trader.total_staked.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Total Apostado</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Trophy className="h-5 w-5 mx-auto mb-1" style={{ color: trader.pnl >= 0 ? '#22c55e' : '#ef4444' }} />
          <p className={`text-2xl font-bold ${trader.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trader.pnl >= 0 ? '+' : ''}R$ {trader.pnl.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">PnL</p>
        </CardContent></Card>
      </div>

      {/* Recent bets */}
      <h2 className="font-bold mb-3">Apostas Recentes</h2>
      <div className="space-y-2">
        {trader.recent_bets.map((bet: any) => (
          <Link key={bet.id} href={`/mercados/${bet.market_slug}`}>
            <Card className="hover:bg-accent/20 transition-colors">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">{bet.market_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {bet.side.toUpperCase()} · R$ {parseFloat(bet.stake_amount).toFixed(0)} · {new Date(bet.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  bet.status === 'settled_win' ? 'bg-green-500/10 text-green-400' :
                  bet.status === 'settled_loss' ? 'bg-red-500/10 text-red-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {bet.status === 'settled_win' ? 'Ganhou' : bet.status === 'settled_loss' ? 'Perdeu' : 'Aberta'}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
