import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, Zap, Radio, Clock, ChevronRight } from 'lucide-react'

const CATEGORIES = ['Todos', 'Política', 'Esportes', 'Cripto', 'Entretenimento', 'Economia', 'Tecnologia']

function timeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Encerrado'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

async function getHomeData() {
  try {
    const supabase = createClient()

    // Buscar direto da tabela markets + opções (sem view)
    const { data: markets } = await supabase
      .from('markets')
      .select('id, title, slug, category, status, closes_at, featured, total_volume, bet_count')
      .eq('status', 'open')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(40)

    if (!markets?.length) return { markets: [], enriched: [], totalVol: 0 }

    // Buscar opções de todos os mercados
    const { data: allOptions } = await supabase
      .from('market_options')
      .select('id, market_id, label, option_key, probability, odds')
      .in('market_id', markets.map(m => m.id))
      .eq('is_active', true)
      .order('sort_order')

    const optsByMarket: Record<string, any[]> = {}
    for (const opt of allOptions || []) {
      if (!optsByMarket[opt.market_id]) optsByMarket[opt.market_id] = []
      optsByMarket[opt.market_id].push(opt)
    }

    const enriched = markets.map(m => ({ ...m, options: optsByMarket[m.id] || [] }))
    const totalVol = markets.reduce((s, m: any) => s + parseFloat(m.total_volume || 0), 0)

    return { markets, enriched, totalVol }
  } catch {
    return { markets: [], enriched: [], totalVol: 0 }
  }
}

export default async function HomePage() {
  const { enriched, totalVol } = await getHomeData()

  const featured = enriched.filter((m: any) => m.featured).slice(0, 3)
  const trending = enriched.slice(0, 24)

  return (
    <div className="min-h-screen bg-background">

      {/* Banner de boas vindas compacto */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-background border-b border-border px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-foreground sm:text-2xl">
              Preveja o futuro. <span className="text-primary">Ganhe apostando certo.</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">A plataforma brasileira de mercados preditivos</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-black text-primary">
                {totalVol > 0 ? `R$${(totalVol/1000).toFixed(1)}k` : 'R$0'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Volume total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-foreground">{trending.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mercados abertos</p>
            </div>
            <Link href="/cadastro"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              Começar grátis →
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-6">

        {/* Ao Vivo + Rápidos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/mercados?tipo=ao-vivo" className="group rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5 hover:border-red-500/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wide">🔴 Ao Vivo</span>
            </div>
            <p className="text-sm font-bold text-foreground">Eventos em andamento</p>
            <p className="text-xs text-muted-foreground mt-1">Aposte em jogos e shows acontecendo agora</p>
            <span className="inline-flex items-center gap-1 mt-3 text-xs text-red-400">Ver ao vivo <ChevronRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/mercados?tipo=rapidos" className="group rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-5 hover:border-yellow-500/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">⚡ Rápidos</span>
            </div>
            <p className="text-sm font-bold text-foreground">BTC sobe ou desce em 5 min?</p>
            <p className="text-xs text-muted-foreground mt-1">Mercados cripto com resolução automática</p>
            <span className="inline-flex items-center gap-1 mt-3 text-xs text-yellow-400">Ver rápidos <ChevronRight className="h-3 w-3" /></span>
          </Link>
        </div>
      </div>
        {/* Mercados em destaque */}
        {featured.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Em destaque
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((m: any) => <MarketCard key={m.id} market={m} featured />)}
            </div>
          </section>
        )}

        {/* Filtros rápidos */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => (
            <Link key={cat}
              href={cat === 'Todos' ? '/mercados' : `/mercados?categoria=${encodeURIComponent(cat)}`}
              className="flex-shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
              {cat === 'Todos' ? '🔥 ' + cat : cat}
            </Link>
          ))}
        </div>

        {/* Grid de mercados */}
        {trending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 py-16 text-center space-y-3">
            <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Nenhum mercado aberto ainda</p>
            <p className="text-xs text-muted-foreground">Use o Admin para criar mercados</p>
            <Link href="/admin/mercados/ia" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              Criar com IA agora →
            </Link>
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Tendências · {trending.length} mercados abertos
              </h2>
              <Link href="/mercados" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((m: any) => <MarketCard key={m.id} market={m} />)}
            </div>
          </section>
        )}

    </div>
  )
}

function MarketCard({ market, featured }: { market: any; featured?: boolean }) {
  const opts: any[] = market.options || []
  const yesOpt = opts.find((o: any) => o.option_key === 'yes') || opts[0]
  const noOpt = opts.find((o: any) => o.option_key === 'no') || opts[1]
  const twoOpts = opts.length === 2 && yesOpt && noOpt
  const vol = parseFloat(market.total_volume || 0)
  const tl = market.closes_at ? timeLeft(market.closes_at) : null

  return (
    <Link href={`/mercados/${market.slug}`}
      className={`group flex flex-col rounded-2xl border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all ${featured ? 'border-primary/30' : 'border-border'}`}>

      {featured && <div className="h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />}

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Categoria + título */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">{market.category || 'Geral'}</span>
            {featured && <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-bold">⭐ Destaque</span>}
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {market.title}
          </h3>
        </div>

        {/* Probabilidades */}
        {twoOpts ? (
          <div className="space-y-1.5">
            {[yesOpt, noOpt].map((opt: any) => {
              const isNo = opt.option_key === 'no'
              const prob = Math.round((opt.probability || 0.5) * 100)
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className="relative flex-1 h-7 rounded-lg overflow-hidden bg-muted">
                    <div className={`absolute inset-y-0 left-0 transition-all ${isNo ? 'bg-red-500/25' : 'bg-primary/25'}`}
                      style={{ width: `${prob}%` }} />
                    <span className="absolute inset-0 flex items-center px-2.5 text-[11px] font-semibold text-foreground z-10 truncate">
                      {opt.label}
                    </span>
                  </div>
                  <span className={`text-xs font-black w-9 text-right tabular-nums ${isNo ? 'text-red-400' : 'text-primary'}`}>
                    {prob}%
                  </span>
                </div>
              )
            })}
          </div>
        ) : opts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {opts.slice(0, 3).map((opt: any) => (
              <div key={opt.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1.5">
                <span className="text-[10px] font-semibold text-foreground truncate max-w-[90px]">{opt.label}</span>
                <span className="text-[10px] font-black text-primary">{Math.round((opt.probability || 0.5) * 100)}%</span>
              </div>
            ))}
            {opts.length > 3 && (
              <span className="text-[10px] text-muted-foreground self-center">+{opts.length - 3} mais</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Sem opções cadastradas</p>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            {vol > 0 && <span>R${vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol.toFixed(0)}</span>}
            {(market.bet_count || 0) > 0 && <span>{market.bet_count} apostas</span>}
          </div>
          {tl && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {tl}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

