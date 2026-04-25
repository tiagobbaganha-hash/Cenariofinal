'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, RefreshCw, Star, User, Mail } from 'lucide-react'

interface Application {
  id: string
  user_id: string
  name: string
  email: string
  status: string
  message: string
  created_at: string
  referral_code?: string
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 3600000) return `${Math.floor(d / 60000)}min atrás`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h atrás`
  return `${Math.floor(d / 86400000)}d atrás`
}

export default function InfluencersAdminPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    
    // Buscar candidaturas da tabela influencer_applications
    let q = supabase.from('influencer_applications').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data: apps } = await q

    // Também buscar candidaturas antigas que foram para market_proposals
    let q2 = supabase.from('market_proposals')
      .select('id, user_id, created_at, status')
      .or("title.like.%CANDIDATURA INFLUENCER%,category.eq.__influencer__")
      .order('created_at', { ascending: false })
    if (filter !== 'all') q2 = q2.eq('status', filter)
    const { data: legacyApps } = await q2

    // Buscar nomes dos usuários legados
    const userIds = (legacyApps || []).map(a => a.user_id)
    let profilesMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
      ;(profiles || []).forEach(p => { profilesMap[p.id] = p })
    }

    const legacyFormatted = (legacyApps || []).map(a => ({
      id: `legacy_${a.id}`,
      user_id: a.user_id,
      name: profilesMap[a.user_id]?.full_name || profilesMap[a.user_id]?.email?.split('@')[0] || 'Sem nome',
      email: profilesMap[a.user_id]?.email || '',
      status: a.status,
      message: 'Candidatura via painel de upgrade',
      created_at: a.created_at,
    }))

    setApplications([...(apps || []), ...legacyFormatted])
    setLoading(false)
  }

  async function approve(app: Application) {
    const supabase = createClient()
    const code = app.referral_code || app.name?.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8) || app.user_id.slice(0, 8)
    
    // 1. Atualizar role do usuário para influencer
    const { error: roleError } = await supabase.from('profiles')
      .update({ role: 'influencer', referral_code: code })
      .eq('id', app.user_id)
    if (roleError) { setMsg('❌ Erro ao atualizar role: ' + roleError.message); return }
    
    // 2. Criar na tabela influencers
    const { error: infError } = await supabase.from('influencers').upsert({
      user_id: app.user_id,
      name: app.name,
      email: app.email,
      referral_code: code,
      commission_pct: 2,
      is_active: true,
    }, { onConflict: 'user_id' })
    if (infError) { setMsg('❌ Erro ao criar influencer: ' + infError.message); return }
    
    // 3. Atualizar status da candidatura
    if (app.id.startsWith('legacy_')) {
      await supabase.from('market_proposals').update({ status: 'approved' }).eq('id', app.id.replace('legacy_', ''))
    } else {
      await supabase.from('influencer_applications').update({ status: 'approved', referral_code: code }).eq('id', app.id)
    }
    
    // 4. Notificar usuário
    await supabase.from('user_notifications').insert({
      user_id: app.user_id,
      type: 'influencer_approved',
      title: '🎉 Você é um Influencer!',
      body: `Sua candidatura foi aprovada! Seu código de indicação é ${code}. Acesse /indicacao para ver seu link.`,
      link: '/indicacao',
    })
    
    setMsg(`✅ ${app.name} aprovado como influencer! Código: ${code}`)
    load()
  }

  async function reject(app: Application) {
    const supabase = createClient()
    if (app.id.startsWith('legacy_')) {
      const { error } = await supabase.from('market_proposals').update({ status: 'rejected' }).eq('id', app.id.replace('legacy_', ''))
      if (error) { setMsg('❌ Erro: ' + error.message); return }
    } else {
      const { error } = await supabase.from('influencer_applications').update({ status: 'rejected' }).eq('id', app.id)
      if (error) { setMsg('❌ Erro: ' + error.message); return }
    }
    await supabase.from('user_notifications').insert({
      user_id: app.user_id,
      type: 'influencer_rejected',
      title: 'Candidatura analisada',
      body: 'Sua candidatura para influencer não foi aprovada desta vez. Continue participando da plataforma!',
      link: '/upgrade',
    })
    setMsg(`❌ ${app.name} rejeitado`)
    load()
  }

  const badgeClass = (s: string) => ({
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[s] || 'bg-muted text-muted-foreground border-border')

  const counts = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Candidaturas de Influencer</h1>
            <p className="text-sm text-muted-foreground">Usuários que querem se tornar influencers</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {msg && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {msg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pendentes', count: counts.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Aprovados', count: counts.approved, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Rejeitados', count: counts.rejected, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-3 text-center ${k.bg}`}>
            <p className={`text-2xl font-black ${k.color}`}>{k.count}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { id: 'pending', label: '⏳ Pendentes' },
          { id: 'approved', label: '✅ Aprovados' },
          { id: 'rejected', label: '❌ Rejeitados' },
          { id: 'all', label: 'Todos' },
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
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma candidatura {filter !== 'all' ? 'pendente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className={`rounded-xl border bg-card p-4 space-y-3 ${app.status === 'pending' ? 'border-yellow-500/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{app.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeClass(app.status)}`}>
                        {app.status === 'pending' ? '⏳ Pendente' : app.status === 'approved' ? '✅ Aprovado' : '❌ Rejeitado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {app.email}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(app.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {app.message && (
                <p className="text-sm text-muted-foreground">{app.message}</p>
              )}

              {app.status === 'approved' && app.referral_code && (
                <p className="text-xs text-green-400">
                  🔗 Código de indicação: <strong>{app.referral_code}</strong>
                </p>
              )}

              {app.status === 'pending' && (
                <div className="border-t border-border/50 pt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => approve(app)}
                    className="flex flex-col gap-1 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 hover:bg-green-500/20 transition-colors text-left">
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <CheckCircle className="h-4 w-4" /> Aprovar
                    </div>
                    <p className="text-[10px] text-green-400/70 leading-tight">
                      Ativa o papel de influencer, gera código de indicação e notifica o usuário.
                    </p>
                  </button>
                  <button onClick={() => reject(app)}
                    className="flex flex-col gap-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 hover:bg-red-500/20 transition-colors text-left">
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <XCircle className="h-4 w-4" /> Rejeitar
                    </div>
                    <p className="text-[10px] text-red-400/70 leading-tight">
                      Recusa a candidatura e notifica o usuário.
                    </p>
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
