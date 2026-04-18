'use client'

import { useEffect, useState } from 'react'
import { fetchPlatformAnalytics, type PlatformAnalytics } from '@/lib/api/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Users, TrendingUp, Zap } from 'lucide-react'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await fetchPlatformAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error('Erro ao carregar analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (loading) {
    return <div>Carregando analytics...</div>
  }

  if (!analytics) {
    return <div>Erro ao carregar dados</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics da Plataforma</h1>
        <p className="text-muted-foreground">Métricas e performance do CenarioX</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              DAU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.daily_active_users}</p>
            <p className="text-xs text-muted-foreground mt-1">+{analytics.new_users_today} novo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Volume Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {analytics.total_volume_today.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Média por usuário</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Volume Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {analytics.total_volume_all_time.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">All-time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {analytics.avg_trade_value.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Por usuário</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mercados por Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Rascunho</span>
              <Badge variant="secondary">{analytics.markets_by_status.draft}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Aberto</span>
              <Badge variant="success">{analytics.markets_by_status.open}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Fechado</span>
              <Badge variant="default">{analytics.markets_by_status.closed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Resolvido</span>
              <Badge variant="default">{analytics.markets_by_status.resolved}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Mercados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.top_markets.map((market, idx) => (
                <div key={market.id} className="flex items-center justify-between text-sm">
                  <span>{idx + 1}. {market.title}</span>
                  <span className="text-muted-foreground">{market.trades} trades</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
