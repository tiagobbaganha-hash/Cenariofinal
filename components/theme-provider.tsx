'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
  resolvedTheme: 'dark' | 'light'
}>({ theme: 'dark', setTheme: () => {}, resolvedTheme: 'dark' })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')
  const [resolvedTheme, setResolved] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('cx_theme') as Theme) || 'dark'
    setThemeState(saved)
    apply(saved)
  }, [])

  function apply(t: Theme) {
    const root = document.documentElement
    if (t === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.setAttribute('data-theme', sys)
      setResolved(sys)
    } else {
      root.setAttribute('data-theme', t)
      setResolved(t)
    }
  }

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('cx_theme', t)
    apply(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
