import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Clock, ChevronRight, Home } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface CMSPage {
  title: string
  content: string
  seo_title: string | null
  seo_description: string | null
}

function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm
  const headings: { id: string; text: string; level: number }[] = []
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim().replace(/^\d+\.\s*/, '')
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    if (level >= 2) headings.push({ id, text, level })
  }
  return headings
}

function estimateReadingTime(content: string): number {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

function renderMarkdown(content: string): string {
  const lines = content.split('\n')
  let html = ''
  let stepCounter = 0
  let inUl = false
  let inOl = false
  let inBlockquote = false
  let pendingUlItems: string[] = []
  let pendingOlItems: string[] = []

  function flushUl() {
    if (pendingUlItems.length === 0) return ''
    const items = pendingUlItems.map(t =>
      `<li class="flex items-start gap-2">
        <span class="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0"></span>
        <span class="text-muted-foreground leading-relaxed">${t}</span>
       </li>`
    ).join('\n')
    pendingUlItems = []
    inUl = false
    return `<ul class="space-y-2 my-4 ml-2">${items}</ul>`
  }

  function flushOl() {
    if (pendingOlItems.length === 0) return ''
    const items = pendingOlItems.map((t, i) =>
      `<li class="flex items-start gap-3">
        <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">${i + 1}</span>
        <span class="text-muted-foreground leading-relaxed">${t}</span>
       </li>`
    ).join('\n')
    pendingOlItems = []
    inOl = false
    return `<ol class="space-y-3 my-4 ml-2">${items}</ol>`
  }

  function inline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-card border border-border rounded px-1.5 py-0.5 text-xs font-mono text-primary">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline font-medium">$1</a>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Blockquote (Dica/Atenção/Info)
    if (line.startsWith('> ')) {
      if (inUl) { html += flushUl() }
      if (inOl) { html += flushOl() }
      const bqText = inline(line.slice(2))
      const isDica = /^(dica|💡|tip|nota|note|atenção)/i.test(bqText)
      const isWarn = /^(atenção|aviso|⚠️|warning)/i.test(bqText)
      const colorClass = isWarn
        ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200'
        : 'border-primary/40 bg-primary/10 text-primary'
      const icon = isWarn ? '⚠️' : '💡'
      html += `<div class="flex gap-3 rounded-xl border ${colorClass} px-4 py-3 my-4 text-sm leading-relaxed">
        <span class="flex-shrink-0">${icon}</span>
        <span>${bqText}</span>
      </div>\n`
      continue
    }

    // H1 — page title (skip, shown in hero)
    if (/^#\s/.test(line)) {
      if (inUl) html += flushUl()
      if (inOl) html += flushOl()
      continue
    }

    // H2 — numbered step or section header
    if (/^##\s/.test(line)) {
      if (inUl) html += flushUl()
      if (inOl) html += flushOl()
      const raw = line.replace(/^##\s+/, '')
      const isNumbered = /^\d+[\.\)]\s/.test(raw)
      const text = inline(raw.replace(/^\d+[\.\)]\s*/, ''))
      const id = raw.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      if (isNumbered) {
        stepCounter++
        html += `<div id="${id}" class="flex items-start gap-4 rounded-2xl border border-border bg-card/60 px-5 py-4 mt-6 mb-2 scroll-mt-24">
          <span class="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">${stepCounter}</span>
          <div class="pt-1">
            <h2 class="text-lg font-semibold text-foreground leading-snug">${text}</h2>
          </div>
        </div>\n`
      } else {
        stepCounter = 0
        html += `<h2 id="${id}" class="text-2xl font-bold text-foreground mt-10 mb-4 pl-4 border-l-4 border-primary scroll-mt-24">${text}</h2>\n`
      }
      continue
    }

    // H3 — sub-section
    if (/^###\s/.test(line)) {
      if (inUl) html += flushUl()
      if (inOl) html += flushOl()
      const raw = line.replace(/^###\s+/, '')
      const text = inline(raw)
      const id = raw.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      html += `<h3 id="${id}" class="text-lg font-semibold text-foreground mt-6 mb-3 scroll-mt-24">${text}</h3>\n`
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inUl) html += flushUl()
      if (inOl) html += flushOl()
      html += `<hr class="border-border my-8" />\n`
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      if (inOl) html += flushOl()
      inUl = true
      pendingUlItems.push(inline(line.replace(/^[-*]\s+/, '')))
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (inUl) html += flushUl()
      inOl = true
      pendingOlItems.push(inline(line.replace(/^\d+\.\s+/, '')))
      continue
    }

    // Flush lists before other content
    if (inUl) html += flushUl()
    if (inOl) html += flushOl()

    // Code block
    if (line.startsWith('```')) {
      let code = ''
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += lines[i] + '\n'
        i++
      }
      html += `<pre class="bg-card border border-border rounded-xl p-4 overflow-x-auto my-6 text-sm font-mono text-foreground">${code.trim()}</pre>\n`
      continue
    }

    // Empty line
    if (line.trim() === '') {
      continue
    }

    // Paragraph
    html += `<p class="text-muted-foreground leading-relaxed my-3">${inline(line)}</p>\n`
  }

  // Flush any remaining lists
  html += flushUl()
  html += flushOl()

  return html
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient()
  const { data } = await supabase
    .from('v_front_cms_pages')
    .select('title, seo_title, seo_description')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Página não encontrada' }
  return {
    title: data.seo_title || data.title,
    description: data.seo_description || undefined,
  }
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data, error } = await supabase
    .from('v_front_cms_pages')
    .select('title, content, seo_title, seo_description')
    .eq('slug', slug)
    .single()

  if (error || !data) notFound()

  const page = data as CMSPage
  const headings = extractHeadings(page.content)
  const readingTime = estimateReadingTime(page.content)
  const htmlContent = renderMarkdown(page.content)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-card/80 to-background">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <a href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" /> Início
            </a>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{page.title}</span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Guia Completo
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
            {page.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{readingTime} min de leitura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-10">
          {/* Sidebar TOC — desktop */}
          {headings.length > 2 && (
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-24">
                <div className="rounded-xl border border-border bg-card/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Neste artigo
                  </p>
                  <ul className="space-y-1">
                    {headings.map(h => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className={`block text-sm py-0.5 transition-colors hover:text-primary ${
                            h.level === 2
                              ? 'text-muted-foreground font-medium'
                              : 'text-muted-foreground/60 pl-3 text-xs'
                          }`}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          )}

          {/* Article */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Mobile TOC */}
            {headings.length > 2 && (
              <details className="lg:hidden mb-6 rounded-xl border border-border bg-card/50">
                <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-foreground select-none">
                  ▶ Índice do artigo
                </summary>
                <nav className="px-4 pb-4 pt-1">
                  <ul className="space-y-1">
                    {headings.map(h => (
                      <li key={h.id}>
                        <a href={`#${h.id}`} className="block text-sm text-muted-foreground hover:text-primary py-0.5 transition-colors">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            )}

            {/* Content */}
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

            {/* Feedback */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="rounded-2xl border border-border bg-card/50 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">Este artigo foi útil?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Seu feedback nos ajuda a melhorar</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:border-primary hover:text-primary text-sm text-muted-foreground transition-colors">
                    👍 Sim
                  </a>
                  <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:border-destructive hover:text-destructive text-sm text-muted-foreground transition-colors">
                    👎 Não
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
