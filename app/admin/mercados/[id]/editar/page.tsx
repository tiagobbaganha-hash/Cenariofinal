'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { ArrowLeft, Save, Loader2, XCircle, Trash2, Sparkles, Image as ImageIcon, X, Plus } from 'lucide-react'

export default function EditarMercado() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const marketId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', slug: '', description: '', category: 'Política',
    status: 'open', featured: false, closes_at: '', resolves_at: '', image_url: '',
  })
  const [options, setOptions] = useState<any[]>([])
  const [influencers, setInfluencers] = useState<any[]>([])
  const [influencerId, setInfluencerId] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCoverLoading, setAiCoverLoading] = useState(false)
  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [coverPreview, setCoverPreview] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: market } = await supabase.from('markets').select('*').eq('id', marketId).single()
      if (!market) { router.push('/admin/mercados'); return }

      setForm({
        title: market.title || '',
        slug: market.slug || '',
        description: market.description || '',
        category: market.category || 'Política',
        status: market.status || 'open',
        featured: market.featured || false,
        image_url: market.image_url || '',
        closes_at: market.closes_at ? market.closes_at.slice(0, 16) : '',
        resolves_at: market.resolves_at ? market.resolves_at.slice(0, 16) : '',
      })

      const { data: opts } = await supabase
        .from('market_options').select('*').eq('market_id', marketId).order('sort_order')
      setOptions(opts || [])
      // Carregar influencers
      const infRes = await supabase.from('influencers').select('id, name').eq('is_active', true)
      setInfluencers(infRes.data || [])
      setInfluencerId((market as any).influencer_id || '')
      setLoading(false)
    }
    load()
  }, [marketId, router])

  async function handleAIGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/admin/ai-market', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiPrompt }) })
      const data = await res.json()
      if (data.market) {
        const m = data.market
        setForm(f => ({ ...f, title: m.title || f.title, description: m.description || f.description, category: m.category || f.category }))
        if (m.options?.length) setOptions(m.options.map((o: any, i: number) => ({
          id: undefined,
          label: o.label || o.name || `Opção ${i+1}`,
          option_key: o.option_key || (i === 0 ? 'yes' : i === 1 ? 'no' : `opt${i+1}`),
          odds: typeof o.odds === 'number' ? o.odds : 2.0,
          probability: typeof o.probability === 'number' ? o.probability : 0.5,
        })))
      }
    } catch (e: any) { toast({ title: 'Erro IA', description: e.message, variant: 'destructive' }) }
    finally { setAiLoading(false) }
  }

  async function handleAICover() {
    setAiCoverLoading(true)
    try {
      const fd = new FormData()
      fd.append('description', form.title)
      coverFiles.forEach((f, i) => fd.append(`image_${i}`, f))
      const res = await fetch('/api/admin/ai-cover', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.image_data_url) {
        const supabase = createClient()
        const blob = await fetch(data.image_data_url).then(r => r.blob())
        const file = new File([blob], `cover-${Date.now()}.png`, { type: 'image/png' })
        const { data: up, error: upErr } = await supabase.storage.from('market-images').upload(`covers/${file.name}`, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('market-images').getPublicUrl(up.path)
        setForm(f => ({ ...f, image_url: publicUrl }))
      }
    } catch (e: any) { toast({ title: 'Erro capa', description: e.message, variant: 'destructive' }) }
    finally { setAiCoverLoading(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('markets').update({
        title: form.title, slug: form.slug, description: form.description,
        category: form.category, status: form.status, featured: form.featured,
        closes_at: form.closes_at || null, resolves_at: form.resolves_at || null,
        image_url: form.image_url || null,
        influencer_id: influencerId || null,
      }).eq('id', marketId)
      if (error) throw error

      // Update options
      for (const opt of options) {
        await supabase.from('market_options').update({
          label: opt.label, option_key: opt.option_key,
          odds: parseFloat(opt.odds) || 1.90, probability: parseFloat(opt.probability) || 0.50,
        }).eq('id', opt.id)
      }

      toast({ type: 'success', title: 'Mercado atualizado!' })
      router.push('/admin/mercados')
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro ao salvar', description: err?.message })
    } finally { setSaving(false) }
  }

  async function handleCancel() {
    if (!confirm('Cancelar este mercado? Apostas abertas serão reembolsadas.')) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('markets').update({ status: 'canceled' }).eq('id', marketId)
      if (error) throw error
      toast({ type: 'success', title: 'Mercado cancelado' })
      router.push('/admin/mercados')
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/mercados" className="p-2 hover:bg-accent rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Editar Mercado</h1>
          <p className="text-muted-foreground text-sm">{form.title}</p>
        </div>
        {(form.status === 'open' || form.status === 'draft') && (
          <Button variant="outline" className="text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={handleCancel} disabled={saving}>
            <XCircle className="h-4 w-4 mr-2" /> Cancelar mercado
          </Button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-semibold">Informações</h2>
          <div>
            {/* IA Generate */}
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Atualizar com IA</p>
              <div className="flex gap-2">
                <input className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Descreva como quer alterar o mercado..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                <Button type="button" onClick={handleAIGenerate} disabled={aiLoading||!aiPrompt.trim()} size="sm" className="gap-1.5 flex-shrink-0">
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Gerar
                </Button>
              </div>
            </div>

            <label className="block text-sm font-medium mb-1">Título</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full h-10 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full h-10 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Imagem de capa</label>
            {form.image_url && (
              <div className="relative mb-3">
                <img src={form.image_url} className="w-full h-32 object-cover rounded-xl border border-border" />
                <button onClick={() => setForm({...form, image_url: ''})} className="absolute top-2 right-2 rounded-full bg-black/60 p-1"><X className="h-3 w-3 text-white" /></button>
              </div>
            )}
            <div className="flex gap-2 mb-2">
              {coverPreview.map((src, i) => <img key={i} src={src} className="h-12 w-12 object-cover rounded-lg border border-border" />)}
              <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border hover:border-primary/50">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files||[]).slice(0,4); setCoverFiles(files); setCoverPreview(files.map(f => URL.createObjectURL(f))) }} />
              </label>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="URL da imagem" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
              <Button type="button" onClick={handleAICover} disabled={aiCoverLoading} variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                {aiCoverLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiCoverLoading ? 'Gerando...' : 'IA'}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none">
                {['Política','Economia','Tecnologia','Cripto','Esportes','Geopolítica','Entretenimento','Geral'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none">
                <option value="draft">Rascunho</option>
                <option value="open">Aberto</option>
                <option value="closed">Fechado</option>
                <option value="resolved">Resolvido</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Encerra em</label>
              <input type="datetime-local" value={form.closes_at} onChange={e => setForm({ ...form, closes_at: e.target.value })}
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Resolve em</label>
              <input type="datetime-local" value={form.resolves_at} onChange={e => setForm({ ...form, resolves_at: e.target.value })}
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
              className="h-4 w-4 rounded accent-primary" />
            <span className="text-sm">Mercado em destaque</span>
          </label>
        </div>

        {/* Options */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-semibold">Opções</h2>
          {options.map((opt, i) => (
            <div key={opt.id || i} className="rounded-xl border border-border bg-background/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Opção {i + 1}</span>
              </div>
              <input value={opt.label || ''} onChange={e => { const n = [...options]; n[i] = { ...n[i], label: e.target.value }; setOptions(n) }}
                placeholder="Nome da opção" className="w-full h-10 px-3 rounded-lg bg-background border border-border outline-none text-sm text-foreground" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-muted-foreground mb-1">Odds</label>
                  <input type="number" step="0.01" value={opt.odds || 2} onChange={e => { const n = [...options]; n[i] = { ...n[i], odds: e.target.value }; setOptions(n) }}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border outline-none text-sm text-foreground" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-muted-foreground mb-1">Prob %</label>
                  <input type="number" step="0.01" value={opt.probability || 0.5} onChange={e => { const n = [...options]; n[i] = { ...n[i], probability: e.target.value }; setOptions(n) }}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border outline-none text-sm text-foreground" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-muted-foreground mb-1">Chave</label>
                  <select value={opt.option_key || 'yes'} onChange={e => { const n = [...options]; n[i] = { ...n[i], option_key: e.target.value }; setOptions(n) }}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border outline-none text-sm text-foreground">
                    <option value="yes">yes</option><option value="no">no</option>
              <input type="number" step="0.01" value={opt.odds} onChange={e => { const n = [...options]; n[i] = { ...n[i], odds: e.target.value }; setOptions(n) }}
                placeholder="Odds" className="h-10 px-3 rounded-lg bg-background border border-border outline-none" />
              <input type="number" step="0.01" value={opt.probability} onChange={e => { const n = [...options]; n[i] = { ...n[i], probability: e.target.value }; setOptions(n) }}
                placeholder="Prob" className="h-10 px-3 rounded-lg bg-background border border-border outline-none" />
            </div>
          ))}
        </div>

        {/* Influencer */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-3">
          <h2 className="font-semibold text-sm">Influencer associado</h2>
          <p className="text-xs text-muted-foreground">Selecione um influencer para rastrear apostas e pagar comissão</p>
          <select
            value={influencerId}
            onChange={e => setInfluencerId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-background border border-border outline-none text-sm text-foreground"
          >
            <option value="">Sem influencer</option>
            {influencers.map((inf: any) => (
              <option key={inf.id} value={inf.id}>{inf.name}</option>
            ))}
          </select>
          {influencerId && (
            <p className="text-xs text-green-400">
              ✅ {influencers.find((i: any) => i.id === influencerId)?.name} vinculado — comissão ativa
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <Link href="/admin/mercados" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Voltar</Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  )
}
