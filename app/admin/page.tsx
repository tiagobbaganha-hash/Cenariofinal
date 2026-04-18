'use client'

import { useEffect, useState } from 'react'
import { StatsCard } from '@/components/admin/StatsCard'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Wallet, Activity } from 'lucide-react'
import { DashboardStats, fetchDashboardStats } from '@/lib/api/admin'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    totalUsers: 0,
    totalVolume: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Erro ao carregar stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma CenarioX
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuários"
          value={stats.totalUsers.toLocaleString('pt-BR')}
          description="Usuários cadastrados"
          icon={Users}
          loading={loading}
        />
        <StatsCard
          title="Mercados Ativos"
          value={stats.activeMarkets.toString()}
          description="Em andamento"
          icon={TrendingUp}
          loading={loading}
        />
        <StatsCard
          title="Total de Mercados"
          value={stats.totalMarkets.toString()}
          description="Criados"
          icon={Wallet}
          loading={loading}
        />
        <StatsCard
          title="Volume Total"
          value={`R$ ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Movimentado"
          icon={Activity}
          loading={loading}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <QuickActionItem
                title="Criar Novo Mercado"
                description="Adicionar um novo mercado preditivo"
                href="/admin/markets/new"
              />
              <QuickActionItem
                title="Visualizar Mercados"
                description={`${stats.totalMarkets} mercados no sistema`}
                href="/admin/markets"
              />
              <QuickActionItem
                title="Gerenciar Usuários"
                description={`${stats.totalUsers} usuários cadastrados`}
                href="/admin/users"
              />
              <QuickActionItem
                title="Relatórios Financeiros"
                description="Volume, taxas e movimentações"
                href="/admin/finance"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickActionItem({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href} className="no-underline">
      <div className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent cursor-pointer">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-muted-foreground">→</span>
      </div>
    </Link>
  )
}
