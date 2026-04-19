'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export type StatusFilter = 'all' | 'open' | 'resolved' | 'canceled'
export type SortOrder = 'featured' | 'closing_soon' | 'newest' | 'volume'

const categories = [
  'Todas',
  'Política',
  'Esportes',
  'Economia',
  'Cultura',
  'Tecnologia',
  'Internacional',
]

const statuses: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abertos' },
  { value: 'resolved', label: 'Resolvidos' },
  { value: 'canceled', label: 'Cancelados' },
]

const sorts: { value: SortOrder; label: string }[] = [
  { value: 'featured', label: 'Destaques' },
  { value: 'closing_soon', label: 'Fecha em breve' },
  { value: 'newest', label: 'Mais novos' },
  { value: 'volume', label: 'Mais volume' },
]

export function MarketFilters({
  search,
  setSearch,
  category,
  setCategory,
  status,
  setStatus,
  sort,
  setSort,
  resultsCount,
}: {
  search: string
  setSearch: (v: string) => void
  category: string
  setCategory: (v: string) => void
  status: StatusFilter
  setStatus: (v: StatusFilter) => void
  sort: SortOrder
  setSort: (v: SortOrder) => void
  resultsCount?: number
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = category !== 'Todas' || status !== 'all' || sort !== 'featured'

  function resetFilters() {
    setCategory('Todas')
    setStatus('all')
    setSort('featured')
  }

  return (
    <div className="space-y-4">
      {/* Search + advanced toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mercados..."
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(showAdvanced && 'bg-accent')}
          aria-label="Filtros avançados"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Status pills + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                status === s.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Ordenar:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced: categories */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 animate-fade-in">
          <span className="text-xs font-medium text-muted-foreground">Categoria:</span>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                category === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Results summary */}
      {(resultsCount !== undefined || hasActiveFilters) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {resultsCount !== undefined ? `${resultsCount} mercados encontrados` : ''}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-foreground hover:text-primary"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}
