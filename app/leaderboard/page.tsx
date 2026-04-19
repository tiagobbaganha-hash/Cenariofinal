'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, cn } from '@/lib/utils'
import type { LeaderboardRow } from '@/lib/types'
import { Trophy, Medal, Award } from 'lucide-react'

type Period = '7d' | '30d' | 'all'

const periods: { value: Period; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'all', label: 'Geral' },
]

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('all')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const viewMap: Record<Period, string> = {
          '7d': 'v_leaderboard_7d',
          '30d': 'v_leaderboard_30d',
          'all': 'v_front_leaderboard_v1',
        }
        const { data } = await supabase
          .from(viewMap[period])
          .select('*')
          .limit(50)
        setRows((data ?? []) as any)
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [period])

  return (
    <>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
                <Trophy className="h-5 w-5" />
              </span>
              Leaderboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              Os melhores traders da CenarioX.
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-muted p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
                  period === p.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {/* Top 3 podium */}
        {!loading && rows.length >= 3 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <PodiumCard row={rows[1]} position={2} icon={Medal} color="text-slate-300" />
            <PodiumCard row={rows[0]} position={1} icon={Trophy} color="text-primary" primary />
            <PodiumCard row={rows[2]} position={3} icon={Award} color="text-amber-500" />
          </div>
        )}

        {/* Full table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-16 text-center">
                <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Leaderboard vazio</p>
                <p className="text-sm text-muted-foreground">
                  Assim que tivermos resultados, os melhores traders aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Rank</th>
                      <th className="px-6 py-3 text-left font-medium">Trader</th>
                      <th className="px-6 py-3 text-right font-medium">Volume</th>
                      <th className="px-6 py-3 text-right font-medium">Apostas</th>
                      <th className="px-6 py-3 text-right font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rows.map((r, idx) => {
                      const rank = r.rank ?? idx + 1
                      const displayName = r.username ?? r.name ?? 'anônimo'
                      const volume = r.volume ?? r.total_stake ?? 0
                      const bets = r.total_bets ?? (r.wins ?? 0) + (r.losses ?? 0)
                      const pnl = r.pnl ?? 0
                      return (
                        <tr key={r.user_id} className="group hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-3.5">
                            <RankBadge rank={rank} />
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{displayName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono tabular-nums">
                            {formatCurrency(volume)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono tabular-nums text-muted-foreground">
                            {bets}
                          </td>
                          <td
                            className={cn(
                              'px-6 py-3.5 text-right font-mono tabular-nums font-medium',
                              pnl > 0 ? 'text-success' : pnl < 0 ? 'text-destructive' : 'text-muted-foreground'
                            )}
                          >
                            {pnl > 0 ? '+' : ''}
                            {formatCurrency(pnl)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

    </>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</div>
  if (rank === 2)
    return <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-400/20 text-xs font-bold text-slate-300">2</div>
  if (rank === 3)
    return <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-500">3</div>
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-xs font-mono text-muted-foreground">
      #{rank}
    </span>
  )
}

function PodiumCard({
  row,
  position,
  icon: Icon,
  color,
  primary,
}: {
  row: LeaderboardRow
  position: number
  icon: any
  color: string
  primary?: boolean
}) {
  if (!row) return null
  const name = row.username ?? row.name ?? 'anônimo'
  const volume = row.volume ?? row.total_stake ?? 0

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        primary && 'sm:scale-105 border-primary/30 shadow-lg shadow-primary/5'
      )}
    >
      <CardContent className="p-5 text-center">
        <Icon className={cn('mx-auto h-8 w-8', color)} />
        <div className={cn('mt-2 text-xs font-medium', color)}>{position}º lugar</div>
        <div className="mt-3 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="font-semibold truncate w-full">{name}</div>
          <div className="font-mono text-lg tabular-nums">{formatCurrency(volume)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
