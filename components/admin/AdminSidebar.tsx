'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
  FileText,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Mercados', href: '/admin/markets', icon: TrendingUp },
  { name: 'Usuários', href: '/admin/users', icon: Users },
  { name: 'Finanças', href: '/admin/finance', icon: Wallet },
  { name: 'CMS', href: '/admin/cms', icon: FileText },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">CenarioX Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors no-underline',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors no-underline hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Voltar ao Site
        </Link>
      </div>
    </aside>
  )
}
