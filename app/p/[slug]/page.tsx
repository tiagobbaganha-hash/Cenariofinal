import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ThumbsUp, ThumbsDown, Clock, ChevronRight } from 'lucide-react'

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

// Extract headings from markdown content
function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: { id: string; text: string; level: number }[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    headings.push({ id, text, level })
  }

  return headings
}

// Estimate reading time (200 words per minute)
function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

// Convert markdown to styled HTML
function renderMarkdown(content: string): string {
  let html = content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings with IDs
  html = html.replace(/^### (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return `<h3 id="${id}" class="text-xl font-semibold text-foreground mt-8 mb-4 scroll-mt-24">${text}</h3>`
  })

  html = html.replace(/^## (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
    return `<h2 id="${id}" class="text-2xl font-bold text-foreground mt-10 mb-4 pl-4 border-l-4 border-primary scroll-mt-24">${text}</h2>`
  })

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-card border border-border rounded-lg p-4 overflow-x-auto my-6"><code class="text-sm text-foreground font-mono">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-card border border-border rounded px-1.5 py-0.5 text-sm font-mono text-primary">$1</code>')

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="flex items-start gap-2 ml-4"><span class="text-primary mt-2">•</span><span>$1</span></li>')
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="space-y-2 my-4">$&</ul>')

  // Ordered lists
  let listCounter = 0
  html = html.replace(/^\d+\. (.+)$/gm, () => {
    listCounter++
    return `<li class="flex items-start gap-2 ml-4"><span class="text-primary font-semibold">${listCounter}.</span><span>$1</span></li>`
  })

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')

  // Paragraphs
  html = html.replace(/^(?!<[hupola]|<li|<code|<pre)(.+)$/gm, '<p class="text-muted-foreground leading-relaxed my-4">$1</p>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-border my-8" />')

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '')

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

  if (!data) {
    return { title: 'Página não encontrada' }
  }

  return {
    title: data.seo_title || data.title,
    description: data.seo_description || undefined,
  }
}

// Feedback section (static - interactivity pode ser adicionada depois via 'use client')
function FeedbackButtons() {
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground">Este artigo foi útil?</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sim</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card">
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Não</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createClient()

  const { data, error } = await supabase
    .from('v_front_cms_pages')
    .select('title, content, seo_title, seo_description')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    notFound()
  }

  const page = data as CMSPage
  const headings = extractHeadings(page.content)
  const readingTime = estimateReadingTime(page.content)
  const htmlContent = renderMarkdown(page.content)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <a href="/" className="hover:text-primary transition-colors">Início</a>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{page.title}</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {page.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min de leitura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Table of Contents - Desktop Sidebar */}
          {headings.length > 0 && (
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <nav className="p-4 bg-card border border-border rounded-xl">
                  <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                    Neste artigo
                  </h4>
                  <ul className="space-y-2">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className={`block text-sm transition-colors hover:text-primary ${
                            heading.level === 2
                              ? 'text-muted-foreground font-medium'
                              : 'text-muted-foreground/70 pl-3'
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}

          {/* Article Content */}
          <article className="flex-1 min-w-0 max-w-3xl">
            {/* Mobile Table of Contents */}
            {headings.length > 0 && (
              <details className="lg:hidden mb-8 bg-card border border-border rounded-xl">
                <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-foreground">
                  Índice do artigo
                </summary>
                <nav className="px-4 pb-4">
                  <ul className="space-y-2">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className={`block text-sm transition-colors hover:text-primary ${
                            heading.level === 2
                              ? 'text-muted-foreground font-medium'
                              : 'text-muted-foreground/70 pl-3'
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            )}

            {/* Rendered Content */}
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            {/* Feedback Section */}
            <FeedbackButtons />
          </article>
        </div>
      </div>
    </div>
  )
}
