'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brain, TrendingUp, TrendingDown, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

interface AIAnalysis {
  resumo: string
  cenarios: Array<{
    opcao: string
    probabilidade: number
    analise: string
    fatores_favor: string[]
    riscos: string[]
  }>
  fatores_chave: string[]
  momento_mercado: 'quente' | 'neutro' | 'frio'
  confianca_analise: 'alta' | 'media' | 'baixa'
  data_resolucao_dica: string
}

export function AIAnalysis({ 
  marketId, title = '', description = '', category = '', optionsData = [] 
}: { 
  marketId: string
  title?: string
  description?: string
  category?: string
  optionsData?: any[]
}) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const [isPro, setIsPro] = useState<boolean | null>(null)

  useEffect(() => {
    // Verificar role do usuário (sem depender de view que pode não existir)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIsPro(false); return }
      supabase.from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: p }: any) => {
          const role = p?.role || 'free'
          setIsPro(['admin', 'super_admin', 'pro', 'influencer'].includes(role))
        })
        .catch(() => setIsPro(false))
    }).catch(() => setIsPro(false))
  }, [])

  async function load() {
    if (analysis || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/market/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, title, description, category, options: optionsData })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (e: any) {
      setError(e.message || 'Não foi possível carregar a análise.')
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    setOpen(v => !v)
    if (!open) load()
  }

  const momentoColor = {
    quente: 'text-orange-400',
    neutro: 'text-blue-400',
    frio: 'text-slate-400',
  }
  const momentoLabel = { quente: '🔥 Quente', neutro: '⚖️ Neutro', frio: '❄️ Frio' }

  // Gate PRO
  if (isPro === false) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Brain className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">Análise IA <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">PRO</span></p>
              <p className="text-xs text-muted-foreground">Cenários e probabilidades com IA</p>
            </div>
          </div>
          <a href="/upgrade" className="flex-shrink-0 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors">Assinar PRO</a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden">
      {/* Header — clicável */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Análise IA <Sparkles className="h-3 w-3 text-primary" />
            </p>
            <p className="text-xs text-muted-foreground">Cenários e probabilidades</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Conteúdo */}
      {open && (
        <div className="px-5 pb-5 border-t border-primary/10 pt-4 space-y-5">
          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Analisando mercado com IA...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {analysis && (
            <>
              {/* Badges de status */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-card border border-border ${momentoColor[analysis.momento_mercado]}`}>
                  {momentoLabel[analysis.momento_mercado]}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-card border border-border text-muted-foreground">
                  Confiança {analysis.confianca_analise}
                </span>
              </div>

              {/* Resumo */}
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.resumo}</p>

              {/* Cenários */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cenários</p>
                {analysis.cenarios.map((c, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card/50 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{c.opcao}</p>
                          <p className="text-xs text-muted-foreground">{c.probabilidade}% de chance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${c.probabilidade}%` }} />
                        </div>
                        {expanded === i ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </button>

                    {expanded === i && (
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/50">
                        <p className="text-sm text-muted-foreground">{c.analise}</p>
                        {c.fatores_favor.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-400 mb-1.5 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> A favor</p>
                            <ul className="space-y-1">
                              {c.fatores_favor.map((f, fi) => (
                                <li key={fi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-green-400 mt-0.5">+</span>{f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {c.riscos.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-400 mb-1.5 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Riscos</p>
                            <ul className="space-y-1">
                              {c.riscos.map((r, ri) => (
                                <li key={ri} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-red-400 mt-0.5">-</span>{r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Fatores chave */}
              {analysis.fatores_chave.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Fatores decisivos</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.fatores_chave.map((f, i) => (
                      <span key={i} className="text-xs bg-card border border-border rounded-full px-3 py-1 text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dica resolução */}
              <div className="rounded-xl bg-card/50 border border-border px-4 py-3 flex gap-3">
                <span className="text-lg">💡</span>
                <p className="text-xs text-muted-foreground">{analysis.data_resolucao_dica}</p>
              </div>

              <p className="text-[10px] text-muted-foreground/50">
                Análise gerada por IA — não é consultoria financeira. Faça sua própria pesquisa.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
