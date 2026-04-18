'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="no-underline">
            <div className="text-lg font-semibold">CenarioX</div>
          </Link>
          <nav className="flex items-center gap-3 text-sm text-neutral-300">
            <Link href="/" className="hover:text-white">Mercados</Link>
            <Link href="/leaderboard" className="hover:text-white">Leaderboard</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {email ? (
            <>
              <span className="hidden text-neutral-300 sm:inline">{email}</span>
              <button
                onClick={signOut}
                className="rounded-xl border border-neutral-700 px-3 py-1.5 hover:bg-neutral-900"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-neutral-700 px-3 py-1.5 no-underline hover:bg-neutral-900"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
