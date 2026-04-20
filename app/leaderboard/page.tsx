'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, cn } from '@/lib/utils'
import type { LeaderboardRow } from '@/lib/types'
import { Trophy, Flame, TrendingUp, Target, Star, Crown, Loader2 } from 'lucide-react'

type Period = '7d' | '30d' | 'all'

// ─── Sistema de Níveis ───────────────────────────────────────────────────────
const LEVELS = [
  { id: 'novato',    label: 'Novato',      min: 0,   max: 9,   emoji: '🥉', color: 'text-amber-600',    bg: 'bg-amber-900/30 border-amber-700/40',  glow: 'shadow-amber-900/30' },
  { id: 'apostador', label: 'Apostador',   min: 10,  max: 49,  emoji: '🥈', color: 'text-slate-300',    bg: 'bg-slate-700/30 border-slate-600/40',  glow: 'shadow-slate-700/30' },
  { id: 'trader',    label: 'Trader',      min: 50,  max: 199, emoji: '🥇', color: 'text-yellow-400',   bg: 'bg-yellow-900/30 border-yellow-700/40', glow: 'shadow-yellow-900/30' },
  { id: 'expert',    label: 'Expert',      min: 200, max: 499, emoji: '💎', color: 'text-cyan-400',     bg: 'bg-cyan-900/30 border-cyan-700/40',    glow: 'shadow-cyan-700/30' },
  { id: 'lenda',     label: 'Lenda',       min: 500, max: Infinity, emoji: '👑', color: 'text-primary', bg: 'bg-primary/20 border-primary/40',     glow: 'shadow-primary/30' },
]

function getLevel(bets: number) {
  return LEVELS.find(l => bets >= l.min && bets <= l.max) ?? LEVELS[0]
}

function getLevelProgress(bets: number) {
  const lvl = getLevel(bets)
  if (lvl.max === Infinity) return 100
  const range = lvl.max - lvl.min
  const prog = bets - lvl.min
  return Math.min(100, Math.round((prog / range) * 100))
}

// ─── Avatares ────────────────────────────────────────────────────────────────
const AVATARS = [
  '🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅',
  '🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪',
]

