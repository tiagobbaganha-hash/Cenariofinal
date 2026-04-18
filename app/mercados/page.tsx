'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { MarketCard } from '@/components/market-card'
import { MarketFilters, type StatusFilter, type SortOrder } from '@/components/market-filters'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { FrontMarket } from '@/lib/types'
import { SearchX } from 'lucide-react'

export default function MarketsPage() {
  const [all, setAll] = useState<FrontMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [sort, setSort] = useState<SortOrder>('featured')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('v_front_markets_v3')
          .select('*')
          .limit(200)
        if (error) throw error
        setAll((data ?? []) as any)
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar mercados')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...all]

    if (status !== 'all') {
      list = list.filter((m) => m.status_text === status)
    }

    if (category !== 'Todas') {
      list = list.filter(
        (m) => (m.category ?? '').toLowerCase() === category.toLowerCase()
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
      )
    }

    switch (sort) {
      case 'featured':
        list.sort(
          (a, b) =>
            Number(b.featured ?? 0) - Number(a.featured ?? 0) ||
            (a.closes_at ?? '').localeCompare(b.closes_at ?? '')
        )
        break
      case 'closing_soon':
        list.sort((a, b) => (a.closes_at ?? '').localeCompare(b.closes_at ?? ''))
        break
      case 'newest':
        list.sort((a, b) => (b.opens_at ?? '').localeCompare(a.opens_at ?? ''))
        break
      case 'volume':
        list.sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0))
        break
    }

    return list
  }, [all, status, category, search, sort])

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mercados</h1>
          <p className="mt-1 text-muted-foreground">
            Explore todos os mercados disponíveis e encontre suas oportunidades.
          </p>
        </header>

        <MarketFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          status={status}
          setStatus={setStatus}
          sort={sort}
          setSort={setSort}
          resultsCount={loading ? undefined : filtered.length}
        />

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : error ? (
            <Card className="p-10 text-center">
              <p className="font-medium text-destructive">Erro ao carregar mercados</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <SearchX className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhum mercado encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou a busca.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m) => (
                <MarketCard key={m.id} market={m as any} />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
