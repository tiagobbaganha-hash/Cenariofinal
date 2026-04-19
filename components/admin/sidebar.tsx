'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Users,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Tag,
  Share2,
  ScrollText,
  ArrowLeft,
  Activity,
} from 'lucide-react'

const sections = [
  {
    title: 'Operação',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/mercados', label: 'Mercados', icon: TrendingUp },
      { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
    ],
  },
  {
    title: 'Usuários',
    items: [
      { href: '/admin/usuarios', label: 'Usuários', icon: Users },
      { href: '/admin/kyc', label: 'KYC', icon: ShieldCheck },
      { href: '/admin/referrals', label: 'Referrals', icon: Share2 },
    ],
  },
  {
    title: 'Conteúdo',
    items: [
      { href: '/admin/cms', label: 'CMS', icon: FileText },
      { href: '/admin/midia', label: 'Mídia', icon: ImageIcon },
      { href: '/admin/promocoes', label: 'Promoções', icon: Tag },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/admin/auditoria', label: 'Auditoria', icon: ScrollText },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/50 lg:block">
      <div className="sticky top-0 h-dvh overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <Activity className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Painel</div>
            <div className="text-sm font-semibold">Admin</div>
          </div>
        </div>

        <nav className="p-3 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname?.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <div className="border-t border-border/60 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao site
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}
