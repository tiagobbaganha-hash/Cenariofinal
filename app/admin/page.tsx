'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, 
  Users, 
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KPIs {
  totalMarkets: number
  activeMarkets: number
  totalUsers: number
  totalVolume: number
  pendingDeposits: number
  pendingWithdrawals: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  created_at: string
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    async function loadData() {
      // Load KPIs
      const { data: kpiData } = await supabase
        .from('v_admin_kpis_final')
        .select('*')
        .single()

      if (kpiData) {
        setKpis({
          totalMarkets: kpiData.total_markets || 0,
          activeMarkets: kpiData.active_markets || 0,
          totalUsers: kpiData.total_users || 0,
          totalVolume: parseFloat(kpiData.total_volume || '0'),
          pendingDeposits: kpiData.pending_deposits || 0,
          pendingWithdrawals: kpiData.pending_withdrawals || 0,
        })
      } else {
        // Fallback: count manually
        const { count: markets } = await supabase.from('markets').select('*', { count: 'exact', head: true })
        const { count: active } = await supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'open')
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        
        setKpis({
          totalMarkets: markets || 0,
          activeMarkets: active || 0,
          totalUsers: users || 0,
          totalVolume: 0,
          pendingDeposits: 0,
          pendingWithdrawals: 0,
        })
      }

      // Load recent activity
      const { data: activity } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (activity) {
        setRecentActivity(activity.map((a: any) => ({
          id: a.id,
          type: a.action,
          description: `${a.action} - ${a.resource_type || 'sistema'}`,
          created_at: a.created_at,
        })))
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visao geral da plataforma CenarioX</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Mercados Ativos"
          value={kpis?.activeMarkets || 0}
          total={kpis?.totalMarkets || 0}
          icon={TrendingUp}
          color="green"
          href="/admin/mercados"
        />
        <KpiCard
          title="Usuarios"
          value={kpis?.totalUsers || 0}
          icon={Users}
          color="cyan"
          href="/admin/usuarios"
        />
        <KpiCard
          title="Volume Total"
          value={`R$ ${((kpis?.totalVolume || 0) / 1000).toFixed(1)}k`}
          icon={Wallet}
          color="yellow"
          href="/admin/financeiro"
        />
        <KpiCard
          title="Taxa Resolucao"
          value="94%"
          icon={BarChart3}
          color="green"
          href="/admin/relatorios"
        />
      </div>

      {/* Alerts */}
      {((kpis?.pendingDeposits || 0) > 0 || (kpis?.pendingWithdrawals || 0) > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(kpis?.pendingDeposits || 0) > 0 && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{kpis?.pendingDeposits} depositos pendentes</p>
                <p className="text-sm text-muted-foreground">Aguardando confirmacao</p>
              </div>
              <Link href="/admin/financeiro">
                <Button size="sm" variant="outline">Revisar</Button>
              </Link>
            </div>
          )}
          {(kpis?.pendingWithdrawals || 0) > 0 && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <div className="p-3 rounded-lg bg-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{kpis?.pendingWithdrawals} saques pendentes</p>
                <p className="text-sm text-muted-foreground">Aguardando processamento</p>
              </div>
              <Link href="/admin/financeiro">
                <Button size="sm" variant="outline">Processar</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Acoes Rapidas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/mercados/novo">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Criar Mercado</p>
                  <p className="text-sm text-muted-foreground">Novo mercado preditivo</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/usuarios">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium">Ver Usuarios</p>
                  <p className="text-sm text-muted-foreground">Gerenciar contas</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/financeiro">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Wallet className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium">Financeiro</p>
                  <p className="text-sm text-muted-foreground">Depositos e saques</p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/admin/relatorios">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Relatorios</p>
                  <p className="text-sm text-muted-foreground">Analytics e metricas</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Atividade Recente</h2>
          <Link href="/admin/auditoria" className="text-sm text-primary hover:text-primary/80">
            Ver tudo
          </Link>
        </div>
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center gap-4 p-4">
                  <div className="p-2 rounded-lg bg-accent">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, total, icon: Icon, color, href }: {
  title: string
  value: number | string
  total?: number
  icon: any
  color: string
  href: string
}) {
  const colors: Record<string, string> = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
  }

  return (
    <Link href={href}>
      <div className={`p-6 rounded-2xl bg-gradient-to-br ${colors[color]} border hover:border-opacity-50 transition-colors cursor-pointer`}>
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-6 w-6" />
          <Eye className="h-4 w-4 opacity-50" />
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {title}
          {total !== undefined && <span className="opacity-70"> / {total} total</span>}
        </p>
      </div>
    </Link>
  )
}
