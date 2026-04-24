'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, BarChart3,
  TrendingUp, 
  Users, 
  Wallet,
  Settings,
  ChevronLeft,
  Zap,
  DollarSign,
  Brain,
  FileText,
  Activity,
  MessageSquare,
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/ai-dashboard', label: 'IA Insights ✨', icon: Brain },
  { href: '/admin/logs', label: 'Logs de Atividade', icon: Activity },
  { href: '/admin/suporte', label: 'Suporte', icon: MessageSquare },
  { href: '/admin/mercados-rapidos', label: 'Mercados Rápidos', icon: Zap },
  { href: '/admin/resolucao', label: 'Resolução Auto', icon: Zap },
  { href: '/admin/ao-vivo', label: 'Ao Vivo 🔴', icon: Zap },
  { href: '/admin/automacao', label: '🤖 Automação', icon: Brain },
  { href: '/admin/mercados', label: 'Mercados', icon: TrendingUp },
  { href: '/admin/usuarios', label: 'Usuários', icon: Users },
  { href: '/admin/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/admin/cms', label: 'CMS / Páginas', icon: FileText },
  { href: '/admin/branding', label: 'Branding', icon: Settings },
  { href: '/admin/influencers', label: 'Influencers', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check admin role
      const { data: profile } = await supabase
        .from('v_front_me')
        .select('role')
        .single()
      
      const role = (profile as any)?.role ?? 'user'
      if (!['admin', 'super_admin'].includes(role)) {
        router.push('/')
        return
      }

      setUser(user)
      setIsAdmin(true)
      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 blur-backdrop border-b border-border/50">
        <div className="flex h-16 items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Zap className="h-4 w-4 text-background" />
            </div>
            <span className="font-bold">Admin</span>
          </Link>
          <Link href="/" className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border p-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <Zap className="h-5 w-5 text-background" />
                </div>
                <div>
                  <span className="font-bold">CenarioX</span>
                  <p className="text-xs text-muted-foreground">Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-border bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
              <Zap className="h-5 w-5 text-background" />
            </div>
            <div>
              <span className="font-bold">CenarioX</span>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
              Voltar ao Site
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 w-full"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
