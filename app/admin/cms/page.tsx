'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { FileText, Save, Loader2, Eye, EyeOff } from 'lucide-react'

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
}

export default function AdminCms() {
  const { toast } = useToast()
  const [pages, setPages] = useState<CmsPage[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CmsPage | null>(null)
  const [saving, setSaving] = useState(false)

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
        content: editing.content,
        content_md: editing.content_md,
        is_published: editing.is_published,
        published: editing.is_published,
        show_in_footer: editing.show_in_footer,
        sort_order: editing.sort_order,
      }).eq('id', editing.id)
      if (error) throw error
      toast({ type: 'success', title: 'Página salva!' })
      setEditing(null)
      loadPages()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (editing) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Editar: {editing.title}</h1>
          <Button variant="outline" onClick={() => setEditing(null)}>Voltar</Button>
        </div>

        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
              className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug</label>
            <p className="text-sm text-muted-foreground px-4 py-2 rounded-lg bg-background border border-border">{editing.slug}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Conteúdo (Markdown)</label>
            <textarea
              value={editing.content_md || editing.content || ''}
              onChange={e => setEditing({ ...editing, content_md: e.target.value, content: e.target.value })}
              rows={15}
              className="w-full px-4 py-3 rounded-lg bg-background border border-border outline-none font-mono text-sm"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.is_published}
                onChange={e => setEditing({ ...editing, is_published: e.target.checked })}
                className="h-4 w-4 rounded accent-primary" />
              <span className="text-sm">Publicado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.show_in_footer}
                onChange={e => setEditing({ ...editing, show_in_footer: e.target.checked })}
                className="h-4 w-4 rounded accent-primary" />
              <span className="text-sm">Mostrar no footer</span>
            </label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CMS — Páginas</h1>
        <p className="text-muted-foreground">Editar termos, privacidade, ajuda e outras páginas</p>
      </div>

      <div className="space-y-3">
        {pages.map(page => (
          <div key={page.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/30 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{page.title}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {page.is_published || page.published ? (
                <span className="text-xs text-green-400 flex items-center gap-1"><Eye className="h-3 w-3" /> Público</span>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1"><EyeOff className="h-3 w-3" /> Rascunho</span>
              )}
              <Button size="sm" variant="outline" onClick={() => setEditing({ ...page })}>
                Editar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
