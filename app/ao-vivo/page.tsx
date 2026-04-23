'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MyPositions } from '@/components/market/MyPositions'
import { Zap, Radio, Clock, Users, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface LiveMarket {
  id: string
  title: string
  slug: string
  description: string | null
  category: string
  status: string
  closes_at: string
  live_config: {
    event_type: 'sport' | 'show' | 'politics' | 'custom'
    event_name: string
    current_score?: string
    period?: string
    is_live: boolean
    stream_url?: string
  } | null
  total_volume: number | null
  bet_count: number | null
  options: Array<{
    id: string
    label: string
    option_key: string
    probability: number
    odds: number
  }>
}

const EVENT_ICONS: Record<string, string> = {
  sport: '⚽', show: '🎬', politics: '🏛️', custom: '🎯'
}

function LiveBadge({ isLive }: { isLive: boolean }) {
  if (!isLive) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      EM BREVE
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
      AO VIVO
    </span>
  )
}

function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    function tick() {
      const diff = new Date(closesAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('ENCERRADO'); return }
      setUrgent(diff < 300000)
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(h > 0 ? `${h}h ${String(m).padStart(2,'0')}m` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [closesAt])

  return (
    <span className={`font-mono font-bold text-sm ${urgent ? 'text-red-400 animate-pulse' : 'text-foreground'}`}>
      {timeLeft}
    </span>
  )
}

