'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export function Header() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const read = async () => {
      const { data } = await supabase.auth.getSession()
      if (!ignore) setEmail(data.session?.user?.email ?? null)
    }

    read()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })

    return () => {
      ignore = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="no-underline">
            <div className="text-lg font-semibold text-foreground">CenarioX</div>
          </Link>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">Mercados</Link>
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">Leaderboard</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {/* Admin Link - TODO: verificar role do usuario */}
          <Link href="/admin" className="no-underline">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>

          {email ? (
            <>
              <span className="hidden text-muted-foreground sm:inline">{email}</span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sair
              </Button>
            </>
          ) : (
            <Link href="/login" className="no-underline">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
