import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { MarketCard } from '@/components/market-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FrontMarket } from '@/lib/types'
import { ArrowRight, TrendingUp, Trophy, Users, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 30

async function getMarkets(): Promise<{ featured: FrontMarket[]; open: FrontMarket[] }> {
  try {
    const { data } = await supabase
      .from('v_front_markets_v3')
      .select('*')
      .eq('status_text', 'open')
      .order('featured', { ascending: false })
      .order('closes_at', { ascending: true })
      .limit(24)

    const rows = (data ?? []) as any[]
    return {
      featured: rows.filter((m) => m.featured).slice(0, 3),
      open: rows,
    }
  } catch {
    return { featured: [], open: [] }
  }
}

export default async function HomePage() {
  const { featured, open } = await getMarkets()

  return (
    <>
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="relative border-b border-border/60">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="flex flex-col items-start gap-6 max-w-3xl">
              <Badge variant="outline" className="gap-2 px-3 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-medium">Ao vivo agora</span>
              </Badge>

              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Negocie o{' '}
                <span className="bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                  futuro
                </span>
                .
                <br />
                Ganhe por estar certo.
              </h1>

              <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                CenarioX é a plataforma brasileira de mercados preditivos. Compre shares
                de resultados em eventos reais — política, esportes, economia, cultura —
                e lucre quando sua previsão se concretizar.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/mercados">
                  <Button size="lg" className="gap-2">
                    Ver mercados
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline">
                    <Trophy className="h-4 w-4" />
                    Leaderboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
              <StatTile icon={TrendingUp} label="Mercados ativos" value={String(open.length)} />
              <StatTile icon={Users} label="Traders" value="1.2k+" />
              <StatTile icon={Zap} label="Volume 24h" value="R$ 45k" />
              <StatTile icon={Trophy} label="Resolvidos" value="320+" />
            </div>
          </div>
        </section>

        {/* FEATURED */}
        {featured.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Em destaque
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os mercados mais negociados agora.
                </p>
              </div>
              <Link
                href="/mercados"
                className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featured.map((m) => (
                <MarketCard key={m.id} market={m as any} />
              ))}
            </div>
          </section>
        )}

        {/* ALL OPEN MARKETS */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Mercados abertos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {open.length} mercados aceitando apostas agora.
              </p>
            </div>
          </div>

          {open.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Nenhum mercado aberto</p>
                <p className="text-sm text-muted-foreground">
                  Volte em breve para ver novos mercados.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {open.map((m) => (
                <MarketCard key={m.id} market={m as any} />
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
          <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-10 text-center">
            <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]" />
            <div className="relative">
              <h3 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                Pronto para começar?
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-pretty text-muted-foreground">
                Crie sua conta, complete a verificação e faça sua primeira aposta em
                minutos.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/login">
                  <Button size="lg">Criar conta grátis</Button>
                </Link>
                <Link href="/mercados">
                  <Button size="lg" variant="outline">
                    Explorar mercados
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
