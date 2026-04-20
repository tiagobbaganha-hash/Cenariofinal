import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BetWidget } from '@/components/bet-widget'
import { PriceHistoryChart } from '@/components/market/PriceHistoryChart'
import { MarketComments } from '@/components/market/MarketComments'
import { AIAnalysis } from '@/components/market/AIAnalysis'
import { MarketCountdown } from '@/components/market/MarketCountdown'
import { MarketContext } from '@/components/market/MarketContext'
import { RelatedMarkets } from '@/components/market/RelatedMarkets'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FrontMarket } from '@/lib/types'
import type { Metadata } from 'next'
import { Calendar, Clock, TrendingUp, Users, ChevronLeft } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 10

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const market = await getMarket(params.slug)
  if (!market) return { title: 'Mercado não encontrado' }
  
  const options = Array.isArray(market.options) ? market.options : []
  const yesOpt = options.find((o: any) => o.option_key === 'yes')
  const prob = yesOpt?.probability ? `${(yesOpt.probability * 100).toFixed(0)}%` : ''
  
  return {
    title: market.title,
    description: `${market.description || market.title}${prob ? ` — ${prob} de chance` : ''}. Faça sua previsão no CenarioX.`,
    openGraph: {
      title: market.title,
      description: market.description || 'Mercado preditivo no CenarioX',
      type: 'website',
    },
  }
}

async function getMarket(slug: string): Promise<FrontMarket | null> {
  const supabase = createClient()
  
  // Try by slug first
  const { data, error } = await supabase
    .from('v_front_markets_v5')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  
  if (error) {
    console.error('Market query error:', error.message)
  }

  if (data) return data as any

  // Fallback: try by id
  const { data: byId, error: idError } = await supabase
    .from('v_front_markets_v5')
    .select('*')
    .eq('id', slug)
    .maybeSingle()

  if (idError) {
    console.error('Market query by id error:', idError.message)
  }

  return (byId as any) ?? null
}

export default async function MarketDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const market = await getMarket(params.slug)
  if (!market) return notFound()

  // Load market stats
  const supabase = createClient()
  const { data: statsData } = await supabase
    .from('orders')
    .select('stake_amount')
    .eq('market_id', market.id)
  
  const totalVolume = (statsData || []).reduce((sum: number, o: any) => sum + parseFloat(o.stake_amount || '0'), 0)
  const betCount = (statsData || []).length

  const options = Array.isArray(market.options) ? market.options : []
  const isOpen = market.status_text === 'open'
  const isResolved = market.status_text === 'resolved'
  const winnerOptionId = market.result_option_id
  const winnerOption = options.find((o: any) => o.id === winnerOptionId)

  return (
    <>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Resolved banner */}
        {isResolved && winnerOption && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="font-bold text-green-400">Mercado resolvido</p>
              <p className="text-sm text-muted-foreground">
                Resultado: <span className="font-medium text-foreground">{(winnerOption as any).label}</span>
                {market.resolution_outcome_text && (
                  <span> — {market.resolution_outcome_text}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Cover image */}
        {market.image_url && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-border">
            <img src={market.image_url} alt={market.title} className="w-full h-48 sm:h-64 object-cover" />
          </div>
        )}

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

              {/* Contagem regressiva */}
              {isOpen && (
                <MarketCountdown
                  closesAt={market.closes_at ?? null}
                  resolvesAt={market.resolves_at ?? null}
                  status={market.status_text ?? 'open'}
                />
              )}

              {/* Badge do influencer */}
              {(market as any).influencer_name && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 w-fit">
                  {(market as any).influencer_photo ? (
                    <img src={(market as any).influencer_photo} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {(market as any).influencer_name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">Mercado de</span>
                  <span className="text-xs font-semibold text-foreground">{(market as any).influencer_name}</span>
                </div>
              )}

              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {market.title}
              </h1>

              {market.description && (
                <p className="text-pretty text-muted-foreground">{market.description}</p>
              )}
            </div>

            {/* Contexto IA — estilo Palpitada */}
            <MarketContext
              marketId={market.id}
              title={market.title}
              description={market.description || ''}
              category={market.category || ''}
              options={options.map((o: any) => ({ label: o.label, probability: o.probability }))}
            />

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              <MiniStat
                icon={TrendingUp}
                label="Volume total"
                value={formatCurrency(totalVolume)}
              />
              <MiniStat
                icon={Users}
                label="Apostas"
                value={String(betCount)}
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
                    const isWinner = isResolved && opt.id === winnerOptionId
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-lg border p-4 ${
                          isWinner 
                            ? 'border-green-500/40 bg-green-500/5 ring-1 ring-green-500/20' 
                            : 'border-border bg-background/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium flex items-center gap-2">
                            {opt.label}
                            {isWinner && <span className="text-xs text-green-400 font-bold">VENCEDOR</span>}
                          </span>
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

            {/* Price History Chart */}
            <PriceHistoryChart marketId={market.id} options={options.map((o: any) => ({ label: o.label, option_key: o.option_key, probability: o.probability }))} />

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

            {/* Share */}
            <ShareButtons title={market.title} slug={market.slug} />

            {/* AI Analysis */}
            <AIAnalysis 
              marketId={market.id}
              title={market.title}
              description={market.description || ''}
              category={market.category || ''}
              optionsData={options.map((o: any) => ({ label: o.label, probability: o.probability, odds: o.odds }))}
            />

            {/* Comments */}
            <MarketComments marketId={market.id} />

            {/* Related */}
            <RelatedMarkets marketId={market.id} category={market.category || 'Geral'} />
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

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://cenariox.com.br/mercados/${slug}`
  const text = `O que você acha? "${title}" — Faça sua previsão no CenarioX!`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  
  return (
    <div className="flex gap-2">
      <a href={whatsapp} target="_blank" rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent/30 transition-colors">
        WhatsApp
      </a>
      <a href={twitter} target="_blank" rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent/30 transition-colors">
        Twitter / X
      </a>
    </div>
  )
}
