'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, RefreshCw, ExternalLink, User, Lightbulb } from 'lucide-react'
import Link from 'next/link'

interface Proposal {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  fonte_resolucao: string
  status: string
  created_at: string
  profiles?: { full_name: string; email: string }
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 3600000) return `${Math.floor(d / 60000)}min atrás`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h atrás`
  return `${Math.floor(d / 86400000)}d atrás`
}

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('market_proposals')
      .select('*')
      .order('created_at', { ascending: false })
    // Excluir candidaturas de influencer das sugestões de mercado
    q = q.not('category', 'eq', '__influencer__')
    q = q.not('title', 'like', '%CANDIDATURA INFLUENCER%')
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    
    if (error) {
      console.error('Erro ao carregar propostas:', error.message)
      setLoading(false)
      return
    }
    
    // Buscar nomes dos usuários separadamente
    const proposals = data || []
    const userIds = [...new Set(proposals.map(p => p.user_id).filter(Boolean))]
    let profilesMap: Record<string, any> = {}
    
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)
      ;(profilesData || []).forEach(p => { profilesMap[p.id] = p })
    }
    
    const enriched = proposals.map(p => ({
      ...p,
      profiles: profilesMap[p.user_id] || null
    }))
    
    setProposals(enriched)
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('market_proposals').update({ status }).eq('id', id)
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    // Notificar usuário
    const proposal = proposals.find(p => p.id === id)
    if (proposal) {
      const msg = status === 'approved'
        ? `✅ Sua sugestão de mercado "${proposal.title}" foi aprovada! Em breve estará disponível na plataforma.`
        : `❌ Sua sugestão de mercado "${proposal.title}" não foi aprovada desta vez. Obrigado pela participação!`
      await supabase.from('user_notifications').insert({
        user_id: proposal.user_id,
        type: 'proposal_update',
        title: status === 'approved' ? '✅ Sugestão aprovada!' : 'Sugestão analisada',
        body: msg,
        link: '/mercados',
      })
    }
  }

  const counts = {
    pending: proposals.filter(p => p.status === 'pending').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  }

  const badgeClass = (s: string) => ({
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[s] || 'bg-muted text-muted-foreground border-border')

  const badgeLabel = (s: string) => ({ pending: '⏳ Pendente', approved: '✅ Aprovada', rejected: '❌ Rejeitada' }[s] || s)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sugestões de Mercado</h1>
            <p className="text-sm text-muted-foreground">Propostas enviadas pelos usuários para análise</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 hover:text-foreground text-muted-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendentes', count: counts.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Aprovadas', count: counts.approved, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Rejeitadas', count: counts.rejected, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-3 text-center ${k.bg}`}>
            <p className={`text-2xl font-black ${k.color}`}>{k.count}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'pending', label: '⏳ Pendentes' },
          { id: 'approved', label: '✅ Aprovadas' },
          { id: 'rejected', label: '❌ Rejeitadas' },
          { id: 'all', label: 'Todas' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma sugestão {filter !== 'all' ? 'nesta categoria' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className={`rounded-xl border bg-card p-4 space-y-3 ${p.status === 'pending' ? 'border-yellow-500/30' : 'border-border'}`}>
              {/* Header do card */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{p.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeClass(p.status)}`}>
                      {badgeLabel(p.status)}
                    </span>
                    {p.status === 'pending' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium animate-pulse">
                        🔔 Aguarda análise
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {(p.profiles as any)?.full_name || (p.profiles as any)?.email || p.user_id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.category}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              {p.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              )}

              {/* Fonte de resolução */}
              {p.fonte_resolucao && (
                <p className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
                  📍 Fonte de resolução: <span className="text-foreground">{p.fonte_resolucao}</span>
                </p>
              )}

              {/* Ações */}
              {p.status === 'pending' && (
                <div className="border-t border-border/50 pt-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">O que fazer com esta sugestão?</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {/* Opção 1: Converter direto em mercado (RECOMENDADO) */}
                    <Link href={`/admin/mercados/novo?from_proposal=${p.id}&title=${encodeURIComponent(p.title)}&category=${encodeURIComponent(p.category)}&description=${encodeURIComponent(p.description || '')}`}
                      className="flex flex-col gap-1 rounded-xl bg-primary/10 border border-primary/30 text-primary px-4 py-3 hover:bg-primary/20 transition-colors group">
                      <div className="flex items-center gap-1.5 font-semibold text-sm">
                        <ExternalLink className="h-4 w-4" />
                        Criar o Mercado
                      </div>
                      <p className="text-[10px] text-primary/70 leading-tight">
                        Abre a tela de criação já preenchida com o título e categoria desta sugestão. Você revisa e publica.
                      </p>
                    </Link>
                    {/* Opção 2: Só aprovar (sem criar mercado agora) */}
                    <button onClick={() => updateStatus(p.id, 'approved')}
                      className="flex flex-col gap-1 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 hover:bg-green-500/20 transition-colors text-left">
                      <div className="flex items-center gap-1.5 font-semibold text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Aprovar
                      </div>
                      <p className="text-[10px] text-green-400/70 leading-tight">
                        Marca como aprovada e notifica o usuário. Crie o mercado depois quando quiser.
                      </p>
                    </button>
                    {/* Opção 3: Rejeitar */}
                    <button onClick={() => updateStatus(p.id, 'rejected')}
                      className="flex flex-col gap-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 hover:bg-red-500/20 transition-colors text-left">
                      <div className="flex items-center gap-1.5 font-semibold text-sm">
                        <XCircle className="h-4 w-4" />
                        Rejeitar
                      </div>
                      <p className="text-[10px] text-red-400/70 leading-tight">
                        Recusa a sugestão e notifica o usuário que ela não foi aprovada.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
