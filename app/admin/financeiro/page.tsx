'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, TrendingUp, Users, Wallet, DollarSign, Plus, Minus } from 'lucide-react'

export default function FinanceiroAdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalDeposits: 0, totalWithdrawals: 0, totalBalance: 0, totalUsers: 0 })
  const [deposits, setDeposits] = useState<any[]>([])
  const [tab, setTab] = useState<'depositos' | 'saques' | 'extrato' | 'creditar'>('depositos')
  const [msg, setMsg] = useState('')
  // Creditar manual
  const [creditEmail, setCreditEmail] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNote, setCreditNote] = useState('')
  const [crediting, setCrediting] = useState(false)

  useEffect(() => { load() }, [tab])

  async function load() {
    setLoading(true)
    const supabase = createClient()

    // Stats gerais
    const [
      { data: wallets },
      { count: userCount },
      { data: deps },
      { data: withs }
    ] = await Promise.all([
      supabase.from('wallets').select('available_balance'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('deposit_requests').select('amount').eq('status', 'paid'),
      supabase.from('withdrawal_requests').select('amount').eq('status', 'approved'),
    ])

    const totalBalance = (wallets || []).reduce((s: number, w: any) => s + parseFloat(w.available_balance || 0), 0)
    const totalDeposits = (deps || []).reduce((s: number, d: any) => s + parseFloat(d.amount || 0), 0)
    const totalWithdrawals = (withs || []).reduce((s: number, w: any) => s + parseFloat(w.amount || 0), 0)
    setStats({ totalDeposits, totalWithdrawals, totalBalance, totalUsers: userCount || 0 })

    // Dados por aba
    if (tab === 'depositos') {
      const { data } = await supabase.from('deposit_requests')
        .select('*').order('created_at', { ascending: false }).limit(50)
      const userIds = [...new Set((data || []).map((d: any) => d.user_id))]
      let pm: Record<string, any> = {}
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        ;(profiles || []).forEach((p: any) => { pm[p.id] = p })
      }
      setDeposits((data || []).map((d: any) => ({ ...d, profile: pm[d.user_id] })))
    } else if (tab === 'saques') {
      const { data } = await supabase.from('withdrawal_requests')
        .select('*').order('created_at', { ascending: false }).limit(100)
      const userIds = [...new Set((data || []).map((d: any) => d.user_id))]
      let pm: Record<string, any> = {}
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        ;(profiles || []).forEach((p: any) => { pm[p.id] = p })
      }
      setDeposits((data || []).map((d: any) => ({ ...d, profile: pm[d.user_id] })))
    } else if (tab === 'extrato') {
      const { data } = await supabase.from('wallet_ledger')
        .select('*').order('created_at', { ascending: false }).limit(100)
      const userIds = [...new Set((data || []).map((d: any) => d.user_id))]
      let pm: Record<string, any> = {}
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        ;(profiles || []).forEach((p: any) => { pm[p.id] = p })
      }
      setDeposits((data || []).map((d: any) => ({ ...d, profile: pm[d.user_id] })))
    }

    setLoading(false)
  }

  async function creditarManual() {
    if (!creditEmail || !creditAmount) { setMsg('❌ Preencha email e valor'); return }
    const val = parseFloat(creditAmount)
    if (isNaN(val) || val <= 0) { setMsg('❌ Valor inválido'); return }
    setCrediting(true)
    const supabase = createClient()
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', creditEmail).single()
    if (!profile) { setMsg('❌ Usuário não encontrado'); setCrediting(false); return }

    const { error } = await supabase.rpc('admin_credit_wallet', {
      p_user_id: profile.id, p_amount: val, p_note: creditNote || 'Crédito manual admin'
    })
    if (error) { setMsg('❌ ' + error.message); setCrediting(false); return }

    await supabase.from('wallet_ledger').insert({
      user_id: profile.id, entry_type: 'manual_credit', direction: 'credit',
      amount: val, description: creditNote || 'Crédito manual pelo admin'
    })
    await supabase.from('user_notifications').insert({
      user_id: profile.id, type: 'credit', title: '💰 Saldo creditado!',
      body: `R$ ${val.toFixed(2)} foram adicionados à sua carteira. ${creditNote || ''}`, link: '/carteira'
    })

    setMsg(`✅ R$ ${val.toFixed(2)} creditados para ${creditEmail}`)
    setCreditEmail(''); setCreditAmount(''); setCreditNote('')
    setCrediting(false)
    load()
  }

  const badgeStatus = (s: string) => ({
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[s] || 'bg-muted text-muted-foreground border-border')

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Gestão completa de pagamentos</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Saldo Total Usuários', value: `R$ ${stats.totalBalance.toFixed(2)}`, icon: Wallet, color: 'text-primary' },
          { label: 'Total Depositado', value: `R$ ${stats.totalDeposits.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Total Sacado', value: `R$ ${stats.totalWithdrawals.toFixed(2)}`, icon: Minus, color: 'text-red-400' },
          { label: 'Usuários', value: stats.totalUsers.toString(), icon: Users, color: 'text-blue-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
            <p className={`text-xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary flex justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="ml-3 text-primary/60">✕</button>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'depositos', label: '💰 Depósitos' },
          { id: 'saques', label: '💸 Saques' },
          { id: 'extrato', label: '📋 Extrato Geral' },
          { id: 'creditar', label: '➕ Creditar/Debitar' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${tab === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : tab === 'creditar' ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-md">
          <h3 className="font-bold">Creditar/Debitar Saldo Manualmente</h3>
          <p className="text-sm text-muted-foreground">Use para corrigir erros, créditos de bônus ou ajustes.</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">E-mail do usuário</label>
              <input value={creditEmail} onChange={e => setCreditEmail(e.target.value)}
                placeholder="usuario@email.com" type="email"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Valor (negativo para debitar)</label>
              <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                placeholder="Ex: 50 ou -20" type="number"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Motivo (aparece no histórico)</label>
              <input value={creditNote} onChange={e => setCreditNote(e.target.value)}
                placeholder="Ex: Bônus de boas-vindas, ajuste manual..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <button onClick={creditarManual} disabled={crediting}
              className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {crediting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Processando...</> : <><Plus className="h-4 w-4" /> Aplicar</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Usuário</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deposits.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum registro</td></tr>
              ) : deposits.map((d: any) => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.profile?.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{d.profile?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-bold ${d.direction === 'debit' ? 'text-red-400' : 'text-green-400'}`}>
                      {d.direction === 'debit' ? '-' : '+'}R$ {parseFloat(d.amount).toFixed(2)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeStatus(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
