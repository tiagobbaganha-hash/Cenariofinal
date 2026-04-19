'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { Users, Plus, Copy, Loader2, TrendingUp, DollarSign, UserPlus } from 'lucide-react'

interface Influencer {
  id: string
  name: string
  social_url: string
  referral_code: string
  commission_percent: number
  is_active: boolean
  total_referred: number
  total_volume: number
  total_commission: number
  created_at: string
}

export default function AdminInfluencers() {
  const { toast } = useToast()
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', social_url: '', commission_percent: '5', referral_code: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('influencers').select('*').order('total_commission', { ascending: false })
    setInfluencers((data || []) as Influencer[])
    setLoading(false)
  }

  function generateCode(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 12) + Math.random().toString(36).slice(-3)
  }

  async function handleCreate() {
    if (!form.name.trim()) { toast({ type: 'error', title: 'Informe o nome' }); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const code = form.referral_code || generateCode(form.name)
      const { error } = await supabase.from('influencers').insert({
        name: form.name.trim(),
        social_url: form.social_url.trim(),
        referral_code: code,
        commission_percent: parseFloat(form.commission_percent) || 5,
      })
      if (error) throw error
      toast({ type: 'success', title: `Influencer ${form.name} criado!` })
      setForm({ name: '', social_url: '', commission_percent: '5', referral_code: '' })
      setShowForm(false)
      load()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSaving(false) }
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('influencers').update({ is_active: !current }).eq('id', id)
    load()
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(`https://cenariox.com.br/login?ref=${code}`)
    toast({ type: 'success', title: 'Link copiado!' })
  }

  const totalReferred = influencers.reduce((s, i) => s + i.total_referred, 0)
  const totalVolume = influencers.reduce((s, i) => s + i.total_volume, 0)
  const totalCommission = influencers.reduce((s, i) => s + i.total_commission, 0)

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Influenciadores</h1>
          <p className="text-muted-foreground">Programa de parceria com criadores de conteúdo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Influencer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <UserPlus className="h-5 w-5 mx-auto text-blue-400 mb-1" />
          <p className="text-2xl font-bold">{totalReferred}</p>
          <p className="text-xs text-muted-foreground">Indicados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-green-400 mb-1" />
          <p className="text-2xl font-bold">R$ {(totalVolume / 1000).toFixed(1)}k</p>
          <p className="text-xs text-muted-foreground">Volume Gerado</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-yellow-400 mb-1" />
          <p className="text-2xl font-bold">R$ {totalCommission.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Comissões Pagas</p>
        </CardContent></Card>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold">Cadastrar Influenciador</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do influencer" className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rede social (URL)</label>
                <input value={form.social_url} onChange={e => setForm({ ...form, social_url: e.target.value })}
                  placeholder="https://instagram.com/..." className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comissão (%)</label>
                <input type="number" value={form.commission_percent} onChange={e => setForm({ ...form, commission_percent: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Código (auto se vazio)</label>
                <input value={form.referral_code} onChange={e => setForm({ ...form, referral_code: e.target.value })}
                  placeholder="Ex: joaosilva" className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Cadastrar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-3">
        {influencers.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">Nenhum influenciador cadastrado</p>
            <p className="text-sm text-muted-foreground">Clique em "Novo Influencer" para começar</p>
          </CardContent></Card>
        ) : influencers.map(inf => (
          <Card key={inf.id} className={!inf.is_active ? 'opacity-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{inf.name}</p>
                  <p className="text-xs text-muted-foreground">{inf.social_url || 'Sem rede social'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-blue-400">{inf.total_referred} indicados</span>
                    <span className="text-green-400">R$ {inf.total_volume.toFixed(0)} volume</span>
                    <span className="text-yellow-400">R$ {inf.total_commission.toFixed(2)} comissão</span>
                    <span className="text-muted-foreground">{inf.commission_percent}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyLink(inf.referral_code)}>
                    <Copy className="h-3 w-3 mr-1" /> {inf.referral_code}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(inf.id, inf.is_active)}
                    className={inf.is_active ? 'text-green-400' : 'text-red-400'}>
                    {inf.is_active ? 'Ativo' : 'Inativo'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
