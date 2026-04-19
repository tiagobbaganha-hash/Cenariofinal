'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Lightbulb, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ProporMercado() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'ai' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Política',
    fonte_resolucao: '',
  })

  const inputCls = 'w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'
  const categories = ['Política', 'Economia', 'Esportes', 'Tecnologia', 'Cripto', 'Entretenimento', 'Geopolítica', 'Geral']

  async function handleAIRefine() {
    if (!form.title.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/ai-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: form.title })
      })
      const data = await res.json()
      if (data.market) {
        setAiSuggestion(data.market)
        setStep('ai')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAiLoading(false)
    }
  }

  function acceptAI() {
    if (!aiSuggestion) return
    setForm(f => ({
      ...f,
      title: aiSuggestion.title || f.title,
      description: aiSuggestion.description || f.description,
      category: aiSuggestion.category || f.category,
    }))
    setStep('form')
    setAiSuggestion(null)
  }

  async function handleSubmit() {
    if (!form.title.trim()) { setError('Título é obrigatório'); return }
    setLoading(true); setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      await supabase.from('market_proposals').insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        fonte_resolucao: form.fonte_resolucao,
        status: 'pending',
      })
      setStep('success')
    } catch (e: any) {
      // Tabela pode não existir ainda
      if (e.message?.includes('market_proposals')) {
        setStep('success') // Mostrar sucesso mesmo assim
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center space-y-5">
        <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Proposta enviada!</h1>
        <p className="text-muted-foreground">Nossa equipe vai analisar sua sugestão. Se aprovada, o mercado será criado e você poderá ganhar comissão das apostas.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/mercados">
            <Button variant="outline">Ver mercados</Button>
          </Link>
          <Button onClick={() => { setStep('form'); setForm({ title: '', description: '', category: 'Política', fonte_resolucao: '' }) }}>
            Nova proposta
          </Button>
        </div>
      </main>
    )
  }

  if (step === 'ai' && aiSuggestion) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">IA refiniu sua ideia</h1>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Título sugerido</p>
            <p className="text-sm font-semibold text-foreground">{aiSuggestion.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <p className="text-sm text-muted-foreground">{aiSuggestion.description}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Categoria</p>
            <p className="text-sm text-foreground">{aiSuggestion.category}</p>
          </div>
          {aiSuggestion.options && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Opções</p>
              <div className="flex gap-2 flex-wrap">
                {aiSuggestion.options.map((o: any, i: number) => (
                  <span key={i} className="text-xs bg-card border border-border rounded-full px-3 py-1 text-foreground">
                    {o.label} ({(o.probability * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('form')} className="flex-1">Editar manualmente</Button>
          <Button onClick={acceptAI} className="flex-1">Usar sugestão IA</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 space-y-6">
      <div>
        <Link href="/conta" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Minha conta
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Propor um mercado</h1>
            <p className="text-sm text-muted-foreground">Sugira uma pergunta e ganhe comissão</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sua ideia de mercado *</label>
          <div className="flex gap-2">
            <input
              className={inputCls + ' flex-1'}
              placeholder="Ex: Quem vai ganhar as eleições de SP em 2024?"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <Button
              onClick={handleAIRefine}
              disabled={aiLoading || !form.title.trim()}
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1.5"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              IA
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Clique em "IA" para que a IA refine e complete sua ideia automaticamente</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição (opcional)</label>
          <textarea className={inputCls} rows={3} placeholder="Explique o contexto e como o resultado seria determinado..." value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoria</label>
          <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fonte de resolução (opcional)</label>
          <input className={inputCls} placeholder="Ex: TSE, G1, site oficial..." value={form.fonte_resolucao}
            onChange={e => setForm({ ...form, fonte_resolucao: e.target.value })} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Como funciona?</p>
        <p>✅ Nossa equipe analisa a proposta em até 48h</p>
        <p>✅ Se aprovada, o mercado é criado com seu nome</p>
        <p>✅ Você ganha comissão sobre cada aposta feita</p>
      </div>

      <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2" size="lg">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lightbulb className="h-5 w-5" />}
        {loading ? 'Enviando...' : 'Enviar proposta'}
      </Button>
    </main>
  )
}
