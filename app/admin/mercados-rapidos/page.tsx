'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Plus, CheckCircle, Loader2, RefreshCw, TrendingUp, TrendingDown, Sparkles, User } from 'lucide-react'
import { ImageUploadButton } from '@/components/ui/ImageUploadButton'

const ASSET_GROUPS = [
  {
    label: '₿ Cripto',
    assets: [
      { id: 'bitcoin',      symbol: 'BTC',  name: 'Bitcoin',   ws: 'btcbrl' },
      { id: 'ethereum',     symbol: 'ETH',  name: 'Ethereum',  ws: 'ethbrl' },
      { id: 'solana',       symbol: 'SOL',  name: 'Solana',    ws: 'solbrl' },
      { id: 'binancecoin',  symbol: 'BNB',  name: 'BNB',       ws: 'bnbbrl' },
      { id: 'ripple',       symbol: 'XRP',  name: 'XRP',       ws: 'xrpbrl' },
      { id: 'dogecoin',     symbol: 'DOGE', name: 'Dogecoin',  ws: 'dogebrl' },
      { id: 'cardano',      symbol: 'ADA',  name: 'Cardano',   ws: 'adabrl' },
      { id: 'avalanche-2',  symbol: 'AVAX', name: 'Avalanche', ws: 'avaxbrl' },
      { id: 'matic-network',symbol: 'MATIC',name: 'Polygon',   ws: 'maticbrl' },
      { id: 'chainlink',    symbol: 'LINK', name: 'Chainlink', ws: 'linkbrl' },
    ],
  },
  {
    label: '📊 Bolsa BR',
    assets: [
      { id: 'IBOV',  symbol: 'IBOV',  name: 'Ibovespa',  ws: null },
      { id: 'PETR4', symbol: 'PETR4', name: 'Petrobras', ws: null },
      { id: 'VALE3', symbol: 'VALE3', name: 'Vale',      ws: null },
      { id: 'BBDC4', symbol: 'BBDC4', name: 'Bradesco',  ws: null },
      { id: 'ITUB4', symbol: 'ITUB4', name: 'Itaú',      ws: null },
      { id: 'BBAS3', symbol: 'BBAS3', name: 'Banco do Brasil', ws: null },
    ],
  },
  {
    label: '🌾 Agro BR (B3)',
    assets: [
      { id: 'JBSS3',  symbol: 'JBSS3',  name: 'JBS (Boi Gordo)',    ws: null },
      { id: 'MRFG3',  symbol: 'MRFG3',  name: 'Marfrig (Boi)',      ws: null },
      { id: 'AGRO3',  symbol: 'AGRO3',  name: 'BrasilAgro (Soja)',  ws: null },
      { id: 'SLCE3',  symbol: 'SLCE3',  name: 'SLC Agrícola',       ws: null },
      { id: 'SMTO3',  symbol: 'SMTO3',  name: 'São Martinho (Cana)',ws: null },
      { id: 'CAML3',  symbol: 'CAML3',  name: 'Camil (Alimentos)',  ws: null },
    ],
  },
  {
    label: '🛢️ Commodities & Forex',
    assets: [
      { id: 'USD',    symbol: 'USD',   name: 'Dólar (BRL)',   ws: null },
      { id: 'EUR',    symbol: 'EUR',   name: 'Euro (BRL)',    ws: null },
      { id: 'GBP',    symbol: 'GBP',   name: 'Libra (BRL)',   ws: null },
      { id: 'GOLD',   symbol: 'OURO',  name: 'Ouro (oz)',     ws: null },
      { id: 'SILVER', symbol: 'PRATA', name: 'Prata (oz)',    ws: null },
      { id: 'WTI',    symbol: 'WTI',   name: 'Petróleo WTI', ws: null },
    ],
  },
]

const ALL_ASSETS = ASSET_GROUPS.flatMap(g => g.assets)

interface RapidMarket { id: string; title: string; status: string; closes_at: string; rapid_config: any }

