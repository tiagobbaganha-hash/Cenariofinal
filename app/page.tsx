'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  Play,
  Menu,
  X,
  Home,
  User
} from 'lucide-react'

interface Market {
  id: string
  title: string
  slug: string
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
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    async function loadData() {
      // Check user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Load markets
      try {
        const { data } = await supabase
          .from('v_front_markets_v4')
          .select('*')
          .eq('status', 'open')
          .order('featured', { ascending: false })
          .order('total_volume', { ascending: false })
          .limit(12)
        
        if (data) setMarkets(data)
      } catch (e) {
        // Fallback to markets table
        const { data } = await supabase
          .from('markets')
          .select('*')
          .eq('status', 'open')
          .order('featured', { ascending: false })
          .limit(12)
        
        if (data) setMarkets(data)
      }
      setLoading(false)
    }
    loadData()
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
              {user && (
                <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Admin
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/carteira">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      <Wallet className="mr-2 h-4 w-4" />
                      Carteira
                    </Button>
                  </Link>
                  <Link href="/conta">
                    <Button size="sm" className="glow-green">
                      <User className="mr-2 h-4 w-4" />
                      Minha Conta
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">Entrar</Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm" className="glow-green">
                      Criar Conta
                    </Button>
                  </Link>
                </>
              )}
              <button 
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-3">
              <Link href="/mercados" className="block py-2 text-foreground font-medium">Mercados</Link>
              <Link href="/leaderboard" className="block py-2 text-foreground font-medium">Ranking</Link>
              <Link href="/comunidade" className="block py-2 text-foreground font-medium">Comunidade</Link>
              {user && <Link href="/carteira" className="block py-2 text-foreground font-medium">Carteira</Link>}
              {user && <Link href="/admin" className="block py-2 text-foreground font-medium">Admin</Link>}
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-medium text-red-400">{markets.length} mercados ao vivo</span>
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
              Ver todos <ChevronRight className="h-4 w-4" />
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

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gradient-to-b from-background to-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Como Funciona</h2>
            <p className="mt-3 text-lg text-muted-foreground">Comece a negociar em 3 passos</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard number="01" title="Crie sua Conta" description="Cadastro rapido e verificacao em minutos." icon={Users} />
            <StepCard number="02" title="Escolha um Mercado" description="Navegue por categorias: Politica, Esportes, Economia." icon={TrendingUp} />
            <StepCard number="03" title="Faca sua Aposta" description="Compre SIM ou NAO. Se acertar, ganhe!" icon={Wallet} />
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
                Junte-se a milhares de traders que ja estao lucrando.
              </p>
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg font-bold glow-green">
                  Criar Conta Gratis <ArrowRight className="ml-2 h-5 w-5" />
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

            <p className="text-sm text-muted-foreground">2024 CenarioX. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Inicio</span>
          </Link>
          <Link href="/mercados" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-medium">Mercados</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-medium">Ranking</span>
          </Link>
          <Link href={user ? "/carteira" : "/login"} className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-medium">Carteira</span>
          </Link>
          <Link href={user ? "/conta" : "/login"} className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground">
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Conta</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
  }
  return (
    <div className={`stat-card bg-gradient-to-br ${colorClasses[color] || colorClasses.green} rounded-2xl p-6 border`}>
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
  const timeLeft = market.closes_at ? Math.max(0, Math.floor((new Date(market.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

  return (
    <Link href={`/mercados/${market.slug || market.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm border border-white/10">
            {market.category || 'Geral'}
          </span>
        </div>
        {market.featured && (
          <div className="absolute top-4 right-4 z-10">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Star className="h-3 w-3" /> Destaque
            </span>
          </div>
        )}
        <div className="p-6 pt-14">
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-4">{market.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> R$ {(volume / 1000).toFixed(1)}k</span>
            {timeLeft !== null && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {timeLeft}d</span>}
          </div>
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
