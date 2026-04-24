'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Play, CheckCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'

export default function ResolucaoPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [manualMarketId, setManualMarketId] = useState('')
  const [manualOptionId, setManualOptionId] = useState('')
  const [markets, setMarkets] = useState<any[]>([])
  const [marketOptions, setMarketOptions] = useState<any[]>([])
  const [loadingMarkets, setLoadingMarkets] = useState(false)

  async function runCron() {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/cron/resolve-markets', {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev'}` }
      })
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally { setRunning(false) }
  }

  useEffect(() => { loadOpenMarkets() }, [])

  async function loadOpenMarkets() {
    setLoadingMarkets(true)
    const supabase = createClient()
    const { data } = await supabase.from('markets')
      .select('id, title, status, closes_at, result_option_id, market_options(id, label, option_key)')
      .in('status', ['open', 'closed'])
      .order('created_at', { ascending: false })
      .limit(50)
    setMarkets(data || [])
    setLoadingMarkets(false)
  }

  async function resolveManual() {
    if (!manualMarketId || !manualOptionId) return
    setRunning(true)
    try {
      const supabase = createClient()
      // Usar RPC admin_settle_market que liquida tudo corretamente (enums, comissão, IR)
      const { data, error } = await supabase.rpc('admin_settle_market', {
        p_market_id: manualMarketId,
        p_result_option_id: manualOptionId,
        p_note: 'Resolvido manualmente pelo admin',
      })
      if (error) throw new Error(error.message)
      setResult({
        ok: true,
        message: `✅ Mercado resolvido! ${data?.winners || 0} vencedores, ${data?.losers || 0} perdedores. Apostas liquidadas.`,
        ...data
      })
      loadOpenMarkets()
    } catch (e: any) {
      setError(e.message)
    } finally { setRunning(false) }
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Resolução de Mercados</h1>
          <p className="text-xs text-muted-foreground">Cron automático roda a cada 5 minutos no Vercel</p>
        </div>
      </div>

      {/* Status do Cron */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">⚡ Cron Automático</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vercel Cron · /api/cron/resolve-markets · a cada 5 min
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Ativo
          </span>
        </div>

        <div className="rounded-xl border border-border bg-background/50 p-3 text-xs text-muted-foreground space-y-1">
          <p>✅ <strong className="text-foreground">Fecha apostas</strong> — mercados que passaram do closes_at</p>
          <p>✅ <strong className="text-foreground">Resolve rápidos</strong> — compara preço atual vs inicial (CoinGecko)</p>
          <p>✅ <strong className="text-foreground">Liquida apostas</strong> — credita ganhos, notifica usuários</p>
          <p>✅ <strong className="text-foreground">Notificações automáticas</strong> — 🏆 ganhou / ❌ perdeu</p>
        </div>

        <button onClick={runCron} disabled={running}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? 'Executando...' : 'Executar Agora'}
        </button>

        {result && (
          <div className={`rounded-xl border p-3 text-xs ${result.ok ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
            {result.ok ? (
              <>
                <p className="font-semibold mb-1">✅ Executado com sucesso</p>
                {result.processed?.length > 0 ? (
                  result.processed.map((r: any, i: number) => (
                    <p key={i} className="text-muted-foreground">• {r.step}: {r.market || ''} {r.winner ? `→ ${r.winner}` : ''} {r.orders ? `(${r.orders} apostas, ${r.wins} ganhos)` : ''}</p>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhuma ação necessária neste momento.</p>
                )}
                {result.message && <p>{result.message}</p>}
              </>
            ) : (
              <p>❌ {result.error}</p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">❌ {error}</div>
        )}
      </div>

      {/* Resolução manual */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">🎯 Resolução Manual</p>
          <button onClick={loadOpenMarkets} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:text-foreground transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loadingMarkets ? 'animate-spin' : ''}`} />
            Carregar mercados
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Mercado a Resolver</label>
            {markets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Clique em "Carregar mercados" acima →</p>
            ) : (
              <select className={inp} value={manualMarketId} onChange={e => {
                const id = e.target.value
                setManualMarketId(id)
                setManualOptionId('')
                const m = markets.find(m => m.id === id)
                setMarketOptions((m as any)?.market_options || [])
              }}>
                <option value="">— Selecione um mercado —</option>
                {markets.map(m => (
                  <option key={m.id} value={m.id}>
                    [{m.status}] {m.title?.slice(0, 70)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Opção Vencedora</label>
            <select className={inp} value={manualOptionId} onChange={e => setManualOptionId(e.target.value)}
              disabled={!manualMarketId || marketOptions.length === 0}>
              <option value="">— Selecione a opção vencedora —</option>
              {marketOptions.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.label} ({o.option_key})
                </option>
              ))}
              {manualMarketId && marketOptions.length === 0 && (
                <option disabled>Nenhuma opção encontrada</option>
              )}
            </select>
          </div>
        </div>

        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-400">Após definir a opção vencedora, clique em "Executar Agora" acima para liquidar as apostas imediatamente.</p>
        </div>

        <button onClick={resolveManual} disabled={!manualMarketId || !manualOptionId || running}
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary disabled:opacity-50 hover:bg-primary/20 transition-colors">
          <CheckCircle className="h-4 w-4" />
          Definir vencedor
        </button>
      </div>
    </div>
  )
}
