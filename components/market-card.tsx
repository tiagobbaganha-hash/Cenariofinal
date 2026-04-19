import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { Clock, Star, TrendingUp } from 'lucide-react'

export interface MarketCardData {
  id: string
  slug: string
  title: string
  category: string | null
  description?: string | null
  status_text?: string | null
  featured?: boolean | null
  closes_at?: string | null
  options_count?: number | null
  total_volume?: number | null
}

export function MarketCard({ market, compact = false }: { market: MarketCardData; compact?: boolean }) {
  const daysLeft =
    market.closes_at && new Date(market.closes_at).getTime() > Date.now()
      ? Math.ceil((new Date(market.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

  const isClosingSoon = daysLeft !== null && daysLeft <= 7
  const volume = market.total_volume ?? 0

  return (
    <Link
      href={`/mercados/${market.slug ?? market.id}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card transition-all',
        'hover:border-primary/40 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_0_30px_hsl(var(--primary)/0.08)]',
        compact ? 'p-4' : 'p-5'
      )}
    >
      {/* Top meta */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {market.category && (
            <Badge variant="muted" className="font-normal">
              {market.category}
            </Badge>
          )}
          {market.featured && (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3 fill-primary" />
              Destaque
            </Badge>
          )}
        </div>
        {market.status_text === 'open' && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span>Ao vivo</span>
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-balance tracking-tight text-foreground group-hover:text-primary transition-colors',
          compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-2'
        )}
      >
        {market.title}
      </h3>

      {/* Description */}
      {!compact && market.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {market.description}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Stats row */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {formatCurrency(volume)}
          </span>
          <span>·</span>
          <span>{market.options_count ?? 2} opções</span>
        </div>
        {daysLeft !== null && (
          <span
            className={cn(
              'inline-flex items-center gap-1',
              isClosingSoon ? 'text-warning' : 'text-muted-foreground'
            )}
          >
            <Clock className="h-3 w-3" />
            {daysLeft === 0 ? 'Hoje' : daysLeft === 1 ? '1d' : `${daysLeft}d`}
          </span>
        )}
      </div>
    </Link>
  )
}
