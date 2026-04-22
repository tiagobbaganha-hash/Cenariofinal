'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Plus, CheckCircle, Loader2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'

// ─── ATIVOS POR CATEGORIA ───────────────────────────────────────────────────
const ASSET_GROUPS = [
  {
    label: '₿ Cripto',
    assets: [
      { id: 'bitcoin',     symbol: 'BTC',  name: 'Bitcoin',   source: 'coingecko' },
      { id: 'ethereum',    symbol: 'ETH',  name: 'Ethereum',  source: 'coingecko' },
      { id: 'solana',      symbol: 'SOL',  name: 'Solana',    source: 'coingecko' },
      { id: 'binancecoin', symbol: 'BNB',  name: 'BNB',       source: 'coingecko' },
      { id: 'ripple',      symbol: 'XRP',  name: 'XRP',       source: 'coingecko' },
      { id: 'dogecoin',    symbol: 'DOGE', name: 'Dogecoin',  source: 'coingecko' },
    ],
  },
  {
    label: '📊 Bolsa BR',
    assets: [
      { id: 'IBOV',  symbol: 'IBOV',  name: 'Ibovespa',  source: 'hgbrasil' },
      { id: 'PETR4', symbol: 'PETR4', name: 'Petrobras', source: 'hgbrasil' },
      { id: 'VALE3', symbol: 'VALE3', name: 'Vale',      source: 'hgbrasil' },
      { id: 'BBDC4', symbol: 'BBDC4', name: 'Bradesco',  source: 'hgbrasil' },
    ],
  },
  {
    label: '🛢️ Commodities',
    assets: [
      { id: 'WTI',   symbol: 'WTI',  name: 'Petróleo WTI',  source: 'awesomeapi' },
      { id: 'GOLD',  symbol: 'OURO', name: 'Ouro (oz)',      source: 'awesomeapi' },
      { id: 'USD',   symbol: 'USD',  name: 'Dólar (BRL)',    source: 'awesomeapi' },
      { id: 'EUR',   symbol: 'EUR',  name: 'Euro (BRL)',     source: 'awesomeapi' },
    ],
  },
]

const ALL_ASSETS = ASSET_GROUPS.flatMap(g => g.assets)

interface RapidMarket {
  id: string; title: string; status: string; closes_at: string
  rapid_config: any
}

