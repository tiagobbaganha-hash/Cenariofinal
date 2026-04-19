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
  balance: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalDeposited: number
  totalWithdrawn: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  created_at: string
}

export default function CarteiraPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'depositar' | 'sacar' | null>(null)
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
          balance: parseFloat(walletData.available_balance || '0'),
          pendingDeposits: (pendingDep || []).reduce((s, d) => s + parseFloat(d.amount || '0'), 0),
          pendingWithdrawals: (pendingWith || []).reduce((s, w) => s + parseFloat(w.amount || '0'), 0),
          totalDeposited: parseFloat(walletData.total_deposited || '0'),
          totalWithdrawn: parseFloat(walletData.total_withdrawn || '0'),
        })
      } else {
        // Create wallet if not exists
        await supabase.from('wallets').insert({ user_id: user.id, available_balance: 0, locked_balance: 0 })
        setWallet({ balance: 0, pendingDeposits: 0, pendingWithdrawals: 0, totalDeposited: 0, totalWithdrawn: 0 })
      }

      // Load transactions
      const { data: txs } = await supabase
        .from('wallet_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (txs) {
        setTransactions(txs.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.credit || t.debit || '0'),
          status: 'completed',
          description: getDescription(t.type),
          created_at: t.created_at,
        })))
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  function getDescription(type: string): string {
    const map: Record<string, string> = {
      deposit: 'Deposito PIX',
      withdrawal: 'Saque PIX',
      bet: 'Aposta',
      payout: 'Ganho de aposta',
      bonus: 'Bonus',
    }
    return map[type] || 'Transacao'
  }

  async function handleDeposit() {
    const value = parseFloat(amount)
    if (!value || value < 10) {
      setMessage({ type: 'error', text: 'Valor minimo: R$ 10,00' })
      return
    }

    setProcessing(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('deposit_requests')
      .insert({ user_id: user.id, amount: value, status: 'pending', payment_method: 'pix' })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      const code = `00020126580014br.gov.bcb.pix0136${user.id.slice(0, 36)}520400005303986540${value.toFixed(2)}5802BR5925CENARIOX6009SP62070503***6304`
      setPixCode(code)
      setMessage({ type: 'success', text: 'PIX gerado! Copie o codigo abaixo.' })
    }
    setProcessing(false)
  }

  async function handleWithdraw() {
    const value = parseFloat(amount)
    if (!value || value < 20) {
      setMessage({ type: 'error', text: 'Valor minimo: R$ 20,00' })
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 blur-backdrop border-b border-border/50">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-bold">Carteira</h1>
            </div>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Zap className="h-4 w-4 text-background" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-card to-secondary/20 p-6 border border-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-muted-foreground mb-1">Saldo Disponivel</p>
            <p className="text-4xl font-black text-gradient">
              R$ {wallet?.balance.toFixed(2) || '0,00'}
            </p>
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
                <p className="text-sm text-muted-foreground">Copie o codigo PIX abaixo e pague no seu banco:</p>
                <div className="relative">
                  <textarea 
                    readOnly 
                    value={pixCode}
                    className="w-full h-24 p-3 rounded-lg bg-background border border-border text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => { navigator.clipboard.writeText(pixCode); setMessage({ type: 'success', text: 'Copiado!' }) }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Apos o pagamento, o saldo sera creditado em ate 5 minutos.</p>
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
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-sm">Total Depositado</span>
            </div>
            <p className="text-xl font-bold">R$ {wallet?.totalDeposited.toFixed(2) || '0,00'}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm">Total Sacado</span>
            </div>
            <p className="text-xl font-bold">R$ {wallet?.totalWithdrawn.toFixed(2) || '0,00'}</p>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-bold mb-4">Historico</h2>
          {transactions.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma transacao ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'bonus' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'bonus' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'bonus' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'deposit' || tx.type === 'payout' || tx.type === 'bonus' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
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
