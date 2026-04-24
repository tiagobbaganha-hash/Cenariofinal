'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Search, RefreshCw, User, TrendingUp, Brain, Wallet, Shield } from 'lucide-react'

interface Log {
  id: string; user_id: string | null; actor_role: string | null
  action: string; entity_type: string | null; entity_label: string | null
  metadata: any; ip_address: string | null; created_at: string
}

const ACTION_COLOR: Record<string, string> = {
  'bet.placed': 'text-green-400 bg-green-500/10',
  'market.created': 'text-blue-400 bg-blue-500/10',
  'market.resolved': 'text-purple-400 bg-purple-500/10',
  'user.login': 'text-gray-400 bg-gray-500/10',
  'user.register': 'text-cyan-400 bg-cyan-500/10',
  'user.upgrade_pro': 'text-yellow-400 bg-yellow-500/10',
  'ai.analysis_viewed': 'text-primary bg-primary/10',
  'wallet.deposit': 'text-green-400 bg-green-500/10',
  'wallet.withdrawal': 'text-orange-400 bg-orange-500/10',
}
const ACTION_LABEL: Record<string, string> = {
  'bet.placed':'Aposta','bet.cancelled':'Aposta cancelada','market.created':'Mercado criado',
  'market.edited':'Mercado editado','market.resolved':'Mercado resolvido',
  'user.login':'Login','user.register':'Cadastro','user.upgrade_pro':'Upgrade PRO',
  'ai.analysis_viewed':'Análise IA','ai.cover_generated':'Capa IA gerada',
  'wallet.deposit':'Depósito','wallet.withdrawal':'Saque',
  'influencer.market_linked':'Mercado vinculado','admin.user_role_changed':'Role alterada',
  'subscription.activated':'Assinatura ativada',
}
const FILTERS = [
  {label:'Todos',value:''},{label:'Apostas',value:'bet'},
  {label:'Mercados',value:'market'},{label:'Usuários',value:'user'},
  {label:'IA',value:'ai'},{label:'Financeiro',value:'wallet'},
]

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(0)
  const [summary, setSummary] = useState<any[]>([])
  const PAGE = 50

  useEffect(() => { load() }, [filter, page])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('activity_logs').select('*').order('created_at',{ascending:false}).range(page*PAGE,(page+1)*PAGE-1)
    if (filter) q = (q as any).ilike('action',`${filter}%`)
    const { data } = await q
    setLogs(data || [])
    const { data: sum } = await supabase.from('v_activity_summary').select('*').limit(6)
    setSummary(sum || [])
    setLoading(false)
  }

  const filtered = logs
    .filter(l => !dateFrom || l.created_at >= dateFrom + 'T00:00:00')
    .filter(l => !dateTo || l.created_at <= dateTo + 'T23:59:59')
    .filter(l => !search || l.action.includes(search) || l.entity_label?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20"><Activity className="h-4 w-4 text-primary" /></div>
          <h1 className="text-xl font-bold">Logs de Atividade</h1>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading?'animate-spin':''}`} /> Atualizar
        </button>
      </div>

      {summary.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {summary.slice(0,6).map(s => (
            <div key={s.action} className="rounded-xl border border-border bg-card p-3">
              <p className="text-[10px] text-muted-foreground truncate">{ACTION_LABEL[s.action]||s.action}</p>
              <p className="text-lg font-bold">{s.total}</p>
              <p className="text-[10px] text-muted-foreground">{s.unique_users} users</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => {setFilter(f.value);setPage(0)}}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filter===f.value?'bg-primary text-primary-foreground border-primary':'border-border text-muted-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
          placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filtro por data */}
      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-xs text-muted-foreground">Filtrar por data:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">De</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Até</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
            Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-sm text-muted-foreground">
          {logs.length === 0 ? 'Nenhum log ainda — execute o SQL do Sprint 7 no Supabase.' : 'Sem resultados'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(log => {
            const color = ACTION_COLOR[log.action] || 'text-muted-foreground bg-muted'
            return (
              <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${color}`}>
                  {log.action.split('.')[0].slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">{ACTION_LABEL[log.action]||log.action}</span>
                    {log.entity_label && <span className="text-xs text-muted-foreground truncate">— {log.entity_label}</span>}
                    {log.actor_role && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{log.actor_role}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {log.user_id && <span className="text-[10px] font-mono text-muted-foreground/60">{log.user_id.slice(0,8)}…</span>}
                    {log.ip_address && <span className="text-[10px] text-muted-foreground/60">{log.ip_address}</span>}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className="text-[10px] text-muted-foreground/60">
                        {Object.entries(log.metadata).slice(0,2).map(([k,v]) => `${k}: ${v}`).join(' · ')}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {logs.length === PAGE && (
        <div className="flex justify-center gap-4">
          {page > 0 && <button onClick={() => setPage(p=>p-1)} className="text-sm text-primary hover:underline">← Anterior</button>}
          <button onClick={() => setPage(p=>p+1)} className="text-sm text-primary hover:underline">Próxima →</button>
        </div>
      )}
    </div>
  )
}
