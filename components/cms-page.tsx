'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CmsPageProps {
  slug: string
  fallback?: React.ReactNode
}

export function CmsPage({ slug, fallback }: CmsPageProps) {
  const [content, setContent] = useState<{ title: string; content_md: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().from('cms_pages')
      .select('title, content_md, content')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
      .then(({ data }) => {
        if (data) {
          setContent({
            title: data.title,
            content_md: data.content_md || data.content || ('# ' + data.title)
          })
        }
        setLoading(false)
      })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  if (!content) return <>{fallback}</> || null

  // Renderizar markdown simples
  const html = content.content_md
    .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-primary">$2</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-muted-foreground">$2</li>')
    .replace(/\n\n/g, '</p><p class="text-muted-foreground mb-3">')
    .replace(/^(?!<)/gm, '')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{content.title}</h1>
        <div
          className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: `<p class="text-muted-foreground mb-3">${html}</p>` }}
        />
      </div>
    </div>
  )
}
