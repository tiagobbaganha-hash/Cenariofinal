'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, CheckCircle, XCircle, RefreshCw, Eye, Clock } from 'lucide-react'

interface KycUser {
  id: string
  full_name: string
  email: string
  cpf: string
  birth_date: string
  kyc_status: string
  kyc_doc_url: string
  kyc_selfie_url: string
  kyc_submitted_at: string
}

function timeAgo(iso: string) {
  if (!iso) return '—'
  const d = Date.now() - new Date(iso).getTime()
  if (d < 3600000) return `${Math.floor(d / 60000)}min atrás`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h atrás`
  return `${Math.floor(d / 86400000)}d atrás`
}

export default function KycAdminPage() {
  const [users, setUsers] = useState<KycUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('profiles')
      .select('id, full_name, email, cpf, birth_date, kyc_status, kyc_doc_url, kyc_selfie_url, kyc_submitted_at')
      .order('kyc_submitted_at', { ascending: false })
    if (filter !== 'all') q = q.eq('kyc_status', filter)
    else q = q.not('kyc_status', 'eq', 'not_started').not('kyc_status', 'is', null)
    const { data } = await q
    setUsers(data || [])
    setLoading(false)
  }

  async function approve(u: KycUser) {
    const supabase = createClient()
    await supabase.from('profiles').update({ kyc_status: 'approved' }).eq('id', u.id)

    // Notificar usuário
    await supabase.from('user_notifications').insert({
      user_id: u.id,
      type: 'kyc_approved',
      title: '✅ Identidade verificada!',
      body: 'Sua identidade foi verificada com sucesso. Saques estão liberados.',
      link: '/carteira',
    })

    setMsg(`✅ ${u.full_name} aprovado!`)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, kyc_status: 'approved' } : x))
  }

  async function reject(u: KycUser) {
    const reason = prompt('Motivo da rejeição (será enviado ao usuário):')
    if (reason === null) return
    const supabase = createClient()
    await supabase.from('profiles').update({ kyc_status: 'rejected' }).eq('id', u.id)
    await supabase.from('user_notifications').insert({
      user_id: u.id,
      type: 'kyc_rejected',
      title: '❌ Verificação não aprovada',
      body: `Motivo: ${reason || 'Documentos ilegíveis ou inválidos'}. Acesse Minha Conta > Verificação para reenviar.`,
      link: '/conta/kyc',
    })
    setMsg(`❌ ${u.full_name} rejeitado`)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, kyc_status: 'rejected' } : x))
  }

  const pendingCount = users.filter(u => u.kyc_status === 'pending').length

  return (
    <div className="space-y-6 pb-12">
      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-lg w-full space-y-2" onClick={e => e.stopPropagation()}>
            <p className="text-white font-semibold text-center">{preview.label}</p>
            <img src={preview.url} alt={preview.label} className="w-full rounded-2xl" />
            <button onClick={() => setPreview(null)} className="w-full text-white/60 text-sm py-2">Fechar</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Verificação KYC</h1>
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0 ? `⚡ ${pendingCount} aguardando — aprovar em até 10 minutos` : 'Todas verificadas'}
            </p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {msg && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="ml-3 text-primary/60">✕</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma verificação {filter !== 'all' ? 'pendente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className={`rounded-2xl border bg-card p-5 space-y-4 ${u.kyc_status === 'pending' ? 'border-yellow-500/30' : 'border-border'}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold">{u.full_name || '—'}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      u.kyc_status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      u.kyc_status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {u.kyc_status === 'pending' ? '⏳ Pendente' : u.kyc_status === 'approved' ? '✅ Aprovado' : '❌ Rejeitado'}
                    </span>
                    {u.kyc_status === 'pending' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse font-medium">
                        ⚡ Aprovar em 10 min
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{u.email}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {u.cpf && <span>CPF: {u.cpf}</span>}
                    {u.birth_date && <span>Nascimento: {new Date(u.birth_date).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {timeAgo(u.kyc_submitted_at)}
                </p>
              </div>

              {/* Fotos */}
              {(u.kyc_doc_url || u.kyc_selfie_url) && (
                <div className="grid grid-cols-2 gap-3">
                  {u.kyc_doc_url && (
                    <button onClick={() => setPreview({ url: u.kyc_doc_url, label: `Documento — ${u.full_name}` })}
                      className="relative rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors group">
                      <img src={u.kyc_doc_url} alt="Documento" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-[10px] text-center py-1.5 bg-muted/50 text-muted-foreground">📄 Documento</p>
                    </button>
                  )}
                  {u.kyc_selfie_url && (
                    <button onClick={() => setPreview({ url: u.kyc_selfie_url, label: `Selfie — ${u.full_name}` })}
                      className="relative rounded-xl overflow-hidden border border-border hover:border-primary/40 transition-colors group">
                      <img src={u.kyc_selfie_url} alt="Selfie" className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-[10px] text-center py-1.5 bg-muted/50 text-muted-foreground">🤳 Selfie</p>
                    </button>
                  )}
                </div>
              )}

              {/* Ações */}
              {u.kyc_status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => approve(u)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 py-3 text-sm font-semibold hover:bg-green-500/20 transition-colors">
                    <CheckCircle className="h-4 w-4" /> Aprovar
                  </button>
                  <button onClick={() => reject(u)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 py-3 text-sm font-semibold hover:bg-red-500/20 transition-colors">
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
