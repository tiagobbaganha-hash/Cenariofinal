'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchUserPortfolio, type PortfolioSummary } from '@/lib/api/portfolio'
import { PositionCard } from '@/components/portfolio/PositionCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [user_id, setUser_id] = useState<string | null>(null)

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session?.user?.id) {
          throw new Error('User not authenticated')
        }

        setUser_id(data.session.user.id)
        const portfolio_data = await fetchUserPortfolio(data.session.user.id)
        setPortfolio(portfolio_data)
      } catch (error) {
        console.error('Erro ao carregar portfólio:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolio()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfólio</h1>
          <p className="text-muted-foreground">Carregando suas posições...</p>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Portfólio</h1>
          <p className="text-muted-foreground">Erro ao carregar portfólio</p>
        </div>
      </div>
    )
  }

  const isPositive = portfolio.total_unrealized_pnl >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Portfólio</h1>
        <p className="text-muted-foreground">Suas posições abertas em mercados preditivos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {portfolio.total_invested.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {portfolio.total_value.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">P&L Não Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              R$ {portfolio.total_unrealized_pnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Retorno %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {portfolio.total_unrealized_pnl_percentage.toFixed(2)}%
              </p>
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Posições Abertas ({portfolio.positions.length})</h2>
        {portfolio.positions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Você ainda não tem posições abertas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {portfolio.positions.map((position) => (
              <PositionCard key={`${position.market_id}:${position.option_id}`} position={position} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
