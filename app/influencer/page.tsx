'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { Users, TrendingUp, DollarSign, Copy, Loader2, UserPlus, Link2 } from 'lucide-react'

interface InfluencerData {
  id: string; name: string; referral_code: string; commission_percent: number
  total_referred: number; total_volume: number; total_commission: number
  is_active: boolean; created_at: string
}

export default function InfluencerDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<InfluencerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: inf } = await supabase
        .from('influencers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!inf) {
        setLoading(false)
        return
      }
      setData(inf as InfluencerData)
      setLoading(false)
    }
    load()
  }, [router])

  function copyLink() {
    if (!data) return
    navigator.clipboard.writeText(`https://cenariox.com.br/login?ref=${data.referral_code}`)
    setCopied(true)
    toast({ type: 'success', title: 'Link copiado!' })
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex min-h-[60vh] justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Você não é um influenciador</h1>
        <p className="text-muted-foreground">Entre em contato com o admin para participar do programa de influenciadores.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard Influenciador</h1>
      <p className="text-muted-foreground mb-6">Olá, {data.name}! Acompanhe seus resultados.</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5 text-center">
            <UserPlus className="h-6 w-6 mx-auto text-blue-400 mb-2" />
            <p className="text-3xl font-bold">{data.total_referred}</p>
            <p className="text-xs text-muted-foreground">Indicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-green-400 mb-2" />
            <p className="text-3xl font-bold">R$ {(data.total_volume / 1000).toFixed(1)}k</p>
            <p className="text-xs text-muted-foreground">Volume Gerado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
            <p className="text-3xl font-bold text-green-400">R$ {data.total_commission.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Comissão Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Link */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-3"><Link2 className="h-5 w-5" /> Seu Link de Indicação</h2>
          <div className="flex gap-2">
            <input
              value={`https://cenariox.com.br/login?ref=${data.referral_code}`}
              readOnly
              className="flex-1 h-10 px-4 rounded-lg bg-background border border-border font-mono text-sm"
            />
            <Button onClick={copyLink}>
              <Copy className="h-4 w-4 mr-2" /> {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Compartilhe este link. Quando alguém se cadastrar e apostar, você ganha <span className="text-primary font-bold">{data.commission_percent}%</span> de cada aposta.
          </p>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-3">Detalhes</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Código</span><span className="font-mono">{data.referral_code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Comissão</span><span>{data.commission_percent}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={data.is_active ? 'text-green-400' : 'text-red-400'}>{data.is_active ? 'Ativo' : 'Inativo'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Desde</span><span>{new Date(data.created_at).toLocaleDateString('pt-BR')}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
