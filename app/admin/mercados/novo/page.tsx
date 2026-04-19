'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, RefreshCw, Plus, Trash2 } from 'lucide-react'

export default function NovoMercado() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'politica',
    status: 'draft',
    featured: false,
    closes_at: '',
    resolves_at: '',
  })

  const [options, setOptions] = useState([
    { label: 'SIM', option_key: 'yes' },
    { label: 'NÃO', option_key: 'no' },
  ])

  function generateSlug(title: string) {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const suffix = Date.now().toString(36).slice(-4)
    return `${base}-${suffix}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()

    try {
      // Generate ID client-side to avoid .select() RLS issues
      const marketId = crypto.randomUUID()
      
      // Create market
      const { error: marketError } = await supabase
        .from('markets')
        .insert({
          id: marketId,
          title: form.title,
          slug: form.slug || generateSlug(form.title),
          description: form.description,
          category: form.category,
          status: form.status,
          featured: form.featured,
          closes_at: form.closes_at || null,
          resolves_at: form.resolves_at || null,
        } as any)

      if (marketError) throw marketError

      // Create options using the known ID
      if (options.length > 0) {
        const optionsToInsert = options.map((opt: any, idx: number) => ({
          market_id: marketId,
          label: opt.label,
          option_key: opt.option_key || 'yes',
          odds: parseFloat(opt.odds) || 1.90,
          probability: parseFloat(opt.probability) || 0.50,
          sort_order: idx,
          is_active: true,
        }))

        const { error: optError } = await supabase.from('market_options').insert(optionsToInsert as any)
        if (optError) console.error('Erro nas opções:', optError.message)
      }

      router.push('/admin/mercados')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar mercado')
      setSaving(false)
    }
  }

  function addOption() {
    setOptions([...options, { label: '', option_key: 'yes' }])
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/mercados" className="p-2 hover:bg-accent rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Mercado</h1>
          <p className="text-muted-foreground">Criar um novo mercado preditivo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-start justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-300 font-bold">✕</button>
          </div>
        )}

        <div className="rounded-xl bg-card border border-border p-6 space-y-6">
          <h2 className="text-lg font-bold">Informacoes Basicas</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Titulo *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
              placeholder="Ex: Lula sera reeleito em 2026?"
              className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="lula-reeleito-2026"
              className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descreva o mercado..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary outline-none resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none"
              >
                <option value="politica">Politica</option>
                <option value="esportes">Esportes</option>
                <option value="economia">Economia</option>
                <option value="cultura">Cultura</option>
                <option value="tecnologia">Tecnologia</option>
                <option value="entretenimento">Entretenimento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none"
              >
                <option value="draft">Rascunho</option>
                <option value="open">Aberto</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Encerra em</label>
              <input
                type="datetime-local"
                value={form.closes_at}
                onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Resolve em</label>
              <input
                type="datetime-local"
                value={form.resolves_at}
                onChange={(e) => setForm({ ...form, resolves_at: e.target.value })}
                className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-5 h-5 rounded border-border"
            />
            <span className="font-medium">Mercado em destaque</span>
          </label>
        </div>

        <div className="rounded-xl bg-card border border-border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Opcoes</h2>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </div>

          {options.map((option, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => {
                    const newOpts = [...options]
                    newOpts[index] = { ...newOpts[index], label: e.target.value }
                    setOptions(newOpts)
                  }}
                  placeholder="Label (ex: SIM, NÃO)"
                  className="w-full h-10 px-4 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={option.option_key}
                    onChange={(e) => {
                      const newOpts = [...options]
                      newOpts[index] = { ...newOpts[index], option_key: e.target.value }
                      setOptions(newOpts)
                    }}
                    className="h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                  >
                    <option value="yes">yes (SIM)</option>
                    <option value="no">no (NÃO)</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={(option as any).odds ?? 1.90}
                    onChange={(e) => {
                      const newOpts = [...options]
                      newOpts[index] = { ...newOpts[index], odds: parseFloat(e.target.value) || 1.90 } as any
                      setOptions(newOpts)
                    }}
                    placeholder="Odds (ex: 1.90)"
                    className="h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={(option as any).probability ?? 0.50}
                    onChange={(e) => {
                      const newOpts = [...options]
                      newOpts[index] = { ...newOpts[index], probability: parseFloat(e.target.value) || 0.50 } as any
                      setOptions(newOpts)
                    }}
                    placeholder="Prob (ex: 0.50)"
                    className="h-10 px-3 rounded-lg bg-background border border-border focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
              {options.length > 2 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(index)} className="text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link href="/admin/mercados" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="flex-1 glow-green" disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Criar Mercado
          </Button>
        </div>
      </form>
    </div>
  )
}
