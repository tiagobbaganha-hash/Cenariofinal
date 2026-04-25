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
import { MarketLive } from '@/components/market/MarketLive'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FrontMarket } from '@/lib/types'
import type { Metadata } from 'next'
import { Calendar, Clock, TrendingUp, Users, ChevronLeft } from 'lucide-react'
import { ShareButtons } from './ShareButtons'
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

  // Load market stats + options direto do banco
  const supabase = createClient()
  const [{ data: statsData }, { data: influencerData }, { data: liveOptions }] = await Promise.all([
    supabase.from('orders').select('stake_amount').eq('market_id', market.id),
    market.influencer_id
      ? supabase.from('influencers').select('id, name, photo_url, referral_code, bio').eq('id', market.influencer_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('market_options')
      .select('id, label, odds, probability, option_key, sort_order, is_active')
      .eq('market_id', market.id)
      .eq('is_active', true)
      .order('sort_order'),
  ])
  
  // Injetar dados do influencer no market
  const marketWithInfluencer = {
    ...market,
    influencer_name: (influencerData as any)?.name || null,
    influencer_photo: (influencerData as any)?.photo_url || null,
    influencer_bio: (influencerData as any)?.bio || null,
  }

  const totalVolume = (statsData || []).reduce((sum: number, o: any) => sum + parseFloat(o.stake_amount || '0'), 0)
  const betCount = (statsData || []).length

  // Usar options do banco direto (garante IDs corretos para apostas)
  const options = liveOptions && liveOptions.length > 0
    ? liveOptions
    : (Array.isArray(market.options) ? market.options : [])
  // Verificar se está aberto por status OU por closes_at ainda no futuro
  const closesInFuture = market.closes_at ? new Date(market.closes_at) > new Date() : false
  const statusIsOpen = market.status_text === 'open' || market.status === 'open'
  const isOpen = statusIsOpen || (closesInFuture && !market.result_option_id)
  const isResolved = market.status_text === 'resolved' || market.status === 'resolved' || !!market.result_option_id
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
              {(marketWithInfluencer as any).influencer_name && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 w-fit">
                  {(marketWithInfluencer as any).influencer_photo ? (
                    <img src={(marketWithInfluencer as any).influencer_photo} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {(marketWithInfluencer as any).influencer_name?.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">Mercado de</span>
                  <span className="text-xs font-semibold text-foreground">{(marketWithInfluencer as any).influencer_name}</span>
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
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
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

            {/* Opções ao vivo — atualiza automaticamente */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Opções</h2>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ao vivo
                  </span>
                </div>
                <MarketLive
                  marketId={market.id}
                  initialOptions={options as any}
                  initialVolume={totalVolume}
                  initialBetCount={betCount}
                  isResolved={isResolved}
                  winnerOptionId={winnerOptionId}
                />
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
