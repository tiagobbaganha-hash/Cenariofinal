'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Zap, Plus, CheckCircle, Loader2, RefreshCw } from 'lucide-react'

const ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
]

interface RapidMarket {
  id: string; title: string; status: string; closes_at: string
  rapid_config: any
}

export default function AdminRapidMarketsPage() {
  const [markets, setMarkets] = useState<RapidMarket[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [creating, setCreating] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [form, setForm] = useState({ asset: 'bitcoin', duration: '5', up_label: 'Sobe', down_label: 'Desce' })
  const [msg, setMsg] = useState('')

  useEffect(() => { loadMarkets(); fetchPrices() }, [])

  async function loadMarkets() {
    const supabase = createClient()
    const { data } = await supabase.from('markets').select('id, title, status, closes_at, rapid_config')
      .eq('market_type', 'rapid').order('created_at', { ascending: false }).limit(20)
    setMarkets(data || [])
  }

  async function fetchPrices() {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=brl')
      const data = await res.json()
      const p: Record<string, number> = {}
      for (const [k, v] of Object.entries(data)) p[k] = (v as any).brl
      setPrices(p)
    } catch (_) {}
  }

  async function handleCreate() {
    setCreating(true); setMsg('')
    const asset = ASSETS.find(a => a.id === form.asset)!
    const price = prices[form.asset]
    if (!price) { setMsg('Não foi possível obter o preço. Tente novamente.'); setCreating(false); return }
    try {
      const supa = createClient()
      const { data: { session } } = await supa.auth.getSession()
      const tok = session?.access_token || ''
      const res = await fetch('/api/admin/rapid-markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({
          asset: form.asset, asset_symbol: asset.symbol,
          price_at_creation: price, duration_minutes: parseInt(form.duration),
          up_label: form.up_label, down_label: form.down_label,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMsg(`✅ Mercado criado! ${asset.symbol} a R$ ${price.toLocaleString('pt-BR')} por ${form.duration} min`)
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
      setMsg(`✅ Resolvido! ${data.winner} (${data.change_pct}%) · Inicial: R$${data.initial_price?.toFixed(2)} → Final: R$${data.final_price?.toFixed(2)}`)
      loadMarkets()
    } catch (e: any) { setMsg(`❌ ${e.message}`) }
    finally { setResolving(null) }
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20"><Zap className="h-4 w-4 text-primary" /></div>
        <h1 className="text-xl font-bold">Mercados Rápidos</h1>
      </div>

      {/* Criar mercado */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Criar novo mercado rápido</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Ativo</label>
            <select className={inp} value={form.asset} onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}>
              {ASSETS.map(a => <option key={a.id} value={a.id}>{a.symbol} — {a.name} {prices[a.id] ? `(R$ ${prices[a.id].toLocaleString('pt-BR')})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Duração (minutos)</label>
            <select className={inp} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
              {['2', '5', '10', '15', '30'].map(d => <option key={d} value={d}>{d} minutos</option>)}
            </select>
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

        {prices[form.asset] && (
          <div className="rounded-xl bg-card border border-border px-4 py-2.5 text-xs text-muted-foreground">
            Preço inicial: <span className="text-foreground font-semibold font-mono">R$ {prices[form.asset].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            {' · '}Resolução automática: o mercado se resolve quando fechar, baseado no preço atual
          </div>
        )}

        {msg && <p className={`text-sm font-medium ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}

        <div className="flex gap-2">
          <button onClick={fetchPrices} className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar preços
          </button>
          <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar mercado
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mercados recentes</p>
        {markets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">Nenhum mercado rápido criado ainda</div>
        ) : markets.map(m => {
          const cfg = m.rapid_config || {}
          const isOpen = m.status === 'open'
          const expired = isOpen && new Date(m.closes_at) < new Date()
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-foreground">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {cfg.asset_symbol} · Preço inicial: R$ {Number(cfg.price_at_creation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {cfg.final_price && ` → R$ ${Number(cfg.final_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  m.status === 'resolved' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                  expired ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                  'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                  {m.status === 'resolved' ? 'Resolvido' : expired ? 'Expirado' : 'Ao vivo'}
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
