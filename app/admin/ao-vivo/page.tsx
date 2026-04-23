'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Radio, Plus, Edit3, Zap, CheckCircle, Loader2, Loader2 as L2, RefreshCw, Play, Pause, StopCircle, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface LiveMarket {
  id: string; title: string; status: string; closes_at: string
  live_config: any; market_options: any[]
}

const TEMPLATES = [
  { type: 'sport', icon: '⚽', label: 'Futebol', options: ['Time A vence', 'Empate', 'Time B vence'] },
  { type: 'sport', icon: '🏀', label: 'Basquete', options: ['Time A vence', 'Time B vence'] },
  { type: 'show', icon: '🎬', label: 'Reality Show', options: ['Participante A sai', 'Participante B sai', 'Participante C sai'] },
  { type: 'politics', icon: '🏛️', label: 'Evento Político', options: ['Sim', 'Não'] },
  { type: 'custom', icon: '🎯', label: 'Personalizado', options: ['Opção A', 'Opção B'] },
]

export default function AdminAoVivoPage() {
  const { toast } = useToast()
  const [markets, setMarkets] = useState<LiveMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generatingCover, setGeneratingCover] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Esportes',
    event_type: 'sport',
    event_name: '',
    current_score: '',
    period: '',
    duration_hours: '2',
    options: ['Time A vence', 'Empate', 'Time B vence'],
    is_live: true,
    image_url: '',
    influencer_code: '',
  })
  const [influencers, setInfluencers] = useState<{id:string,name:string,referral_code:string}[]>([])

  useEffect(() => {
    loadMarkets()
    // Carregar influencers para vincular ao mercado
    createClient().from('influencers').select('id, name, referral_code').eq('is_active', true).then(({ data }) => {
      setInfluencers(data || [])
    })
  }, [])

  async function loadMarkets() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('markets')
      .select('id, title, status, closes_at, live_config, market_options(id, label, probability, odds)')
      .eq('market_type', 'live')
      .order('created_at', { ascending: false })
      .limit(20)
    setMarkets(data || [])
    setLoading(false)
  }

  async function generateAICover() {
    setGeneratingCover(true)
    try {
      const fd = new FormData()
      fd.append('description', `Mercado ao vivo: ${form.event_name || form.title}`)
      const res = await fetch('/api/admin/ai-cover', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.image_url) setForm((f: any) => ({ ...f, image_url: data.image_url }))
    } catch (_) {}
    setGeneratingCover(false)
  }

  async function handleCreate() {
    if (!form.title || !form.event_name) {
      toast({ type: 'error', title: 'Preencha título e nome do evento' }); return
    }
    setCreating(true)
    try {
      const supabase = createClient()
      const closesAt = new Date(Date.now() + parseFloat(form.duration_hours) * 3600000)
      const slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '-' + Date.now().toString(36)

      // Buscar id do influencer pelo código se informado
      let influencer_id = null
      if (form.influencer_code) {
        const { data: inf } = await supabase.from('influencers').select('id').eq('referral_code', form.influencer_code).single()
        influencer_id = inf?.id || null
      }

      const { data: market, error } = await supabase.from('markets').insert({
        title: form.title,
        description: form.description || null,
        category: form.category,
        slug,
        status: 'open',
        market_type: 'live',
        image_url: form.image_url || null,
        influencer_id: influencer_id,
        closes_at: closesAt.toISOString(),
        resolves_at: new Date(closesAt.getTime() + 3600000).toISOString(),
        live_config: {
          event_type: form.event_type,
          event_name: form.event_name,
          current_score: form.current_score || null,
          period: form.period || null,
          is_live: form.is_live,
        },
      }).select().single()

      if (error) throw error

      // Criar opções
      const validOpts = form.options.filter(o => o.trim())
      const prob = 1 / validOpts.length
      await supabase.from('market_options').insert(
        validOpts.map((label, i) => ({
          market_id: market.id,
          label, option_key: i === 0 ? 'yes' : i === 1 ? 'no' : `opt${i + 1}`,
          probability: prob, odds: parseFloat((1 / prob * 0.95).toFixed(2)),
          sort_order: i, is_active: true,
        }))
      )

      toast({ type: 'success', title: '✅ Mercado ao vivo criado!' })
      setForm(f => ({ ...f, title: '', description: '', event_name: '', current_score: '', period: '', image_url: '', influencer_code: '' }))
      await loadMarkets()
    } catch (e: any) {
      toast({ type: 'error', title: 'Erro', description: e.message })
    } finally { setCreating(false) }
  }

  async function updateLiveConfig(marketId: string, updates: any) {
    setUpdating(marketId)
    const supabase = createClient()
    const market = markets.find(m => m.id === marketId)
    await supabase.from('markets').update({
      live_config: { ...(market?.live_config || {}), ...updates }
    }).eq('id', marketId)
    await loadMarkets()
    setUpdating(null)
    toast({ type: 'success', title: '✅ Atualizado ao vivo!' })
  }

  async function closeMarket(marketId: string) {
    const supabase = createClient()
    await supabase.from('markets').update({ status: 'closed' }).eq('id', marketId)
    loadMarkets()
    toast({ type: 'success', title: 'Mercado fechado para apostas' })
  }

  const inp = 'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30">
          <Radio className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Mercados ao Vivo</h1>
          <p className="text-xs text-muted-foreground">Crie e gerencie mercados de eventos em andamento</p>
        </div>
      </div>

      {/* Diferença: Ao Vivo vs Rápido */}
      <div className="rounded-2xl border border-border bg-card/50 p-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <p className="font-semibold flex items-center gap-2">🔴 Mercado Ao Vivo</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Evento em andamento (jogo, show, política)</li>
            <li>• Admin controla o placar/contexto em tempo real</li>
            <li>• Opções livres: times, candidatos, participantes</li>
            <li>• Duração em horas — resolução manual pelo admin</li>
            <li>• Ex: "Quem marca o próximo gol?" durante um jogo</li>
          </ul>
        </div>
        <div className="space-y-1">
          <p className="font-semibold flex items-center gap-2">⚡ Mercado Rápido</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ligado a preço de ativo via API (cripto, commodities)</li>
            <li>• Sempre "Sobe ou Desce?" em X minutos</li>
            <li>• Resolução 100% automática pelo preço real</li>
            <li>• Duração em minutos (5, 10, 30...)</li>
            <li>• Ex: "BTC sobe ou desce nos próximos 5 min?"</li>
          </ul>
        </div>
      </div>

      {/* Templates rápidos */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">⚡ Templates rápidos</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map(t => (
            <button key={t.label} onClick={() => setForm(f => ({ ...f, event_type: t.type as any, options: t.options, category: t.type === 'sport' ? 'Esportes' : t.type === 'show' ? 'Entretenimento' : t.type === 'politics' ? 'Política' : f.category }))}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Radio className="h-4 w-4 text-red-400" /> Criar novo mercado ao vivo
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Pergunta do mercado *</label>
            <input className={inp} placeholder="Ex: Quem vai marcar o próximo gol?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">Imagem de capa</label>
            <div className="flex gap-2">
              <input className={inp} placeholder="URL da imagem ou gere com IA →" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
              <button onClick={generateAICover} disabled={generatingCover} type="button"
                className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 px-3 py-2 text-xs font-medium hover:bg-violet-500/30 disabled:opacity-50 transition-colors">
                {generatingCover ? <L2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                IA
              </button>
            </div>
            {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 h-28 w-full object-cover rounded-xl border border-border" />}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Influencer (opcional)</label>
            <select className={inp} value={form.influencer_code} onChange={e => setForm(f => ({ ...f, influencer_code: e.target.value }))}>
              <option value="">Sem influencer</option>
              {influencers.map(inf => <option key={inf.id} value={inf.referral_code}>{inf.name} (@{inf.referral_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nome do evento *</label>
            <input className={inp} placeholder="Ex: Flamengo x Palmeiras" value={form.event_name} onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Placar atual</label>
            <input className={inp} placeholder="Ex: 1 x 0" value={form.current_score} onChange={e => setForm(f => ({ ...f, current_score: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Período / Tempo</label>
            <input className={inp} placeholder="Ex: 2º Tempo · 67'" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Duração (horas)</label>
            <select className={inp} value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}>
              {['0.5','1','2','3','4','6','12','24'].map(h => <option key={h} value={h}>{h === '0.5' ? '30 min' : `${h}h`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Categoria</label>
            <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {['Esportes','Entretenimento','Política','Economia','Cripto','Geral'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Opções de resposta</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input className={inp} placeholder={`Opção ${i + 1}`} value={opt}
                  onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? e.target.value : o) }))} />
                {i >= 2 && (
                  <button onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                    className="text-xs text-destructive border border-destructive/30 rounded-xl px-3 hover:bg-destructive/10">✕</button>
                )}
              </div>
            ))}
            {form.options.length < 6 && (
              <button onClick={() => setForm(f => ({ ...f, options: [...f.options, `Opção ${f.options.length + 1}`] }))}
                className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Adicionar opção
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, is_live: !f.is_live }))}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.is_live ? 'bg-red-500' : 'bg-muted'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.is_live ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-foreground">{form.is_live ? '🔴 Ao vivo agora' : '⏰ Em breve'}</span>
          </label>
        </div>

        <button onClick={handleCreate} disabled={creating}
          className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          Criar mercado ao vivo
        </button>
      </div>

      {/* Lista de mercados ao vivo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mercados ativos</p>
          <button onClick={loadMarkets} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : markets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum mercado ao vivo criado ainda
            </div>
          ) : markets.map(m => {
            const cfg = m.live_config || {}
            const isLive = cfg.is_live
            const [score, setScore] = useState(cfg.current_score || '')
            const [period, setPeriod] = useState(cfg.period || '')

            return (
              <div key={m.id} className={`rounded-2xl border p-4 space-y-3 ${isLive ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isLive ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> AO VIVO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded-full px-2 py-0.5">EM BREVE</span>
                      )}
                      <span className={`text-[10px] font-bold ${m.status === 'open' ? 'text-primary' : 'text-muted-foreground'}`}>{m.status.toUpperCase()}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{m.title}</p>
                    {cfg.event_name && <p className="text-xs text-muted-foreground">{cfg.event_name}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateLiveConfig(m.id, { is_live: !isLive })} disabled={updating === m.id}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isLive ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
                      {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {isLive ? 'Pausar' : 'Ativar'}
                    </button>
                    {m.status === 'open' && (
                      <button onClick={() => closeMarket(m.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <StopCircle className="h-3.5 w-3.5" /> Fechar
                      </button>
                    )}
                  </div>
                </div>

                {/* Atualizar placar/período em tempo real */}
                {m.status === 'open' && (
                  <div className="flex gap-2">
                    <input value={score} onChange={e => setScore(e.target.value)} placeholder="Placar atual (ex: 1 x 2)"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
                    <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="Período (ex: 72')"
                      className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
                    <button onClick={() => updateLiveConfig(m.id, { current_score: score, period })} disabled={updating === m.id}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap">
                      {updating === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                      Atualizar
                    </button>
                  </div>
                )}

                {/* Opções e resolução */}
                <div className="flex gap-2 flex-wrap">
                  {m.market_options?.map((opt: any) => (
                    <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <span className="text-xs font-semibold text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-primary font-bold">{Number(opt.odds).toFixed(2)}x</span>
                      {m.status !== 'open' && (
                        <button onClick={async () => {
                          const supabase = createClient()
                          await supabase.from('markets').update({ status: 'resolved', result_option_id: opt.id }).eq('id', m.id)
                          loadMarkets()
                          setUpdating(null)
                        }} className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 hover:bg-green-500/30 transition-colors">
                          ✓ Venceu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
