import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { BetWidget } from '@/components/bet-widget'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FrontMarket } from '@/lib/types'
import { Calendar, Clock, TrendingUp, Users, ChevronLeft } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 10

async function getMarket(slug: string): Promise<FrontMarket | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('v_front_markets_v3')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle()
    if (error) throw error
    return (data as any) ?? null
  } catch {
    return null
  }
}

export default async function MarketDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const market = await getMarket(params.slug)
  if (!market) return notFound()

  const options = Array.isArray(market.options) ? market.options : []
  const isOpen = market.status_text === 'open'

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/mercados" className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
            Mercados
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[40ch]">{market.title}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT: Content */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {market.category && (
                  <Badge variant="muted" className="font-normal">{market.category}</Badge>
                )}
                {market.featured && <Badge>Destaque</Badge>}
                <StatusBadge status={market.status_text ?? 'open'} />
              </div>

              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {market.title}
              </h1>

              {market.description && (
                <p className="text-pretty text-muted-foreground">{market.description}</p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              <MiniStat
                icon={TrendingUp}
                label="Volume total"
                value={formatCurrency(market.total_volume ?? 0)}
              />
              <MiniStat
                icon={Users}
                label="Apostas"
                value={String(market.bet_count ?? 0)}
              />
              <MiniStat
                icon={Calendar}
                label="Abre"
                value={market.opens_at ? formatDateTime(market.opens_at) : '—'}
              />
              <MiniStat
                icon={Clock}
                label="Fecha"
                value={market.closes_at ? formatDateTime(market.closes_at) : '—'}
              />
            </div>

            {/* Options breakdown */}
            <Card>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold">Opções</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha uma opção abaixo para visualizar o mercado.
                </p>
                <div className="space-y-3">
                  {options.map((opt: any) => {
                    const probability = opt.probability ?? 0
                    const isNo = opt.option_key === 'no' || opt.label?.toLowerCase() === 'não'
                    return (
                      <div
                        key={opt.id}
                        className="rounded-lg border border-border bg-background/40 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{opt.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm tabular-nums text-muted-foreground">
                              {Number(opt.odds ?? 0).toFixed(2)}x
                            </span>
                            <span className="font-mono text-sm font-semibold tabular-nums">
                              {(probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={isNo ? 'h-full bg-destructive' : 'h-full bg-primary'}
                            style={{ width: `${Math.min(100, probability * 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold mb-3">Sobre este mercado</h2>
                <div className="space-y-3 text-sm">
                  <Row label="ID do mercado" value={<span className="font-mono text-xs">{market.id}</span>} />
                  {market.resolves_at && (
                    <Row label="Resolve em" value={formatDateTime(market.resolves_at)} />
                  )}
                  <Row label="Total de opções" value={String(options.length)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Bet widget */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <BetWidget
              marketId={market.id}
              marketSlug={market.slug}
              options={options as any}
              isOpen={isOpen}
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'open') return <Badge variant="success">Aberto</Badge>
  if (status === 'resolved') return <Badge variant="muted">Resolvido</Badge>
  if (status === 'canceled') return <Badge variant="destructive">Cancelado</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function MiniStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums truncate">{value}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
