'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { Lightbulb, Send, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Proposal {
  id: string; title: string; status: string; admin_notes: string | null; created_at: string
}

export default function ProporMercado() {
  const router = useRouter()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Geral')
  const [options, setOptions] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      supabase.from('market_proposals').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }).limit(10)
        .then(({ data: props }) => setProposals((props || []) as Proposal[]))
    })
  }, [router])

  async function handleSubmit() {
    if (!title.trim()) { toast({ type: 'error', title: 'Informe o título' }); return }
    setSending(true)
    try {
      const supabase = createClient()
      const optArray = options.split(',').map(o => o.trim()).filter(Boolean)
      const { error } = await supabase.from('market_proposals').insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        category,
        suggested_options: optArray.length > 0 ? optArray : ['SIM', 'NÃO'],
      } as any)
      if (error) throw error
      toast({ type: 'success', title: 'Proposta enviada! O admin vai analisar.' })
      setTitle(''); setDescription(''); setOptions('')
      // Reload proposals
      const { data } = await supabase.from('market_proposals').select('*').eq('user_id', userId!).order('created_at', { ascending: false }).limit(10)
      setProposals((data || []) as Proposal[])
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setSending(false) }
  }

  const statusIcon = { pending: Clock, approved: CheckCircle, rejected: XCircle }
  const statusColor = { pending: 'text-yellow-400', approved: 'text-green-400', rejected: 'text-red-400' }
  const statusLabel = { pending: 'Em análise', approved: 'Aprovado', rejected: 'Recusado' }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
        <Lightbulb className="h-7 w-7 text-primary" /> Propor Mercado
      </h1>
      <p className="text-muted-foreground mb-6">Sugira um mercado e, se aprovado, ele vai ao ar!</p>

      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título (pergunta)</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Quem será campeão da Libertadores 2026?"
              className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Critérios de resolução, fontes, contexto..."
              rows={3} className="w-full px-4 py-2 rounded-lg bg-background border border-border outline-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none">
                {['Política','Economia','Esportes','Tecnologia','Cripto','Entretenimento','Geopolítica','Geral'].map(c =>
                  <option key={c} value={c}>{c}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opções (separar por vírgula)</label>
              <input value={options} onChange={e => setOptions(e.target.value)}
                placeholder="SIM, NÃO ou Flamengo, Palmeiras, Atlético"
                className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none text-sm" />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar Proposta
          </Button>
        </CardContent>
      </Card>

      {proposals.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Suas Propostas</h2>
          <div className="space-y-2">
            {proposals.map(p => {
              const Icon = statusIcon[p.status as keyof typeof statusIcon] || Clock
              const color = statusColor[p.status as keyof typeof statusColor] || 'text-muted-foreground'
              const label = statusLabel[p.status as keyof typeof statusLabel] || p.status
              return (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                      {p.admin_notes && <p className="text-xs text-muted-foreground mt-1">Admin: {p.admin_notes}</p>}
                    </div>
                    <span className={`flex items-center gap-1 text-sm ${color}`}>
                      <Icon className="h-4 w-4" /> {label}
                    </span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
