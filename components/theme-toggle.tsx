'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('cenariox-theme') as 'dark' | 'light' | null
    const initial = saved || 'dark'
    apply(initial)
    setTheme(initial)
  }, [])

  function apply(t: 'dark' | 'light') {
    const root = document.documentElement
    root.setAttribute('data-theme', t)
  }

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('cenariox-theme', next)
    apply(next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors ${className}`}
      title={theme === 'dark' ? 'Mudar para claro' : 'Mudar para escuro'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
