'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Star, 
  BarChart3,
  Zap,
  Trophy,
  Wallet,
  User,
  Home,
  ChevronDown
} from 'lucide-react'

interface MarketOption {
  id: string
  label: string
  odds?: number | null
  probability?: number | null
  option_key?: string | null
}

interface Market {
  id: string
  title: string
  slug: string
  category: string
  status: string
  status_text?: string
  image_url?: string | null
  influencer_name?: string | null
  influencer_code?: string | null
  featured: boolean
  closes_at: string | null
  total_volume?: number
  yes_price?: number
  no_price?: number
  options?: MarketOption[] | null
}

export default function MercadosPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('todos')
  const [sortBy, setSortBy] = useState('featured')
  const [user, setUser] = useState<any>(null)
  const [marketType, setMarketType] = useState('todos')

  const categories = ['todos', 'politica', 'esportes', 'economia', 'cultura', 'entretenimento', 'tecnologia']

  useEffect(() => {
    const supabase = createClient()
    
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Busca mercados + opções diretamente (não depende de view)
      const { data: rawMarkets } = await supabase
        .from('markets')
        .select('id, slug, title, category, status, image_url, featured, closes_at, total_volume, influencer_id')
        .in('status', ['open', 'closed'])
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (rawMarkets && rawMarkets.length > 0) {
        // Buscar todas as opções dos mercados retornados
        const ids = rawMarkets.map((m: any) => m.id)
        const { data: allOptions } = await supabase
          .from('market_options')
          .select('id, market_id, label, odds, probability, option_key, sort_order')
          .in('market_id', ids)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        // Agrupar opções por market_id
        const optMap: Record<string, any[]> = {}
        for (const opt of (allOptions || [])) {
          if (!optMap[opt.market_id]) optMap[opt.market_id] = []
          optMap[opt.market_id].push(opt)
        }

        // Montar mercados com options
        const markets = rawMarkets.map((m: any) => ({
          ...m,
          options: optMap[m.id] || [],
        }))
        setMarkets(markets)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const filtered = useMemo(() => {
    let list = [...markets]

    if (marketType !== 'todos') {
      const typeMap: Record<string, string> = { rapidos: 'rapid', 'ao-vivo': 'live', normais: 'standard' }
      list = list.filter(m => (m.market_type || 'standard') === (typeMap[marketType] || marketType))
    }

    if (category !== 'todos') {
      list = list.filter(m => m.category?.toLowerCase() === category)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(m => m.title?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q))
    }

    switch (sortBy) {
      case 'featured':
        list.sort((a, b) => Number(b.featured) - Number(a.featured))
        break
      case 'volume':
        list.sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
        break
      case 'closing':
        list.sort((a, b) => (a.closes_at || '').localeCompare(b.closes_at || ''))
        break
    }

    return list
  }, [markets, category, search, sortBy])

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 blur-backdrop border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Zap className="h-5 w-5 text-background" />
              </div>
              <span className="text-xl font-bold hidden sm:block">
                Cenario<span className="text-primary">X</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/mercados" className="text-sm font-medium text-primary">Mercados</Link>
              <Link href="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Ranking</Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/carteira">
                    <Button variant="outline" size="sm"><Wallet className="mr-2 h-4 w-4" /> Carteira</Button>
                  </Link>
                  <Link href="/conta">
                    <Button size="sm" className="glow-green"><User className="mr-2 h-4 w-4" /> Conta</Button>
                  </Link>
                </>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="glow-green">Entrar</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold">Mercados</h1>
          <p className="text-muted-foreground mt-2">Explore todos os mercados preditivos disponiveis</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar mercados..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-card border border-border focus:border-primary outline-none"
            />
          </div>
          {/* Filtro por tipo de mercado */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'todos', label: '🌐 Todos' },
              { id: 'normais', label: '📊 Normais' },
              { id: 'rapidos', label: '⚡ Rápidos' },
              { id: 'ao-vivo', label: '🔴 Ao Vivo' },
            ].map(t => (
              <button key={t.id} onClick={() => setMarketType(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors border ${
                  marketType === t.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          {/* Filtro por categoria */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  category === cat 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border border-border hover:border-primary/50'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort & Results */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filtered.length} mercado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-4 rounded-lg bg-card border border-border focus:border-primary outline-none"
          >
            <option value="featured">Destaques</option>
            <option value="volume">Maior Volume</option>
            <option value="closing">Encerrando</option>
          </select>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl font-medium">Nenhum mercado encontrado</p>
            <p className="text-muted-foreground mt-2">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs">Inicio</span>
          </Link>
          <Link href="/mercados" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-medium">Mercados</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <Trophy className="h-5 w-5" />
            <span className="text-xs">Ranking</span>
          </Link>
          <Link href={user ? "/carteira" : "/login"} className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-xs">Carteira</span>
          </Link>
          <Link href={user ? "/conta" : "/login"} className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="text-xs">Conta</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function MarketCard({ market }: { market: Market }) {
  const options = Array.isArray(market.options) && market.options.length > 0 ? market.options : null
  const yesPrice = market.yes_price ?? (0.4 + Math.random() * 0.3)
  const noPrice = 1 - yesPrice
  const volume = market.total_volume ?? Math.floor(1000 + Math.random() * 50000)
  const timeLeft = market.closes_at ? Math.max(0, Math.floor((new Date(market.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

  return (
    <Link href={`/mercados/${market.slug || market.id}`}>
      <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full">
        {/* Cover image */}
        {market.image_url && (
          <div className="h-40 overflow-hidden">
            <img src={market.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className={`absolute ${market.image_url ? 'top-2' : 'top-4'} left-4 z-10`}>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm border border-white/10">
            {market.category || 'Geral'}
          </span>
          {market.market_type === 'rapid' && <span className="ml-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/90 text-black">⚡</span>}
          {market.market_type === 'live' && <span className="ml-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/90 text-white">🔴</span>}
        </div>
        {market.featured && (
          <div className={`absolute ${market.image_url ? 'top-2' : 'top-4'} right-4 z-10`}>
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <Star className="h-3 w-3" /> Destaque
            </span>
          </div>
        )}
        {market.influencer_name && (
          <div className={`absolute ${market.image_url ? 'top-2' : 'top-4'} left-4 z-10 mt-8`}>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/30 text-purple-300 border border-purple-500/30 backdrop-blur-sm">
              @{market.influencer_name}
            </span>
          </div>
        )}
        <div className={market.image_url ? 'p-5' : 'p-6 pt-14'}>
          <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors mb-4">{market.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><BarChart3 className="h-4 w-4" /> R$ {(volume / 1000).toFixed(1)}k</span>
            {timeLeft !== null && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {timeLeft}d</span>}
          </div>
          {options && options.length > 0 ? (
            /* Opções reais do banco */
            <div className={
              options.length === 2 ? 'grid grid-cols-2 gap-2' :
              options.length === 3 ? 'grid grid-cols-3 gap-1.5' :
              options.length === 4 ? 'grid grid-cols-2 gap-1.5' :
              'grid grid-cols-2 gap-1.5'
            }>
              {options.slice(0, 6).map((opt, i) => {
                const isNo = opt.option_key === 'no' || opt.label?.toLowerCase() === 'não' || opt.label?.toLowerCase() === 'nao'
                const prob = typeof opt.probability === 'number' ? opt.probability : 0.5
                const colors = [
                  'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
                  'bg-rose-500/20 border-rose-500/40 text-rose-400',
                  'bg-blue-500/20 border-blue-500/40 text-blue-400',
                  'bg-amber-500/20 border-amber-500/40 text-amber-400',
                  'bg-purple-500/20 border-purple-500/40 text-purple-400',
                  'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
                ]
                const colorClass = isNo ? colors[1] : colors[i % colors.length]
                return (
                  <div key={opt.id} className={`rounded-xl border px-2 py-2 text-center ${colorClass}`}>
                    <div className="text-[10px] font-semibold opacity-80 truncate mb-0.5">{opt.label}</div>
                    <div className="text-base font-bold">{(prob * 100).toFixed(0)}%</div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Fallback SIM/NAO */
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border bg-emerald-500/20 border-emerald-500/40 px-2 py-2 text-center">
                <div className="text-[10px] font-semibold text-emerald-400 opacity-80 mb-0.5">SIM</div>
                <div className="text-base font-bold text-emerald-400">{(yesPrice * 100).toFixed(0)}%</div>
              </div>
              <div className="rounded-xl border bg-rose-500/20 border-rose-500/40 px-2 py-2 text-center">
                <div className="text-[10px] font-semibold text-rose-400 opacity-80 mb-0.5">NÃO</div>
                <div className="text-base font-bold text-rose-400">{(noPrice * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
