'use client'

import type { FrontMarket } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Calendar, Tag, FileText } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  open: { label: 'Aberto', variant: 'success' },
  closed: { label: 'Fechado', variant: 'default' },
  resolved: { label: 'Resolvido', variant: 'secondary' },
  suspended: { label: 'Suspenso', variant: 'warning' },
  draft: { label: 'Rascunho', variant: 'secondary' },
}

export function MarketInfo({ market }: { market: FrontMarket }) {
  const status = statusConfig[market.status] || { label: market.status, variant: 'default' as const }

  return (
    <div className="space-y-4">
      <div>
        <Badge variant={status.variant} className="mb-2">
          {status.label}
        </Badge>
        <h1 className="text-3xl font-bold text-balance">{market.title}</h1>
        <p className="mt-2 text-muted-foreground">{market.category}</p>
      </div>

      {market.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Descrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{market.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cronograma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Abre em</p>
              <p className="text-sm">{market.opens_at ? formatDate(market.opens_at) : '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Fecha em</p>
              <p className="text-sm font-medium">{market.closes_at ? formatDate(market.closes_at) : '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Resolve em</p>
              <p className="text-sm">{market.resolves_at ? formatDate(market.resolves_at) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opções de Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {market.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{option.label}</p>
                  {option.probability && (
                    <p className="text-xs text-muted-foreground">
                      Probabilidade: {option.probability}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{option.odds}</p>
                  <p className="text-xs text-muted-foreground">odds</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