export default function AdminRapidMarketsPage() {
  const [markets, setMarkets] = useState<RapidMarket[]>([])
  const [prices, setPrices] = useState<Record<string, { value: number; change: number }>>({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [influencers, setInfluencers] = useState<{id:string,name:string}[]>([])
  const [generatingCover, setGeneratingCover] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const [form, setForm] = useState({
    asset: 'bitcoin',
    duration: '5',
    up_label: 'Sobe',
    down_label: 'Desce',
    custom_title: '',
    image_url: '',
    influencer_id: '',
    ai_description: '',
  })

  const selectedAsset = ALL_ASSETS.find(a => a.id === form.asset) || ALL_ASSETS[0]
  const currentPrice = prices[form.asset]

  useEffect(() => {
    loadMarkets()
    fetchAllPrices()
    createClient().from('influencers').select('id, name').eq('is_active', true)
      .then(({ data }) => setInfluencers(data || []))
  }, [])

  // Binance WebSocket para cripto em tempo real
  useEffect(() => {
    const cryptoAssets = ALL_ASSETS.filter(a => a.ws)
    if (!cryptoAssets.length) return

    const streams = cryptoAssets.map(a => `${a.ws}@miniTicker`).join('/')
    const wsUrl = `wss://stream.binance.com/stream?streams=${streams}`

    const connect = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const { data: d } = JSON.parse(e.data)
          const sym = d.s?.replace('BRL', '').toLowerCase()
          const asset = cryptoAssets.find(a => a.ws === sym + 'brl' || a.symbol.toLowerCase() === sym)
          if (asset && d.c) {
            const value = parseFloat(d.c)
            setPrices(prev => ({
              ...prev,
              [asset.id]: { value, change: prev[asset.id]?.change || 0 }
            }))
          }
        } catch (_) {}
      }

      ws.onerror = () => ws.close()
      ws.onclose = () => setTimeout(connect, 3000) // reconectar
    }

    connect()
    return () => { wsRef.current?.close() }
  }, [])

  async function loadMarkets() {
    const { data } = await createClient().from('markets')
      .select('id, title, status, closes_at, rapid_config')
      .eq('market_type', 'rapid').order('created_at', { ascending: false }).limit(30)
    setMarkets(data || [])
  }

  const fetchAllPrices = useCallback(async () => {
    setPriceLoading(true)
    try {
      const res = await fetch('/api/prices', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPrices(prev => {
          const next = { ...prev }
          for (const [id, v] of Object.entries(data as any)) {
            next[id] = { value: (v as any).value, change: (v as any).change }
          }
          return next
        })
      }
    } catch (_) {}
    setPriceLoading(false)
  }, [])

  // Polling para não-cripto a cada 10s
  useEffect(() => {
    const interval = setInterval(fetchAllPrices, 10000)
    return () => clearInterval(interval)
  }, [fetchAllPrices])

  async function generateAICover() {
    setGeneratingCover(true)
    try {
      const fd = new FormData()
      fd.append('description', `Mercado preditivo: ${selectedAsset.name} — ${form.custom_title || `${selectedAsset.symbol} sobe ou desce?`}`)
      const res = await fetch('/api/admin/ai-cover', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.image_url) setForm(f => ({ ...f, image_url: data.image_url }))
      else if (data.error) setMsg(`❌ Capa IA: ${data.error}`)
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    setGeneratingCover(false)
  }

  async function generateAIAnalysis() {
    setGeneratingAI(true)
    try {
      const prompt = `Gere uma análise curta e impactante para um mercado preditivo sobre: ${selectedAsset.name} (${selectedAsset.symbol}). Pergunta: ${form.custom_title || `${selectedAsset.symbol} vai subir ou cair nos próximos ${form.duration} minutos?`}. Preço atual: R$ ${currentPrice?.value?.toLocaleString('pt-BR') || 'N/A'}. Máximo 3 frases.`
      const res = await fetch('/api/admin/ai-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      if (data.error) { setMsg(`❌ IA: ${data.error}`); return }
      // API retorna {market: {description, title, ...}}
      const desc = data.market?.description || data.content || data.result || ''
      if (desc) setForm(f => ({ ...f, ai_description: desc }))
      else setMsg('❌ IA não retornou descrição')
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    setGeneratingAI(false)
  }

  async function handleCreate() {
    setCreating(true); setMsg('')
    if (!currentPrice?.value) {
      setMsg('❌ Preço não disponível. Aguarde ou escolha outro ativo.')
      setCreating(false); return
    }
    try {
      const supa = createClient()
      const asset_symbol = selectedAsset.symbol
      const duration_minutes = parseInt(form.duration)
      const now = new Date()
      const closesAt = new Date(now.getTime() + duration_minutes * 60000)
      const resolvesAt = new Date(closesAt.getTime() + 60000)
      const slug = `${asset_symbol.toLowerCase()}-${Date.now().toString(36)}`
      const title = form.custom_title || `${asset_symbol} (${duration_minutes}min): ${form.up_label} ou ${form.down_label}?`
      const description = form.ai_description || `Preço inicial: R$ ${currentPrice?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`

      const insertData: any = {
        title, slug, description, category: 'Cripto',
        status: 'open', market_type: 'rapid',
        closes_at: closesAt.toISOString(), resolves_at: resolvesAt.toISOString(),
        rapid_config: { asset: form.asset, asset_symbol, vs_currency: 'brl', duration_minutes, price_at_creation: currentPrice.value },
      }
      if (form.image_url) insertData.image_url = form.image_url
      if (form.influencer_id) insertData.influencer_id = form.influencer_id

      const { data: market, error: mErr } = await supa.from('markets').insert(insertData).select().single()
      if (mErr) throw new Error(mErr.message)

      await supa.from('market_options').insert([
        { market_id: market.id, label: form.up_label || 'Sobe', option_key: 'yes', probability: 0.50, odds: 1.90, sort_order: 0, is_active: true },
        { market_id: market.id, label: form.down_label || 'Desce', option_key: 'no', probability: 0.50, odds: 1.90, sort_order: 1, is_active: true },
      ])

      setMsg(`✅ Criado! ${asset_symbol} a R$ ${currentPrice?.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '?'} por ${duration_minutes}min`)
      setForm(f => ({ ...f, custom_title: '', image_url: '', ai_description: '', influencer_id: '' }))
      loadMarkets()
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    setCreating(false)
  }

  async function handleResolve(id: string) {
    setResolving(id)
    try {
      const { data: { session } } = await createClient().auth.getSession()
      const res = await fetch('/api/admin/rapid-markets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ market_id: id })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMsg(`✅ Resolvido! ${data.winner} (${data.change_pct}%)`)
      loadMarkets()
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    setResolving(null)
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Mercados Rápidos</h1>
          <p className="text-xs text-muted-foreground">Preços cripto via Binance WebSocket (tempo real)</p>
        </div>
        <button onClick={fetchAllPrices} disabled={priceLoading} className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`h-3.5 w-3.5 ${priceLoading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      {/* Painel de preços */}
      <div className="space-y-3">
        {ASSET_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
              {group.assets.map(asset => {
                const p = prices[asset.id]
                const isSelected = form.asset === asset.id
                return (
                  <button key={asset.id} onClick={() => setForm(f => ({ ...f, asset: asset.id }))}
                    className={`rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{asset.symbol}</span>
                      {p && <span className={`text-[10px] flex items-center gap-0.5 ${p.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(p.change).toFixed(2)}%
                      </span>}
                    </div>
                    {p ? <p className="text-xs font-mono">R$ {(p.value||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: (p.value||0) > 10 ? 2 : 6 })}</p>
                      : <div className="h-3 w-14 bg-muted animate-pulse rounded" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <p className="text-sm font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Criar mercado rápido</p>

        <div className="rounded-xl border border-primary/30 bg-card px-4 py-3 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Ativo selecionado</p><p className="font-semibold">{selectedAsset.symbol} — {selectedAsset.name}</p></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Preço atual</p>
            {currentPrice ? <p className="font-mono font-bold text-primary">R$ {currentPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              : <p className="text-xs text-muted-foreground">não disponível</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Duração</label>
            <select className={inp} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
              {['1','2','5','10','15','30','60'].map(d => <option key={d} value={d}>{d === '60' ? '1 hora' : `${d} minutos`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Pergunta customizada (opcional)</label>
            <input className={inp} placeholder={`${selectedAsset.symbol} sobe ou desce?`}
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

        {/* Influencer */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><User className="h-3 w-3" /> Influencer (opcional)</label>
          <select className={inp} value={form.influencer_id} onChange={e => setForm(f => ({ ...f, influencer_id: e.target.value }))}>
            <option value="">Nenhum</option>
            {influencers.map(inf => <option key={inf.id} value={inf.id}>{inf.name}</option>)}
          </select>
        </div>

        {/* Imagem de capa */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">Imagem de capa</label>
            <button onClick={generateAICover} disabled={generatingCover} type="button"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
              {generatingCover ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Gerar com IA
            </button>
          </div>
          <ImageUploadButton value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
        </div>

                {/* Análise IA */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" /> Análise IA (descrição)</label>
            <button onClick={generateAIAnalysis} disabled={generatingAI}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
              {generatingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Gerar
            </button>
          </div>
          <textarea className={inp + ' resize-none'} rows={3}
            placeholder="Descrição/análise do mercado (opcional — gerada por IA)"
            value={form.ai_description} onChange={e => setForm(f => ({ ...f, ai_description: e.target.value }))} />
        </div>

        {/* Preview */}
        <div className="rounded-xl bg-muted/40 border border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span className="text-foreground font-medium">Título: </span>
          {form.custom_title || `${selectedAsset.symbol} (${form.duration}min): ${form.up_label} ou ${form.down_label}?`}
          {currentPrice && <span className="ml-2 text-primary font-mono">· R$ {currentPrice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
        </div>

        {msg && <p className={`text-sm font-medium ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}

        <button onClick={handleCreate} disabled={creating || !currentPrice}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          Criar mercado rápido
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mercados recentes</p>
        {markets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">Nenhum mercado rápido criado ainda</div>
        ) : markets.map(m => {
          const cfg = m.rapid_config || {}
          const expired = m.status === 'open' && new Date(m.closes_at) < new Date()
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {cfg.asset_symbol} · R$ {Number(cfg.price_at_creation||0).toLocaleString('pt-BR', {minimumFractionDigits:2})}
                  {' · '}{new Date(m.closes_at).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  m.status === 'resolved' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                  expired ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                  'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                  {m.status === 'resolved' ? '✓ Resolvido' : expired ? '⏰ Expirado' : '🔴 Ao vivo'}
                </span>
                {m.status !== 'resolved' && (
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