function Avatar({ url, name, seed, size = 'md' }: { url?: string|null; name?: string|null; seed: string; size?: 'sm'|'md'|'lg'|'xl' }) {
  const sizeMap = { sm: 'h-8 w-8 text-sm', md: 'h-10 w-10 text-base', lg: 'h-14 w-14 text-xl', xl: 'h-20 w-20 text-3xl' }
  const emoji = AVATARS[seed.charCodeAt(0) % AVATARS.length]
  const initials = (name || seed || '?').slice(0, 2).toUpperCase()

  if (url) {
    return <img src={url} alt={name || 'Avatar'} className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-primary/30`} />
  }
  return (
    <div className={`${sizeMap[size]} rounded-full flex items-center justify-center bg-primary/15 border border-primary/30 font-bold`}>
      {emoji}
    </div>
  )
}

// ─── Rank Badge ──────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-yellow-900 font-black text-sm shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-400/50">
      1
    </div>
  )
  if (rank === 2) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400 text-slate-900 font-black text-sm shadow-md ring-2 ring-slate-300/50">
      2
    </div>
  )
  if (rank === 3) return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-black text-sm shadow-md ring-2 ring-amber-600/50">
      3
    </div>
  )
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-sm">
      {rank}
    </div>
  )
}

// ─── Card do Pódio (Top 3) ───────────────────────────────────────────────────
function PodiumCard({ row, position }: { row: LeaderboardRow; position: 1|2|3 }) {
  const level = getLevel(row.total_bets ?? 0)
  const progress = getLevelProgress(row.total_bets ?? 0)
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' }
  const orders = { 1: 'order-2', 2: 'order-1', 3: 'order-3' }
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <div className={`flex flex-col items-center gap-3 ${orders[position]}`}>
      {/* Avatar + Badge */}
      <div className="relative">
        <Avatar url={row.avatar_url} name={row.name ?? row.username} seed={row.user_id} size="lg" />
        <div className="absolute -bottom-1 -right-1 text-xl leading-none">{medals[position]}</div>
        {position === 1 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl animate-bounce">👑</div>
        )}
      </div>

      {/* Nome + Nível */}
      <div className="text-center">
        <p className="text-sm font-bold text-foreground">{row.name ?? row.username ?? 'Apostador'}</p>
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${level.bg} ${level.color}`}>
          {level.emoji} {level.label}
        </div>
      </div>

      {/* Stats */}
      <div className="text-center space-y-0.5">
        <p className="text-base font-bold text-foreground">{formatCurrency(row.total_stake ?? row.volume ?? 0)}</p>
        <p className="text-[10px] text-muted-foreground">{row.total_bets ?? 0} apostas</p>
        {(row.accuracy ?? 0) > 0 && (
          <p className={`text-[10px] font-semibold ${(row.pnl ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {(row.accuracy! * 100).toFixed(0)}% acerto
          </p>
        )}
      </div>

      {/* Pedestal */}
      <div className={`w-24 ${heights[position]} rounded-t-xl flex items-end justify-center pb-2 font-black text-2xl ${
        position === 1 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-lg shadow-yellow-500/30 text-yellow-900' :
        position === 2 ? 'bg-gradient-to-t from-slate-600 to-slate-400 text-slate-900' :
        'bg-gradient-to-t from-amber-800 to-amber-600 text-amber-100'
      }`}>
        {position}
      </div>
    </div>
  )
}

// ─── Linha da Tabela ─────────────────────────────────────────────────────────
function LeaderRow({ row, rank, isMe }: { row: LeaderboardRow; rank: number; isMe: boolean }) {
  const level = getLevel(row.total_bets ?? 0)
  const progress = getLevelProgress(row.total_bets ?? 0)
  const pnlPositive = (row.pnl ?? 0) >= 0

  return (
    <div className={cn(
      'group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all',
      isMe ? 'border-primary/40 bg-primary/10 shadow-md shadow-primary/10' : 'border-border bg-card hover:border-primary/20 hover:bg-card/80'
    )}>
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar url={row.avatar_url} name={row.name ?? row.username} seed={row.user_id} size="md" />
      </div>

      {/* Nome + Nível + Barra */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">
            {row.name ?? row.username ?? 'Apostador'}
          </span>
          {isMe && <span className="text-[10px] bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-bold">Você</span>}
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${level.bg} ${level.color}`}>
            {level.emoji} {level.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground">{row.total_bets ?? 0} apostas</span>
        </div>
      </div>

      {/* Volume */}
      <div className="text-right hidden sm:block">
        <p className="text-sm font-bold text-foreground">{formatCurrency(row.total_stake ?? row.volume ?? 0)}</p>
        <p className="text-[10px] text-muted-foreground">volume</p>
      </div>

      {/* Acerto */}
      {(row.accuracy ?? 0) > 0 && (
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-primary">{(row.accuracy! * 100).toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground">acerto</p>
        </div>
      )}

      {/* P&L */}
      <div className="text-right flex-shrink-0">
        <p className={cn('text-sm font-bold', pnlPositive ? 'text-primary' : 'text-destructive')}>
          {pnlPositive ? '+' : ''}{formatCurrency(row.pnl ?? 0)}
        </p>
        <p className="text-[10px] text-muted-foreground">P&L</p>
      </div>
    </div>
  )
}

// ─── Página Principal ────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'ranking'|'niveis'>('ranking')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setMyId(user.id) })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const supabase = createClient()
        const viewMap: Record<Period, string> = {
          '7d': 'v_leaderboard_7d',
          '30d': 'v_leaderboard_30d',
          'all': 'v_front_leaderboard_v1',
        }
        const { data } = await supabase.from(viewMap[period]).select('*').limit(100)
        const list = (data ?? []) as LeaderboardRow[]
        setRows(list)
        if (myId) {
          const idx = list.findIndex(r => r.user_id === myId)
          setMyRank(idx >= 0 ? idx + 1 : null)
        }
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period, myId])

  const top3 = rows.slice(0, 3)
  const rest = rows.slice(3)
  const myRow = myId ? rows.find(r => r.user_id === myId) : null

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Trophy className="h-6 w-6" />
            </span>
            Leaderboard
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">Os melhores traders do CenárioX</p>
        </div>

        {/* Filtro período */}
        <div className="flex gap-1 rounded-xl bg-muted/50 border border-border p-1">
          {(['7d', '30d', 'all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('rounded-lg px-4 py-1.5 text-xs font-semibold transition-all',
                period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}>
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Geral'}
            </button>
          ))}
        </div>
      </div>

      {/* Minha posição */}
      {myRow && myRank && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 flex items-center gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 font-black text-primary text-lg">
            {myRank}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Sua posição</p>
            <p className="text-xs text-muted-foreground">
              {getLevel(myRow.total_bets ?? 0).emoji} {getLevel(myRow.total_bets ?? 0).label} · {myRow.total_bets ?? 0} apostas · {formatCurrency(myRow.total_stake ?? 0)} volume
            </p>
          </div>
          <div className="text-right">
            <p className={cn('text-sm font-bold', (myRow.pnl ?? 0) >= 0 ? 'text-primary' : 'text-destructive')}>
              {(myRow.pnl ?? 0) >= 0 ? '+' : ''}{formatCurrency(myRow.pnl ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">seu P&L</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {[
          { id: 'ranking', label: '🏆 Ranking', },
          { id: 'niveis', label: '⭐ Sistema de Níveis' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={cn('flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB RANKING ─── */}
      {activeTab === 'ranking' && (
        loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum trader ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pódio Top 3 */}
            {top3.length >= 3 && (
              <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-card/50 p-6 overflow-hidden relative">
                {/* Background decorativo */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-4 left-8 text-8xl">🏆</div>
                  <div className="absolute bottom-4 right-8 text-8xl">⭐</div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 text-center">🏅 Pódio</p>
                <div className="flex items-end justify-center gap-4">
                  {top3[1] && <PodiumCard row={top3[1]} position={2} />}
                  {top3[0] && <PodiumCard row={top3[0]} position={1} />}
                  {top3[2] && <PodiumCard row={top3[2]} position={3} />}
                </div>
              </div>
            )}

            {/* Resto da lista */}
            {rest.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Classificação geral</p>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  <span className="w-8">#</span>
                  <span className="flex-1 ml-10">Trader</span>
                  <span className="hidden sm:block w-24 text-right">Volume</span>
                  <span className="hidden md:block w-16 text-right">Acerto</span>
                  <span className="w-20 text-right">P&L</span>
                </div>
                {rest.map((row, i) => (
                  <LeaderRow key={row.user_id} row={row} rank={i + 4} isMe={row.user_id === myId} />
                ))}
              </div>
            )}

            {/* Se não tiver top3 mas tiver dados */}
            {top3.length < 3 && rows.length > 0 && (
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <LeaderRow key={row.user_id} row={row} rank={i + 1} isMe={row.user_id === myId} />
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* ─── TAB NÍVEIS ─── */}
      {activeTab === 'niveis' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Evolua apostando mais e subindo de nível. Cada nível desbloqueia novos privilégios e reconhecimento na plataforma.</p>

          {LEVELS.map((lvl, i) => (
            <div key={lvl.id} className={`rounded-2xl border p-5 ${lvl.bg}`}>
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0">{lvl.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-black ${lvl.color}`}>{lvl.label}</span>
                    {myRow && getLevel(myRow.total_bets ?? 0).id === lvl.id && (
                      <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-bold">Seu nível atual</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {lvl.max === Infinity
                      ? `${lvl.min}+ apostas`
                      : `${lvl.min} – ${lvl.max} apostas`}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      ['Badge exclusivo', lvl.emoji],
                      ['Avatar especial', '🎨'],
                      i >= 2 ? ['Chat em destaque', '💬'] : ['Acesso básico', '✅'],
                      i >= 3 ? ['Mercados VIP', '🔑'] : i >= 2 ? ['Bônus de odds', '📈'] : ['Leaderboard', '🏆'],
                    ].map(([label, icon]) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{icon}</span>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Quantos traders neste nível */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-2xl font-black ${lvl.color}`}>
                    {rows.filter(r => getLevel(r.total_bets ?? 0).id === lvl.id).length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">traders</p>
                </div>
              </div>

              {/* Barra de progresso se for meu nível */}
              {myRow && getLevel(myRow.total_bets ?? 0).id === lvl.id && lvl.max !== Infinity && (
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{myRow.total_bets ?? 0} apostas</span>
                    <span>próximo nível: {lvl.max + 1} apostas</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${lvl.color.replace('text-', 'bg-')}`}
                      style={{ width: `${getLevelProgress(myRow.total_bets ?? 0)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
