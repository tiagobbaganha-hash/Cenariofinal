import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingUp, Zap, Radio, Clock, ChevronRight, Users } from 'lucide-react'

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

function pct(p: number) { return `${Math.round((p || 0.5) * 100)}%` }

async function getHomeData() {
  const supabase = createClient()
  const [marketsRes, statsRes] = await Promise.all([
    supabase.from('v_front_markets_v5')
      .select('id, title, slug, category, status, closes_at, featured, total_volume, bet_count, options')
      .in('status', ['open'])
      .order('featured', { ascending: false })
      .order('total_volume', { ascending: false })
      .limit(40),
    supabase.from('orders').select('stake_amount', { count: 'exact', head: false })
  ])
  const totalVol = (statsRes.data || []).reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0)
  return { markets: marketsRes.data || [], totalVol, totalBets: statsRes.count || 0 }
}

export default async function HomePage() {
  const { markets, totalVol, totalBets } = await getHomeData()

  const featured = markets.filter((m: any) => m.featured).slice(0, 3)
  const trending = markets.slice(0, 20)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero compacto */}
      <div className="border-b border-border bg-card/30 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">
              Preveja o futuro. <span className="text-primary">Ganhe apostando certo.</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">A plataforma de mercados preditivos do Brasil</p>
          </div>
          <div className="flex gap-6">
            {[
              { label: 'Volume total', value: `R$${(totalVol/1000).toFixed(1)}k` },
              { label: 'Mercados ativos', value: markets.length.toString() },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-8">

        {/* Destaque — mercados featured */}
        {featured.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Em destaque
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((m: any) => <MarketCard key={m.id} market={m} featured />)}
            </div>
          </section>
        )}

        {/* Filtros de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => (
            <Link key={cat} href={cat === 'Todos' ? '/mercados' : `/mercados?categoria=${encodeURIComponent(cat)}`}
              className="flex-shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
              {cat}
            </Link>
          ))}
        </div>

        {/* Grid de mercados */}
        {trending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-16 text-center space-y-3">
            <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm font-medium text-foreground">Nenhum mercado aberto ainda</p>
            <Link href="/admin/mercados/ia" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              Criar mercados com IA →
            </Link>
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                🔥 Tendências — {trending.length} mercados
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

        {/* Seção ao vivo + rápidos */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/ao-vivo" className="group rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 hover:border-red-500/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Ao Vivo</span>
            </div>
            <p className="text-sm font-bold text-foreground mb-1">Mercados em tempo real</p>
            <p className="text-xs text-muted-foreground">Aposte em eventos acontecendo agora</p>
            <span className="inline-flex items-center gap-1 mt-3 text-xs text-red-400 group-hover:underline">Ver ao vivo <ChevronRight className="h-3.5 w-3.5" /></span>
          </Link>
          <Link href="/mercados-rapidos" className="group rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-6 hover:border-yellow-500/40 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Mercados Rápidos</span>
            </div>
            <p className="text-sm font-bold text-foreground mb-1">Bitcoin sobe ou desce em 5 min?</p>
            <p className="text-xs text-muted-foreground">Previsões de cripto com resolução automática</p>
            <span className="inline-flex items-center gap-1 mt-3 text-xs text-yellow-400 group-hover:underline">Ver rápidos <ChevronRight className="h-3.5 w-3.5" /></span>
          </Link>
        </div>

        {/* Como funciona — compacto */}
        <section className="rounded-2xl border border-border bg-card/50 p-6">
          <h2 className="text-sm font-bold text-foreground mb-4 text-center">Como funciona</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: '1', icon: '🔍', title: 'Escolha um mercado', desc: 'Navegue por política, esportes, cripto e muito mais' },
              { n: '2', icon: '🎯', title: 'Faça sua previsão', desc: 'Aposte na opção que você acredita que vai acontecer' },
              { n: '3', icon: '💰', title: 'Ganhe quando acertar', desc: 'Quanto mais cedo você apostar, maior o retorno' },
            ].map(s => (
              <div key={s.n} className="text-center space-y-2">
                <div className="text-3xl">{s.icon}</div>
                <p className="text-sm font-bold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MarketCard({ market, featured }: { market: any; featured?: boolean }) {
  const opts = Array.isArray(market.options) ? market.options : []
  const yesOpt = opts.find((o: any) => o.option_key === 'yes') || opts[0]
  const noOpt = opts.find((o: any) => o.option_key === 'no') || opts[1]
  const vol = parseFloat(market.total_volume || 0)
  const tl = market.closes_at ? timeLeft(market.closes_at) : null

  return (
    <Link href={`/mercados/${market.slug}`}
      className={`group flex flex-col rounded-2xl border bg-card overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 ${featured ? 'border-primary/20 bg-primary/5' : 'border-border'}`}>

      {featured && <div className="h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />}

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">{market.category}</span>
              {featured && <span className="text-[10px] bg-primary/20 text-primary rounded-full px-2 py-0.5 font-bold">Destaque</span>}
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {market.title}
            </h3>
          </div>
        </div>

        {/* Opções principais */}
        {opts.length === 2 && yesOpt && noOpt ? (
          <div className="space-y-1.5">
            {[yesOpt, noOpt].map((opt: any) => {
              const isNo = opt.option_key === 'no'
              const prob = Math.round((opt.probability || 0.5) * 100)
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <div className="flex-1 h-6 rounded-lg overflow-hidden bg-muted relative">
                    <div className={`h-full transition-all ${isNo ? 'bg-red-500/30' : 'bg-primary/30'}`} style={{ width: `${prob}%` }} />
                    <span className="absolute inset-0 flex items-center px-2.5 text-[10px] font-bold text-foreground">{opt.label}</span>
                  </div>
                  <span className={`text-xs font-black w-10 text-right ${isNo ? 'text-red-400' : 'text-primary'}`}>{prob}%</span>
                </div>
              )
            })}
          </div>
        ) : opts.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {opts.slice(0, 3).map((opt: any) => (
              <div key={opt.id} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                <span className="text-[10px] font-semibold text-foreground truncate max-w-[100px]">{opt.label}</span>
                <span className="text-[10px] font-black text-primary">{pct(opt.probability)}</span>
              </div>
            ))}
            {opts.length > 3 && <span className="text-[10px] text-muted-foreground self-center">+{opts.length - 3}</span>}
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            {vol > 0 && <span className="text-[10px] text-muted-foreground">R${vol >= 1000 ? `${(vol/1000).toFixed(1)}k` : vol.toFixed(0)}</span>}
            {market.bet_count > 0 && <span className="text-[10px] text-muted-foreground">{market.bet_count} apostas</span>}
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
