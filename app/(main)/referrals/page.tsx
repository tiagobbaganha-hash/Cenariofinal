'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getOrCreateReferralCode, applyReferralCode } from '@/lib/api/referrals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Copy, Share2, Gift, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface ReferralStats {
  code: string
  referrals_count: number
  total_earned: number
  pending_bonus: number
  referrals: Array<{
    email: string
    joined_at: string
    status: string
  }>
}

export default function ReferralsPage() {
  const toast = useToast()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [applyingCode, setApplyingCode] = useState(false)

  useEffect(() => {
    const loadReferralStats = async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session?.session?.user?.id) return

        const code = await getOrCreateReferralCode()
        if (code) {
          setStats({
            code,
            referrals_count: 0,
            total_earned: 0,
            pending_bonus: 0,
            referrals: [],
          })
        }
      } catch (error) {
        console.error('Error loading referral stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReferralStats()
  }, [])

  const handleCopyCode = () => {
    if (stats?.code) {
      navigator.clipboard.writeText(stats.code)
      toast.success('Sucesso', 'Código copiado para a área de transferência!')
    }
  }

  const handleShareCode = () => {
    if (stats?.code) {
      const referralUrl = `${window.location.origin}?ref=${stats.code}`
      navigator.clipboard.writeText(referralUrl)
      toast.success('Sucesso', 'Link de referência copiado!')
    }
  }

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!referralCodeInput.trim()) return

    try {
      setApplyingCode(true)
      await applyReferralCode(referralCodeInput)
      toast.success('Sucesso', 'Código de referência aplicado!')
      setReferralCodeInput('')
    } catch (error: any) {
      toast.error('Erro', error.message || 'Não foi possível aplicar o código')
    } finally {
      setApplyingCode(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Programa de Referência</h1>
        <p className="text-muted-foreground mt-2">
          Convide amigos e ganhe bônus exclusivos para cada referência bem-sucedida
        </p>
      </div>

      {/* Seu Código de Referência */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Seu Código de Referência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 p-3 rounded-lg bg-muted">
                <code className="font-mono font-bold text-lg">{stats.code}</code>
              </div>
              <Button onClick={handleCopyCode} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={handleShareCode} size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Compartilhe seu código com amigos. Eles ganham um bônus e você também!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usar Código de Referência */}
      <Card>
        <CardHeader>
          <CardTitle>Usar Código de Referência</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyCode} className="flex gap-2">
            <Input
              placeholder="Cole o código aqui..."
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              disabled={applyingCode}
            />
            <Button type="submit" disabled={applyingCode}>
              {applyingCode ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Referências</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.referrals_count || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">
              R$ {(stats?.total_earned || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bônus Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">
              R$ {(stats?.pending_bonus || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seus Referidos */}
      {stats && stats.referrals && stats.referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seus Referidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.referrals.map((referral) => (
                <div key={referral.email} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{referral.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{referral.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Entrou em {new Date(referral.joined_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={referral.status === 'active' ? 'success' : 'secondary'}>
                    {referral.status === 'active' ? 'Ativo' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Como Funciona */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">1. Convide um amigo</p>
            <p className="text-sm text-muted-foreground">Compartilhe seu código ou link de referência</p>
          </div>
          <div>
            <p className="font-medium">2. Seu amigo se cadastra</p>
            <p className="text-sm text-muted-foreground">Eles usam seu código ao criar a conta</p>
          </div>
          <div>
            <p className="font-medium">3. Ganhe bônus</p>
            <p className="text-sm text-muted-foreground">Você recebe R$ 50 para cada amigo que faz seu primeiro depósito</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
