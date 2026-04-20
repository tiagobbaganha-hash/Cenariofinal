'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import { FileText, Save, Loader2, Eye, EyeOff, Plus, Trash2, ExternalLink, X } from 'lucide-react'

interface CmsPage {
  id: string
  slug: string
  title: string
  content: string | null
  content_md: string | null
  is_published: boolean
  published: boolean
  sort_order: number | null
  show_in_footer: boolean
  seo_title?: string | null
  seo_description?: string | null
}

const CATEGORIES = [
  { label: 'Legal', slugs: ['termos', 'privacidade', 'riscos', 'regras', 'legalidade'] },
  { label: 'Aprenda', slugs: ['o-que-e', 'como-funciona', 'sobre', 'ajuda'] },
  { label: 'Outras', slugs: [] },
]

export default function AdminCms() {
  const { toast } = useToast()
  const [pages, setPages] = useState<CmsPage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CmsPage | null>(null)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPage, setNewPage] = useState({ slug: '', title: '' })
  const [activeTab, setActiveTab] = useState<'editor' | 'seo' | 'settings'>('editor')

  useEffect(() => { loadPages() }, [])

  async function loadPages() {
    const supabase = createClient()
    const { data } = await supabase.from('cms_pages').select('*').order('sort_order')
    setPages(data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('cms_pages').update({
        title: editing.title,
        content: editing.content_md || editing.content,
        content_md: editing.content_md,
        is_published: editing.is_published,
        published: editing.is_published,
        show_in_footer: editing.show_in_footer,
        sort_order: editing.sort_order,
        seo_title: editing.seo_title,
        seo_description: editing.seo_description,
      }).eq('id', editing.id)
      if (error) throw error
      toast({ type: 'success', title: '✅ Página salva!' })
      loadPages()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSaving(false) }
  }

  async function handleCreate() {
    if (!newPage.slug || !newPage.title) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('cms_pages').insert({
        slug: newPage.slug.toLowerCase().replace(/\s+/g, '-'),
        title: newPage.title,
        content: `## ${newPage.title}\n\nConteúdo da página...`,
        content_md: `## ${newPage.title}\n\nConteúdo da página...`,
        is_published: false,
        published: false,
        show_in_footer: false,
        sort_order: pages.length + 1,
      })
      if (error) throw error
      toast({ type: 'success', title: '✅ Página criada!' })
      setCreating(false)
      setNewPage({ slug: '', title: '' })
      loadPages()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Deletar "${title}"?`)) return
    const supabase = createClient()
    await supabase.from('cms_pages').delete().eq('id', id)
    setPages(prev => prev.filter(p => p.id !== id))
    if (editing?.id === id) setEditing(null)
    toast({ type: 'success', title: 'Página removida' })
  }

  async function togglePublish(page: CmsPage) {
    const supabase = createClient()
    await supabase.from('cms_pages').update({ is_published: !page.is_published, published: !page.is_published }).eq('id', page.id)
    setPages(prev => prev.map(p => p.id === page.id ? { ...p, is_published: !p.is_published, published: !p.is_published } : p))
    if (editing?.id === page.id) setEditing(e => e ? { ...e, is_published: !e.is_published } : e)
  }

  // Agrupar páginas por categoria
  function getCategory(slug: string) {
    for (const cat of CATEGORIES) {
      if (cat.slugs.includes(slug)) return cat.label
    }
    return 'Outras'
  }

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    pages: pages.filter(p => getCategory(p.slug) === cat.label)
  })).filter(c => c.pages.length > 0)

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar — lista de páginas */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Páginas CMS</span>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Nova
          </button>
        </div>

        {/* Form nova página */}
        {creating && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <input
              placeholder="slug (ex: sobre-nos)"
              value={newPage.slug}
              onChange={e => setNewPage(n => ({ ...n, slug: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Título da página"
              value={newPage.title}
              onChange={e => setNewPage(n => ({ ...n, title: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-1">
              <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-lg bg-primary text-primary-foreground text-xs py-1.5 hover:bg-primary/90 disabled:opacity-50">
                {saving ? '...' : 'Criar'}
              </button>
              <button onClick={() => setCreating(false)} className="flex-1 rounded-lg border border-border text-xs py-1.5 text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Páginas agrupadas */}
        {grouped.map(cat => (
          <div key={cat.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5 px-1">{cat.label}</p>
            {cat.pages.map(page => (
              <div key={page.id}
                onClick={() => setEditing(page)}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-colors mb-1 ${
                  editing?.id === page.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent/50 border border-transparent'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{page.title}</p>
                  <p className="text-[10px] text-muted-foreground">/p/{page.slug}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); togglePublish(page) }}
                    className={`p-1 rounded-md transition-colors ${page.is_published ? 'text-green-400 hover:bg-green-500/10' : 'text-muted-foreground hover:bg-accent'}`}
                    title={page.is_published ? 'Publicado' : 'Rascunho'}
                  >
                    {page.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(page.id, page.title) }}
                    className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Editor */}
      {editing ? (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Header do editor */}
          <div className="flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex-1">
              <input
                value={editing.title}
                onChange={e => setEditing(ed => ed ? { ...ed, title: e.target.value } : ed)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-base font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a href={`/p/${editing.slug}`} target="_blank"
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-3.5 w-3.5" /> Ver
              </a>
              <button
                onClick={() => setEditing(null)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 flex-shrink-0 w-fit">
            {(['editor', 'seo', 'settings'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`rounded-lg px-4 py-1.5 text-xs font-medium capitalize transition-colors ${activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {t === 'editor' ? 'Conteúdo' : t === 'seo' ? 'SEO' : 'Configurações'}
              </button>
            ))}
          </div>

          {/* Tab: Conteúdo */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex gap-4 overflow-hidden">
              <textarea
                value={editing.content_md || editing.content || ''}
                onChange={e => setEditing(ed => ed ? { ...ed, content_md: e.target.value, content: e.target.value } : ed)}
                className="flex-1 rounded-2xl border border-border bg-card px-5 py-4 text-sm font-mono text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                placeholder="Escreva o conteúdo em Markdown..."
                spellCheck={false}
              />
            </div>
          )}

          {/* Tab: SEO */}
          {activeTab === 'seo' && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Título SEO</label>
                <input
                  value={editing.seo_title || ''}
                  onChange={e => setEditing(ed => ed ? { ...ed, seo_title: e.target.value } : ed)}
                  placeholder={editing.title}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{(editing.seo_title || '').length}/60 chars</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição SEO</label>
                <textarea
                  value={editing.seo_description || ''}
                  onChange={e => setEditing(ed => ed ? { ...ed, seo_description: e.target.value } : ed)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{(editing.seo_description || '').length}/160 chars</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">URL da página</label>
                <p className="rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground font-mono">
                  /p/{editing.slug}
                </p>
              </div>
            </div>
          )}

          {/* Tab: Configurações */}
          {activeTab === 'settings' && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEditing(ed => ed ? { ...ed, is_published: !ed.is_published } : ed)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editing.is_published ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Publicado</p>
                  <p className="text-xs text-muted-foreground">Visível publicamente em /p/{editing.slug}</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEditing(ed => ed ? { ...ed, show_in_footer: !ed.show_in_footer } : ed)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${editing.show_in_footer ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.show_in_footer ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Mostrar no footer</p>
                  <p className="text-xs text-muted-foreground">Aparece na seção Legal do rodapé</p>
                </div>
              </label>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordem</label>
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={e => setEditing(ed => ed ? { ...ed, sort_order: parseInt(e.target.value) } : ed)}
                  className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-border">
          <div className="text-center space-y-2">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Selecione uma página para editar</p>
            <button onClick={() => setCreating(true)} className="text-xs text-primary hover:underline">
              + Criar nova página
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
