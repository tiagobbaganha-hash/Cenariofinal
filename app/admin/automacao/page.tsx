'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import { 
  Calendar, Brain, Zap, Clock, Play, Trash2, 
  Plus, Loader2, CheckCircle, RefreshCw, Newspaper,
  TrendingUp, Settings, ChevronDown, ChevronUp
} from 'lucide-react'

type Tab = 'scheduling' | 'ai_resolve' | 'news_feed' | 'amm'

export default function AutomacaoPage() {
  const [tab, setTab] = useState<Tab>('scheduling')

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <Settings className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Central de Automação</h1>
          <p className="text-xs text-muted-foreground">Scheduling, resolução por IA, feed de notícias e AMM dinâmico</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'scheduling', label: '📅 Agendamento', icon: Calendar },
          { id: 'ai_resolve', label: '🤖 Resolução IA', icon: Brain },
          { id: 'news_feed', label: '📰 Feed de Notícias', icon: Newspaper },
          { id: 'amm', label: '📊 AMM Config', icon: TrendingUp },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-border'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'scheduling' && <SchedulingPanel />}
      {tab === 'ai_resolve' && <AIResolvePanel />}
      {tab === 'news_feed' && <NewsFeedPanel />}
      {tab === 'amm' && <AMMPanel />}
    </div>
  )
}

