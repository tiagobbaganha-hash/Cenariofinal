'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, X, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

export function ShieldCheckBanner() {
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cx_cookie_consent')
    if (!consent) setShow(true)
  }, [])

  function accept() {
    localStorage.setItem('cx_cookie_consent', JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    setShow(false)
  }

  function reject() {
    localStorage.setItem('cx_cookie_consent', JSON.stringify({ accepted: false, date: new Date().toISOString() }))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
      <div className="mx-auto max-w-2xl pointer-events-auto">
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Este site usa cookies</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo.{' '}
                <Link href="/p/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
                {' · '}
                <Link href="/p/termos" className="text-primary hover:underline">Termos de Uso</Link>
              </p>

              {expanded && (
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <span><strong className="text-foreground">Essenciais</strong> — necessários para o funcionamento da plataforma (login, sessão, preferências)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 flex-shrink-0">○</span>
                    <span><strong className="text-foreground">Analíticos</strong> — nos ajudam a entender como você usa o CenárioX para melhorar a plataforma</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setExpanded(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Menos detalhes' : 'Mais detalhes'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={reject}
              className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Rejeitar não essenciais
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Aceitar todos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
