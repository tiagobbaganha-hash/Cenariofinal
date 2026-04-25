'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

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

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('market_proposals')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setProposals(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('market_proposals').update({ status }).eq('id', id)
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const statusBadge = (s: string) => ({
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  }[s] || 'bg-muted text-muted-foreground')

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Propostas de Mercado</h1>
          <p className="text-sm text-muted-foreground">Sugestões enviadas pelos usuários</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 hover:text-foreground text-muted-foreground transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[['all','Todas'],['pending','Pendentes'],['approved','Aprovadas'],['rejected','Rejeitadas']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === val ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma proposta encontrada</div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge(p.status)}`}>{p.status}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{p.category}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  {p.fonte_resolucao && (
                    <p className="text-xs text-primary mt-1">📎 Fonte: {p.fonte_resolucao}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Por: {(p.profiles as any)?.full_name || (p.profiles as any)?.email || p.user_id.slice(0,8)} · {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              {p.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => updateStatus(p.id, 'approved')}
                    className="flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 text-sm hover:bg-green-500/20 transition-colors">
                    <CheckCircle className="h-4 w-4" /> Aprovar
                  </button>
                  <button onClick={() => updateStatus(p.id, 'rejected')}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 text-sm hover:bg-red-500/20 transition-colors">
                    <XCircle className="h-4 w-4" /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
