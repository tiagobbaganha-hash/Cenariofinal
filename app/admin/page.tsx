import { StatsCard } from '@/components/admin/StatsCard'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Wallet, Activity } from 'lucide-react'

// Mock data - sera substituido por dados reais do Supabase
const stats = {
  totalUsers: 1247,
  activeMarkets: 23,
  totalVolume: 45780.5,
  dailyBets: 342,
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visao geral da plataforma CenarioX
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Usuarios"
          value={stats.totalUsers.toLocaleString('pt-BR')}
          description="vs. mes anterior"
          icon={Users}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Mercados Ativos"
          value={stats.activeMarkets.toString()}
          description="3 fechando hoje"
          icon={TrendingUp}
        />
        <StatsCard
          title="Volume Total"
          value={`R$ ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="vs. mes anterior"
          icon={Wallet}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Apostas Hoje"
          value={stats.dailyBets.toString()}
          description="vs. ontem"
          icon={Activity}
          trend={{ value: -3.1, isPositive: false }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity />

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acoes Rapidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <QuickActionItem
                title="Criar Novo Mercado"
                description="Adicionar um novo mercado preditivo"
                href="/admin/markets/new"
              />
              <QuickActionItem
                title="Aprovar KYC Pendente"
                description="5 verificacoes aguardando revisao"
                href="/admin/users?filter=kyc_pending"
              />
              <QuickActionItem
                title="Resolver Mercado"
                description="2 mercados prontos para resolucao"
                href="/admin/markets?filter=ready_to_resolve"
              />
              <QuickActionItem
                title="Saques Pendentes"
                description="8 solicitacoes de saque"
                href="/admin/finance?filter=pending_withdrawals"
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
    <a
      href={href}
      className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent no-underline"
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="text-muted-foreground">→</span>
    </a>
  )
}
