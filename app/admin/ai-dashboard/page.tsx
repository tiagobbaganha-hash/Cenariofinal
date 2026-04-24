'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brain, TrendingUp, Users, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Target, Zap, BarChart3, Shield, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface PlatformMetrics {
  // Usuários
  totalUsers: number
  activeUsers7d: number
  newUsers7d: number
  churnRisk: number // usuários sem apostar há 14+ dias
  // Mercados
  totalMarkets: number
  openMarkets: number
  resolvedToday: number
  avgResolutionTime: number
  // Financeiro
  volume7d: number
  volume30d: number
  platformProfit7d: number
  irRetido7d: number
  pendingWithdrawals: number
  // Anti-fraude
  multipleAccounts: number
  suspiciousBets: number
  // Performance
  healthScore: number
  alerts: { level: 'critical' | 'warning' | 'good'; msg: string }[]
}

export default function CentralPerformancePage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [aiInsight, setAiInsight] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString()
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString()
    const d14 = new Date(now.getTime() - 14 * 86400000).toISOString()
    const today = new Date(now.toDateString()).toISOString()

    const [
      { count: totalUsers },
      { data: recentOrders },
      { data: markets },
      { data: ledger7d },
      { data: ledger30d },
      { data: withdrawals },
      { data: profiles7d },
    ] = await Promise.all([
      supabase.from('wallets').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('user_id, created_at, stake_amount').gte('created_at', d7),
      supabase.from('markets').select('id, status, created_at, closes_at, total_volume, bet_count'),
      supabase.from('platform_ledger').select('platform_amount, influencer_amount, net_platform_profit, entry_type').gte('created_at', d7),
      supabase.from('platform_ledger').select('net_platform_profit').gte('created_at', d30),
      supabase.from('financial_transactions').select('amount, status').eq('type', 'withdrawal').eq('status', 'pending').catch(() => ({ data: [] })),
      supabase.from('profiles').select('id').gte('created_at', d7),
    ])

    const activeUsers7d = new Set((recentOrders || []).map(o => o.user_id)).size
    const openMarkets = (markets || []).filter(m => m.status === 'open').length
    const resolvedToday = (markets || []).filter(m => m.status === 'resolved' && m.closes_at >= today).length
    const volume7d = (recentOrders || []).reduce((s, o) => s + parseFloat(o.stake_amount || 0), 0)
    const volume30d = (ledger30d || []).reduce((s, l) => s + parseFloat(l.net_platform_profit || 0), 0)
    const platformProfit7d = (ledger7d || []).filter(l => l.entry_type === 'market_settlement').reduce((s, l) => s + parseFloat(l.net_platform_profit || 0), 0)
    const irRetido7d = (ledger7d || []).filter(l => l.entry_type === 'ir_retencao').reduce((s, l) => s + parseFloat(l.platform_amount || 0), 0)
    const pendingWithdrawals = ((withdrawals || []) as any[]).length

    // Score de saúde
    const alerts: { level: 'critical' | 'warning' | 'good'; msg: string }[] = []
    let score = 100

    if (activeUsers7d < 3) { alerts.push({ level: 'warning', msg: 'Poucos usuários ativos nos últimos 7 dias — considere campanha de reengajamento' }); score -= 15 }
    if (openMarkets < 3) { alerts.push({ level: 'critical', msg: `Apenas ${openMarkets} mercados abertos — crie novos para manter engajamento` }); score -= 20 }
    if (pendingWithdrawals > 5) { alerts.push({ level: 'warning', msg: `${pendingWithdrawals} saques pendentes — processe para melhorar experiência` }); score -= 10 }
    if (platformProfit7d > 0) alerts.push({ level: 'good', msg: `Lucro de R$ ${platformProfit7d.toFixed(2)} nos últimos 7 dias ✅` })
    if (openMarkets >= 5) alerts.push({ level: 'good', msg: `${openMarkets} mercados ativos — boa diversidade para os usuários ✅` })
    if (volume7d > 1000) alerts.push({ level: 'good', msg: `Volume de R$ ${volume7d.toFixed(0)} em 7 dias — plataforma em crescimento ✅` })

    score = Math.max(0, Math.min(100, score))

    setMetrics({
      totalUsers: totalUsers || 0, activeUsers7d, newUsers7d: (profiles7d || []).length,
      churnRisk: Math.max(0, (totalUsers || 0) - activeUsers7d),
      totalMarkets: (markets || []).length, openMarkets, resolvedToday, avgResolutionTime: 0,
      volume7d, volume30d, platformProfit7d, irRetido7d, pendingWithdrawals: pendingWithdrawals,
      multipleAccounts: 0, suspiciousBets: 0, healthScore: score, alerts,
    })
    setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function generateAIInsight() {
    if (!metrics) return
    setLoadingAI(true)
    try {
      const prompt = `Você é um consultor especialista em plataformas de prediction markets brasileiras. Analise estas métricas e dê 3 ações prioritárias específicas e acionáveis em português:

MÉTRICAS DA SEMANA:
- Usuários totais: ${metrics.totalUsers}
- Usuários ativos 7d: ${metrics.activeUsers7d}
- Novos usuários 7d: ${metrics.newUsers7d}
- Volume 7d: R$ ${metrics.volume7d.toFixed(2)}
- Lucro plataforma 7d: R$ ${metrics.platformProfit7d.toFixed(2)}
- Mercados abertos: ${metrics.openMarkets}
- Saques pendentes: ${metrics.pendingWithdrawals}
- Score de saúde: ${metrics.healthScore}/100

Alertas: ${metrics.alerts.map(a => a.msg).join(' | ')}

Seja direto. Liste apenas 3 ações em bullet points com números concretos.`

      const res = await fetch('/api/market/ai-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, marketId: 'platform-analysis' })
      })
      const data = await res.json()
      setAiInsight(data.insight || data.content || data.result || 'Análise indisponível no momento.')
    } catch (_) {
      setAiInsight('Erro ao gerar análise. Verifique a configuração da API Anthropic.')
    }
    setLoadingAI(false)
  }

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const scoreColor = !metrics ? '' : metrics.healthScore >= 80 ? 'text-green-400' : metrics.healthScore >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = !metrics ? '' : metrics.healthScore >= 80 ? 'bg-green-500/10 border-green-500/20' : metrics.healthScore >= 60 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Central de Performance</h1>
            <p className="text-xs text-muted-foreground">{lastUpdate ? `Atualizado às ${lastUpdate}` : 'Carregando...'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAIInsight} disabled={loadingAI || loading}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 px-3 py-2 text-sm hover:bg-violet-500/30 transition-colors disabled:opacity-50">
            {loadingAI ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Análise IA
          </button>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Score de saúde */}
      {metrics && (
        <div className={`rounded-2xl border ${scoreBg} p-5 flex items-center justify-between`}>
          <div>
            <p className="text-sm font-semibold">Score de Saúde da Plataforma</p>
            <p className="text-xs text-muted-foreground mt-0.5">Baseado em engajamento, mercados e finanças</p>
          </div>
          <div className="text-right">
            <p className={`text-4xl font-black ${scoreColor}`}>{metrics.healthScore}</p>
            <p className="text-xs text-muted-foreground">/100</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Usuários Ativos 7d', value: metrics.activeUsers7d, sub: `${metrics.newUsers7d} novos`, up: metrics.newUsers7d > 0, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { icon: Activity, label: 'Volume 7d', value: fmt(metrics.volume7d), sub: `${metrics.openMarkets} mercados abertos`, up: metrics.volume7d > 0, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
            { icon: DollarSign, label: 'Lucro 7d', value: fmt(metrics.platformProfit7d), sub: `IR retido: ${fmt(metrics.irRetido7d)}`, up: metrics.platformProfit7d > 0, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { icon: Shield, label: 'Risco de Churn', value: metrics.churnRisk, sub: `usuários sem apostar 7d`, up: false, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-xl border ${kpi.bg} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.up ? <ArrowUpRight className="h-3.5 w-3.5 text-green-400" /> : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />}
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-muted-foreground/60">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alertas */}
      {metrics && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertas e Recomendações</p>
          {metrics.alerts.map((a, i) => (
            <div key={i} className={`rounded-xl border p-3 flex items-start gap-2 ${
              a.level === 'critical' ? 'border-red-500/30 bg-red-500/5' :
              a.level === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
              'border-green-500/30 bg-green-500/5'
            }`}>
              {a.level === 'good'
                ? <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                : <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${a.level === 'critical' ? 'text-red-400' : 'text-yellow-400'}`} />}
              <p className="text-sm">{a.msg}</p>
            </div>
          ))}
        </div>
      )}

      {/* Análise IA */}
      {aiInsight && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <p className="text-sm font-semibold text-violet-400">Análise IA — Ações Prioritárias</p>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiInsight}</p>
        </div>
      )}

      {/* Métricas detalhadas */}
      {metrics && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mercados</p>
            {[
              { label: 'Total de mercados', value: metrics.totalMarkets },
              { label: 'Abertos agora', value: metrics.openMarkets },
              { label: 'Resolvidos hoje', value: metrics.resolvedToday },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financeiro</p>
            {[
              { label: 'Saques pendentes', value: metrics.pendingWithdrawals, alert: metrics.pendingWithdrawals > 5 },
              { label: 'IR retido (7d)', value: fmt(metrics.irRetido7d) },
              { label: 'Volume total (7d)', value: fmt(metrics.volume7d) },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className={`text-sm font-bold ${(m as any).alert ? 'text-amber-400' : ''}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}
