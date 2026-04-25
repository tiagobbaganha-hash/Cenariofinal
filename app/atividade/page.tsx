'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Zap, TrendingUp, Trophy, Users, RefreshCw, Activity } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'bet' | 'win' | 'market_created' | 'join'
  user_name: string
  user_avatar: string
  market_title: string
  market_slug: string
  amount?: number
  option_label?: string
  created_at: string
}

const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return 'agora'
  if (d < 3600000) return `${Math.floor(d/60000)}min`
  if (d < 86400000) return `${Math.floor(d/3600000)}h`
  return `${Math.floor(d/86400000)}d`
}

function ActivityIcon({ type }: { type: string }) {
  if (type === 'win') return <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center"><Trophy className="h-4 w-4 text-yellow-400" /></div>
  if (type === 'market_created') return <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center"><Zap className="h-4 w-4 text-purple-400" /></div>
  return <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-primary" /></div>
}

function ActivityText({ item }: { item: ActivityItem }) {
  if (item.type === 'win') return (
    <p className="text-sm">
      <span className="font-semibold text-yellow-400">{item.user_name}</span>
      <span className="text-muted-foreground"> ganhou </span>
      <span className="font-semibold text-green-400">R$ {item.amount?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
      <span className="text-muted-foreground"> em </span>
      <Link href={`/mercados/${item.market_slug}`} className="text-primary hover:underline">{item.market_title}</Link>
    </p>
  )
  if (item.type === 'market_created') return (
    <p className="text-sm">
      <span className="font-semibold">{item.user_name}</span>
      <span className="text-muted-foreground"> criou o mercado </span>
      <Link href={`/mercados/${item.market_slug}`} className="text-primary hover:underline">{item.market_title}</Link>
    </p>
  )
  return (
    <p className="text-sm">
      <span className="font-semibold">{item.user_name}</span>
      <span className="text-muted-foreground"> apostou </span>
      <span className="font-semibold text-primary">R$ {item.amount?.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
      <span className="text-muted-foreground"> em </span>
      <span className="font-medium text-foreground">{item.option_label}</span>
      <span className="text-muted-foreground"> · </span>
      <Link href={`/mercados/${item.market_slug}`} className="text-muted-foreground hover:text-primary transition-colors text-xs">{item.market_title}</Link>
    </p>
  )
}

export default function AtividadePage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ traders: 0, apostas: 0, volume: 0, mercados: 0 })
  const [live, setLive] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 30

  const load = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    // Buscar apostas recentes
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, stake_amount, status, created_at, settlement_amount,
        market_options(label),
        markets(title, slug),
        profiles(full_name, email, avatar_url)
      `)
      .in('status', ['open', 'settled_win', 'settled_loss'])
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Buscar mercados recentes
    const { data: markets } = await supabase
      .from('markets')
      .select('id, title, slug, created_at, created_by, profiles(full_name, email, avatar_url)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar stats
    const { data: statsData } = await supabase
      .from('markets')
      .select('total_volume, bet_count')
      .eq('status', 'open')

    const totalVol = (statsData || []).reduce((s, m) => s + (m.total_volume || 0), 0)
    const totalBets = (statsData || []).reduce((s, m) => s + (m.bet_count || 0), 0)

    const { count: tradersCount } = await supabase
      .from('wallets')
      .select('*', { count: 'exact', head: true })

    setStats({
      traders: tradersCount || 0,
      apostas: totalBets,
      volume: totalVol,
      mercados: (statsData || []).length,
    })

    const activities: ActivityItem[] = []

    // Adicionar apostas
    for (const o of (orders || [])) {
      const market = (o as any).markets
      const option = (o as any).market_options
      const profile = (o as any).profiles
      if (!market) continue
      const name = profile?.full_name || profile?.email?.split('@')[0] || 'Trader'
      const seed = name.charCodeAt(0) % AVATARS.length
      activities.push({
        id: o.id,
        type: o.status === 'settled_win' ? 'win' : 'bet',
        user_name: name,
        user_avatar: profile?.avatar_url || AVATARS[seed],
        market_title: market.title,
        market_slug: market.slug,
        amount: o.status === 'settled_win' ? o.settlement_amount : o.stake_amount,
        option_label: option?.label || '',
        created_at: o.created_at,
      })
    }

    // Adicionar mercados criados
    for (const m of (markets || [])) {
      const profile = (m as any).profiles
      const name = profile?.full_name || profile?.email?.split('@')[0] || 'Admin'
      const seed = name.charCodeAt(0) % AVATARS.length
      activities.push({
        id: `market-${m.id}`,
        type: 'market_created',
        user_name: name,
        user_avatar: AVATARS[seed],
        market_title: m.title,
        market_slug: m.slug,
        created_at: m.created_at,
      })
    }

    // Ordenar por data
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setItems(prev => page === 0 ? activities : [...prev, ...activities])
    setHasMore(activities.length >= PAGE_SIZE)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime
  useEffect(() => {
    if (!live) return
    const supabase = createClient()
    const channel = supabase.channel('activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [live, load])

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Atividade</h1>
              <p className="text-sm text-muted-foreground">O que está acontecendo agora</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLive(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${live ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'border-border text-muted-foreground'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
              {live ? 'Ao vivo' : 'Pausado'}
            </button>
            <button onClick={load} disabled={loading}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { icon: Users, label: 'Traders', value: stats.traders.toLocaleString('pt-BR') },
            { icon: TrendingUp, label: 'Apostas', value: stats.apostas.toLocaleString('pt-BR') },
            { icon: Zap, label: 'Mercados', value: stats.mercados.toLocaleString('pt-BR') },
            { icon: Trophy, label: 'Volume', value: `R$ ${stats.volume >= 1000 ? (stats.volume/1000).toFixed(1)+'k' : stats.volume}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-2">
          {loading && items.length === 0 ? (
            Array.from({length: 8}).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma atividade ainda</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className={`rounded-xl border bg-card p-4 flex items-center gap-3 transition-all ${item.type === 'win' ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border hover:border-border/80'}`}>
              <div className="text-2xl flex-shrink-0">{item.user_avatar}</div>
              <div className="flex-1 min-w-0">
                <ActivityText item={item} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.created_at)}</p>
              </div>
              <ActivityIcon type={item.type} />
            </div>
          ))}
        </div>
      {/* Carregar mais */}
        {hasMore && !loading && (
          <button onClick={() => { setPage(p => p + 1) }} disabled={loadingMore}
            className="w-full rounded-xl border border-border bg-card py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center justify-center gap-2">
            {loadingMore ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Carregando...</> : 'Carregar mais atividades'}
          </button>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">Todas as atividades carregadas</p>
        )}
      </div>
    </div>
  )
}
