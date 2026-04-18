import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'

interface AdminUser {
  id: string
  email: string
  name: string | null
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected'
  role: 'user' | 'admin' | 'super_admin'
  balance: number
  totalBets: number
  totalVolume: number
  createdAt: string
  lastLoginAt: string | null
}

// Mock data - sera substituido por dados reais do Supabase
const mockUsers: AdminUser[] = [
  {
    id: '1',
    email: 'joao@email.com',
    name: 'Joao Silva',
    kycStatus: 'approved',
    role: 'user',
    balance: 1250.5,
    totalBets: 45,
    totalVolume: 3200.0,
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-03-20T14:30:00Z',
  },
  {
    id: '2',
    email: 'maria@email.com',
    name: 'Maria Santos',
    kycStatus: 'pending',
    role: 'user',
    balance: 500.0,
    totalBets: 12,
    totalVolume: 800.0,
    createdAt: '2024-02-10T09:15:00Z',
    lastLoginAt: '2024-03-19T18:45:00Z',
  },
  {
    id: '3',
    email: 'pedro@email.com',
    name: 'Pedro Oliveira',
    kycStatus: 'none',
    role: 'user',
    balance: 0,
    totalBets: 0,
    totalVolume: 0,
    createdAt: '2024-03-18T16:00:00Z',
    lastLoginAt: null,
  },
  {
    id: '4',
    email: 'admin@cenariox.com',
    name: 'Admin CenarioX',
    kycStatus: 'approved',
    role: 'super_admin',
    balance: 0,
    totalBets: 0,
    totalVolume: 0,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-03-20T10:00:00Z',
  },
  {
    id: '5',
    email: 'ana@email.com',
    name: 'Ana Costa',
    kycStatus: 'rejected',
    role: 'user',
    balance: 100.0,
    totalBets: 5,
    totalVolume: 150.0,
    createdAt: '2024-03-01T11:30:00Z',
    lastLoginAt: '2024-03-15T20:00:00Z',
  },
]

const kycStatusConfig: Record<AdminUser['kycStatus'], { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  none: { label: 'Nao Iniciado', variant: 'secondary' },
  pending: { label: 'Pendente', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
}

const roleLabels: Record<AdminUser['role'], string> = {
  user: 'Usuario',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export default function AdminUsersPage() {
  const columns = [
    {
      key: 'email',
      header: 'Usuario',
      cell: (user: AdminUser) => (
        <div>
          <p className="font-medium">{user.name ?? 'Sem nome'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      cell: (user: AdminUser) => (
        <span className="text-sm">
          {roleLabels[user.role]}
        </span>
      ),
    },
    {
      key: 'kycStatus',
      header: 'KYC',
      cell: (user: AdminUser) => (
        <Badge variant={kycStatusConfig[user.kycStatus].variant}>
          {kycStatusConfig[user.kycStatus].label}
        </Badge>
      ),
    },
    {
      key: 'balance',
      header: 'Saldo',
      cell: (user: AdminUser) => (
        <span className="font-mono">{formatCurrency(user.balance)}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'totalVolume',
      header: 'Volume Total',
      cell: (user: AdminUser) => (
        <span className="font-mono">{formatCurrency(user.totalVolume)}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'createdAt',
      header: 'Cadastro',
      cell: (user: AdminUser) => formatDate(user.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gerencie os usuarios da plataforma"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton label="Todos" count={mockUsers.length} active />
        <FilterButton
          label="KYC Pendente"
          count={mockUsers.filter((u) => u.kycStatus === 'pending').length}
        />
        <FilterButton
          label="KYC Rejeitado"
          count={mockUsers.filter((u) => u.kycStatus === 'rejected').length}
        />
        <FilterButton
          label="Admins"
          count={mockUsers.filter((u) => u.role !== 'user').length}
        />
      </div>

      <DataTable
        data={mockUsers}
        columns={columns}
        onRowClick={(user) => {
          window.location.href = `/admin/users/${user.id}`
        }}
      />
    </div>
  )
}

function FilterButton({
  label,
  count,
  active = false,
}: {
  label: string
  count: number
  active?: boolean
}) {
  return (
    <button
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs ${
          active ? 'bg-primary-foreground/20' : 'bg-muted'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
