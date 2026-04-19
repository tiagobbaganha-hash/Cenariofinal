import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  
  const { data: page } = await supabase
    .from('v_front_cms_pages')
    .select('title, content, seo_title, seo_description')
    .eq('slug', params.slug)
    .single()

  if (!page) return notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{(page as any).title}</h1>
      <div className="mt-8 prose prose-invert prose-sm max-w-none 
        prose-headings:text-foreground prose-p:text-muted-foreground 
        prose-a:text-primary prose-strong:text-foreground
        prose-li:text-muted-foreground">
        <div dangerouslySetInnerHTML={{ 
          __html: ((page as any).content || '')
            .replace(/^## /gm, '<h2>')
            .replace(/^### /gm, '<h3>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/,'<p>').replace(/$/,'</p>')
        }} />
      </div>
    </div>
  )
}
