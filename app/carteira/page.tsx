'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Minus,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Zap,
  TrendingUp,
  Trophy,
  User,
  Home,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

interface WalletData {
  available_balance: number
  locked_balance: number
  pendingDeposits: number
  pendingWithdrawals: number
}

interface Transaction {
  id: string
  type: string
  entry_type: string
  amount: number
  direction: 'credit' | 'debit'
  description: string
  market_title?: string
  market_slug?: string
  reference_id?: string
  created_at: string
  balance_after?: number
}

export default function CarteiraPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'depositar' | 'sacar' | null>(null)
  const [txFilter, setTxFilter] = useState<string>('all')
  const [txPage, setTxPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Load wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('available_balance, locked_balance')
        .eq('user_id', user.id)
        .single()

      if (walletData) {
        // Load pending
        const { data: pendingDep } = await supabase
          .from('deposit_requests')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'pending')

        const { data: pendingWith } = await supabase
          .from('withdrawal_requests')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'pending')

        setWallet({
          available_balance: parseFloat(walletData.available_balance || '0'),
          locked_balance: parseFloat(walletData.locked_balance || '0'),
          pendingDeposits: (pendingDep || []).reduce((s, d) => s + parseFloat(d.amount || '0'), 0),
          pendingWithdrawals: (pendingWith || []).reduce((s, w) => s + parseFloat(w.amount || '0'), 0),
        })
      } else {
        // Create wallet if not exists
        await supabase.from('wallets').insert({ user_id: user.id, available_balance: 0, locked_balance: 0 })
      }

      // Load transactions com dados completos
      let txQuery = supabase
        .from('wallet_ledger')
        .select('*, orders(market_id, markets(title, slug))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(21)

      const { data: txs } = await txQuery

      if (txs) {
        setHasMore(txs.length > 20)
        setTransactions(txs.slice(0, 20).map((t: any) => ({
          id: t.id,
          type: t.entry_type || (t.direction === 'credit' ? 'deposit' : 'debit'),
          entry_type: t.entry_type || (t.direction === 'credit' ? 'deposit' : 'debit'),
          amount: parseFloat(t.amount || '0'),
          direction: t.direction === 'credit' ? 'credit' : 'debit',
          description: getDescription(t.entry_type),
          market_title: t.orders?.markets?.title || null,
          market_slug: t.orders?.markets?.slug || null,
          reference_id: t.reference_id || null,
          created_at: t.created_at,
          balance_after: t.balance_after ? parseFloat(t.balance_after) : null,
        })))
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  function getDescription(type: string | null | undefined): string {
    if (!type) return 'Transação'
    const map: Record<string, string> = {
      deposit: 'Depósito via PIX',
      deposit_pix: 'Depósito via PIX',
      withdrawal: 'Saque PIX',
      withdrawal_fee: 'Taxa de saque',
      bet_lock: 'Aposta realizada',
      bet_stake: 'Aposta realizada',
      bet_place: 'Aposta realizada',
      bet_settle_win: '🏆 Aposta ganha!',
      bet_settle_loss: 'Aposta perdida',
      bet_sell: 'Posição vendida',
      bet_cancel: 'Aposta cancelada',
      bet_refund: 'Reembolso de aposta',
      refund: 'Reembolso',
      bonus: 'Bônus creditado',
      referral_commission: 'Comissão de indicação',
      influencer_commission: 'Comissão influencer',
      adjustment: 'Ajuste manual',
      sold: 'Posição vendida',
      settlement_win: '🏆 Aposta ganha!',
      settlement_loss: 'Aposta perdida',
      bet_settle_win: '🏆 Aposta ganha!',
      bet_settle_loss: 'Aposta perdida',
      ir_retencao: 'IR retido na fonte (15%)',
      commission: 'Comissão recebida',
      platform_fee: 'Taxa da plataforma',
      credit: 'Crédito',
      debit: 'Débito',
    }
    return map[type] || type.replace(/_/g, ' ').replace(/\w/g, l => l.toUpperCase()) || 'Transação'
  }

  function getTxIcon(type: string | null | undefined) {
    if (!type) return '💳'
    if (type.includes('deposit')) return '💰'
    if (type.includes('withdrawal') || type.includes('withdrawal_fee')) return '📤'
    if (type.includes('bet_settle_win') || type === 'refund') return '🏆'
    if (type.includes('bet_settle_loss')) return '❌'
    if (type.includes('bet_sell')) return '💱'
    if (type.includes('bet')) return '🎯'
    if (type.includes('commission')) return '💸'
    if (type === 'bonus') return '🎁'
    if (type === 'adjustment') return '⚙️'
    return '💳'
  }

  function getTxColor(direction: string, type: string) {
    if (direction === 'credit') return 'text-green-400'
    if (type?.includes('fee')) return 'text-orange-400'
    return 'text-red-400'
  }

  function getTxBg(direction: string, type: string) {
    if (direction === 'credit') return 'bg-green-500/10 border-green-500/20'
    if (type?.includes('fee')) return 'bg-orange-500/10 border-orange-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  const TX_FILTERS = [
    { label: 'Todos', value: 'all' },
    { label: 'Depósitos', value: 'deposit' },
    { label: 'Saques', value: 'withdrawal' },
    { label: 'Apostas', value: 'bet' },
    { label: 'Ganhos', value: 'bet_settle_win' },
    { label: 'Comissões', value: 'commission' },
  ]

  const filteredTxs = txFilter === 'all'
    ? transactions
    : transactions.filter(tx => tx.entry_type?.includes(txFilter))

  async function handleDeposit() {
    const value = parseFloat(amount)
    if (!value || value < 10) {
      setMessage({ type: 'error', text: 'Valor mínimo: R$ 10,00' })
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/pagamentos/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: value, email: user.email })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPixCode(data.pix_code)
      setMessage({ type: 'success', text: data.mode === 'manual'
        ? '✅ PIX gerado! Após pagar, envie o comprovante pelo suporte. Crédito em até 2h.'
        : '✅ PIX gerado! Pague e aguarde a confirmação automática.' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    }
    setProcessing(false)
  }

  async function handleWithdraw() {
    const value = parseFloat(amount)
    if (!value || value < 20) {
      setMessage({ type: 'error', text: 'Valor mínimo: R$ 20,00' })
      return
    }
    // Verificar KYC
    const supabase2 = createClient()
    const { data: profile } = await supabase2.from('profiles').select('kyc_status, pix_key').eq('id', user.id).single()
    if (!profile?.kyc_status || profile.kyc_status !== 'approved') {
      setMessage({ type: 'error', text: '❌ KYC necessário para saques. Complete a verificação de identidade.' })
      return
    }
    if (!pixKey) {
      setMessage({ type: 'error', text: 'Informe sua chave PIX' })
      return
    }
    if (wallet && value > wallet.available_balance) {
      setMessage({ type: 'error', text: 'Saldo insuficiente' })
      return
    }

    setProcessing(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({ user_id: user.id, amount: value, pix_key: pixKey, status: 'pending' })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Saque solicitado! Processamento em ate 24h.' })
      setActiveTab(null)
      setAmount('')
      setPixKey('')
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="pb-24">
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <h1 className="text-3xl font-bold">Carteira</h1>
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-secondary/20 p-6 border border-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
            <p className="text-4xl font-black text-gradient">
              R$ {wallet?.available_balance.toFixed(2) || '0,00'}
            </p>
            {(wallet?.locked_balance || 0) > 0 && (
              <p className="text-sm text-blue-400 mt-1">
                R$ {wallet?.locked_balance.toFixed(2)} em apostas
              </p>
            )}
            {(wallet?.pendingDeposits || 0) > 0 && (
              <p className="text-sm text-yellow-400 mt-2">
                + R$ {wallet?.pendingDeposits.toFixed(2)} em depositos pendentes
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button 
              onClick={() => { setActiveTab('depositar'); setMessage(null); setPixCode('') }}
              className="h-12 glow-green"
            >
              <Plus className="mr-2 h-5 w-5" /> Depositar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { setActiveTab('sacar'); setMessage(null) }}
              className="h-12"
            >
              <Minus className="mr-2 h-5 w-5" /> Sacar
            </Button>
          </div>
        </div>

        {/* Deposit/Withdraw Form */}
        {activeTab && (
          <div className="rounded-2xl bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {activeTab === 'depositar' ? 'Depositar via PIX' : 'Sacar via PIX'}
              </h2>
              <button onClick={() => { setActiveTab(null); setPixCode(''); setMessage(null) }} className="text-muted-foreground hover:text-foreground">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                {message.text}
              </div>
            )}

            {pixCode ? (
              <div className="space-y-4">
                {/* QR Code visual */}
                <div className="flex flex-col items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5">
                  <p className="text-sm font-semibold text-foreground">📱 Escaneie o QR Code</p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}&bgcolor=0a0a0a&color=22c55e&format=png`}
                    alt="QR Code PIX"
                    className="h-48 w-48 rounded-xl border border-border"
                  />
                  <p className="text-xs text-muted-foreground text-center">Abra seu banco → PIX → Ler QR Code</p>
                </div>
                {/* Código copia e cola */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Ou copie o código PIX:</p>
                  <div className="flex gap-2">
                    <input readOnly value={pixCode} className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-muted-foreground truncate" />
                    <Button size="sm" className="flex-shrink-0 rounded-xl" onClick={() => { navigator.clipboard.writeText(pixCode); setMessage({ type: 'success', text: '✅ Copiado!' }) }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-400">
                  ⚡ Saldo creditado automaticamente em até 5 minutos após o pagamento.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor (R$)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={activeTab === 'depositar' ? 'Minimo R$ 10,00' : 'Minimo R$ 20,00'}
                    className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                {activeTab === 'sacar' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Chave PIX</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="CPF, Email, Telefone ou Chave Aleatoria"
                      className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  {[10, 50, 100, 200].map(v => (
                    <button
                      key={v}
                      onClick={() => setAmount(v.toString())}
                      className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent/80 text-sm font-medium"
                    >
                      R$ {v}
                    </button>
                  ))}
                </div>

                <Button 
                  className="w-full h-12 glow-green"
                  onClick={activeTab === 'depositar' ? handleDeposit : handleWithdraw}
                  disabled={processing}
                >
                  {processing ? <RefreshCw className="h-5 w-5 animate-spin" /> : activeTab === 'depositar' ? 'Gerar PIX' : 'Solicitar Saque'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-sm">Em Apostas</span>
            </div>
            <p className="text-xl font-bold">R$ {(wallet?.locked_balance || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm">Saques Pendentes</span>
            </div>
            <p className="text-xl font-bold">R$ {(wallet?.pendingWithdrawals || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Histórico de Transações</h2>
            <span className="text-xs text-muted-foreground">{filteredTxs.length} registro{filteredTxs.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TX_FILTERS.map(f => (
              <button key={f.value} onClick={() => setTxFilter(f.value)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${txFilter === f.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {filteredTxs.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-10 text-center">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTxs.map(tx => (
                <div key={tx.id} className={`rounded-xl border p-4 transition-colors hover:bg-card/80 ${getTxBg(tx.direction, tx.entry_type)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card border border-border text-lg">
                        {getTxIcon(tx.entry_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                        {tx.market_title && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {tx.market_slug ? (
                              <a href={`/mercados/${tx.market_slug}`} className="hover:text-primary transition-colors">
                                📊 {tx.market_title}
                              </a>
                            ) : tx.market_title}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(tx.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {tx.balance_after !== null && tx.balance_after !== undefined && (
                            <span className="text-[10px] text-muted-foreground/60">
                              Saldo após: R$ {tx.balance_after.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${getTxColor(tx.direction, tx.entry_type)}`}>
                        {tx.direction === 'credit' ? '+' : '-'}R$ {tx.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && (
                <button className="w-full rounded-xl border border-border bg-card/50 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Carregar mais transações →
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-lg safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <Home className="h-5 w-5" />
            <span className="text-xs">Inicio</span>
          </Link>
          <Link href="/mercados" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Mercados</span>
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <Trophy className="h-5 w-5" />
            <span className="text-xs">Ranking</span>
          </Link>
          <Link href="/carteira" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-medium">Carteira</span>
          </Link>
          <Link href="/conta" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="text-xs">Conta</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
