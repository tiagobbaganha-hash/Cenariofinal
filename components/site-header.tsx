'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, X, TrendingUp } from 'lucide-react'

const navigation = [
  { label: 'Mercados', href: '/mercados' },
  { label: 'Apostas', href: '/apostas' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Comunidade', href: '/comunidade' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setUserEmail(data.user?.email ?? null)

      if (data.user) {
        const { data: me } = await supabase
          .from('v_front_me')
          .select('role')
          .single()
        const role = (me as any)?.role ?? 'user'
        setIsAdmin(['admin', 'super_admin'].includes(role))
      }
    }
    load()

    const supabase = createClient()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30 group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight">
              Cenario<span className="text-primary">X</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => {
              const active = pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'text-foreground bg-accent/60'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname?.startsWith('/admin')
                    ? 'text-primary bg-primary/10'
                    : 'text-primary/80 hover:text-primary hover:bg-primary/5'
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {userEmail ? (
            <Link href="/conta">
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                Conta
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Começar</Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Admin
              </Link>
            )}
            <div className="mt-2 border-t border-border/60 pt-2">
              {userEmail ? (
                <Link href="/conta" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Conta
                  </Button>
                </Link>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
