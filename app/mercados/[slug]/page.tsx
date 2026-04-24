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
  const [{ data: statsData }, { data: liveOptions }] = await Promise.all([
    supabase.from('orders').select('stake_amount').eq('market_id', market.id),
    // Buscar dados do influencer se houver
    market.influencer_id
      ? supabase.from('influencers').select('id, name, photo_url, referral_code, bio').eq('id', market.influencer_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('market_options')
      .select('id, label, odds, probability, option_key, sort_order, is_active')
      .eq('market_id', market.id)
      .eq('is_active', true)
      .order('sort_order'),
  ])
  
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

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = typeof window !== 'undefined' ? window.location.href : `https://v0-cenariox-arquitetura-e-plano.vercel.app/mercados/${slug}`
  const text = `"${title}" — Faça sua previsão no CenárioX!`
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const shares = [
    {
      label: 'WhatsApp', color: 'hover:text-green-400 hover:border-green-400/40',
      href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    },
    {
      label: 'X', color: 'hover:text-foreground hover:border-foreground/40',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    },
    {
      label: 'Telegram', color: 'hover:text-sky-400 hover:border-sky-400/40',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {shares.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
            className={`flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card/50 px-3 py-3 text-muted-foreground transition-all hover:scale-105 ${s.color}`}>
            {s.icon}
            <span className="text-[10px] font-medium">{s.label}</span>
          </a>
        ))}
      </div>
      <button onClick={copyLink}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
        {copied ? '✅ Link copiado!' : '🔗 Copiar link'}
      </button>
    </div>
  )
}
