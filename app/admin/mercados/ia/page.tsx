'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import { Sparkles, Loader2, Save, RefreshCw, CheckCircle, Plus, Trash2, Zap, Brain } from 'lucide-react'
import Link from 'next/link'

interface GeneratedMarket {
  title: string
  description: string
  category: string
  options: { label: string; option_key: string; probability: number; odds: number }[]
  closes_at_days: number
  resolves_at_days: number
  selected?: boolean
  saved?: boolean
  saving?: boolean
}

const TEMPLATES = [
  { label: '🎬 BBB / Reality Shows', prompt: 'Gere 5 mercados preditivos sobre o BBB 26 e reality shows brasileiros em 2026' },
  { label: '🏛️ Política Brasil 2026', prompt: 'Gere 5 mercados preditivos sobre eleições presidenciais e políticas no Brasil em 2026' },
  { label: '⚽ Futebol Brasileiro', prompt: 'Gere 5 mercados preditivos sobre o Campeonato Brasileiro 2026, Copa do Brasil e clubes nacionais' },
  { label: '🏎️ Fórmula 1 2026', prompt: 'Gere 5 mercados preditivos sobre a temporada de Fórmula 1 2026, pilotos e construtores' },
  { label: '₿ Cripto & Economia', prompt: 'Gere 5 mercados preditivos sobre Bitcoin, Ethereum e economia brasileira em 2026' },
  { label: '🌍 Geopolítica', prompt: 'Gere 5 mercados preditivos sobre eventos geopolíticos e internacionais em 2026' },
  { label: '🎵 Pop Culture BR', prompt: 'Gere 5 mercados preditivos sobre música, cinema, entretenimento e cultura pop brasileira em 2026' },
  { label: '🏀 Esportes Globais', prompt: 'Gere 5 mercados preditivos sobre NBA, Copa do Mundo 2026, Olimpíadas e esportes internacionais' },
]

