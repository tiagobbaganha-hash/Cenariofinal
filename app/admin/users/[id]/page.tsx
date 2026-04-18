'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, Mail, Clock, Shield, Wallet } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'

interface UserDetail {
  id: string
  email: string
  name: string | null
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected'
  role: 'user' | 'admin' | 'super_admin'
  balance: number
  totalBets: number
  totalVolume: number
  totalWinnings: number
  created_at: string
  last_sign_in_at: string | null
  last_activity_at: string | null
  isActive: boolean
}

const kycStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  none: { label: 'Não Iniciado', variant: 'secondary' },
  pending: { label: 'Pendente', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
}

const roleLabels: Record<string, { label: string; badge: 'default' | 'secondary' | 'success' }> = {
  user: { label: 'Usuário', badge: 'default' },
  admin: { label: 'Admin', badge: 'warning' },
  super_admin: { label: 'Super Admin', badge: 'destructive' },
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        // TODO: Implementar fetch de usuário quando houver endpoint REST
        // Por enquanto, usar mock data
        const mockUser: UserDetail = {
          id: userId,
          email: 'usuario@example.com',
          name: 'João Silva',
          kycStatus: 'approved',
          role: 'user',
          balance: 1250.50,
          totalBets: 45,
          totalVolume: 3200.0,
          totalWinnings: 580.0,
          created_at: '2024-01-15T10:00:00Z',
          last_sign_in_at: '2024-03-20T14:30:00Z',
          last_activity_at: '2024-03-20T14:45:00Z',
          isActive: true,
        }
        setUser(mockUser)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar usuário')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Usuário não encontrado</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            O usuário que você está procurando não existe ou foi removido.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{user.name || 'Usuário'}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{user.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.isActive ? 'success' : 'secondary'}>
            {user.isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo"
          value={formatCurrency(user.balance)}
          icon={Wallet}
        />
        <StatCard
          title="Total de Apostas"
          value={user.totalBets.toString()}
          icon={AlertCircle}
        />
        <StatCard
          title="Volume Movimentado"
          value={formatCurrency(user.totalVolume)}
          icon={Wallet}
        />
        <StatCard
          title="Ganhos"
          value={formatCurrency(user.totalWinnings)}
          icon={AlertCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Nome Completo
                  </label>
                  <p className="mt-1 text-sm font-medium">{user.name || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="mt-1 text-sm font-medium">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atividade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ActivityItem
                label="Cadastro"
                value={formatDate(user.created_at)}
                icon={Clock}
              />
              <ActivityItem
                label="Último Login"
                value={user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '—'}
                icon={Clock}
              />
              <ActivityItem
                label="Última Atividade"
                value={user.last_activity_at ? formatDate(user.last_activity_at) : '—'}
                icon={Clock}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Apostas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatItem
                  label="Total de Apostas"
                  value={user.totalBets.toString()}
                />
                <StatItem
                  label="Volume Total"
                  value={formatCurrency(user.totalVolume)}
                />
                <StatItem
                  label="Ganhos Líquidos"
                  value={formatCurrency(user.totalWinnings)}
                />
                <StatItem
                  label="ROI"
                  value={user.totalVolume > 0 ? `${((user.totalWinnings / user.totalVolume) * 100).toFixed(2)}%` : '—'}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4" />
                  KYC / Verificação
                </label>
                <Badge variant={kycStatusConfig[user.kycStatus].variant}>
                  {kycStatusConfig[user.kycStatus].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Status de verificação de identidade do usuário.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Papel do Usuário
                </label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={user.role}
                  disabled
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Contato o super admin para alterar permissões.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" disabled>
                Resetar Senha
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Suspender Conta
              </Button>
              <p className="text-xs text-muted-foreground">
                Funcionalidades em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: any
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: any
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function StatItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