// ─── SCHEDULING ─────────────────────────────────────────────
function SchedulingPanel() {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Política',
    publish_at: '', closes_at: '', resolves_at: '',
    resolution_source: '', ai_resolve: false,
    options: [{ label: 'Sim', option_key: 'yes', probability: 0.5, odds: 2.0 }, { label: 'Não', option_key: 'no', probability: 0.5, odds: 2.0 }]
  })

  useEffect(() => { loadSchedules() }, [])

  async function loadSchedules() {
    const supabase = createClient()
    const { data } = await supabase.from('market_schedules')
      .select('*').order('publish_at', { ascending: true }).limit(20)
    setSchedules(data || [])
    setLoading(false)
  }

  async function createSchedule() {
    if (!form.title || !form.publish_at || !form.closes_at) {
      toast({ type: 'error', title: 'Preencha todos os campos obrigatórios' }); return
    }
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('market_schedules').insert({
      title: form.title,
      description: form.description,
      category: form.category,
      publish_at: form.publish_at,
      closes_at: form.closes_at,
      resolves_at: form.resolves_at || form.closes_at,
      resolution_source: form.resolution_source,
      ai_resolve: form.ai_resolve,
      options: form.options,
      created_by: user?.id,
      status: 'scheduled'
    })
    if (error) { toast({ type: 'error', title: error.message }) }
    else { toast({ type: 'success', title: '✅ Mercado agendado!' }); setShowForm(false); loadSchedules() }
    setCreating(false)
  }

  async function publishNow(id: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/scheduling/publish-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ schedule_id: id })
    })
    const d = await res.json()
    if (d.error) toast({ type: 'error', title: d.error })
    else { toast({ type: 'success', title: '✅ Mercado publicado!' }); loadSchedules() }
  }

  async function cancelSchedule(id: string) {
    const supabase = createClient()
    await supabase.from('market_schedules').update({ status: 'cancelled' }).eq('id', id)
    loadSchedules()
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Mercados Agendados</p>
          <p className="text-xs text-muted-foreground">Mercados publicam automaticamente na data programada</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Agendar
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">📅 Novo mercado agendado</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Título do mercado *</label>
              <input className={inp} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Ex: Quem vence as eleições de 2026?" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">Descrição</label>
              <textarea className={inp} rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Contexto do mercado..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Categoria</label>
              <select className={inp} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {['Política', 'Esportes', 'Cripto', 'Entretenimento', 'Economia', 'Tecnologia', 'Geral'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Fonte de resolução</label>
              <input className={inp} value={form.resolution_source} onChange={e => setForm(f => ({...f, resolution_source: e.target.value}))} placeholder="Ex: TSE, FIFA, CoinGecko" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Publicar em *</label>
              <input type="datetime-local" className={inp} value={form.publish_at} onChange={e => setForm(f => ({...f, publish_at: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Fechar apostas em *</label>
              <input type="datetime-local" className={inp} value={form.closes_at} onChange={e => setForm(f => ({...f, closes_at: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Resolver em</label>
              <input type="datetime-local" className={inp} value={form.resolves_at} onChange={e => setForm(f => ({...f, resolves_at: e.target.value}))} />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button onClick={() => setForm(f => ({...f, ai_resolve: !f.ai_resolve}))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.ai_resolve ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.ai_resolve ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-foreground">Resolução automática por IA</span>
            </div>
          </div>

          {/* Opções */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Opções de resposta</p>
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input className={inp} value={opt.label} placeholder={`Opção ${i+1}`}
                  onChange={e => setForm(f => ({...f, options: f.options.map((o, j) => j === i ? {...o, label: e.target.value} : o)}))} />
                <input className="w-20 rounded-xl border border-border bg-background px-2 py-2 text-xs text-foreground focus:outline-none" type="number" step="0.01" value={opt.odds}
                  onChange={e => setForm(f => ({...f, options: f.options.map((o, j) => j === i ? {...o, odds: parseFloat(e.target.value)} : o)}))} />
                {i >= 2 && <button onClick={() => setForm(f => ({...f, options: f.options.filter((_, j) => j !== i)}))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
            {form.options.length < 6 && (
              <button onClick={() => setForm(f => ({...f, options: [...f.options, {label: '', option_key: `opt${f.options.length}`, probability: 0.5, odds: 2.0}]}))}
                className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar opção</button>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
            <button onClick={createSchedule} disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              {creating ? 'Agendando...' : 'Agendar mercado'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        : schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum mercado agendado ainda
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map(s => (
              <div key={s.id} className={`rounded-2xl border p-4 flex items-start gap-3 ${s.status === 'published' ? 'border-primary/20 bg-primary/5' : s.status === 'cancelled' ? 'border-border opacity-50' : 'border-border bg-card'}`}>
                <div className="text-xl flex-shrink-0">{s.status === 'published' ? '✅' : s.status === 'cancelled' ? '❌' : '📅'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                    <span>📅 Publica: {new Date(s.publish_at).toLocaleString('pt-BR')}</span>
                    <span>⏰ Fecha: {new Date(s.closes_at).toLocaleString('pt-BR')}</span>
                    {s.ai_resolve && <span className="text-primary">🤖 Auto-resolve IA</span>}
                  </div>
                </div>
                {s.status === 'scheduled' && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => publishNow(s.id)} className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-lg px-2 py-1.5 hover:bg-primary/30">
                      <Play className="h-3 w-3" /> Agora
                    </button>
                    <button onClick={() => cancelSchedule(s.id)} className="text-[10px] text-destructive border border-destructive/30 rounded-lg px-2 py-1.5 hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ─── AI RESOLVE ─────────────────────────────────────────────
function AIResolvePanel() {
  const { toast } = useToast()
  const [markets, setMarkets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const [{ data: mkt }, { data: lg }] = await Promise.all([
      supabase.from('markets').select('id, title, category, closes_at, status, resolution_source').in('status', ['open', 'closed']).order('closes_at').limit(20),
      supabase.from('ai_resolution_log').select('*').order('created_at', { ascending: false }).limit(10)
    ])
    setMarkets(mkt || [])
    setLogs(lg || [])
    setLoading(false)
  }

  async function resolveWithAI(marketId: string) {
    setResolving(marketId)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch('/api/admin/ai-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ market_id: marketId })
      })
      const d = await res.json()
      if (d.error) toast({ type: 'error', title: d.error })
      else toast({ type: 'success', title: `✅ Resolvido! Vencedor: ${d.winner_label} (confiança: ${Math.round((d.confidence||0)*100)}%)` })
      loadData()
    } catch (e: any) {
      toast({ type: 'error', title: e.message })
    }
    setResolving(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Resolução por IA (Claude)</p>
        <p className="text-xs text-muted-foreground">A IA pesquisa o resultado e resolve o mercado automaticamente com raciocínio explícito</p>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
        <div className="space-y-2">
          {markets.map(m => (
            <div key={m.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{m.title}</p>
                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span>{m.category}</span>
                  <span>•</span>
                  <span className={m.status === 'open' ? 'text-primary' : 'text-yellow-400'}>{m.status === 'open' ? '🟢 Aberto' : '🟡 Fechado'}</span>
                  {m.resolution_source && <span>• Fonte: {m.resolution_source}</span>}
                </div>
              </div>
              <button onClick={() => resolveWithAI(m.id)} disabled={resolving === m.id}
                className="flex items-center gap-1.5 flex-shrink-0 rounded-xl bg-primary/20 border border-primary/30 text-primary px-3 py-2 text-xs font-semibold hover:bg-primary/30 disabled:opacity-50">
                {resolving === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                {resolving === m.id ? 'Analisando...' : 'Resolver com IA'}
              </button>
            </div>
          ))}
        </div>
      )}

      {logs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Log de resoluções</p>
          {logs.map(l => (
            <div key={l.id} className="rounded-xl border border-border bg-card/50 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-primary font-semibold">{l.resolution_source}</span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
              </div>
              {l.ai_reasoning && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{l.ai_reasoning}</p>}
              {l.confidence && <p className="text-[10px] text-primary mt-1">Confiança: {Math.round(l.confidence * 100)}%</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NEWS FEED ───────────────────────────────────────────────
function NewsFeedPanel() {
  const { toast } = useToast()
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [topic, setTopic] = useState('')

  useEffect(() => { loadQueue() }, [])

  async function loadQueue() {
    const supabase = createClient()
    const { data } = await supabase.from('news_market_queue').select('*').order('created_at', { ascending: false }).limit(20)
    setQueue(data || [])
    setLoading(false)
  }

  async function generateFromTopic() {
    if (!topic.trim()) return
    setGenerating(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch('/api/admin/news-to-markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ topic, count: 5 })
      })
      const d = await res.json()
      if (d.error) toast({ type: 'error', title: d.error })
      else { toast({ type: 'success', title: `✅ ${d.created} mercados gerados da notícia!` }); setTopic(''); loadQueue() }
    } catch (e: any) { toast({ type: 'error', title: e.message }) }
    setGenerating(false)
  }

  async function approveAndPublish(item: any) {
    const supabase = createClient()
    const mkt = item.ai_generated_market
    if (!mkt) return
    const slug = mkt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '-' + Date.now().toString(36)
    const now = new Date()
    const { data: market } = await supabase.from('markets').insert({
      title: mkt.title, description: mkt.description, category: mkt.category,
      slug, status: 'open',
      closes_at: new Date(now.getTime() + (mkt.closes_at_days || 30) * 86400000).toISOString(),
      resolves_at: new Date(now.getTime() + (mkt.resolves_at_days || 37) * 86400000).toISOString(),
    }).select().single()
    if (market) {
      await supabase.from('market_options').insert(
        (mkt.options || []).map((o: any, i: number) => ({
          market_id: market.id, label: o.label, option_key: o.option_key || `opt${i}`,
          probability: o.probability || 0.5, odds: o.odds || 2.0, sort_order: i, is_active: true
        }))
      )
      await supabase.from('news_market_queue').update({ status: 'published', market_id: market.id }).eq('id', item.id)
      toast({ type: 'success', title: '✅ Mercado publicado!' })
      loadQueue()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Gerar mercados de notícias</p>
        <p className="text-xs text-muted-foreground">Cole uma manchete ou tópico e a IA gera mercados preditivos relevantes</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase">Manchete ou tópico</label>
        <textarea value={topic} onChange={e => setTopic(e.target.value)} rows={3}
          placeholder="Ex: Lula anuncia novo pacote econômico com corte de gastos de R$50 bilhões&#10;&#10;Ou: Copa do Mundo 2026 começa em junho com 48 seleções"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
        <button onClick={generateFromTopic} disabled={!topic.trim() || generating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
          {generating ? 'Gerando mercados...' : 'Gerar mercados com IA'}
        </button>
      </div>

      {loading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        : queue.map(item => (
          <div key={item.id} className={`rounded-2xl border p-4 space-y-3 ${item.status === 'published' ? 'border-primary/20 bg-primary/5 opacity-70' : 'border-border bg-card'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{item.source || 'Tópico manual'}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{item.headline}</p>
              </div>
              <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 ${item.status === 'published' ? 'bg-primary/20 text-primary' : item.status === 'rejected' ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {item.status === 'published' ? '✅ Publicado' : item.status === 'rejected' ? '❌ Rejeitado' : '⏳ Pendente'}
              </span>
            </div>

            {item.ai_generated_market && item.status === 'pending' && (
              <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2">
                <p className="text-xs font-bold text-foreground">{item.ai_generated_market.title}</p>
                <p className="text-[11px] text-muted-foreground">{item.ai_generated_market.description}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(item.ai_generated_market.options || []).map((o: any) => (
                    <span key={o.label} className="text-[10px] bg-muted rounded-full px-2 py-0.5">{o.label} ({Math.round((o.probability||0.5)*100)}%)</span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => approveAndPublish(item)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 text-xs font-semibold hover:bg-primary/30">
                    <CheckCircle className="h-3.5 w-3.5" /> Aprovar e publicar
                  </button>
                  <button onClick={async () => { const s = createClient(); await s.from('news_market_queue').update({ status: 'rejected' }).eq('id', item.id); loadQueue() }}
                    className="rounded-lg border border-destructive/30 text-destructive px-3 py-1.5 text-xs hover:bg-destructive/10">
                    Rejeitar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}

// ─── AMM CONFIG ──────────────────────────────────────────────
function AMMPanel() {
  const [markets, setMarkets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadMarkets() }, [])

  async function loadMarkets() {
    const supabase = createClient()
    const { data } = await supabase.from('markets')
      .select('id, title, status, total_volume, bet_count, market_options(id, label, option_key, probability, odds, total_staked, liquidity_pool)')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(10)
    setMarkets(data || [])
    setLoading(false)
  }

  async function seedLiquidity(marketId: string, amount: number) {
    const supabase = createClient()
    await supabase.from('market_options').update({ liquidity_pool: amount }).eq('market_id', marketId)
    loadMarkets()
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">AMM Dinâmico</p>
        <p className="text-xs text-muted-foreground">Odds atualizam automaticamente conforme apostas entram. Injete liquidez inicial para mercados novos.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">Como funciona o AMM</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>📊 <strong className="text-foreground">Fórmula:</strong> Odds = (Pool Total / Pool da Opção) × 0.95</p>
          <p>💧 <strong className="text-foreground">Liquidez inicial:</strong> R$100 por opção (configurável)</p>
          <p>⚡ <strong className="text-foreground">Atualização:</strong> A cada nova aposta, todas as odds são recalculadas</p>
          <p>🎯 <strong className="text-foreground">Margem:</strong> 5% para a plataforma embutido nas odds</p>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        : markets.map(m => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-shrink-0">
                <span>💰 R${m.total_volume?.toFixed(0) || 0}</span>
                <span>🎯 {m.bet_count || 0} apostas</span>
              </div>
            </div>
            <div className="space-y-2">
              {(m.market_options || []).map((opt: any) => {
                const pool = (parseFloat(opt.total_staked || 0) + parseFloat(opt.liquidity_pool || 100))
                const totalPool = (m.market_options || []).reduce((s: number, o: any) => s + parseFloat(o.total_staked || 0) + parseFloat(o.liquidity_pool || 100), 0)
                const pct = totalPool > 0 ? Math.round(pool / totalPool * 100) : 50
                return (
                  <div key={opt.id} className="flex items-center gap-3">
                    <span className="text-xs text-foreground w-20 truncate">{opt.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-primary w-10 text-right">{Number(opt.odds).toFixed(2)}x</span>
                    <span className="text-[10px] text-muted-foreground w-8">{pct}%</span>
                    <span className="text-[10px] text-muted-foreground">R${pool.toFixed(0)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 pt-1">
              {[50, 100, 500].map(v => (
                <button key={v} onClick={() => seedLiquidity(m.id, v)}
                  className="text-[10px] border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                  💧 Seed R${v}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
