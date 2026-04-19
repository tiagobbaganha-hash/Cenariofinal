'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, Users, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Target, Zap, BarChart3, ArrowRight } from 'lucide-react'

interface Insight {
  resumo_executivo: string
  alertas: Array<{ nivel: 'critico' | 'atencao' | 'positivo'; mensagem: string }>
  mercados_sugeridos: Array<{
    titulo: string
    categoria: string
    justificativa: string
    potencial_volume: 'baixo' | 'medio' | 'alto' | 'muito_alto'
    urgencia: 'hoje' | 'esta_semana' | 'este_mes'
  }>
  insights_usuarios: { retencao: string; acao_recomendada: string }
  insights_mercados: { categoria_destaque: string; mercados_para_encerrar: string; acao_recomendada: string }
  insights_receita: { projecao_30_dias: string; acao_recomendada: string }
  score_saude_plataforma: number
  prioridade_semana: string
}

const URGENCIA_LABEL: Record<string, string> = {
  hoje: '🔴 Hoje',
  esta_semana: '🟡 Esta semana',
  este_mes: '🟢 Este mês',
}
const VOLUME_LABEL: Record<string, string> = {
  baixo: '📊 Baixo',
  medio: '📈 Médio',
  alto: '🚀 Alto',
  muito_alto: '💥 Muito alto',
}
const ALERTA_STYLE: Record<string, string> = {
  critico: 'border-red-500/30 bg-red-500/10 text-red-300',
  atencao: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  positivo: 'border-green-500/30 bg-green-500/10 text-green-300',
}
const ALERTA_ICON: Record<string, any> = {
  critico: AlertTriangle,
  atencao: AlertTriangle,
  positivo: CheckCircle,
}

export default function AIDashboardPage() {
  const [insights, setInsights] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(true)
  const [cached, setCached] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')

  async function load(force = false) {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-insights' + (force ? '?refresh=1' : ''))
      const data = await res.json()
      if (data.insights) {
        setInsights(data.insights)
        setCached(data.cached)
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const score = insights?.score_saude_plataforma || 0
  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              Dashboard IA <Sparkles className="h-4 w-4 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">
              {cached ? `Cache · ${lastUpdate}` : `Atualizado · ${lastUpdate}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-card/80 text-sm text-muted-foreground transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading && !insights && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Analisando plataforma com IA...</p>
          <p className="text-xs text-muted-foreground/50">Isso pode levar alguns segundos</p>
        </div>
      )}

      {insights && (
        <>
          {/* Score + Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Health Score */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Saúde da Plataforma</p>
              <div className="flex items-end gap-3 mb-3">
                <span className={`text-5xl font-bold ${scoreColor}`}>{score}</span>
                <span className="text-muted-foreground mb-1">/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${scoreBg}`} style={{ width: `${score}%` }} />
              </div>
            </div>
            {/* Prioridade */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2">🎯 Prioridade da Semana</p>
              <p className="text-sm font-medium text-foreground leading-snug">{insights.prioridade_semana}</p>
              <div className="mt-3 h-px bg-primary/20" />
              <p className="text-xs text-muted-foreground mt-3">{insights.resumo_executivo}</p>
            </div>
          </div>

          {/* Alertas */}
          {insights.alertas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertas</p>
              {insights.alertas.map((a, i) => {
                const Icon = ALERTA_ICON[a.nivel]
                return (
                  <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${ALERTA_STYLE[a.nivel]}`}>
                    <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {a.mensagem}
                  </div>
                )
              })}
            </div>
          )}

          {/* Grid insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Usuários */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <p className="text-sm font-semibold text-foreground">Usuários</p>
              </div>
              <p className="text-xs text-muted-foreground">{insights.insights_usuarios.retencao}</p>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                <p className="text-xs text-blue-300 font-medium">Ação: {insights.insights_usuarios.acao_recomendada}</p>
              </div>
            </div>

            {/* Mercados */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-400" />
                <p className="text-sm font-semibold text-foreground">Mercados</p>
              </div>
              <p className="text-xs text-muted-foreground">Destaque: <span className="text-green-400 font-medium">{insights.insights_mercados.categoria_destaque}</span></p>
              <p className="text-xs text-muted-foreground">{insights.insights_mercados.mercados_para_encerrar}</p>
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
                <p className="text-xs text-green-300 font-medium">Ação: {insights.insights_mercados.acao_recomendada}</p>
              </div>
            </div>

            {/* Receita */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <p className="text-sm font-semibold text-foreground">Receita</p>
              </div>
              <p className="text-xs text-muted-foreground">{insights.insights_receita.projecao_30_dias}</p>
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
                <p className="text-xs text-orange-300 font-medium">Ação: {insights.insights_receita.acao_recomendada}</p>
              </div>
            </div>
          </div>

          {/* Mercados Sugeridos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Mercados Sugeridos pela IA</p>
            </div>
            <div className="grid gap-3">
              {insights.mercados_sugeridos.map((m, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground leading-snug">{m.titulo}</p>
                        <span className="text-xs text-muted-foreground">{m.categoria}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs">{URGENCIA_LABEL[m.urgencia]}</span>
                      <span className="text-xs text-muted-foreground">{VOLUME_LABEL[m.potencial_volume]}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-10">{m.justificativa}</p>
                  <div className="mt-3 pl-10">
                    <a
                      href={`/admin/mercados/novo?title=${encodeURIComponent(m.titulo)}`}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      Criar este mercado <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
