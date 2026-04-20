'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FooterPage {
  slug: string
  title: string
}

export function SiteFooter() {
  const [pages, setPages] = useState<FooterPage[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('v_site_footer_pages')
        .select('slug, title, sort_order')
        .order('sort_order')
        .limit(10)
      setPages((data || []) as FooterPage[])
    }
    load()
  }, [])

  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
                <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="text-base font-bold">
                Cenario<span className="text-primary">X</span>
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground text-pretty">
              Mercados preditivos brasileiros. Aposte em eventos reais, negocie previsões
              e compita com outros traders.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plataforma
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/mercados" className="text-muted-foreground hover:text-foreground">Mercados</Link></li>
              <li><Link href="/leaderboard" className="text-muted-foreground hover:text-foreground">Leaderboard</Link></li>
              <li><Link href="/comunidade" className="text-muted-foreground hover:text-foreground">Comunidade</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suporte
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/ajuda" className="text-muted-foreground hover:text-foreground">Central de Ajuda</Link></li>
              <li><Link href="/propor-mercado" className="text-muted-foreground hover:text-foreground">Sugerir Mercado</Link></li>
              <li><Link href="/upgrade" className="text-muted-foreground hover:text-foreground">Planos PRO</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {pages.length > 0 ? (
                pages.map(p => (
                  <li key={p.slug}>
                    <Link href={`/p/${p.slug}`} className="text-muted-foreground hover:text-foreground">
                      {p.title}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="/p/termos" className="text-muted-foreground hover:text-foreground">Termos de Uso</Link></li>
                  <li><Link href="/p/privacidade" className="text-muted-foreground hover:text-foreground">Privacidade</Link></li>
                  <li><Link href="/p/ajuda" className="text-muted-foreground hover:text-foreground">Ajuda</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CenarioX. Todos os direitos reservados.</p>
          <p>Aposte com responsabilidade. Proibido para menores de 18 anos.</p>
        </div>
      </div>
    </footer>
  )
}
