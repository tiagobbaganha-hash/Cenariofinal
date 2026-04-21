'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Trophy, TrendingUp, TrendingDown, Target, Loader2, ArrowLeft, Shield } from 'lucide-react'

const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']
const LEVELS = [
  { id: 'novato', label: 'Novato', min: 0, max: 9, emoji: '🥉', color: 'text-amber-500', bg: 'bg-amber-900/30 border-amber-700/40' },
  { id: 'apostador', label: 'Apostador', min: 10, max: 49, emoji: '🥈', color: 'text-slate-300', bg: 'bg-slate-700/30 border-slate-600/40' },
  { id: 'trader', label: 'Trader', min: 50, max: 199, emoji: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700/40' },
  { id: 'expert', label: 'Expert', min: 200, max: 499, emoji: '💎', color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-700/40' },
  { id: 'lenda', label: 'Lenda', min: 500, max: Infinity, emoji: '👑', color: 'text-primary', bg: 'bg-primary/20 border-primary/40' },
]
function getLevel(bets: number) { return LEVELS.find(l => bets >= l.min && bets <= l.max) ?? LEVELS[0] }

export default function TraderPage() {
  const params = useParams()
  const router = useRouter()
  const traderId = params.id as string
  const [trader, setTrader] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [profileRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, created_at, avatar_url').eq('id', traderId).single(),
        supabase.from('orders').select('id, stake_amount, potential_payout, status, created_at, settlement_amount, option_id').eq('user_id', traderId).order('created_at', { ascending: false }).limit(20),
      ])

      const profile = profileRes.data as any
      if (!profile) { setLoading(false); return }

      const allOrders = ordersRes.data || []
      const wins = allOrders.filter((o: any) => o.status === 'settled_win')
      const losses = allOrders.filter((o: any) => o.status === 'settled_loss')
      const totalStaked = allOrders.reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0)
      const totalWon = wins.reduce((s: number, o: any) => s + parseFloat(o.settlement_amount || 0), 0)
      const pnl = totalWon - totalStaked
      const winRate = (wins.length + losses.length) > 0 ? wins.length / (wins.length + losses.length) : 0
      const totalBets = allOrders.length

      setTrader({ ...profile, name: profile.full_name || profile.email?.split("@")[0] || 'Trader', totalBets, totalStaked, totalWon, pnl, winRate, wins: wins.length, losses: losses.length })
      setOrders(allOrders.slice(0, 10))
      setLoading(false)
    }
    load()
  }, [traderId])

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (!trader) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Trader não encontrado</p>
      <Link href="/leaderboard" className="text-primary hover:underline text-sm">← Voltar ao Leaderboard</Link>
    </div>
  )

  const level = getLevel(trader.totalBets)
  const emoji = traderId ? AVATARS[traderId.charCodeAt(0) % AVATARS.length] : '🎯'
  const pnlPositive = trader.pnl >= 0
  const memberSince = new Date(trader.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Hero do perfil */}
      <div className={`rounded-3xl border p-6 ${level.bg}`}>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {trader.avatar_url ? (
              <img src={trader.avatar_url} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/30" alt={trader.name} />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 text-5xl ring-2 ring-primary/30">
                {emoji}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 text-2xl leading-none">{level.emoji}</div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-foreground">{trader.name}</h1>
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold mt-1 ${level.bg} ${level.color}`}>
              {level.emoji} {level.label}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Membro desde {memberSince}
            </p>
          </div>

          {/* P&L destaque */}
          <div className={`rounded-2xl border p-3 text-right flex-shrink-0 ${pnlPositive ? 'border-primary/30 bg-primary/10' : 'border-destructive/30 bg-destructive/10'}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">P&L Total</p>
            <p className={`text-2xl font-black ${pnlPositive ? 'text-primary' : 'text-destructive'}`}>
              {pnlPositive ? '+' : ''}{formatCurrency(trader.pnl)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: '🎯', label: 'Apostas', value: trader.totalBets.toLocaleString('pt-BR') },
          { icon: '💰', label: 'Volume', value: formatCurrency(trader.totalStaked) },
          { icon: '✅', label: 'Vitórias', value: trader.wins.toString() },
          { icon: '📊', label: 'Acerto', value: `${(trader.winRate * 100).toFixed(0)}%` },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Barra vitórias vs derrotas */}
      {(trader.wins + trader.losses) > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">Resultado histórico</p>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div className="bg-primary transition-all" style={{ width: `${trader.winRate * 100}%` }} />
            <div className="bg-destructive transition-all flex-1" />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-primary font-semibold">{trader.wins} vitórias ({(trader.winRate * 100).toFixed(0)}%)</span>
            <span className="text-destructive font-semibold">{trader.losses} derrotas</span>
          </div>
        </div>
      )}

      {/* Apostas recentes */}
      {orders.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Apostas recentes</p>
          {orders.map((o: any) => {
            const isWin = o.status === 'settled_win'
            const isLoss = o.status === 'settled_loss'
            const isOpen = ['open','pending'].includes(o.status)
            return (
              <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm ${isWin ? 'bg-primary/20 text-primary' : isLoss ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                  {isWin ? '🏆' : isLoss ? '❌' : '⏳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {isWin ? 'Ganhou' : isLoss ? 'Perdeu' : 'Em aberto'} · {new Date(o.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">{formatCurrency(parseFloat(o.stake_amount))}</p>
                  {isWin && <p className="text-[10px] text-primary">+{formatCurrency(parseFloat(o.settlement_amount || 0))}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
