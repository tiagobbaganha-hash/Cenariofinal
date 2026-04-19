'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

interface DepositRequest {
  id: string
  user_id: string
  user_email?: string
  amount: number
  status: string
  payment_method: string
  created_at: string
}

interface WithdrawalRequest {
  id: string
  user_id: string
  user_email?: string
  amount: number
  pix_key: string
  status: string
  created_at: string
}

export default function AdminFinanceiro() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals'>('deposits')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    
    // Load deposits
    const { data: deps } = await supabase
      .from('deposit_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (deps) {
      setDeposits(deps.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        amount: parseFloat(d.amount || '0'),
        status: d.status,
        payment_method: d.payment_method || 'pix',
        created_at: d.created_at,
      })))
    }

    // Load withdrawals
    const { data: withs } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (withs) {
      setWithdrawals(withs.map((w: any) => ({
        id: w.id,
        user_id: w.user_id,
        amount: parseFloat(w.amount || '0'),
        pix_key: w.pix_key,
        status: w.status,
        created_at: w.created_at,
      })))
    }

    setLoading(false)
  }

  async function approveDeposit(id: string) {
    setProcessing(id)
    const supabase = createClient()
    
    await supabase
      .from('deposit_requests')
      .update({ status: 'completed' })
      .eq('id', id)
    
    await loadData()
    setProcessing(null)
  }

  async function rejectDeposit(id: string) {
    setProcessing(id)
    const supabase = createClient()
    
    await supabase
      .from('deposit_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
    
    await loadData()
    setProcessing(null)
  }

  async function approveWithdrawal(id: string) {
    setProcessing(id)
    const supabase = createClient()
    
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'completed' })
      .eq('id', id)
    
    await loadData()
    setProcessing(null)
  }

  async function rejectWithdrawal(id: string) {
    setProcessing(id)
    const supabase = createClient()
    
    await supabase
      .from('withdrawal_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
    
    await loadData()
    setProcessing(null)
  }

  const pendingDeposits = deposits.filter(d => d.status === 'pending')
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')

  const totalDeposits = deposits.filter(d => d.status === 'completed').reduce((s, d) => s + d.amount, 0)
  const totalWithdrawals = withdrawals.filter(w => w.status === 'completed').reduce((s, w) => s + w.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerenciar depositos e saques</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <ArrowDownLeft className="h-4 w-4" />
            <span className="text-sm">Depositos</span>
          </div>
          <p className="text-2xl font-bold">R$ {(totalDeposits / 1000).toFixed(1)}k</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-sm">Saques</span>
          </div>
          <p className="text-2xl font-bold">R$ {(totalWithdrawals / 1000).toFixed(1)}k</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Dep. Pendentes</span>
          </div>
          <p className="text-2xl font-bold">{pendingDeposits.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Saq. Pendentes</span>
          </div>
          <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'deposits' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'
          }`}
        >
          Depositos ({deposits.length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'withdrawals' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent'
          }`}
        >
          Saques ({withdrawals.length})
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'deposits' ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Usuario</th>
                  <th className="text-left p-4 font-medium">Valor</th>
                  <th className="text-left p-4 font-medium">Metodo</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-right p-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : deposits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhum deposito
                    </td>
                  </tr>
                ) : (
                  deposits.map(dep => (
                    <tr key={dep.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="p-4 font-mono text-sm">{dep.id.slice(0, 8)}</td>
                      <td className="p-4 font-mono text-sm">{dep.user_id.slice(0, 8)}</td>
                      <td className="p-4 font-bold text-green-400">R$ {dep.amount.toFixed(2)}</td>
                      <td className="p-4 uppercase text-sm">{dep.payment_method}</td>
                      <td className="p-4">
                        <StatusBadge status={dep.status} />
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(dep.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4">
                        {dep.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => approveDeposit(dep.id)}
                              disabled={processing === dep.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing === dep.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectDeposit(dep.id)}
                              disabled={processing === dep.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-accent/50">
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Usuario</th>
                  <th className="text-left p-4 font-medium">Valor</th>
                  <th className="text-left p-4 font-medium">Chave PIX</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Data</th>
                  <th className="text-right p-4 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhum saque
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(wit => (
                    <tr key={wit.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="p-4 font-mono text-sm">{wit.id.slice(0, 8)}</td>
                      <td className="p-4 font-mono text-sm">{wit.user_id.slice(0, 8)}</td>
                      <td className="p-4 font-bold text-red-400">R$ {wit.amount.toFixed(2)}</td>
                      <td className="p-4 font-mono text-sm">{wit.pix_key?.slice(0, 20)}</td>
                      <td className="p-4">
                        <StatusBadge status={wit.status} />
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(wit.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4">
                        {wit.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm"
                              onClick={() => approveWithdrawal(wit.id)}
                              disabled={processing === wit.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing === wit.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectWithdrawal(wit.id)}
                              disabled={processing === wit.id}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const icons: Record<string, any> = {
    pending: Clock,
    completed: CheckCircle,
    rejected: XCircle,
    failed: XCircle,
  }

  const Icon = icons[status] || Clock

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm border ${styles[status] || styles.pending}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  )
}
