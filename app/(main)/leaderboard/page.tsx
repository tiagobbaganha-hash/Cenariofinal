'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, TrendingUp } from 'lucide-react'

interface LeaderboardUser {
  rank: number
  user_id: string
  user_email: string
  total_bets: number
  winning_percentage: number
  total_profit: number
  total_volume: number
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'all_time' | 'monthly' | 'weekly'>('all_time')

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('v_front_leaderboard_v1')
          .select('*')
          .order('total_profit', { ascending: false })
          .limit(100)

        if (error) throw error

        const formattedData = (data || []).map((user: any, index: number) => ({
          rank: index + 1,
          user_id: user.user_id,
          user_email: user.user_email || 'Anônimo',
          total_bets: user.total_bets || 0,
          winning_percentage: user.winning_percentage || 0,
          total_profit: user.total_profit || 0,
          total_volume: user.total_volume || 0,
        }))

        setUsers(formattedData)
      } catch (error) {
        console.error('Error loading leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [timeframe])

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500'
    if (rank === 2) return 'text-slate-400'
    if (rank === 3) return 'text-amber-600'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">
          Veja os melhores apostadores da plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 100 Apostadores
            </CardTitle>
            <div className="flex gap-2">
              {['all_time', 'monthly', 'weekly'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    timeframe === tf
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tf === 'all_time' ? 'Todos os Tempos' : tf === 'monthly' ? 'Este Mês' : 'Esta Semana'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário no leaderboard ainda
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  {/* Rank Medal */}
                  <div className={`text-2xl font-bold w-12 text-center ${getMedalColor(user.rank)}`}>
                    {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback>{user.user_email.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium truncate">{user.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.total_bets} apostas • {user.winning_percentage.toFixed(1)}% de sucesso
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className={`text-lg font-bold ${user.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {user.total_profit >= 0 ? '+' : ''} R$ {Math.abs(user.total_profit).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Volume: R$ {user.total_volume.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Apostas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {users.reduce((sum, u) => sum + u.total_bets, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {users.reduce((sum, u) => sum + u.total_volume, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${users.reduce((sum, u) => sum + u.total_profit, 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {users.reduce((sum, u) => sum + u.total_profit, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
