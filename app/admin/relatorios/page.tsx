'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, TrendingUp, Users, DollarSign, Trophy, RefreshCw, Settings } from 'lucide-react'

interface Stats {
  totalVolume: number
  platformProfit: number
  influencerPaid: number
  totalBets: number
  totalWinners: number
  totalUsers: number
  activeMarkets: number
}

interface Transaction {
  id: string
  user_name: string
  cpf: string
  type: string
  amount: number
  market_title: string
  created_at: string
  status: string
}

export default function RelatoriosPage() {
  const [stats, setStats] = useState<Stats>({ totalVolume: 0, platformProfit: 0, influencerPaid: 0, totalBets: 0, totalWinners: 0, totalUsers: 0, activeMarkets: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [commissionPct, setCommissionPct] = useState('5')
  const [savingCommission, setSavingCommission] = useState(false)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'apostas' | 'fiscal' | 'influencers'>('overview')

  useEffect(() => { load() }, [period])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const since = new Date(Date.now() - parseInt(period) * 86400000).toISOString()

    // Stats gerais
    const [{ data: ledger }, { data: orders }, { data: markets }, { data: plat }, { count: userCount }] = await Promise.all([
      supabase.from('platform_ledger').select('platform_amount, influencer_amount, net_platform_profit, gross_volume').gte('created_at', since),
      supabase.from('orders').select('id, status, stake_amount, settlement_amount, user_id, created_at, market_id').gte('created_at', since),
      supabase.from('markets').select('id, title, total_volume, status').eq('status', 'open'),
      supabase.from('platform_settings').select('key, value'),
      supabase.from('wallets').select('*', { count: 'exact', head: true }),
    ])

    // Commission setting
    const commMap: Record<string, string> = {}
    for (const s of plat || []) commMap[s.key] = s.value
    setCommissionPct(commMap['commission_pct'] || '5')

    const totalVol = (ledger || []).reduce((s, l) => s + parseFloat(l.gross_volume || 0), 0)
    const platProfit = (ledger || []).reduce((s, l) => s + parseFloat(l.net_platform_profit || 0), 0)
    const inflPaid = (ledger || []).reduce((s, l) => s + parseFloat(l.influencer_amount || 0), 0)
    const wins = (orders || []).filter(o => o.status === 'settled_win').length

    setStats({
      totalVolume: totalVol,
      platformProfit: platProfit,
      influencerPaid: inflPaid,
      totalBets: (orders || []).length,
      totalWinners: wins,
      totalUsers: userCount || 0,
      activeMarkets: (markets || []).length,
    })

    // Transações detalhadas
    const txs: Transaction[] = (orders || []).slice(0, 200).map((o: any) => ({
      id: o.id,
      user_name: o.user_id?.slice(0, 8) || '-',
      cpf: '-',
      type: o.status === 'settled_win' ? 'Ganho' : o.status === 'settled_loss' ? 'Perda' : 'Aposta',
      amount: o.status === 'settled_win' ? parseFloat(o.settlement_amount || 0) : parseFloat(o.stake_amount || 0),
      market_title: o.market_id?.slice(0, 8) || '-',
      created_at: o.created_at,
      status: o.status,
    }))
    setTransactions(txs)
    setLoading(false)
  }

  async function saveCommission() {
    setSavingCommission(true)
    const supabase = createClient()
    await supabase.from('platform_settings').upsert({ key: 'commission_pct', value: commissionPct, updated_at: new Date().toISOString() })
    setSavingCommission(false)
    alert(`✅ Comissão atualizada para ${commissionPct}%`)
  }

  function exportCSV(data: any[], filename: string) {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visão financeira completa da plataforma</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="365">1 ano</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:border-primary/40 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Configuração de comissão */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Configuração de Comissão</span>
        </div>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">% da plataforma sobre volume total</label>
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="20" step="0.5"
                value={commissionPct} onChange={e => setCommissionPct(e.target.value)}
                className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          <button onClick={saveCommission} disabled={savingCommission}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {savingCommission ? 'Salvando...' : 'Salvar'}
          </button>
          <p className="text-xs text-muted-foreground self-end pb-2">Aplicada em todos os mercados na próxima resolução</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Volume Total', value: fmt(stats.totalVolume), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: TrendingUp, label: 'Lucro Plataforma', value: fmt(stats.platformProfit), color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { icon: Trophy, label: 'Pago Influencers', value: fmt(stats.influencerPaid), color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { icon: Users, label: 'Usuários', value: stats.totalUsers.toString(), color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border ${s.bg} p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['overview', 'apostas', 'fiscal', 'influencers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'overview' ? 'Resumo' : t === 'apostas' ? 'Apostas' : t === 'fiscal' ? 'Apuração Fiscal' : 'Influencers'}
          </button>
        ))}
      </div>

      {tab === 'apostas' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{transactions.length} transações</p>
            <button onClick={() => exportCSV(transactions, 'apostas')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 transition-colors">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['ID', 'Tipo', 'Valor', 'Mercado', 'Data', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id.slice(0, 8)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'Ganho' ? 'bg-green-500/20 text-green-400' : t.type === 'Perda' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{t.type}</span></td>
                    <td className="px-4 py-3 font-mono font-medium">{fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.market_title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-xs">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Total de Apostas', value: stats.totalBets.toLocaleString('pt-BR') },
            { label: 'Apostas Ganhas', value: stats.totalWinners.toLocaleString('pt-BR') },
            { label: 'Mercados Ativos', value: stats.activeMarkets.toLocaleString('pt-BR') },
            { label: 'Comissão Média', value: `${commissionPct}%` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'fiscal' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-amber-400 mb-1">⚠️ Apuração Fiscal</p>
            <p className="text-xs text-muted-foreground">Exporta lista de usuários com ganhos acima de R$ 2.112/mês para declaração ao Fisco.</p>
          </div>
          <button onClick={() => exportCSV(transactions.filter(t => t.type === 'Ganho' && t.amount > 2112), 'apuracao-fiscal')}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-4 w-4" /> Exportar Apuração Fiscal (CSV)
          </button>
          <p className="text-xs text-muted-foreground">* Inclua CPF e dados completos habilitando o KYC obrigatório antes do saque</p>
        </div>
      )}

      {tab === 'influencers' && (
        <InfluencerReport />
      )}
    </div>
  )
}

function InfluencerReport() {
  const [data, setData] = useState<any[]>([])
  useEffect(() => {
    createClient().from('influencers')
      .select('id, name, referral_code, commission_pct, total_earned, total_commission, is_active')
      .order('total_earned', { ascending: false })
      .then(({ data }) => setData(data || []))
  }, [])

  const fmt = (n: number) => `R$ ${(n||0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>{['Influencer', 'Código', 'Comissão %', 'Total Ganho', 'Status'].map(h => (
            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map(inf => (
            <tr key={inf.id} className="hover:bg-muted/20">
              <td className="px-4 py-3 font-medium">{inf.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inf.referral_code}</td>
              <td className="px-4 py-3">{inf.commission_pct || 2}%</td>
              <td className="px-4 py-3 font-mono text-green-400 font-medium">{fmt(inf.total_earned)}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${inf.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>{inf.is_active ? 'Ativo' : 'Inativo'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