export default function AoVivoPage() {
  const [markets, setMarkets] = useState<LiveMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [bettingId, setBettingId] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [balance, setBalance] = useState(0)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      const { data: w } = await supabase.from('wallets').select('available_balance').eq('user_id', user.id).single()
      setBalance(parseFloat((w as any)?.available_balance || 0))
    }

    // Buscar mercados ao vivo — query simples sem nested select
    const { data: mData, error: mErr } = await supabase
      .from('markets')
      .select('*')
      .eq('market_type', 'live')
      .in('status', ['open', 'closed', 'resolved'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (mErr) console.error('Ao-vivo markets error:', mErr)

    if (mData && mData.length > 0) {
      // Buscar options separadamente
      const ids = mData.map((m: any) => m.id)
      const { data: opts } = await supabase
        .from('market_options')
        .select('id, market_id, label, option_key, probability, odds')
        .in('market_id', ids)

      setMarkets(mData.map((m: any) => ({
        ...m,
        options: (opts || []).filter((o: any) => o.market_id === m.id)
      })))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime: atualizar quando mercado muda
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('live-markets')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'markets' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function handleBet(market: LiveMarket, optionId: string) {
    const key = `${market.id}-${optionId}`
    const stake = parseFloat(amounts[key] || '0')
    if (!stake || stake <= 0 || !userId) return

    setBettingId(key)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('rpc_place_bet', { p_option_id: optionId, p_stake: stake })
      if (error) throw error
      setAmounts(prev => ({ ...prev, [key]: '' }))
      setBalance(b => b - stake)
      load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBettingId(null)
    }
  }

  const liveMarkets = markets.filter(m => m.live_config?.is_live)
  const upcomingMarkets = markets.filter(m => !m.live_config?.is_live)

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30">
              <Radio className="h-5 w-5 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Mercados ao Vivo</h1>
            {liveMarkets.length > 0 && <LiveBadge isLive={true} />}
          </div>
          <p className="text-sm text-muted-foreground">Aposte em eventos acontecendo agora</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : markets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center space-y-3">
          <Radio className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="text-sm font-medium text-foreground">Nenhum evento ao vivo agora</p>
          <p className="text-xs text-muted-foreground">Novos eventos são adicionados durante o dia. Ative as notificações para ser avisado!</p>
          <Link href="/mercados" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            Ver todos os mercados →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AO VIVO */}
          {liveMarkets.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                Acontecendo agora — {liveMarkets.length} evento{liveMarkets.length !== 1 ? 's' : ''}
              </p>
              {liveMarkets.map(m => <LiveMarketCard key={m.id} market={m} userId={userId} balance={balance} amounts={amounts} setAmounts={setAmounts} bettingId={bettingId} onBet={handleBet} />)}
            </div>
          )}

          {/* EM BREVE */}
          {upcomingMarkets.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Em breve</p>
              {upcomingMarkets.map(m => <LiveMarketCard key={m.id} market={m} userId={userId} balance={balance} amounts={amounts} setAmounts={setAmounts} bettingId={bettingId} onBet={handleBet} />)}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function LiveMarketCard({ market, userId, balance, amounts, setAmounts, bettingId, onBet }: {
  market: LiveMarket; userId: string | null; balance: number
  amounts: Record<string, string>; setAmounts: any; bettingId: string | null
  onBet: (m: LiveMarket, optionId: string) => void
}) {
  const cfg = market.live_config
  const isLive = cfg?.is_live
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null)

  const activeKey = selectedOpt ? `${market.id}-${selectedOpt}` : null
  const stake = activeKey ? parseFloat(amounts[activeKey] || '0') : 0
  const selOption = market.options.find(o => o.id === selectedOpt)
  const payout = stake * (selOption?.odds || 0)

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${isLive ? 'border-red-500/30 bg-card' : 'border-border bg-card/70'}`}>
      {/* Barra de status */}
      {isLive && (
        <div className="h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
      )}

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{EVENT_ICONS[cfg?.event_type || 'custom']}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <LiveBadge isLive={!!isLive} />
              <span className="text-[10px] text-muted-foreground">{market.category}</span>
              {cfg?.period && <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-bold">{cfg.period}</span>}
            </div>
            <h2 className="text-sm font-bold text-foreground">{market.title}</h2>
            {cfg?.current_score && (
              <p className="text-lg font-black text-primary mt-1 font-mono">{cfg.current_score}</p>
            )}
            {market.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{market.description}</p>
            )}
          </div>
          {/* Timer + Stats */}
          <div className="text-right flex-shrink-0 space-y-1">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <CountdownTimer closesAt={market.closes_at} />
            </div>
            {market.total_volume && (
              <p className="text-[10px] text-muted-foreground">{formatCurrency(market.total_volume)} apostado</p>
            )}
          </div>
        </div>

        {/* Opções */}
        <div className={`grid gap-2 ${market.options.length === 2 ? 'grid-cols-2' : market.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {market.options.map(opt => {
            const isSelected = selectedOpt === opt.id
            const isNo = opt.option_key === 'no'
            const pct = Math.round((opt.probability || 0.5) * 100)

            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOpt(isSelected ? null : opt.id)}
                disabled={market.status !== 'open'}
                className={`relative rounded-xl border p-3 text-left transition-all overflow-hidden disabled:cursor-not-allowed ${
                  isSelected
                    ? isNo ? 'border-red-500/60 bg-red-500/15' : 'border-primary/60 bg-primary/15'
                    : 'border-border bg-background hover:border-primary/30'
                }`}
              >
                {/* Barra de probabilidade no fundo */}
                <div className={`absolute inset-0 opacity-10 transition-all ${isNo ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${pct}%` }} />

                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isSelected ? (isNo ? 'text-red-400' : 'text-primary') : 'text-foreground'}`}>
                      {opt.label}
                    </span>
                    <span className="text-sm font-black text-foreground">{Number(opt.odds).toFixed(2)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${isNo ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold ${isNo ? 'text-red-400' : 'text-primary'}`}>{pct}%</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Widget de aposta inline */}
        {selectedOpt && market.status === 'open' && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Apostando em: <span className="font-bold text-foreground">{selOption?.label}</span></span>
              <span className="text-xs text-muted-foreground">Saldo: <span className="font-mono text-foreground">{formatCurrency(balance)}</span></span>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <input
                  type="number"
                  min="1"
                  placeholder="0,00"
                  value={activeKey ? amounts[activeKey] || '' : ''}
                  onChange={e => setAmounts((prev: any) => ({ ...prev, [activeKey!]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && onBet(market, selectedOpt)}
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <button
                onClick={() => onBet(market, selectedOpt)}
                disabled={!stake || bettingId === activeKey}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 whitespace-nowrap">
                {bettingId === activeKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Apostar
              </button>
            </div>
            <div className="flex gap-2">
              {[5, 10, 25, 50].map(v => (
                <button key={v} onClick={() => setAmounts((prev: any) => ({ ...prev, [activeKey!]: String(v) }))}
                  className="flex-1 rounded-lg border border-border bg-background py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                  R${v}
                </button>
              ))}
            </div>
            {stake > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Retorno potencial</span>
                <span className="font-bold text-primary">{formatCurrency(payout)}</span>
              </div>
            )}
          </div>
        )}

        {/* Login prompt */}
        {!userId && market.status === 'open' && (
          <Link href="/login" className="block w-full rounded-xl border border-border bg-muted/30 py-2.5 text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            Faça login para apostar
          </Link>
        )}
        {/* Minhas posições */}
        {userId && <MyPositions marketId={market.id} options={market.options} />}
      </div>
    </div>
  )
}
