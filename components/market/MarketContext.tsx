'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw } from 'lucide-react'

interface Props {
  marketId: string
  title: string
  description: string
  category: string
  options: Array<{ label: string; probability?: number }>
}

// Renderiza markdown simples sem lib externa
function renderMd(text: string) {
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (!line.trim()) { out.push(<div key={key++} className="h-2" />); continue }

    if (line.startsWith('## ')) {
      out.push(
        <h2 key={key++} className="text-base font-bold text-foreground mt-5 mb-2 flex items-center gap-2">
          <span className="h-0.5 w-4 bg-primary rounded-full flex-shrink-0" />
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      out.push(<h3 key={key++} className="text-sm font-semibold text-foreground mt-4 mb-1.5">{line.slice(4)}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      out.push(
        <div key={key++} className="flex items-start gap-2 my-1">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {renderInline(line.slice(2))}
          </p>
        </div>
      )
    } else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      out.push(
        <div key={key++} className="flex items-start gap-3 my-1.5">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{num}</span>
          <p className="text-sm text-muted-foreground leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ''))}</p>
        </div>
      )
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      out.push(<p key={key++} className="text-sm font-semibold text-foreground mt-3 mb-1">{line.slice(2, -2)}</p>)
    } else {
      out.push(<p key={key++} className="text-sm text-muted-foreground leading-relaxed my-1">{renderInline(line)}</p>)
    }
  }
  return out
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i} className="italic">{p.slice(1, -1)}</em>
    return p
  })
}

export function MarketContext({ marketId, title, description, category, options }: Props) {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/market/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, title, description, category, options })
      })
      const data = await res.json()
      if (data.context) {
        setContext(data.context)
        setGenerated(true)
      } else {
        setError(data.error || 'Erro ao gerar contexto')
      }
    } catch (e: any) {
      setError('Erro ao gerar contexto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    setOpen(v => !v)
    if (!open && !generated && !loading) generate()
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-card/80 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Contexto</p>
            <p className="text-xs text-muted-foreground">Entenda o mercado em detalhes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {generated && !loading && (
            <button
              onClick={e => { e.stopPropagation(); setGenerated(false); setContext(''); generate() }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Regenerar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {!open && !generated && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Gerar
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Content */}
      {open && (
        <div className="border-t border-border px-5 py-5">
          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando contexto com IA...</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={generate} className="mt-2 text-xs text-red-400 hover:underline">Tentar novamente</button>
            </div>
          )}

          {context && !loading && (
            <div className="space-y-0.5">
              {renderMd(context)}
              <p className="text-[10px] text-muted-foreground/40 mt-4 pt-3 border-t border-border/50">
                Contexto gerado por IA — apenas informativo. Não constitui aconselhamento financeiro.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
