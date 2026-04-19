'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { Users, Plus, Copy, Loader2, TrendingUp, DollarSign, Camera, Link2, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Influencer {
  id: string; name: string; social_url: string; referral_code: string
  commission_percent: number; is_active: boolean; photo_url?: string
  bio?: string; email?: string
  total_referred: number; total_volume: number; total_commission: number
}
interface Market { id: string; title: string; category: string; status: string }

export default function AdminInfluencers() {
  const { toast } = useToast()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [linkedMarkets, setLinkedMarkets] = useState<Record<string, any[]>>({})
  const [linkingMarket, setLinkingMarket] = useState<{ influencerId: string; marketId: string; commission: string } | null>(null)

  const [form, setForm] = useState({
    name: '', social_url: '', commission_percent: '5', referral_code: '',
    bio: '', email: '', photo_url: ''
  })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const [infRes, mktRes] = await Promise.all([
      supabase.from('influencers').select('*').order('total_commission', { ascending: false }),
      supabase.from('markets').select('id, title, category, status').eq('status', 'open').limit(50)
    ])
    setInfluencers((infRes.data || []) as Influencer[])
    setMarkets((mktRes.data || []) as Market[])
    setLoading(false)
  }

  async function loadLinkedMarkets(influencerId: string) {
    if (linkedMarkets[influencerId]) return
    const supabase = createClient()
    const { data } = await supabase
      .from('influencer_market_commission')
      .select('id, market_id, commission_percent, total_volume, total_commission, status')
      .eq('influencer_id', influencerId)
    const ids = (data || []).map(d => d.market_id)
    if (ids.length === 0) { setLinkedMarkets(m => ({ ...m, [influencerId]: [] })); return }
    const { data: mkt } = await supabase.from('markets').select('id, title, category, status').in('id', ids)
    const merged = (data || []).map(d => ({
      ...d,
      market: (mkt || []).find(m => m.id === d.market_id)
    }))
    setLinkedMarkets(m => ({ ...m, [influencerId]: merged }))
  }

  function generateCode(name: string) {
    return name.toUpperCase().replace(/\s+/g, '').slice(0, 8) + Math.random().toString(36).slice(2, 5).toUpperCase()
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, influencerId?: string) {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    const path = `influencers/${influencerId || 'new'}-${Date.now()}.${file.name.split('.').pop()}`
    const { data, error } = await supabase.storage.from('market-images').upload(path, file, { upsert: true })
    if (error) { toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' }); return }
    const { data: { publicUrl } } = supabase.storage.from('market-images').getPublicUrl(data.path)
    if (influencerId) {
      await supabase.from('influencers').update({ photo_url: publicUrl }).eq('id', influencerId)
      setInfluencers(prev => prev.map(i => i.id === influencerId ? { ...i, photo_url: publicUrl } : i))
      toast({ title: '✅ Foto atualizada' })
    } else {
      setForm(f => ({ ...f, photo_url: publicUrl }))
    }
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('influencers').insert({
        name: form.name, social_url: form.social_url, bio: form.bio, email: form.email,
        commission_percent: parseFloat(form.commission_percent) || 5,
        referral_code: form.referral_code || generateCode(form.name),
        photo_url: form.photo_url || null,
        is_active: true
      })
      if (error) throw error
      toast({ title: '✅ Influencer criado' })
      setShowForm(false)
      setForm({ name: '', social_url: '', commission_percent: '5', referral_code: '', bio: '', email: '', photo_url: '' })
      load()
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function handleLinkMarket() {
    if (!linkingMarket?.influencerId || !linkingMarket?.marketId) return
    const supabase = createClient()
    const { error } = await supabase.from('influencer_market_commission').upsert({
      influencer_id: linkingMarket.influencerId,
      market_id: linkingMarket.marketId,
      commission_percent: parseFloat(linkingMarket.commission) || 5,
    }, { onConflict: 'influencer_id,market_id' })
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return }
    toast({ title: '✅ Mercado vinculado' })
    setLinkingMarket(null)
    delete linkedMarkets[linkingMarket.influencerId]
    loadLinkedMarkets(linkingMarket.influencerId)
  }

  async function handleUnlinkMarket(influencerId: string, linkId: string) {
    const supabase = createClient()
    await supabase.from('influencer_market_commission').delete().eq('id', linkId)
    delete linkedMarkets[influencerId]
    loadLinkedMarkets(influencerId)
    toast({ title: '✅ Mercado desvinculado' })
  }

  const inputCls = 'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Influencers</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo
        </Button>
      </div>

      {/* Formulário novo influencer */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-card p-5 space-y-4">
          <p className="text-sm font-semibold">Novo Influencer</p>
          <div className="flex items-center gap-4">
            {form.photo_url ? (
              <img src={form.photo_url} className="h-16 w-16 rounded-full object-cover border border-border" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-dashed border-border">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <label className="cursor-pointer text-xs text-primary hover:underline">
              Upload foto
              <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e)} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Nome *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, referral_code: f.referral_code || generateCode(e.target.value) }))} />
            <input className={inputCls} placeholder="E-mail" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className={inputCls} placeholder="URL Social (Instagram, TikTok...)" value={form.social_url} onChange={e => setForm(f => ({ ...f, social_url: e.target.value }))} />
            <input className={inputCls} placeholder="Código referral" value={form.referral_code} onChange={e => setForm(f => ({ ...f, referral_code: e.target.value }))} />
            <div className="relative">
              <input className={inputCls + ' pr-8'} placeholder="Comissão %" type="number" min="0" max="50" step="0.5" value={form.commission_percent} onChange={e => setForm(f => ({ ...f, commission_percent: e.target.value }))} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <textarea className={inputCls} rows={2} placeholder="Bio (opcional)" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving} className="flex-1 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : influencers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum influencer cadastrado</div>
      ) : (
        <div className="space-y-3">
          {influencers.map(inf => (
            <div key={inf.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Card principal */}
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Foto */}
                  <div className="relative flex-shrink-0">
                    {inf.photo_url ? (
                      <img src={inf.photo_url} className="h-14 w-14 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-border text-lg font-bold text-primary">
                        {inf.name.charAt(0)}
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                      <Camera className="h-3 w-3 text-primary-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, inf.id)} />
                    </label>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{inf.name}</p>
                        {inf.bio && <p className="text-xs text-muted-foreground mt-0.5">{inf.bio}</p>}
                        {inf.social_url && (
                          <a href={inf.social_url} target="_blank" className="text-xs text-primary hover:underline">{inf.social_url}</a>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${inf.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                        {inf.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mt-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Comissão</p>
                        <p className="text-sm font-bold text-primary">{inf.commission_percent}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="text-sm font-semibold text-foreground">R$ {(inf.total_volume || 0).toFixed(0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Ganho</p>
                        <p className="text-sm font-semibold text-green-400">R$ {(inf.total_commission || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Indicados</p>
                        <p className="text-sm font-semibold text-foreground">{inf.total_referred || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código referral */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 rounded-lg bg-background border border-border px-3 py-1.5 text-xs font-mono text-muted-foreground">
                    {window?.location?.origin || 'https://cenariox.com.br'}/?ref={inf.referral_code}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${inf.referral_code}`); toast({ title: '✅ Link copiado' }) }}
                    className="p-1.5 rounded-lg border border-border hover:bg-primary/10 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Toggle mercados */}
                <button
                  onClick={() => {
                    if (expanded === inf.id) { setExpanded(null) }
                    else { setExpanded(inf.id); loadLinkedMarkets(inf.id) }
                  }}
                  className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Mercados vinculados</span>
                  {expanded === inf.id ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </button>
              </div>

              {/* Mercados vinculados */}
              {expanded === inf.id && (
                <div className="border-t border-border p-4 space-y-3 bg-background/50">
                  {/* Mercados existentes */}
                  {(linkedMarkets[inf.id] || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum mercado vinculado</p>
                  ) : (
                    <div className="space-y-2">
                      {(linkedMarkets[inf.id] || []).map(lm => (
                        <div key={lm.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{lm.market?.title || 'Mercado'}</p>
                            <p className="text-xs text-muted-foreground">{lm.commission_percent}% · R$ {(lm.total_volume||0).toFixed(0)} vol · R$ {(lm.total_commission||0).toFixed(2)} ganho</p>
                          </div>
                          <button onClick={() => handleUnlinkMarket(inf.id, lm.id)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vincular novo mercado */}
                  {linkingMarket?.influencerId === inf.id ? (
                    <div className="space-y-2">
                      <select
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        value={linkingMarket.marketId}
                        onChange={e => setLinkingMarket(m => m ? { ...m, marketId: e.target.value } : m)}
                      >
                        <option value="">Escolha um mercado</option>
                        {markets.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm pr-6 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            type="number" min="0" max="50" step="0.5" placeholder="Comissão"
                            value={linkingMarket.commission}
                            onChange={e => setLinkingMarket(m => m ? { ...m, commission: e.target.value } : m)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                        <Button onClick={handleLinkMarket} size="sm" disabled={!linkingMarket.marketId}>Vincular</Button>
                        <Button variant="outline" size="sm" onClick={() => setLinkingMarket(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkingMarket({ influencerId: inf.id, marketId: '', commission: String(inf.commission_percent) })}
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Vincular mercado com comissão personalizada
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
