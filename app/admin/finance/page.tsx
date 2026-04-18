import { PageHeader } from '@/components/admin/PageHeader'
import { StatsCard } from '@/components/admin/StatsCard'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react'

interface Transaction {
  id: string
  type: 'deposit' | 'withdrawal'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  amount: number
  userEmail: string
  method: 'pix' | 'card' | 'crypto'
  createdAt: string
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    status: 'completed',
    amount: 500,
    userEmail: 'joao@email.com',
    method: 'pix',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    type: 'withdrawal',
    status: 'pending',
    amount: 200,
    userEmail: 'maria@email.com',
    method: 'pix',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '3',
    type: 'deposit',
    status: 'completed',
    amount: 1000,
    userEmail: 'pedro@email.com',
    method: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: '4',
    type: 'withdrawal',
    status: 'pending',
    amount: 350,
    userEmail: 'ana@email.com',
    method: 'pix',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: '5',
    type: 'deposit',
    status: 'failed',
    amount: 250,
    userEmail: 'carlos@email.com',
    method: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
]

const statusConfig: Record<Transaction['status'], { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  completed: { label: 'Concluido', variant: 'success' },
  failed: { label: 'Falhou', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'secondary' },
}

const methodLabels: Record<Transaction['method'], string> = {
  pix: 'Pix',
  card: 'Cartao',
  crypto: 'Cripto',
}

export default function AdminFinancePage() {
  const stats = {
    totalBalance: 125750.5,
    pendingWithdrawals: 8,
    pendingAmount: 4250.0,
    todayVolume: 12500.0,
  }

  const columns = [
    {
      key: 'type',
      header: 'Tipo',
      cell: (tx: Transaction) => (
        <div className="flex items-center gap-2">
          {tx.type === 'deposit' ? (
            <ArrowDownRight className="h-4 w-4 text-success" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-warning" />
          )}
          <span>{tx.type === 'deposit' ? 'Deposito' : 'Saque'}</span>
        </div>
      ),
    },
    {
      key: 'userEmail',
      header: 'Usuario',
      cell: (tx: Transaction) => (
        <span className="text-sm">{tx.userEmail}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Valor',
      cell: (tx: Transaction) => (
        <span className="font-mono font-medium">
          {formatCurrency(tx.amount)}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'method',
      header: 'Metodo',
      cell: (tx: Transaction) => methodLabels[tx.method],
    },
    {
      key: 'status',
      header: 'Status',
      cell: (tx: Transaction) => (
        <Badge variant={statusConfig[tx.status].variant}>
          {statusConfig[tx.status].label}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Data',
      cell: (tx: Transaction) => formatDateTime(tx.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Gerencie depositos, saques e saldos"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Saldo Total Usuarios"
          value={formatCurrency(stats.totalBalance)}
          icon={Wallet}
        />
        <StatsCard
          title="Saques Pendentes"
          value={stats.pendingWithdrawals.toString()}
          description={formatCurrency(stats.pendingAmount)}
          icon={ArrowUpRight}
        />
        <StatsCard
          title="Volume Hoje"
          value={formatCurrency(stats.todayVolume)}
          icon={DollarSign}
          trend={{ value: 15.2, isPositive: true }}
        />
        <StatsCard
          title="Taxa Media"
          value="2.5%"
          description="sobre transacoes"
          icon={DollarSign}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterButton label="Todas" count={mockTransactions.length} active />
        <FilterButton
          label="Pendentes"
          count={mockTransactions.filter((t) => t.status === 'pending').length}
        />
        <FilterButton
          label="Depositos"
          count={mockTransactions.filter((t) => t.type === 'deposit').length}
        />
        <FilterButton
          label="Saques"
          count={mockTransactions.filter((t) => t.type === 'withdrawal').length}
        />
      </div>

      <DataTable data={mockTransactions} columns={columns} />
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
