import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  TrendingUp, 
  Trophy, 
  Users, 
  Search,
  Target,
  Clock,
  BarChart3,
  Star,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Types
interface MarketOption {
  id: string
  option_key: 'yes' | 'no'
  label: string
  odds: number
  probability: number
  is_active: boolean
  sort_order: number
}

interface Market {
  id: string
  slug: string
  title: string
  description: string
  category: string
  image_url: string | null
  status_text: string
  featured: boolean
  opens_at: string | null
  closes_at: string | null
  resolves_at: string | null
  options: MarketOption[]
  options_count: number
}

interface Stats {
  total_users: number
  active_markets: number
  total_markets: number
  total_bets: number
  total_volume: number
  volume_24h: number
}

// Formatters
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Sem prazo'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getTimeLeft(dateString: string | null): string {
  if (!dateString) return ''
  const now = new Date()
  const target = new Date(dateString)
  const diff = target.getTime() - now.getTime()
  
  if (diff <= 0) return 'Encerrado'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return 'Menos de 1h'
}

// Category colors
const categoryColors: Record<string, string> = {
  'Política': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Economia': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Tecnologia': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Cripto': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Esportes': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Geopolítica': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Entretenimento': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export default async function HomePage() {
  const supabase = createClient()
  
  // Fetch markets
  const { data: markets, error: marketsError } = await supabase
    .from('v_front_markets_v4')
    .select('*')
    .in('status_text', ['open'])
    .order('featured', { ascending: false })
    .order('closes_at', { ascending: true })
    .limit(12)

  // Fetch stats
  const { data: stats } = await supabase
    .from('v_kpi_public_dashboard')
    .select('*')
    .single()

  // Fetch branding (hero banner)
  const { data: branding } = await supabase
    .from('branding_settings')
    .select('custom_css')
    .eq('id', 1)
    .single()
  
  const heroBannerUrl = (branding as any)?.custom_css || ''

  // Handle errors
  if (marketsError) {
    console.error('Error fetching markets:', marketsError)
  }

  const marketsList = (markets || []) as Market[]
  const statsData = (stats || {
    total_users: 0,
    active_markets: 0,
    total_markets: 0,
    total_bets: 0,
    total_volume: 0,
    volume_24h: 0,
  }) as Stats

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0F14' }}>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background: banner image or gradient */}
        {heroBannerUrl ? (
          <>
            <div className="absolute inset-0">
              <img src={heroBannerUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50" />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          </>
        )}
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Preveja o Futuro
            </span>
          </h1>
          
          <p className="mt-6 text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto">
            A plataforma de mercado preditivo mais avancada do Brasil
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/mercados">
              <Button size="lg" className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25">
                Explorar Mercados
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-gray-700 hover:bg-gray-800">
                Como Funciona
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-12 border-y border-gray-800" style={{ backgroundColor: '#111827' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={Users} 
              value={statsData.total_users?.toLocaleString('pt-BR') || '0'} 
              label="Usuarios Ativos" 
            />
            <StatCard 
              icon={BarChart3} 
              value={formatCurrency(statsData.total_volume || 0)} 
              label="Volume Total" 
            />
            <StatCard 
              icon={Activity} 
              value={formatCurrency(statsData.volume_24h || 0)} 
              label="Volume 24h" 
            />
            <StatCard 
              icon={TrendingUp} 
              value={statsData.active_markets?.toString() || '0'} 
              label="Mercados Ativos" 
            />
          </div>
        </div>
      </section>

      {/* MERCADOS EM DESTAQUE */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Mercados em Destaque
            </h2>
            <p className="mt-3 text-lg text-gray-400">
              Mercados reais do CenarioX
            </p>
          </div>

          {marketsList.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-gray-800" style={{ backgroundColor: '#111827' }}>
              <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Nenhum mercado disponivel no momento</p>
              <p className="text-gray-500 mt-2">Volte em breve para ver novos mercados</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {marketsList.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}

          {marketsList.length > 0 && (
            <div className="mt-12 text-center">
              <Link href="/mercados">
                <Button size="lg" variant="outline" className="border-gray-700 hover:bg-gray-800">
                  Ver Todos os Mercados
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 border-t border-gray-800" style={{ backgroundColor: '#111827' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Como Funciona
            </h2>
            <p className="mt-3 text-lg text-gray-400">
              Comece a prever em 3 passos simples
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="1"
              icon={Search}
              title="Escolha um mercado"
              description="Navegue por categorias como Politica, Economia, Esportes e Tecnologia. Encontre eventos que voce conhece."
            />
            <StepCard
              number="2"
              icon={Target}
              title="Faca sua previsao"
              description="Compre SIM se acha que vai acontecer, NAO se acha que nao vai. O preco reflete a probabilidade."
            />
            <StepCard
              number="3"
              icon={Trophy}
              title="Ganhe quando acertar"
              description="Se sua previsao estiver correta, voce ganha! Quanto mais cedo apostar, maior o potencial de lucro."
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center" style={{ backgroundColor: '#111827' }}>
            {/* Gradient effects */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Comece a prever o futuro
              </h2>
              <p className="mt-4 text-xl text-gray-400 max-w-xl mx-auto">
                Junte-se a milhares de usuarios que ja estao fazendo previsoes
              </p>
              <div className="mt-8">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/25">
                    Criar Conta Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Components
function StatCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="text-center p-6 rounded-2xl border border-gray-800" style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)' }}>
      <Icon className="h-6 w-6 text-green-400 mx-auto mb-3" />
      <div className="text-2xl sm:text-3xl font-bold text-white font-mono">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  )
}

function MarketCard({ market }: { market: Market }) {
  const options = market.options || []
  const yesOption = options.find(o => o.option_key === 'yes')
  const noOption = options.find(o => o.option_key === 'no')
  
  const yesOdds = yesOption?.odds || 2.0
  const noOdds = noOption?.odds || 2.0
  const yesProbability = yesOption?.probability || 50

  const categoryClass = categoryColors[market.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'

  return (
    <Link href={`/mercados/${market.slug}`}>
      <div 
        className="group relative overflow-hidden rounded-2xl border border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
        style={{ backgroundColor: '#111827' }}
      >
        {/* Cover image */}
        {market.image_url && (
          <div className="h-40 overflow-hidden">
            <img src={market.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}

        <div className="p-6">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryClass}`}>
            {market.category || 'Geral'}
          </span>
          
          {market.featured && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Star className="h-3 w-3" /> Destaque
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-green-400 transition-colors mb-4">
          {market.title}
        </h3>

        {/* Probability bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>SIM {yesProbability.toFixed(0)}%</span>
            <span>NAO {(100 - yesProbability).toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${yesProbability}%` }}
            />
          </div>
        </div>

        {/* Odds buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="flex flex-col items-center justify-center py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors">
            <span className="text-xs text-green-400 mb-1">SIM</span>
            <span className="text-lg font-bold text-green-400">{yesOdds.toFixed(2)}</span>
          </button>
          <button className="flex flex-col items-center justify-center py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors">
            <span className="text-xs text-red-400 mb-1">NAO</span>
            <span className="text-lg font-bold text-red-400">{noOdds.toFixed(2)}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {getTimeLeft(market.closes_at)}
          </span>
          <span className="text-xs">
            {formatDate(market.closes_at)}
          </span>
        </div>
        </div>
      </div>
    </Link>
  )
}

function StepCard({ number, icon: Icon, title, description }: { number: string; icon: any; title: string; description: string }) {
  return (
    <div className="relative p-8 rounded-2xl border border-gray-800" style={{ backgroundColor: 'rgba(11, 15, 20, 0.8)' }}>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-5xl font-black bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
          {number}
        </span>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30">
          <Icon className="h-6 w-6 text-green-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
