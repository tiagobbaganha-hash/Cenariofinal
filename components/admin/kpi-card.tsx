import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  change?: number
  hint?: string
  tone?: 'default' | 'success' | 'warning' | 'destructive'
}

export function KpiCard({ label, value, icon: Icon, change, hint, tone = 'default' }: KpiCardProps) {
  const trendUp = change !== undefined && change > 0
  const trendDown = change !== undefined && change < 0

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                'mt-2 text-2xl font-bold tabular-nums',
                tone === 'success' && 'text-success',
                tone === 'warning' && 'text-warning',
                tone === 'destructive' && 'text-destructive'
              )}
            >
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              tone === 'default' && 'bg-primary/10 text-primary',
              tone === 'success' && 'bg-success/10 text-success',
              tone === 'warning' && 'bg-warning/10 text-warning',
              tone === 'destructive' && 'bg-destructive/10 text-destructive'
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        {(change !== undefined || hint) && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {change !== undefined && (
              <span className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                trendUp && 'text-success',
                trendDown && 'text-destructive',
                !trendUp && !trendDown && 'text-muted-foreground'
              )}>
                {trendUp && <TrendingUp className="h-3 w-3" />}
                {trendDown && <TrendingDown className="h-3 w-3" />}
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
