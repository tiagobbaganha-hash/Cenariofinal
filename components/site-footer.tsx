'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Send, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BrandingData {
  brand_name?: string
  logo_url?: string
  support_email?: string
  instagram_url?: string
  telegram_url?: string
  x_url?: string
}

export function SiteFooter() {
  const [branding, setBranding] = useState<BrandingData>({})
  const [legalPages, setLegalPages] = useState<{ slug: string; title: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    // Carregar branding
    supabase.from('branding_settings')
      .select('brand_name, logo_url, support_email, instagram_url, telegram_url, x_url')
      .eq('id', 1).maybeSingle()
      .then(({ data }) => { if (data) setBranding(data) })
      .catch(() => {})

    // Carregar páginas legais do CMS
    supabase.from('cms_pages')
      .select('slug, title')
      .eq('show_in_footer', true)
      .eq('is_published', true)
      .order('sort_order')
      .limit(8)
      .then(({ data }) => { if (data?.length) setLegalPages(data) })
      .catch(() => {})
  }, [])

  const brandName = branding.brand_name || 'CenárioX'

  return (
    <footer className="mt-20 border-t border-border/40 bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={brandName} className="h-8 w-auto object-contain" />
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 group-hover:bg-primary/20 transition-colors">
                    <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <span className="text-base font-bold">
                    {brandName.replace(/x$/i, '')}<span className="text-primary">X</span>
                  </span>
                </>
              )}
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              A plataforma brasileira de mercados preditivos. Aposte em eventos reais, negocie previsões e compita com outros traders.
            </p>
            {/* Redes sociais */}
            <div className="flex gap-2">
              {branding.x_url && (
                <a href={branding.x_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  𝕏
                </a>
              )}
              {branding.instagram_url && (
                <a href={branding.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  IG
                </a>
              )}
              {branding.telegram_url && (
                <a href={branding.telegram_url} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                  <Send className="h-4 w-4" />
                </a>
              )}
              {!branding.x_url && !branding.instagram_url && !branding.telegram_url && (
                <p className="text-xs text-muted-foreground/50">Configure redes sociais no Admin → Branding</p>
              )}
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Todos os Mercados', href: '/mercados' },
                { label: 'Minhas Previsões', href: '/apostas' },
                { label: 'Leaderboard', href: '/leaderboard' },
                { label: 'Comunidade', href: '/comunidade' },
                { label: 'Sugerir Mercado', href: '/propor-mercado' },
                { label: 'Planos PRO', href: '/upgrade' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Aprenda */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Aprenda</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'O que é Mercado Preditivo?', href: '/p/o-que-e' },
                { label: 'Como Funciona o CenárioX', href: '/p/como-funciona' },
                { label: 'É Legal no Brasil?', href: '/p/legalidade' },
                { label: 'Dúvidas Frequentes', href: '/ajuda' },
                { label: 'Central de Ajuda', href: '/ajuda' },
                { label: 'Sobre Nós', href: '/p/sobre' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              {legalPages.length > 0 ? (
                legalPages.map(p => (
                  <li key={p.slug}>
                    <Link href={`/p/${p.slug}`} className="text-muted-foreground hover:text-foreground transition-colors">{p.title}</Link>
                  </li>
                ))
              ) : (
                <>
                  {[
                    { label: 'Política de Privacidade', href: '/p/privacidade' },
                    { label: 'Termos de Uso', href: '/p/termos' },
                    { label: 'Aviso de Riscos', href: '/p/riscos' },
                    { label: 'Regras da Plataforma', href: '/p/regras' },
                  ].map(l => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </>
              )}
              {branding.support_email && (
                <li>
                  <a href={`mailto:${branding.support_email}`} className="text-muted-foreground hover:text-foreground transition-colors">
                    {branding.support_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block">🔞 Proibido para menores de 18 anos</span>
            <span>🎯 Aposte com responsabilidade</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
