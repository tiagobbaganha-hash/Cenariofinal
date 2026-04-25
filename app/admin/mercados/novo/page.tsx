'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Plus, Trash2, Sparkles, Image as ImageIcon, Loader2, X } from 'lucide-react'

export default function NovoMercado() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // IA states
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCoverLoading, setAiCoverLoading] = useState(false)
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [coverPreview, setCoverPreview] = useState<string[]>([])

  // Pré-preencher com dados de proposta se vier de uma sugestão
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const title = params.get('title')
      const category = params.get('category')
      const description = params.get('description')
      const proposal_id = params.get('from_proposal')
      if (title) setForm(f => ({ ...f, title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) }))
      if (category) setForm(f => ({ ...f, category }))
      if (description) setForm(f => ({ ...f, description }))
      if (proposal_id) setProposalId(proposal_id)
    }
  }, [])

  const [proposalId, setProposalId] = useState('')
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'Política',
    status: 'draft',
    market_type: 'standard',
    featured: false,
    closes_at: '',
    resolves_at: '',
    image_url: '',
    influencer_id: '',
    platform_commission: '5',
  })

  const [influencers, setInfluencers] = useState<any[]>([])
  useState(() => {
    const supabase = createClient()
    supabase.from('influencers').select('id, name').eq('is_active', true)
      .then(({ data }) => setInfluencers(data || []))
  })

  const [options, setOptions] = useState([
    { label: 'SIM', option_key: 'yes', probability: 0.5, odds: 2.0 },
    { label: 'NÃO', option_key: 'no', probability: 0.5, odds: 2.0 },
  ])

  function generateSlug(title: string) {
    const base = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `${base}-${Date.now().toString(36).slice(-4)}`
  }

  // IA — gerar mercado completo
  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ai-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const m = data.market
      setForm(f => ({
        ...f,
        title: m.title || f.title,
        slug: generateSlug(m.title || f.title),
        description: m.description || f.description,
        category: m.category || f.category,
        closes_at: m.closes_at_days ? new Date(Date.now() + m.closes_at_days * 86400000).toISOString().slice(0, 16) : f.closes_at,
        resolves_at: m.resolves_at_days ? new Date(Date.now() + m.resolves_at_days * 86400000).toISOString().slice(0, 16) : f.resolves_at,
      }))
      if (m.options?.length) {
        setOptions(m.options.map((o: any, i: number) => ({
          label: o.label || o.name || `Opção ${i + 1}`,
          option_key: o.option_key || (i === 0 ? 'yes' : i === 1 ? 'no' : `opt${i + 1}`),
          probability: typeof o.probability === 'number' ? o.probability : 0.5,
          odds: typeof o.odds === 'number' ? o.odds : parseFloat((1 / (typeof o.probability === 'number' ? o.probability : 0.5)).toFixed(2)),
        })))
      }
      // Auto-gerar capa se tiver prompt de imagem
      if (m.image_prompt) {
        setAiPrompt(m.image_prompt)
      }
    } catch (e: any) {
      setError('Erro IA: ' + e.message)
    } finally {
      setAiLoading(false)
    }
  }

  // IA — gerar capa com Gemini Imagen
  async function handleAICover() {
    setAiCoverLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('description', form.title || aiPrompt)
      coverFiles.forEach((f, i) => fd.append(`image_${i}`, f))

      const res = await fetch('/api/admin/ai-cover', { method: 'POST', body: fd })
      const data = await res.json()

      if (data.image_data_url) {
        // Upload para Supabase Storage
        const supabase = createClient()
        const blob = await fetch(data.image_data_url).then(r => r.blob())
        const file = new File([blob], `cover-${Date.now()}.png`, { type: 'image/png' })
        const { data: uploaded, error: upErr } = await supabase.storage.from('market-images').upload(`covers/${file.name}`, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('market-images').getPublicUrl(uploaded.path)
        setForm(f => ({ ...f, image_url: publicUrl }))
      } else if (data.fallback) {
        setError(`Imagen indisponível. Prompt gerado: ${data.prompt}`)
      }
    } catch (e: any) {
      setError('Erro capa: ' + e.message)
    } finally {
      setAiCoverLoading(false)
    }
  }

  function handleCoverFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 4)
    setCoverFiles(files)
    setCoverPreview(files.map(f => URL.createObjectURL(f)))
  }

  async function handleSave() {
    if (!form.title || !form.slug) { setError('Título e slug são obrigatórios'); return }
    setSaving(true); setError('')
    try {
      const supabase = createClient()
      const { data: market, error: mErr } = await supabase.from('markets').insert({
        title: form.title, slug: form.slug, description: form.description,
        category: form.category, status: form.status, featured: form.featured,
        closes_at: form.closes_at || null, resolves_at: form.resolves_at || null,
        image_url: form.image_url || null,
        market_type: form.market_type || 'standard',
        ...(form.influencer_id ? { influencer_id: form.influencer_id } : {}),
        platform_commission: parseFloat(form.platform_commission) || 5,
      }).select().single()
      if (mErr) throw mErr

      const opts = options.map((o, i) => ({
        market_id: (market as any).id, label: o.label, option_key: o.option_key,
        probability: o.probability, odds: o.odds, sort_order: i, is_active: true
      }))
      const { error: oErr } = await supabase.from('market_options').insert(opts as any)
      if (oErr) throw oErr

      router.push('/admin/mercados')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const categories = ['Política', 'Economia', 'Esportes', 'Tecnologia', 'Cripto', 'Entretenimento', 'Geopolítica', 'Geral']
  const inputCls = 'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/mercados" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Mercados
        </Link>
        <h1 className="text-lg font-bold">Novo Mercado</h1>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* BLOCO IA — Gerar mercado */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Gerar com IA</p>
          <span className="text-xs text-muted-foreground">— descreva o mercado e a IA preenche tudo</span>
        </div>
        <div className="flex gap-2">
          <input
            className={inputCls + ' flex-1'}
            placeholder="Ex: Eleições municipais de São Paulo 2024, quem vai ganhar?"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
          />
          <Button onClick={handleAIGenerate} disabled={aiLoading || !aiPrompt.trim()} size="sm" className="gap-2 flex-shrink-0">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar
          </Button>
        </div>
      </div>

      {/* BLOCO Capa IA */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Capa do Mercado</p>
        </div>

        {/* Preview da capa gerada */}
        {form.image_url && (
          <div className="relative">
            <img src={form.image_url} alt="Capa" className="w-full h-40 object-cover rounded-xl" />
            <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="absolute top-2 right-2 rounded-full bg-black/60 p-1">
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        )}

        {/* Upload de fotos de referência */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Fotos de referência (opcional) — até 4 imagens</p>
          <div className="flex gap-2 flex-wrap">
            {coverPreview.map((src, i) => (
              <img key={i} src={src} className="h-16 w-16 object-cover rounded-lg border border-border" />
            ))}
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleCoverFiles} />
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            className={inputCls + ' flex-1'}
            placeholder="URL da imagem (ou gere com IA)"
            value={form.image_url}
            onChange={e => setForm({ ...form, image_url: e.target.value })}
          />
          <Button
            onClick={handleAICover}
            disabled={aiCoverLoading}
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
          >
            {aiCoverLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiCoverLoading ? 'Gerando...' : 'Gerar capa'}
          </Button>
        </div>
      </div>

      {/* Dados básicos */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Dados do mercado</p>

        {/* Tipo de mercado */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo de Mercado</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'standard', label: '📊 Normal', desc: 'Resolução manual' },
              { id: 'rapid', label: '⚡ Rápido', desc: 'Auto via preço de ativo' },
              { id: 'live', label: '🔴 Ao Vivo', desc: 'Evento em andamento' },
            ] as const).map(t => (
              <button key={t.id} type="button"
                onClick={() => setForm(f => ({ ...f, market_type: t.id }))}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  form.market_type === t.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                }`}>
                <p className="font-semibold text-xs">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>

          {/* Campos específicos para Rápido */}
          {form.market_type === 'rapid' && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-yellow-400">⚡ Mercado Rápido</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Ativo</label>
                  <select className={inputCls} value={form.rapid_asset} onChange={e => setForm({...form, rapid_asset: e.target.value})}>
                    {['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX'].map(a => <option key={a} value={a}>{a}/BRL</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Duração</label>
                  <select className={inputCls} value={form.rapid_duration} onChange={e => setForm({...form, rapid_duration: e.target.value})}>
                    {[['2','2 min'],['5','5 min'],['10','10 min'],['15','15 min'],['30','30 min']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
          {form.market_type === 'live' && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-red-400">🔴 Mercado Ao Vivo</p>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Nome do Evento *</label>
                <input className={inputCls} value={form.live_event_name} onChange={e => setForm({...form, live_event_name: e.target.value})} placeholder="Ex: Brasil x Argentina, BBB Paredão..." />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Contexto atual (opcional)</label>
                <input className={inputCls} value={form.live_context} onChange={e => setForm({...form, live_context: e.target.value})} placeholder="Ex: 2° tempo, 67 min, 1x0" />
              </div>
            </div>
          )}

          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Título *</label>
          <input className={inputCls} placeholder="Pergunta do mercado?" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Slug</label>
          <input className={inputCls} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição</label>
          <textarea className={inputCls} rows={3} placeholder="Explique o mercado, critérios de resolução..." value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Categoria</label>
            <select className={inputCls} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
            <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Rascunho</option>
              <option value="open">Aberto</option>
              <option value="closed">Fechado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha em</label>
            <input type="datetime-local" className={inputCls} value={form.closes_at}
              onChange={e => setForm({ ...form, closes_at: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Resolve em</label>
            <input type="datetime-local" className={inputCls} value={form.resolves_at}
              onChange={e => setForm({ ...form, resolves_at: e.target.value })} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="featured" checked={form.featured}
            onChange={e => setForm({ ...form, featured: e.target.checked })}
            className="h-4 w-4 accent-primary" />
          <label htmlFor="featured" className="text-sm text-muted-foreground">Destaque na home</label>
        </div>
      </div>

      {/* Opções */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Opções de aposta</p>
          <button onClick={() => setOptions(o => [...o, { label: '', option_key: `opt${o.length+1}`, probability: 0.5, odds: 2.0 }])}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar opção
          </button>
        </div>
        {options.map((opt, i) => (
          <div key={i} className="rounded-xl border border-border bg-background/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Opção {i + 1}</span>
              {options.length > 2 && (
                <button onClick={() => setOptions(o => o.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input className={inputCls} placeholder="Nome da opção (ex: SIM, Lula, São Paulo)" value={opt.label}
              onChange={e => setOptions(o => o.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-muted-foreground mb-1">Probabilidade %</label>
                <input className={inputCls} type="number" min="0" max="100" step="1"
                  value={Math.round(opt.probability * 100)}
                  onChange={e => {
                    const pct = Math.min(100, Math.max(0, Number(e.target.value))) / 100
                    setOptions(o => o.map((x, j) => j === i ? { ...x, probability: pct, odds: pct > 0 ? parseFloat((1/pct).toFixed(2)) : 0 } : x))
                  }} />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-muted-foreground mb-1">Odds</label>
                <input className={inputCls} type="number" min="1" step="0.01" value={opt.odds}
                  onChange={e => setOptions(o => o.map((x, j) => j === i ? { ...x, odds: parseFloat(e.target.value) || 2 } : x))} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comissão da plataforma */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Comissão da plataforma</p>
        <p className="text-xs text-muted-foreground">Percentual retido pela plataforma sobre cada aposta neste mercado</p>
        <div className="relative">
          <input
            className={inputCls + ' pr-8'}
            type="number" min="0" max="20" step="0.5"
            value={form.platform_commission}
            onChange={e => setForm({ ...form, platform_commission: e.target.value })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground/60">Padrão: 5% · Máximo recomendado: 10%</p>
      </div>

      {/* Influencer */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Influencer associado</p>
        <p className="text-xs text-muted-foreground">Associe um influencer para rastrear conversões e pagar comissão</p>
        <select className={inputCls} value={form.influencer_id} onChange={e => setForm({ ...form, influencer_id: e.target.value })}>
          <option value="">Sem influencer</option>
          {influencers.map((inf: any) => (
            <option key={inf.id} value={inf.id}>{inf.name}</option>
          ))}
        </select>
        {influencers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum influencer cadastrado. <Link href="/admin/influencers" className="text-primary hover:underline">Cadastrar →</Link>
          </p>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? 'Salvando...' : 'Criar Mercado'}
      </Button>
    </div>
  )
}
