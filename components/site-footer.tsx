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
  youtube_url?: string
  support_whatsapp?: string
  tiktok_url?: string
}

export function SiteFooter() {
  const [branding, setBranding] = useState<BrandingData>({})
  const [legalPages, setLegalPages] = useState<{ slug: string; title: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    // Carregar branding
    supabase.from('branding_settings')
      .select('brand_name, logo_url, support_email, support_whatsapp, instagram_url, telegram_url, x_url, youtube_url, tiktok_url')
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
            {/* Redes sociais — ícones SVG modernos */}
            <div className="flex gap-2 flex-wrap">
              {branding.x_url && (
                <a href={branding.x_url.startsWith('http') ? branding.x_url : `https://x.com/${branding.x_url}`} target="_blank" rel="noopener noreferrer"
                  title="X (Twitter)" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {branding.instagram_url && (
                <a href={branding.instagram_url.startsWith('http') ? branding.instagram_url : `https://instagram.com/${branding.instagram_url}`} target="_blank" rel="noopener noreferrer"
                  title="Instagram" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-pink-400 hover:border-pink-400/40 transition-all hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {branding.telegram_url && (
                <a href={branding.telegram_url.startsWith('http') ? branding.telegram_url : `https://t.me/${branding.telegram_url}`} target="_blank" rel="noopener noreferrer"
                  title="Telegram" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-sky-400 hover:border-sky-400/40 transition-all hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
              )}
              {branding.youtube_url && (
                <a href={branding.youtube_url.startsWith('http') ? branding.youtube_url : `https://youtube.com/@${branding.youtube_url}`} target="_blank" rel="noopener noreferrer"
                  title="YouTube" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/40 transition-all hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {branding.tiktok_url && (
                <a href={branding.tiktok_url.startsWith('http') ? branding.tiktok_url : `https://tiktok.com/@${branding.tiktok_url}`} target="_blank" rel="noopener noreferrer"
                  title="TikTok" className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all hover:scale-110">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/></svg>
                </a>
              )}
              {branding.support_whatsapp && (
                <a href={`https://wa.me/${branding.support_whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  📱 WhatsApp
                </a>
              )}
              {!branding.x_url && !branding.instagram_url && !branding.telegram_url && !branding.youtube_url && !branding.support_whatsapp && (
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
                { label: 'Ranking', href: '/ranking' },
                
                { label: 'Sugerir Mercado', href: '/propor-mercado' },
                
                { label: '🎁 Indicação', href: '/indicacao' },
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
              {[
                { label: 'Termos de Uso', href: '/p/termos' },
                { label: 'Política de Privacidade', href: '/p/privacidade' },
                { label: 'Aviso de Riscos', href: '/p/riscos' },
                { label: 'Regras da Plataforma', href: '/p/regras' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
                </li>
              ))}
              {branding.support_email && (
                <li className="pt-2">
                  <a href={`mailto:${branding.support_email}`} className="text-muted-foreground hover:text-foreground transition-colors text-xs">
                    ✉️ {branding.support_email}
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
