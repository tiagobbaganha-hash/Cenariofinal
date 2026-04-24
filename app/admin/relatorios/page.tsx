'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, TrendingUp, Users, DollarSign, Trophy, RefreshCw, Settings, FileText, Shield, Star } from 'lucide-react'

const fmt = (n: number) => `R$ ${(n||0).toLocaleString('pt-BR', {minimumFractionDigits:2})}`
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR')

function exportCSV(data: any[], filename: string) {
  if (!data.length) return alert('Sem dados para exportar')
  const headers = Object.keys(data[0]).join(';')
  const rows = data.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'\\"')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + headers + '\n' + rows], {type:'text/csv;charset=utf-8;'})
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

export default function RelatoriosPage() {
  const [tab, setTab] = useState<'plataforma'|'clientes'|'influencers'|'fiscal'|'config'>('plataforma')
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(false)

  // ── PLATAFORMA ──
  const [platStats, setPlatStats] = useState<any>({})
  const [platLedger, setPlatLedger] = useState<any[]>([])

  // ── CLIENTES ──
  const [clients, setClients] = useState<any[]>([])

  // ── INFLUENCERS ──
  const [influencers, setInfluencers] = useState<any[]>([])

  // ── FISCAL ──
  const [fiscal, setFiscal] = useState<any[]>([])

  // ── CONFIG ──
  const [commissionPct, setCommissionPct] = useState('5')
  const [minWithdrawal, setMinWithdrawal] = useState('50')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const since = new Date(Date.now() - parseInt(period)*86400000).toISOString()

    // Config
    const {data: cfg} = await supabase.from('platform_settings').select('key,value')
    const cfgMap: Record<string,string> = {}
    for (const c of cfg||[]) cfgMap[c.key] = c.value
    setCommissionPct(cfgMap['commission_pct']||'5')
    setMinWithdrawal(cfgMap['min_withdrawal']||'50')

    if (tab === 'plataforma') {
      const {data: ledger} = await supabase.from('platform_ledger')
        .select('*').gte('created_at', since).order('created_at', {ascending:false})
      const {data: mkts} = await supabase.from('markets').select('id,total_volume,bet_count,status')
      const {count: users} = await supabase.from('wallets').select('*', {count:'exact',head:true})

      const totalVol = (ledger||[]).filter(l=>l.entry_type==='market_settlement').reduce((s:number,l:any)=>s+parseFloat(l.gross_volume||0),0)
      const platProfit = (ledger||[]).filter(l=>l.entry_type==='market_settlement').reduce((s:number,l:any)=>s+parseFloat(l.net_platform_profit||0),0)
      const irColetado = (ledger||[]).filter(l=>l.entry_type==='ir_retencao').reduce((s:number,l:any)=>s+parseFloat(l.platform_amount||0),0)
      const inflPago = (ledger||[]).filter(l=>l.entry_type==='market_settlement').reduce((s:number,l:any)=>s+parseFloat(l.influencer_amount||0),0)
      const activeMarkets = (mkts||[]).filter((m:any)=>m.status==='open').length
      const totalBets = (mkts||[]).reduce((s:number,m:any)=>s+(m.bet_count||0),0)

      setPlatStats({ totalVol, platProfit, irColetado, inflPago, users: users||0, activeMarkets, totalBets })
      setPlatLedger(ledger||[])
    }

    if (tab === 'clientes') {
      const {data: orders} = await supabase.from('orders')
        .select('id,user_id,stake_amount,potential_payout,settlement_amount,status,created_at,market_id,markets(title,slug)')
        .gte('created_at', since).order('created_at', {ascending:false}).limit(500)

      // Agrupar por usuário
      const byUser: Record<string,any> = {}
      for (const o of orders||[]) {
        const uid = o.user_id
        if (!byUser[uid]) byUser[uid] = {user_id: uid, apostas:0, total_apostado:0, total_ganho:0, total_perdido:0, ir_retido:0}
        byUser[uid].apostas++
        byUser[uid].total_apostado += parseFloat(o.stake_amount||0)
        if (o.status==='settled_win') {
          const payout = parseFloat(o.settlement_amount||0)
          const lucro = payout - parseFloat(o.stake_amount||0)
          byUser[uid].total_ganho += payout
          if (lucro > 2112) byUser[uid].ir_retido += lucro * 0.15
        }
        if (o.status==='settled_loss') byUser[uid].total_perdido += parseFloat(o.stake_amount||0)
      }
      setClients(Object.values(byUser).sort((a:any,b:any)=>b.total_apostado-a.total_apostado))
    }

    if (tab === 'influencers') {
      const {data: inf} = await supabase.from('influencers')
        .select('id,name,referral_code,commission_pct,commission_percent,total_earned,total_commission,is_active,bio,photo_url')
        .order('total_earned', {ascending:false})
      const {data: infLedger} = await supabase.from('platform_ledger')
        .select('influencer_id,influencer_amount,gross_volume,created_at')
        .gt('influencer_amount',0).gte('created_at', since)

      const byInf: Record<string,number> = {}
      for (const l of infLedger||[]) {
        if (l.influencer_id) byInf[l.influencer_id] = (byInf[l.influencer_id]||0) + parseFloat(l.influencer_amount||0)
      }
      setInfluencers((inf||[]).map((i:any)=>({...i, periodo_ganho: byInf[i.id]||0})))
    }

    if (tab === 'fiscal') {
      const {data: orders} = await supabase.from('orders')
        .select('id,user_id,stake_amount,settlement_amount,status,created_at,markets(title)')
        .eq('status','settled_win').gte('created_at', since)

      const byUser: Record<string,any> = {}
      for (const o of orders||[]) {
        const uid = o.user_id
        const payout = parseFloat(o.settlement_amount||0)
        const stake = parseFloat(o.stake_amount||0)
        const lucro = payout - stake
        if (!byUser[uid]) byUser[uid] = {user_id:uid, nome:'Carregar...', cpf:'Não informado', ganho_bruto:0, stake_total:0, lucro_liquido:0, ir_devido:0}
        byUser[uid].ganho_bruto += payout
        byUser[uid].stake_total += stake
        byUser[uid].lucro_liquido += lucro
      }

      // Carregar perfis
      const uids = Object.keys(byUser)
      if (uids.length > 0) {
        const {data: profiles} = await supabase.from('profiles')
          .select('id,full_name,email,cpf').in('id', uids)
        for (const p of profiles||[]) {
          if (byUser[p.id]) {
            byUser[p.id].nome = p.full_name || p.email?.split('@')[0] || '-'
            byUser[p.id].cpf = p.cpf || 'Não cadastrado'
          }
        }
      }

      const result = Object.values(byUser)
        .map((u:any)=>({...u, ir_devido: u.lucro_liquido > 2112 ? u.lucro_liquido * 0.15 : 0}))
        .filter((u:any)=>u.lucro_liquido > 0)
        .sort((a:any,b:any)=>b.lucro_liquido-a.lucro_liquido)
      setFiscal(result)
    }

    setLoading(false)
  }, [tab, period])

  useEffect(()=>{ load() }, [load])

  async function saveConfig() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('platform_settings').upsert([
      {key:'commission_pct', value: commissionPct, updated_at: new Date().toISOString()},
      {key:'min_withdrawal', value: minWithdrawal, updated_at: new Date().toISOString()},
    ])
    setSaving(false)
    alert(`✅ Configurações salvas`)
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40'

  const TABS = [
    {id:'plataforma', label:'🏛️ Plataforma', icon:TrendingUp},
    {id:'clientes', label:'👤 Clientes', icon:Users},
    {id:'influencers', label:'⭐ Influencers', icon:Star},
    {id:'fiscal', label:'📋 Fiscal/IR', icon:FileText},
    {id:'config', label:'⚙️ Config', icon:Settings},
  ] as const

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visão financeira completa</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
            <option value="7">7 dias</option><option value="30">30 dias</option>
            <option value="90">90 dias</option><option value="365">1 ano</option>
          </select>
          <button onClick={load} disabled={loading} className="p-2 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab===t.id?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PLATAFORMA ── */}
      {tab==='plataforma' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {label:'Volume Total', value:fmt(platStats.totalVol||0), color:'text-blue-400', bg:'bg-blue-500/10 border-blue-500/20'},
              {label:'Lucro Líquido', value:fmt(platStats.platProfit||0), color:'text-green-400', bg:'bg-green-500/10 border-green-500/20'},
              {label:'IR Retido', value:fmt(platStats.irColetado||0), color:'text-amber-400', bg:'bg-amber-500/10 border-amber-500/20'},
              {label:'Pago Influencers', value:fmt(platStats.inflPago||0), color:'text-purple-400', bg:'bg-purple-500/10 border-purple-500/20'},
              {label:'Usuários', value:(platStats.users||0).toString(), color:'text-primary', bg:'bg-primary/10 border-primary/20'},
              {label:'Mercados Ativos', value:(platStats.activeMarkets||0).toString(), color:'text-cyan-400', bg:'bg-cyan-500/10 border-cyan-500/20'},
              {label:'Total Apostas', value:(platStats.totalBets||0).toString(), color:'text-rose-400', bg:'bg-rose-500/10 border-rose-500/20'},
              {label:'Margem Efetiva', value:`${platStats.totalVol>0?((platStats.platProfit/platStats.totalVol)*100).toFixed(1):0}%`, color:'text-yellow-400', bg:'bg-yellow-500/10 border-yellow-500/20'},
            ].map(s=>(
              <div key={s.label} className={`rounded-xl border ${s.bg} p-4`}>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">Histórico de liquidações</p>
            <button onClick={()=>exportCSV(platLedger.map(l=>({data:fmtDate(l.created_at),tipo:l.entry_type,volume:l.gross_volume,comissao_plat:l.platform_amount,comissao_infl:l.influencer_amount,lucro_liquido:l.net_platform_profit})),'relatorio-plataforma')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 transition-colors">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Data','Tipo','Volume','Comissão Plat.','Comissão Infl.','Lucro Líquido'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {platLedger.slice(0,50).map(l=>(
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(l.created_at)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${l.entry_type==='ir_retencao'?'bg-amber-500/20 text-amber-400':'bg-green-500/20 text-green-400'}`}>{l.entry_type==='ir_retencao'?'IR Retido':'Liquidação'}</span></td>
                    <td className="px-4 py-3 font-mono text-xs">{fmt(l.gross_volume||0)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-400">{fmt(l.platform_amount||0)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-400">{fmt(l.influencer_amount||0)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-green-400">{fmt(l.net_platform_profit||0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CLIENTES ── */}
      {tab==='clientes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">{clients.length} usuários com apostas</p>
            <button onClick={()=>exportCSV(clients.map(c=>({usuario:c.user_id.slice(0,8),apostas:c.apostas,total_apostado:c.total_apostado,total_ganho:c.total_ganho,total_perdido:c.total_perdido,saldo_pnl:c.total_ganho-c.total_apostado,ir_estimado:c.ir_retido})),'relatorio-clientes')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 transition-colors">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Usuário','Apostas','Total Apostado','Total Ganho','Total Perdido','P&L','IR Estimado'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map(c=>{
                  const pnl = c.total_ganho - c.total_apostado
                  return (
                    <tr key={c.user_id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{c.user_id.slice(0,8)}...</td>
                      <td className="px-4 py-3 text-center font-bold">{c.apostas}</td>
                      <td className="px-4 py-3 font-mono text-xs">{fmt(c.total_apostado)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-green-400">{fmt(c.total_ganho)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-red-400">{fmt(c.total_perdido)}</td>
                      <td className={`px-4 py-3 font-mono text-xs font-bold ${pnl>=0?'text-green-400':'text-red-400'}`}>{fmt(pnl)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-amber-400">{c.ir_retido>0?fmt(c.ir_retido):'-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── INFLUENCERS ── */}
      {tab==='influencers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">{influencers.length} influencers</p>
            <button onClick={()=>exportCSV(influencers.map(i=>({nome:i.name,codigo:i.referral_code,comissao_pct:i.commission_pct||i.commission_percent||2,ganho_periodo:i.periodo_ganho,ganho_total:i.total_earned||0,status:i.is_active?'Ativo':'Inativo'})),'relatorio-influencers')}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40 transition-colors">
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Nome','Código','% Comissão','Ganho (período)','Ganho Total','Status'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {influencers.map(inf=>(
                  <tr key={inf.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{inf.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inf.referral_code}</td>
                    <td className="px-4 py-3 font-bold text-primary">{inf.commission_pct||inf.commission_percent||2}%</td>
                    <td className="px-4 py-3 font-mono text-purple-400 font-medium">{fmt(inf.periodo_ganho)}</td>
                    <td className="px-4 py-3 font-mono text-green-400 font-bold">{fmt(inf.total_earned||0)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${inf.is_active?'bg-green-500/20 text-green-400':'bg-muted text-muted-foreground'}`}>{inf.is_active?'Ativo':'Inativo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-amber-400 mb-1">📋 Obrigações do Influencer</p>
            <p>O influencer deve emitir <strong>Nota Fiscal de Serviços (NFS-e)</strong> para cada pagamento recebido. Recomende que se constituam como LTDA no Simples Nacional para reduzir a carga tributária (aprox. 6%).</p>
          </div>
        </div>
      )}

      {/* ── FISCAL ── */}
      {tab==='fiscal' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="font-semibold text-blue-400 mb-1">📋 Apuração Fiscal — IR sobre Prêmios</p>
            <p className="text-xs text-muted-foreground">Lei 14.790/2023 · Alíquota 15% sobre ganho líquido acima de R$ 2.112/mês · Retido na fonte pela plataforma</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold">{fiscal.length} usuários com ganhos</p>
            <button onClick={()=>exportCSV(fiscal.map(f=>({nome:f.nome,cpf:f.cpf,ganho_bruto:f.ganho_bruto,stake_total:f.stake_total,lucro_liquido:f.lucro_liquido,ir_devido:f.ir_devido,periodo:`últimos ${period} dias`})),'apuracao-fiscal-ir')}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 transition-colors">
              <Download className="h-3.5 w-3.5" /> Exportar DARF/Fiscal CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Nome','CPF','Ganho Bruto','Apostado','Lucro Líquido','IR Devido (15%)','Tributável'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fiscal.map((f,i)=>(
                  <tr key={i} className={`hover:bg-muted/20 ${f.ir_devido>0?'bg-amber-500/5':''}`}>
                    <td className="px-4 py-3 font-medium">{f.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs">{f.cpf}</td>
                    <td className="px-4 py-3 font-mono text-xs text-green-400">{fmt(f.ganho_bruto)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmt(f.stake_total)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-green-400">{fmt(f.lucro_liquido)}</td>
                    <td className={`px-4 py-3 font-mono text-xs font-bold ${f.ir_devido>0?'text-amber-400':'text-muted-foreground'}`}>{f.ir_devido>0?fmt(f.ir_devido):'Isento'}</td>
                    <td className="px-4 py-3">{f.ir_devido>0?<span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">Tributável</span>:<span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">Isento</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">* CPF "Não cadastrado" indica usuário sem KYC. Ative o KYC obrigatório antes do saque para garantir conformidade fiscal.</p>
        </div>
      )}

      {/* ── CONFIG ── */}
      {tab==='config' && (
        <div className="space-y-5 max-w-lg">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <p className="font-semibold flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Configurações Financeiras</p>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Comissão da plataforma (% sobre volume total)</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="20" step="0.5" value={commissionPct} onChange={e=>setCommissionPct(e.target.value)} className={inp + ' w-28'} />
                <span className="text-sm text-muted-foreground">%</span>
                <span className="text-xs text-muted-foreground">· Aplicado na próxima resolução de mercado</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Valor mínimo de saque (R$)</label>
              <input type="number" min="10" step="10" value={minWithdrawal} onChange={e=>setMinWithdrawal(e.target.value)} className={inp + ' w-28'} />
            </div>
            <div className="rounded-xl bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">📊 Distribuição por aposta (odds 1.90x, comissão {commissionPct}%):</p>
              <p>· Apostador ganha: <span className="text-green-400">stake × 1.90</span></p>
              <p>· House edge embutido nos odds: <span className="text-primary">~5%</span></p>
              <p>· Comissão adicional: <span className="text-primary">{commissionPct}% do volume</span></p>
              <p>· IR retido na fonte: <span className="text-amber-400">15% sobre lucro &gt; R$2.112</span></p>
            </div>
            <button onClick={saveConfig} disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {saving ? 'Salvando...' : '💾 Salvar Configurações'}
            </button>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
            <p className="font-semibold text-amber-400 flex items-center gap-2"><Shield className="h-4 w-4" /> Obrigações Legais</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>✅ IR 15% retido na fonte sobre ganhos &gt; R$2.112/mês</li>
              <li>✅ Relatório de apuração fiscal com CPF por usuário</li>
              <li>⏳ DARF mensal para recolhimento do IR retido</li>
              <li>⏳ Informe de rendimentos anual por usuário (DIRPF)</li>
              <li>⏳ Licença SPA (Secretaria de Prêmios e Apostas)</li>
              <li>⏳ Notas fiscais dos influencers (exigir NFS-e)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
