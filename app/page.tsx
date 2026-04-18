'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  TrendingUp, 
  Trophy, 
  Users, 
  Zap, 
  ChevronRight,
  Flame,
  Clock,
  BarChart3,
  Wallet,
  Star,
  Play
} from 'lucide-react'

interface Market {
  id: string
  title: string
  category: string
  status: string
  closes_at: string | null
  featured: boolean
  total_volume?: number
  yes_price?: number
  no_price?: number
}

export default function HomePage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMarkets() {
      try {
        const { data } = await supabase
          .from('v_front_markets_v3')
          .select('*')
          .eq('status_text', 'open')
          .order('featured', { ascending: false })
          .limit(12)
        
        setMarkets(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadMarkets()
  }, [])

  const featured = markets.filter(m => m.featured).slice(0, 3)
  const hotMarkets = markets.slice(0, 6)

  return (
    <div className="min-h-screen bg-background">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 blur-backdrop border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Zap className="h-5 w-5 text-background" />
              </div>
              <span className="text-xl font-bold">
                Cenario<span className="text-primary">X</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/mercados" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Mercados
              </Link>
              <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Ranking
              </Link>
              <Link href="/comunidade" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Comunidade
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="glow-green">
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="text-center">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-medium text-red-400">12 mercados ao vivo agora</span>
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="text-gradient">Aposte</span> no que
              <br />
              <span className="relative">
                voce acredita
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 4C200 6 250 8 298 2" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop offset="0%" stopColor="hsl(142 90% 50%)" />
                      <stop offset="50%" stopColor="hsl(45 100% 51%)" />
                      <stop offset="100%" stopColor="hsl(187 100% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mt-8 text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Negocie previsoes sobre politica, esportes, economia e cultura.
              <span className="text-foreground font-medium"> Ganhe quando estiver certo.</span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/mercados">
                <Button size="lg" className="h-14 px-8 text-lg font-bold glow-green">
                  <Play className="mr-2 h-5 w-5" />
                  Comecar Agora
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  Ver Ranking
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <StatCard icon={TrendingUp} value="R$ 2.5M+" label="Volume Total" color="green" />
              <StatCard icon={Users} value="15.000+" label="Traders Ativos" color="cyan" />
              <StatCard icon={Trophy} value="850+" label="Mercados Resolvidos" color="yellow" />
              <StatCard icon={BarChart3} value="94%" label="Taxa de Resolucao" color="green" />
            </div>
          </div>
        </div>
      </section>

      {/* HOT MARKETS */}
      <section className="relative py-20 bg-gradient-to-b from-background via-card/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Mercados em Alta</h2>
                <p className="text-sm text-muted-foreground">Os mais negociados agora</p>
              </div>
            </div>
            <Link href="/mercados" className="hidden sm:flex items-center gap-1 text-primary hover:text-primary/80 font-medium">
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hotMarkets.map((market, i) => (
                <MarketCardPremium key={market.id} market={market} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED SECTION */}
      {featured.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Destaques</h2>
                <p className="text-sm text-muted-foreground">Mercados selecionados pela equipe</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {featured.map((market, i) => (
                <FeaturedCard key={market.id} market={market} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gradient-to-b from-background to-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Como Funciona</h2>
            <p className="mt-3 text-lg text-muted-foreground">Comece a negociar em 3 passos simples</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard 
              number="01" 
              title="Crie sua Conta" 
              description="Cadastro rapido e verificacao em minutos. Comece com deposito minimo de R$ 20."
              icon={Users}
            />
            <StepCard 
              number="02" 
              title="Escolha um Mercado" 
              description="Navegue por categorias: Politica, Esportes, Economia, Cultura e muito mais."
              icon={TrendingUp}
            />
            <StepCard 
              number="03" 
              title="Faca sua Aposta" 
              description="Compre SIM ou NAO. Se acertar, receba R$ 1,00 por cada share. Simples assim."
              icon={Wallet}
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-card to-secondary/20 p-12 text-center border border-primary/20">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/30 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold mb-4">
                Pronto para <span className="text-gradient">comecar</span>?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                Junte-se a milhares de traders que ja estao lucrando com suas previsoes.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg font-bold glow-green">
                  Criar Conta Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Zap className="h-4 w-4 text-background" />
              </div>
              <span className="font-bold">CenarioX</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/termos" className="hover:text-foreground">Termos</Link>
              <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
              <Link href="/suporte" className="hover:text-foreground">Suporte</Link>
            </div>

            <p className="text-sm text-muted-foreground">
              2024 CenarioX. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  const colorClasses = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
  }[color] || 'from-primary/20 to-primary/5 border-primary/20'

  return (
    <div className={`stat-card bg-gradient-to-br ${colorClasses} rounded-2xl p-6 border`}>
      <Icon className="h-6 w-6 text-muted-foreground mb-3" />
      <div className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function MarketCardPremium({ market, index }: { market: Market; index: number }) {
  const yesPrice = market.yes_price ?? (0.4 + Math.random() * 0.3)
  const noPrice = 1 - yesPrice
  const volume = market.total_volume ?? Math.floor(1000 + Math.random() * 50000)
  
  const timeLeft = market.closes_at 
    ? Math.max(0, Math.floor((new Date(market.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <Link href={`/mercados/${market.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        {/* Category badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/10">
            {market.category || 'Geral'}
          </span>
        </div>

        {/* Featured badge */}
        {market.featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Star className="h-3 w-3" />
              Destaque
            </span>
          </div>
        )}

        <div className="p-6 pt-14">
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-4">
            {market.title}
          </h3>

          {/* Volume and time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              R$ {(volume / 1000).toFixed(1)}k
            </span>
            {timeLeft !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {timeLeft}d restantes
              </span>
            )}
          </div>

          {/* Odds buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="odds-btn odds-btn-yes">
              <div className="text-xs opacity-80 mb-1">SIM</div>
              <div className="text-xl font-bold">{(yesPrice * 100).toFixed(0)}c</div>
            </button>
            <button className="odds-btn odds-btn-no">
              <div className="text-xs opacity-80 mb-1">NAO</div>
              <div className="text-xl font-bold">{(noPrice * 100).toFixed(0)}c</div>
            </button>
          </div>
        </div>

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </Link>
  )
}

function FeaturedCard({ market, index }: { market: Market; index: number }) {
  const colors = [
    'from-green-500/20 to-emerald-500/10',
    'from-yellow-500/20 to-orange-500/10', 
    'from-cyan-500/20 to-blue-500/10'
  ]
  
  const yesPrice = market.yes_price ?? (0.5 + Math.random() * 0.3)
  const volume = market.total_volume ?? Math.floor(10000 + Math.random() * 100000)

  return (
    <Link href={`/mercados/${market.id}`}>
      <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[index % 3]} border border-white/10 p-6 h-full hover:border-primary/50 transition-all duration-300`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="live-badge">AO VIVO</span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10">
            {market.category || 'Geral'}
          </span>
        </div>

        <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
          {market.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span>Volume: R$ {(volume / 1000).toFixed(0)}k</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-primary">{(yesPrice * 100).toFixed(0)}%</span>
            <span className="text-sm text-muted-foreground">chance SIM</span>
          </div>
          <Button size="sm" className="glow-green">
            Apostar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  )
}

function StepCard({ number, title, description, icon: Icon }: { number: string; title: string; description: string; icon: any }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/50 to-secondary/50 opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
      <div className="relative rounded-2xl bg-card border border-border p-8 h-full">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl font-black text-gradient">{number}</span>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
