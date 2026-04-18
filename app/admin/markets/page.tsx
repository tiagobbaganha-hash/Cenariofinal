import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface AdminMarket {
  id: string
  title: string
  category: string
  status: 'draft' | 'open' | 'suspended' | 'closed' | 'resolved' | 'cancelled'
  totalVolume: number
  totalBets: number
  closesAt: string
  createdAt: string
}

// Mock data - sera substituido por dados reais do Supabase
const mockMarkets: AdminMarket[] = [
  {
    id: '1',
    title: 'Lula vence as eleicoes de 2026',
    category: 'Politica',
    status: 'open',
    totalVolume: 15420.5,
    totalBets: 234,
    closesAt: '2026-10-01T23:59:59Z',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Bitcoin acima de $100k ate dezembro',
    category: 'Cripto',
    status: 'open',
    totalVolume: 8750.0,
    totalBets: 156,
    closesAt: '2024-12-31T23:59:59Z',
    createdAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '3',
    title: 'Brasil ganha a Copa do Mundo 2026',
    category: 'Esportes',
    status: 'draft',
    totalVolume: 0,
    totalBets: 0,
    closesAt: '2026-07-19T23:59:59Z',
    createdAt: '2024-03-10T09:15:00Z',
  },
  {
    id: '4',
    title: 'Selic abaixo de 10% em junho',
    category: 'Economia',
    status: 'closed',
    totalVolume: 5230.0,
    totalBets: 89,
    closesAt: '2024-06-30T23:59:59Z',
    createdAt: '2024-01-20T11:00:00Z',
  },
  {
    id: '5',
    title: 'Novo iPhone com IA generativa',
    category: 'Tecnologia',
    status: 'resolved',
    totalVolume: 3100.0,
    totalBets: 67,
    closesAt: '2024-09-15T23:59:59Z',
    createdAt: '2024-04-05T16:45:00Z',
  },
]

const statusConfig: Record<AdminMarket['status'], { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  open: { label: 'Aberto', variant: 'success' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  closed: { label: 'Fechado', variant: 'default' },
  resolved: { label: 'Resolvido', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export default function AdminMarketsPage() {
  const columns = [
    {
      key: 'title',
      header: 'Mercado',
      cell: (market: AdminMarket) => (
        <div>
          <p className="font-medium">{market.title}</p>
          <p className="text-xs text-muted-foreground">{market.category}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (market: AdminMarket) => (
        <Badge variant={statusConfig[market.status].variant}>
          {statusConfig[market.status].label}
        </Badge>
      ),
    },
    {
      key: 'totalVolume',
      header: 'Volume',
      cell: (market: AdminMarket) => (
        <span className="font-mono">
          R$ {market.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'totalBets',
      header: 'Apostas',
      cell: (market: AdminMarket) => market.totalBets.toLocaleString('pt-BR'),
      className: 'text-right',
    },
    {
      key: 'closesAt',
      header: 'Encerra em',
      cell: (market: AdminMarket) => formatDate(market.closesAt),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mercados"
        description="Gerencie os mercados preditivos da plataforma"
        action={{
          label: 'Novo Mercado',
          href: '/admin/markets/new',
        }}
      />

      <DataTable
        data={mockMarkets}
        columns={columns}
        onRowClick={(market) => {
          window.location.href = `/admin/markets/${market.id}`
        }}
      />
    </div>
  )
}
