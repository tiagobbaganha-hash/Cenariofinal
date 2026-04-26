'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy, Plus, Minus, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function CarteiraPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [saldo, setSaldo] = useState(0)
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'depositar' | 'sacar' | null>(null)
  const [amount, setAmount] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [msg, setMsg] = useState<{type: 'ok'|'err', text: string} | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email || '')

      // Saldo
      const { data: w } = await supabase.from('wallets')
        .select('available_balance')
        .eq('user_id', user.id)
        .maybeSingle()
      setSaldo(parseFloat(w?.available_balance || '0'))
      setLoading(false) // Mostrar botões imediatamente após saldo

      // Histórico (carrega em background, não bloqueia)
      supabase.from('wallet_ledger')
        .select('id, entry_type, direction, amount, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data: t }) => setTxs(t || []))
        .catch(() => {})
    }
    load().catch(() => setLoading(false))
  }, [router])

  async function depositar() {
    const val = parseFloat(amount)
    if (!val || val < 10) { setMsg({ type: 'err', text: 'Mínimo R$ 10,00' }); return }
    setProcessing(true)
    setMsg(null)
    try {
      const res = await fetch('/api/pagamentos/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: val, email: userEmail })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPixCode(data.pix_code)
      setMsg({ type: 'ok', text: '✅ PIX gerado! Escaneie o QR Code abaixo.' })
    } catch (e: any) {
      setMsg({ type: 'err', text: 'Erro: ' + e.message })
    }
    setProcessing(false)
  }

  async function sacar() {
    const val = parseFloat(amount)
    if (!val || val < 20) { setMsg({ type: 'err', text: 'Mínimo R$ 20,00' }); return }
    if (!pixKey) { setMsg({ type: 'err', text: 'Informe sua chave PIX' }); return }
    if (val > saldo) { setMsg({ type: 'err', text: 'Saldo insuficiente' }); return }
    setProcessing(true)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase.from('withdrawal_requests')
      .insert({ user_id: userId, amount: val, pix_key: pixKey, status: 'pending' })
    if (error) {
      setMsg({ type: 'err', text: error.message })
    } else {
      setMsg({ type: 'ok', text: '✅ Saque solicitado! Processado em até 24h.' })
      setTab(null)
      setAmount('')
      setPixKey('')
    }
    setProcessing(false)
  }

  function fechar() {
    setTab(null)
    setAmount('')
    setPixKey('')
    setPixCode('')
    setMsg(null)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Carteira</h1>

        {/* Saldo */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-card border border-primary/20 p-6">
          <p className="text-sm text-muted-foreground mb-1">Saldo disponível</p>
          <p className="text-4xl font-black text-primary">R$ {saldo.toFixed(2)}</p>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { setTab('depositar'); setPixCode(''); setMsg(null) }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground h-12 font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Depositar
            </button>
            <button
              onClick={() => { setTab('sacar'); setPixCode(''); setMsg(null) }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-card h-12 font-semibold hover:border-primary/40 transition-colors"
            >
              <Minus className="h-4 w-4" /> Sacar
            </button>
          </div>
        </div>

        {/* Formulário */}
        {tab && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{tab === 'depositar' ? '💰 Depositar via PIX' : '💸 Solicitar Saque'}</h2>
              <button onClick={fechar} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>

            {msg && (
              <div className={`rounded-xl px-4 py-3 text-sm ${msg.type === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {msg.text}
              </div>
            )}

            {pixCode ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-sm font-semibold">📱 Escaneie o QR Code</p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&bgcolor=ffffff&color=000000`}
                    alt="QR PIX"
                    className="h-44 w-44 rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <input readOnly value={pixCode} className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono truncate" />
                    <button onClick={() => { navigator.clipboard.writeText(pixCode); setMsg({ type: 'ok', text: '✅ Copiado!' }) }}
                      className="flex-shrink-0 rounded-xl border border-border bg-card px-3 py-2 hover:border-primary/40 transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-yellow-400 text-center">⚡ Saldo creditado automaticamente em até 5 min após o pagamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={tab === 'depositar' ? 'Mínimo R$ 10,00' : 'Mínimo R$ 20,00'}
                    className="w-full h-12 rounded-xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex gap-2">
                  {(tab === 'depositar' ? [10, 50, 100, 200] : [20, 50, 100, 200]).map(v => (
                    <button key={v} onClick={() => setAmount(v.toString())}
                      className="flex-1 py-2 rounded-xl border border-border bg-background text-sm font-medium hover:border-primary/40 transition-colors">
                      R$ {v}
                    </button>
                  ))}
                </div>
                {tab === 'sacar' && (
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Sua chave PIX</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={e => setPixKey(e.target.value)}
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                      className="w-full h-12 rounded-xl border border-border bg-background px-4 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                )}
                <button
                  onClick={tab === 'depositar' ? depositar : sacar}
                  disabled={processing}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {processing
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Processando...</>
                    : tab === 'depositar' ? 'Gerar PIX' : 'Solicitar Saque'
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* Histórico */}
        <div className="space-y-2">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Histórico</h2>
          {txs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.direction === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {tx.direction === 'credit' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || tx.entry_type || (tx.direction === 'credit' ? 'Crédito' : 'Débito')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <p className={`font-bold text-sm ${tx.direction === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.direction === 'credit' ? '+' : '-'}R$ {parseFloat(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
