import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Position } from '@/lib/api/portfolio'

interface PositionCardProps {
  position: Position
}

export function PositionCard({ position }: PositionCardProps) {
  const isPositive = position.unrealized_pnl >= 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{position.market_title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{position.option_label}</p>
          </div>
          <Badge variant={isPositive ? 'success' : 'destructive'}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {position.unrealized_pnl_percentage.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Quantidade</p>
            <p className="font-semibold">{position.quantity.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preço Médio</p>
            <p className="font-semibold">${position.avg_price.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preço Atual</p>
            <p className="font-semibold">${position.current_price.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor Total</p>
            <p className="font-semibold">R$ {(position.quantity * position.current_price).toFixed(2)}</p>
          </div>
        </div>
        <div className={`rounded-lg p-3 ${isPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <p className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            P&L: R$ {position.unrealized_pnl.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
