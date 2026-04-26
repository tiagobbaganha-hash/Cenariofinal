'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Copy, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function CarteiraPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [saldo, setSaldo] = useState(0)
  const [txs, setTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [amountDep, setAmountDep] = useState('')
  const [amountSaq, setAmountSaq] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [msgDep, setMsgDep] = useState('')
  const [msgSaq, setMsgSaq] = useState('')
  const [errDep, setErrDep] = useState('')
  const [errSaq, setErrSaq] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email || '')
      createClient().from('wallets').select('available_balance').eq('user_id', user.id).maybeSingle()
        .then(({ data: w }) => { setSaldo(parseFloat(w?.available_balance || '0')); setLoading(false) })
        .catch(() => setLoading(false))
      createClient().from('wallet_ledger').select('id,entry_type,direction,amount,description,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
        .then(({ data: t }) => setTxs(t || [])).catch(() => {})
    }).catch(() => setLoading(false))
  }, [router])

  async function depositar() {
    setErrDep(''); setMsgDep('')
    const cleanAmount = String(amountDep).replace(',', '.').trim()
    const val = parseFloat(cleanAmount)
    if (isNaN(val) || val < 10) { 
      setErrDep(`Mínimo R$ 10,00. Valor digitado: "${amountDep}"`)
      return 
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/pagamentos/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, amount: Number(val), email: userEmail })
      })
      const data = await res.json()
      if (data.error) { setErrDep(data.error); setProcessing(false); return }
      setPixCode(data.pix_code)
      setMsgDep('PIX gerado com sucesso!')
    } catch (e: any) {
      setErrDep(e.message)
    }
    setProcessing(false)
  }

  async function sacar() {
    setErrSaq(''); setMsgSaq('')
    const val = parseFloat(amountSaq)
    if (!val || val < 20) { setErrSaq('Mínimo R$ 20,00'); return }
    if (!pixKey.trim()) { setErrSaq('Informe sua chave PIX'); return }
    if (val > saldo) { setErrSaq('Saldo insuficiente'); return }
    setProcessing(true)
    const { error } = await createClient().from('withdrawal_requests')
      .insert({ user_id: userId, amount: val, pix_key: pixKey, status: 'pending' })
    if (error) { setErrSaq(error.message) } 
    else { setMsgSaq('Saque solicitado! Processado em até 24h.'); setAmountSaq(''); setPixKey('') }
    setProcessing(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg px-4 py-8 space-y-6">
        
        {/* Saldo */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-card border border-primary/20 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Saldo disponível</p>
          <p className="text-5xl font-black text-primary">R$ {saldo.toFixed(2)}</p>
          <div className="flex gap-3 mt-5">
            <button onClick={() => document.getElementById('depositar')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
              ↓ Depositar
            </button>
            <button onClick={() => document.getElementById('sacar')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 h-11 rounded-xl border border-border bg-card font-bold text-sm hover:border-primary/40 transition-colors">
              ↓ Sacar
            </button>
          </div>
        </div>

        {/* Depositar */}
        <div id="depositar" className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">💰 Depositar via PIX</h2>
          
          {errDep && <div className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 text-sm">{errDep}</div>}
          {msgDep && <div className="rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-3 text-sm">✅ {msgDep}</div>}
          
          {pixCode ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}&bgcolor=ffffff&color=000000`}
                  alt="QR PIX" className="h-52 w-52"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">Escaneie com o app do seu banco</p>
              <div className="flex gap-2">
                <input readOnly value={pixCode} className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono truncate" />
                <button onClick={() => { navigator.clipboard.writeText(pixCode); alert('Copiado!') }}
                  className="flex-shrink-0 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => { setPixCode(''); setAmountDep(''); setMsgDep('') }}
                className="w-full rounded-xl border border-border py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Novo depósito
              </button>
              <p className="text-xs text-yellow-400 text-center">⚡ Saldo creditado em até 5 min após pagamento</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[10, 50, 100, 200].map(v => (
                  <button key={v} onClick={() => setAmountDep(v.toString())}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${amountDep === v.toString() ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                    R$ {v}
                  </button>
                ))}
              </div>
              <input type="number" value={amountDep} onChange={e => setAmountDep(e.target.value)}
                placeholder="Ou digite o valor (mín. R$ 10)"
                className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button onClick={depositar} disabled={processing}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {processing ? 'Gerando PIX...' : amountDep ? `📱 Gerar PIX - R$ ${amountDep}` : '📱 Gerar PIX'}
              </button>
            </div>
          )}
        </div>

        {/* Sacar */}
        <div id="sacar" className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">💸 Solicitar Saque</h2>
          
          {errSaq && <div className="rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 text-sm">{errSaq}</div>}
          {msgSaq && <div className="rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 px-4 py-3 text-sm">✅ {msgSaq}</div>}
          
          <div className="space-y-3">
            <div className="flex gap-2">
              {[20, 50, 100, 200].map(v => (
                <button key={v} onClick={() => setAmountSaq(v.toString())}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${amountSaq === v.toString() ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                  R$ {v}
                </button>
              ))}
            </div>
            <input type="number" value={amountSaq} onChange={e => setAmountSaq(e.target.value)}
              placeholder="Valor do saque (mín. R$ 20)"
              className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)}
              placeholder="Sua chave PIX (CPF, email, telefone...)"
              className="w-full h-12 rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <button onClick={sacar} disabled={processing}
              className="w-full h-12 rounded-xl bg-card border border-border font-bold text-sm hover:border-primary/40 disabled:opacity-50 transition-colors">
              {processing ? 'Solicitando...' : '✉️ Solicitar Saque via PIX'}
            </button>
            <p className="text-xs text-muted-foreground text-center">Processamento em até 24 horas úteis</p>
          </div>
        </div>

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