export default function AiMarketPage() {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState('')
  const [qty, setQty] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [markets, setMarkets] = useState<GeneratedMarket[]>([])
  const [savingAll, setSavingAll] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  async function generate(customPrompt?: string) {
    const p = customPrompt || prompt.trim()
    if (!p) { toast({ type: 'error', title: 'Descreva o tema' }); return }
    setGenerating(true)
    setMarkets([])
    setSavedCount(0)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/admin/ai-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          prompt: `${p}. Gere exatamente ${qty} mercados preditivos diferentes e interessantes.
          
          Retorne JSON com array "markets" contendo objetos com:
          - title: pergunta clara em português
          - description: contexto do evento (2-3 frases)
          - category: uma de [Política, Esportes, Cripto, Entretenimento, Economia, Geopolítica, Tecnologia]
          - options: array de 2-4 opções com {label, option_key (yes/no/opt1/opt2...), probability (0-1 somando 1), odds (1/probability * 0.95)}
          - closes_at_days: dias até fechar apostas (7-90)
          - resolves_at_days: dias até resolver (closes + 1-7)
          
          Foco: mercados relevantes, emocionantes, com probabilidades realistas. Retorne APENAS JSON válido.`
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      // Parsear JSON da resposta
      let parsed: any = null
      try {
        const text = data.result || data.content || JSON.stringify(data)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
        if (parsed?.markets) {
          setMarkets(parsed.markets.map((m: any) => ({ ...m, selected: true })))
        } else {
          throw new Error('Formato inválido')
        }
      } catch (_) {
        // Se retornou mercado único (formato antigo)
        if (data.title) {
          setMarkets([{ ...data, selected: true }])
        } else {
          throw new Error('Não foi possível parsear os mercados gerados')
        }
      }
    } catch (e: any) {
      toast({ type: 'error', title: 'Erro ao gerar', description: e.message })
    } finally {
      setGenerating(false)
    }
  }

  async function saveMarket(idx: number) {
    const market = markets[idx]
    if (market.saved || market.saving) return

    setMarkets(prev => prev.map((m, i) => i === idx ? { ...m, saving: true } : m))

    try {
      const supabase = createClient()
      const now = new Date()
      const closesAt = new Date(now.getTime() + (market.closes_at_days || 30) * 86400000)
      const resolvesAt = new Date(now.getTime() + (market.resolves_at_days || 37) * 86400000)
      const slug = market.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
        + '-' + Date.now().toString(36)

      const { data: created, error } = await supabase.from('markets').insert({
        title: market.title,
        description: market.description,
        category: market.category,
        slug,
        status: 'open',
        closes_at: closesAt.toISOString(),
        resolves_at: resolvesAt.toISOString(),
      }).select().single()

      if (error) throw error

      // Criar opções
      await supabase.from('market_options').insert(
        market.options.map((opt, i) => ({
          market_id: created.id,
          label: opt.label,
          option_key: opt.option_key || (i === 0 ? 'yes' : i === 1 ? 'no' : `opt${i + 1}`),
          probability: opt.probability,
          odds: opt.odds || (1 / opt.probability * 0.95),
          sort_order: i,
          is_active: true,
        }))
      )

      setMarkets(prev => prev.map((m, i) => i === idx ? { ...m, saving: false, saved: true } : m))
      setSavedCount(c => c + 1)
    } catch (e: any) {
      setMarkets(prev => prev.map((m, i) => i === idx ? { ...m, saving: false } : m))
      toast({ type: 'error', title: 'Erro ao salvar', description: e.message })
    }
  }

  async function saveAll() {
    setSavingAll(true)
    const toSave = markets.map((_, i) => i).filter(i => !markets[i].saved && markets[i].selected)
    for (const idx of toSave) {
      await saveMarket(idx)
      await new Promise(r => setTimeout(r, 300)) // pequeno delay entre saves
    }
    setSavingAll(false)
    toast({ type: 'success', title: `✅ ${toSave.length} mercados criados!`, description: 'Disponíveis em /mercados' })
  }

  const selectedCount = markets.filter(m => m.selected && !m.saved).length
  const allSaved = markets.length > 0 && markets.every(m => m.saved || !m.selected)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Gerador IA de Mercados</h1>
          <p className="text-xs text-muted-foreground">Crie múltiplos mercados em segundos com IA</p>
        </div>
      </div>

      {/* Templates rápidos */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">⚡ Templates rápidos</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <button key={t.label} onClick={() => { setPrompt(t.prompt); generate(t.prompt) }}
              disabled={generating}
              className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-50">
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt customizado */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">✍️ Prompt personalizado</p>
        <div className="flex gap-3 items-start">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ex: Gere mercados sobre Copa do Mundo 2026, focando nos favoritos ao título..."
            rows={3}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Qtd:</span>
              <select value={qty} onChange={e => setQty(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none">
                {[3, 5, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button onClick={() => generate()} disabled={generating || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 whitespace-nowrap">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Gerando...' : 'Gerar'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {generating && (
        <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
          <div className="flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">IA gerando {qty} mercados preditivos...</p>
        </div>
      )}

      {/* Mercados gerados */}
      {markets.length > 0 && !generating && (
        <div className="space-y-4">
          {/* Ações em massa */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {markets.length} mercados gerados
                  {savedCount > 0 && <span className="text-primary ml-2">({savedCount} salvos)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{selectedCount} selecionados para salvar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMarkets([])} className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 hover:text-foreground transition-colors">
                Limpar
              </button>
              <button onClick={() => generate()} disabled={generating}
                className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Regerar
              </button>
              {!allSaved && (
                <button onClick={saveAll} disabled={savingAll || selectedCount === 0}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  {savingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar {selectedCount > 0 ? selectedCount : ''} selecionados
                </button>
              )}
              {allSaved && (
                <Link href="/mercados" className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
                  <CheckCircle className="h-4 w-4" /> Ver mercados →
                </Link>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="grid gap-3">
            {markets.map((market, idx) => (
              <div key={idx} className={`rounded-2xl border p-5 transition-all ${
                market.saved ? 'border-green-500/30 bg-green-500/5' :
                market.selected ? 'border-primary/20 bg-card' : 'border-border bg-card/50 opacity-60'
              }`}>
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => !market.saved && setMarkets(prev => prev.map((m, i) => i === idx ? { ...m, selected: !m.selected } : m))}
                    disabled={market.saved}
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                      market.saved ? 'border-green-500 bg-green-500' : market.selected ? 'border-primary bg-primary' : 'border-border'
                    }`}
                  >
                    {(market.saved || market.selected) && <span className="text-white text-xs">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{market.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{market.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">{market.category}</span>
                        <span className="text-[10px] text-muted-foreground">📅 {market.closes_at_days}d</span>
                        {market.saved ? (
                          <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" /> Salvo
                          </span>
                        ) : (
                          <button onClick={() => saveMarket(idx)} disabled={market.saving || !market.selected}
                            className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5 hover:bg-primary/30 disabled:opacity-50 transition-colors">
                            {market.saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5" />}
                            Salvar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Opções */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {market.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5">
                          <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground">{Math.round(opt.probability * 100)}%</span>
                          <span className="text-[10px] text-primary font-bold">{Number(opt.odds).toFixed(2)}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