export default function AdminRapidMarketsPage() {
  const [markets, setMarkets] = useState<RapidMarket[]>([])
  const [prices, setPrices] = useState<Record<string, { value: number; change: number }>>({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [form, setForm] = useState({
    asset: 'bitcoin',
    duration: '5',
    up_label: 'Sobe',
    down_label: 'Desce',
    custom_title: '',
  })
  const [msg, setMsg] = useState('')

  const selectedAsset = ALL_ASSETS.find(a => a.id === form.asset) || ALL_ASSETS[0]
  const currentPrice = prices[form.asset]

  useEffect(() => { loadMarkets(); fetchAllPrices() }, [])

  async function loadMarkets() {
    const supabase = createClient()
    const { data } = await supabase.from('markets').select('id, title, status, closes_at, rapid_config')
      .eq('market_type', 'rapid').order('created_at', { ascending: false }).limit(30)
    setMarkets(data || [])
  }

  const fetchAllPrices = useCallback(async () => {
    setPriceLoading(true)
    try {
      // Proxy interno — evita CORS e rate limit do browser
      const res = await fetch('/api/prices', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const result: Record<string, { value: number; change: number }> = {}
        for (const [id, v] of Object.entries(data as any)) {
          result[id] = { value: (v as any).value, change: (v as any).change }
        }
        setPrices(result)
      }
    } catch (_) {}
    setPriceLoading(false)
  }, [])

  // Atualizar preços a cada 15s
  useEffect(() => {
    const interval = setInterval(fetchAllPrices, 15000)
    return () => clearInterval(interval)
  }, [fetchAllPrices])

  async function handleCreate() {
    setCreating(true); setMsg('')
    if (!currentPrice?.value) {
      setMsg('❌ Preço não disponível para este ativo. Tente outro ou atualize os preços.')
      setCreating(false); return
    }
    try {
      const supa = createClient()
      const { data: { session } } = await supa.auth.getSession()
      const tok = session?.access_token || ''
      const res = await fetch('/api/admin/rapid-markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({
          asset: form.asset,
          asset_symbol: selectedAsset.symbol,
          price_at_creation: currentPrice.value,
          duration_minutes: parseInt(form.duration),
          up_label: form.up_label,
          down_label: form.down_label,
          custom_title: form.custom_title || null,
          asset_source: selectedAsset.source,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const priceStr = currentPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      setMsg(`✅ Mercado criado! ${selectedAsset.symbol} a R$ ${priceStr} por ${form.duration} min`)
      loadMarkets()
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    finally { setCreating(false) }
  }

  async function handleResolve(id: string) {
    setResolving(id)
    try {
      const supa = createClient()
      const { data: { session } } = await supa.auth.getSession()
      const tok = session?.access_token || ''
      const res = await fetch('/api/admin/rapid-markets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({ market_id: id })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMsg(`✅ Resolvido! ${data.winner} (${data.change_pct}%) · R$${Number(data.initial_price).toFixed(2)} → R$${Number(data.final_price).toFixed(2)}`)
      loadMarkets()
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    finally { setResolving(null) }
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Mercados Rápidos</h1>
        <button onClick={fetchAllPrices} disabled={priceLoading}
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${priceLoading ? 'animate-spin' : ''}`} />
          Atualizar preços
        </button>
      </div>

      {/* Painel de preços ao vivo */}
      <div className="space-y-3">
        {ASSET_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.assets.map(asset => {
                const p = prices[asset.id]
                const isSelected = form.asset === asset.id
                return (
                  <button key={asset.id}
                    onClick={() => setForm(f => ({ ...f, asset: asset.id }))}
                    className={`rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{asset.symbol}</span>
                      {p && (
                        <span className={`text-[10px] font-medium flex items-center gap-0.5 ${p.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(p.change).toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {priceLoading && !p ? (
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    ) : p ? (
                      <p className="text-xs font-mono text-foreground">
                        R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: p.value > 100 ? 2 : 4 })}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">indisponível</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Formulário de criação */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4" /> Criar mercado rápido
        </p>

        {/* Ativo selecionado */}
        <div className="rounded-xl border border-primary/30 bg-card px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Ativo selecionado</p>
            <p className="font-semibold text-foreground">{selectedAsset.symbol} — {selectedAsset.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Preço atual</p>
            {currentPrice ? (
              <p className="font-mono font-bold text-primary">
                R$ {currentPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">não disponível</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Duração</label>
            <select className={inp} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
              {['2','5','10','15','30','60'].map(d => (
                <option key={d} value={d}>{d < '60' ? `${d} minutos` : '1 hora'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Pergunta customizada (opcional)</label>
            <input className={inp} placeholder={`${selectedAsset.symbol} sobe ou desce em ${form.duration}min?`}
              value={form.custom_title} onChange={e => setForm(f => ({ ...f, custom_title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Label "Sobe"</label>
            <input className={inp} value={form.up_label} onChange={e => setForm(f => ({ ...f, up_label: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Label "Desce"</label>
            <input className={inp} value={form.down_label} onChange={e => setForm(f => ({ ...f, down_label: e.target.value }))} />
          </div>
        </div>

        {/* Preview do título */}
        <div className="rounded-xl bg-muted/40 border border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span className="text-foreground font-medium">Título: </span>
          {form.custom_title || `${selectedAsset.symbol} (${form.duration}min): ${form.up_label} ou ${form.down_label}?`}
          {currentPrice && (
            <span className="ml-2 text-primary font-mono">· Inicial: R$ {currentPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          )}
        </div>

        {msg && <p className={`text-sm font-medium ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}

        <button onClick={handleCreate} disabled={creating || !currentPrice}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Criar mercado rápido
        </button>
      </div>

      {/* Lista de mercados */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mercados recentes</p>
        {markets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Nenhum mercado rápido criado ainda
          </div>
        ) : markets.map(m => {
          const cfg = m.rapid_config || {}
          const isOpen = m.status === 'open'
          const expired = isOpen && new Date(m.closes_at) < new Date()
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {cfg.asset_symbol} · Inicial: R$ {Number(cfg.price_at_creation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {cfg.final_price && ` → R$ ${Number(cfg.final_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  {' · '}{new Date(m.closes_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  m.status === 'resolved' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                  expired ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                  'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                  {m.status === 'resolved' ? '✓ Resolvido' : expired ? '⏰ Expirado' : '🔴 Ao vivo'}
                </span>
                {(expired || isOpen) && m.status !== 'resolved' && (
                  <button onClick={() => handleResolve(m.id)} disabled={resolving === m.id}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/20 border border-primary/30 px-3 py-1.5 text-xs text-primary hover:bg-primary/30 transition-colors disabled:opacity-50">
                    {resolving === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Resolver
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
