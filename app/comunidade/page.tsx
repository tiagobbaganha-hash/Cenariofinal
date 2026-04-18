import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Users } from 'lucide-react'

export default function CommunityPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Users className="h-5 w-5" />
            </span>
            Comunidade
          </h1>
          <p className="mt-2 text-muted-foreground">
            Discuta mercados, compartilhe previsões e aprenda com outros traders.
          </p>
        </header>

        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-semibold">Em breve</h2>
                <Badge variant="warning">Beta</Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Estamos preparando a área da comunidade. Em breve você poderá comentar em
                mercados, criar threads de discussão e seguir outros traders.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </>
  )
}
