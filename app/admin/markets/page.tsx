'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { fetchMarkets, Market } from '@/lib/api/admin'

interface AdminMarket extends Market {
  totalVolume?: number
  totalBets?: number
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  open: { label: 'Aberto', variant: 'success' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  closed: { label: 'Fechado', variant: 'default' },
  resolved: { label: 'Resolvido', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<AdminMarket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const data = await fetchMarkets(50)
        setMarkets(data)
      } catch (error) {
        console.error('Erro ao carregar mercados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMarkets()
  }, [])

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
        <Badge variant={statusConfig[market.status]?.variant || 'default'}>
          {statusConfig[market.status]?.label || market.status}
        </Badge>
      ),
    },
    {
      key: 'featured',
      header: 'Destaque',
      cell: (market: AdminMarket) => (
        <Badge variant={market.featured ? 'success' : 'secondary'}>
          {market.featured ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      key: 'closes_at',
      header: 'Encerra em',
      cell: (market: AdminMarket) => 
        market.closes_at ? formatDate(market.closes_at) : '—',
    },
    {
      key: 'created_at',
      header: 'Criado em',
      cell: (market: AdminMarket) => formatDate(market.created_at),
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

      {loading ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Carregando mercados...</p>
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Nenhum mercado encontrado</p>
        </div>
      ) : (
        <DataTable
          data={markets}
          columns={columns}
          onRowClick={(market) => {
            window.location.href = `/admin/markets/${market.id}`
          }}
        />
      )}
    </div>
  )
}
