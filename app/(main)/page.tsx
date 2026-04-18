'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { TrendingUp, Clock, Users, Zap } from 'lucide-react'

interface Market {
  id: string
  title: string
  category: string
  description?: string
  status: string
  featured: boolean
  closes_at: string | null
  options_count?: number
}

export default function HomePage() {
  const [featuredMarkets, setFeaturedMarkets] = useState<Market[]>([])
  const [allMarkets, setAllMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMarkets = async () => {
      try {
        const { data, error } = await supabase
          .from('markets')
          .select('id, title, category, description, status, featured, closes_at')
          .eq('status', 'open')
          .order('featured', { ascending: false })
          .order('closes_at', { ascending: true })

        if (error) throw error

        const markets = data || []
        const featured = markets.filter((m) => m.featured).slice(0, 3)
        setFeaturedMarkets(featured)
        setAllMarkets(markets)
      } catch (error) {
        console.error('Erro ao carregar mercados:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMarkets()
  }, [])

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Mercados Preditivos
          </h1>
          <p className="text-lg text-muted-foreground">
            Aposte em eventos reais e compita com outros usuários. Explore os mercados abertos
            abaixo ou crie o seu próprio.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/markets">
            <Button size="lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              Ver Todos os Mercados
            </Button>
          </Link>
          <Link href="/wallet">
            <Button variant="outline" size="lg">
              Minha Carteira
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Mercados Ativos"
          value={allMarkets.length.toString()}
          icon={TrendingUp}
        />
        <StatCard
          label="Usuários"
          value="1.2K+"
          icon={Users}
        />
        <StatCard
          label="Volume Total"
          value="R$ 45K+"
          icon={Zap}
        />
        <StatCard
          label="Tempo Médio"
          value="30 dias"
          icon={Clock}
        />
      </section>

      {/* Featured Markets */}
      {featuredMarkets.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Em Destaque</h2>
            <p className="text-muted-foreground">Os mercados mais populares do momento</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} featured />
            ))}
          </div>
        </section>
      )}

      {/* All Markets */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Todos os Mercados</h2>
          <p className="text-muted-foreground">
            {allMarkets.length} mercados abertos para apostas
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : allMarkets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum mercado aberto no momento</p>
              <p className="text-sm text-muted-foreground">
                Verifique em breve ou crie um novo mercado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {allMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="rounded-lg bg-primary/10 border border-primary/20 p-8 text-center">
        <h3 className="text-2xl font-bold mb-2">Pronto para começar?</h3>
        <p className="text-muted-foreground mb-6">
          Faça seu primeiro depósito e comece a apostar em eventos do mundo real.
        </p>
        <Link href="/wallet/deposit">
          <Button size="lg">Depositar Agora</Button>
        </Link>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: any
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function MarketCard({ market, featured = false }: { market: Market; featured?: boolean }) {
  const timeLeft = market.closes_at
    ? Math.floor((new Date(market.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isClosingSoon = timeLeft !== null && timeLeft <= 7

  return (
    <Link href={`/market/${market.id}`}>
      <Card className={`hover:border-primary transition-colors cursor-pointer ${featured ? 'border-primary/50' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-lg">{market.title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {market.category}
              </Badge>
            </div>
            {featured && <Badge className="ml-2">Destaque</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {market.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {market.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLeft !== null && (
                <span className={isClosingSoon ? 'text-warning' : ''}>
                  Encerra em {timeLeft}d
                </span>
              )}
            </div>
            <span>{market.closes_at ? formatDate(market.closes_at) : 'Aberto'}</span>
          </div>

          <Button size="sm" className="w-full" variant="outline">
            Ver Mercado
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
