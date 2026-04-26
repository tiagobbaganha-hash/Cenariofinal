'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, CheckCircle, XCircle, Wallet } from 'lucide-react'

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  pix_key: string
  status: string
  created_at: string
  notes?: string
  profiles?: { full_name: string; email: string; cpf: string }
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 3600000) return `${Math.floor(d/60000)}min atrás`
  if (d < 86400000) return `${Math.floor(d/3600000)}h atrás`
  return `${Math.floor(d/86400000)}d atrás`
}

export default function SaquesAdminPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [msg, setMsg] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    if (error) { setMsg('Erro: ' + error.message); setLoading(false); return }

    const userIds = [...new Set((data || []).map((w: any) => w.user_id))]
    let profilesMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, cpf').in('id', userIds)
      ;(profiles || []).forEach((p: any) => { profilesMap[p.id] = p })
    }
    setWithdrawals((data || []).map((w: any) => ({ ...w, profiles: profilesMap[w.user_id] })))
    setLoading(false)
  }

  async function approve(w: Withdrawal) {
    if (!confirm(`Aprovar saque de R$ ${w.amount.toFixed(2)}?\n\nChave PIX: ${w.pix_key}\n\nFaça o PIX antes de clicar OK.`)) return
    setProcessing(w.id)
    const supabase = createClient()

    await supabase.from('wallets').rpc || await supabase.rpc('admin_debit_wallet', {
      p_user_id: w.user_id, p_amount: w.amount, p_reference_id: w.id, p_note: 'Saque PIX'
    }).catch(() => {})

    await supabase.from('wallet_ledger').insert({
      user_id: w.user_id, entry_type: 'withdrawal', direction: 'debit',
      amount: w.amount, description: `Saque PIX para ${w.pix_key}`,
    })

    await supabase.from('withdrawal_requests').update({ status: 'approved', notes: 'Aprovado pelo admin' }).eq('id', w.id)

    await supabase.from('user_notifications').insert({
      user_id: w.user_id, type: 'withdrawal_approved', title: 'Saque aprovado!',
      body: `Seu saque de R$ ${w.amount.toFixed(2)} foi processado para ${w.pix_key}.`, link: '/carteira',
    })

    setMsg(`✅ Aprovado! Faça o PIX de R$ ${w.amount.toFixed(2)} para ${w.pix_key}`)
    setProcessing(null)
    load()
  }

  async function reject(w: Withdrawal) {
    const reason = prompt('Motivo da recusa:')
    if (reason === null) return
    setProcessing(w.id)
    const supabase = createClient()
    await supabase.from('withdrawal_requests').update({ status: 'rejected', notes: reason || 'Recusado' }).eq('id', w.id)
    await supabase.from('user_notifications').insert({
      user_id: w.user_id, type: 'withdrawal_rejected', title: 'Saque não aprovado',
      body: `Saque de R$ ${w.amount.toFixed(2)} recusado. Motivo: ${reason}. Saldo mantido na carteira.`, link: '/carteira',
    })
    setMsg('❌ Saque recusado. Usuário notificado.')
    setProcessing(null)
    load()
  }

  const pendingTotal = withdrawals.filter(w => w.status === 'pending').reduce((a, w) => a + w.amount, 0)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Saques</h1>
            <p className="text-sm text-muted-foreground">Gerencie as solicitações de saque</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {msg && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-primary/60 ml-3">✕</button>
        </div>
      )}

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total aguardando aprovação</p>
        <p className="text-2xl font-black text-yellow-400">R$ {pendingTotal.toFixed(2)}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'pending', label: '⏳ Pendentes' },
          { id: 'approved', label: '✅ Aprovados' },
          { id: 'rejected', label: '❌ Recusados' },
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
      ) : withdrawals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum saque {filter !== 'all' ? 'pendente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map(w => (
            <div key={w.id} className={`rounded-xl border bg-card p-4 space-y-3 ${w.status === 'pending' ? 'border-yellow-500/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-lg text-primary">R$ {w.amount.toFixed(2)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      w.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>{w.status === 'pending' ? '⏳ Pendente' : w.status === 'approved' ? '✅ Aprovado' : '❌ Recusado'}</span>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{w.profiles?.full_name || 'Usuário'} — {w.profiles?.email}</p>
                  {w.profiles?.cpf && <p className="text-xs text-muted-foreground">CPF: {w.profiles.cpf}</p>}
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo(w.created_at)}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <p className="text-[10px] text-muted-foreground">Chave PIX:</p>
                <p className="text-sm font-mono font-bold">{w.pix_key}</p>
              </div>

              {w.notes && <p className="text-xs text-muted-foreground">{w.notes}</p>}

              {w.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => approve(w)} disabled={processing === w.id}
                    className="flex flex-col gap-1 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 hover:bg-green-500/20 transition-colors text-left disabled:opacity-50">
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <CheckCircle className="h-4 w-4" /> Aprovar
                    </div>
                    <p className="text-[10px] text-green-400/70">Confirme que já fez o PIX</p>
                  </button>
                  <button onClick={() => reject(w)} disabled={processing === w.id}
                    className="flex flex-col gap-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 hover:bg-red-500/20 transition-colors text-left disabled:opacity-50">
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <XCircle className="h-4 w-4" /> Recusar
                    </div>
                    <p className="text-[10px] text-red-400/70">Devolve o saldo ao usuário</p>
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
