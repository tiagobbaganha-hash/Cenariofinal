'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { Sparkles, Loader2, Save, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface GeneratedMarket {
  title: string
  description: string
  category: string
  options: { label: string; option_key: string; probability: number; odds: number }[]
  closes_at_days: number
  resolves_at_days: number
  image_prompt: string
}

export default function AiMarketPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<GeneratedMarket | null>(null)

  async function generate() {
    if (!prompt.trim()) { toast({ type: 'error', title: 'Descreva o mercado' }); return }
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/ai-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data.market)
      toast({ type: 'success', title: 'Mercado gerado pela IA!' })
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro na IA', description: err?.message })
    } finally { setGenerating(false) }
  }

  async function saveMarket() {
    if (!result) return
    setSaving(true)
    try {
      const supabase = createClient()
      const marketId = crypto.randomUUID()
      const now = new Date()
      const closesAt = new Date(now.getTime() + (result.closes_at_days || 30) * 86400000)
      const resolvesAt = new Date(now.getTime() + (result.resolves_at_days || 35) * 86400000)

      const slug = result.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36).slice(-4)

      const { error } = await supabase.from('markets').insert({
        id: marketId,
        title: result.title,
        slug,
        description: result.description,
        category: result.category,
        status: 'open',
        closes_at: closesAt.toISOString(),
        resolves_at: resolvesAt.toISOString(),
      } as any)
      if (error) throw error

      // Insert options
      const opts = result.options.map((o, i) => ({
        market_id: marketId,
        label: o.label,
        option_key: o.option_key,
        probability: o.probability,
        odds: o.odds,
        sort_order: i,
        is_active: true,
      }))
      await supabase.from('market_options').insert(opts as any)

      toast({ type: 'success', title: 'Mercado salvo com sucesso!' })
      router.push('/admin/mercados')
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro ao salvar', description: err?.message })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/mercados" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" /> Criar com IA
          </h1>
          <p className="text-muted-foreground">Descreva o mercado e a IA gera tudo automaticamente</p>
        </div>
      </div>

      {/* Prompt */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <label className="block text-sm font-medium">Descreva o mercado</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ex: Quero criar um mercado sobre quem vai ser o próximo prefeito de Alta Floresta. Os candidatos são João Silva, Maria Santos e Pedro Costa."
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border outline-none text-sm"
          />
          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Gerar com IA</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-primary/30">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-primary">Mercado Gerado</h2>
            
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Título</label>
              <input value={result.title} onChange={e => setResult({ ...result, title: e.target.value })}
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none font-medium" />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
              <textarea value={result.description} onChange={e => setResult({ ...result, description: e.target.value })}
                rows={3} className="w-full px-4 py-2 rounded-lg bg-background border border-border outline-none text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Categoria</label>
                <input value={result.category} onChange={e => setResult({ ...result, category: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Fecha em (dias)</label>
                <input type="number" value={result.closes_at_days} onChange={e => setResult({ ...result, closes_at_days: parseInt(e.target.value) || 30 })}
                  className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Opções</label>
              {result.options.map((opt, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                  <input value={opt.label} onChange={e => { const o = [...result.options]; o[i] = { ...o[i], label: e.target.value }; setResult({ ...result, options: o }) }}
                    className="h-9 px-3 rounded-lg bg-background border border-border outline-none text-sm" />
                  <input value={opt.option_key} readOnly className="h-9 px-3 rounded-lg bg-background border border-border outline-none text-sm text-muted-foreground" />
                  <input type="number" step="0.01" value={opt.probability} onChange={e => { const o = [...result.options]; o[i] = { ...o[i], probability: parseFloat(e.target.value) || 0.5 }; setResult({ ...result, options: o }) }}
                    className="h-9 px-3 rounded-lg bg-background border border-border outline-none text-sm" />
                  <input type="number" step="0.01" value={opt.odds} onChange={e => { const o = [...result.options]; o[i] = { ...o[i], odds: parseFloat(e.target.value) || 2 }; setResult({ ...result, options: o }) }}
                    className="h-9 px-3 rounded-lg bg-background border border-border outline-none text-sm" />
                </div>
              ))}
            </div>

            {result.image_prompt && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Prompt de imagem (para gerar capa)</label>
                <p className="text-xs bg-background border border-border rounded-lg p-3 text-muted-foreground">{result.image_prompt}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={generate} disabled={generating}>
                <RefreshCw className="h-4 w-4 mr-2" /> Regerar
              </Button>
              <Button className="flex-1" onClick={saveMarket} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Mercado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
