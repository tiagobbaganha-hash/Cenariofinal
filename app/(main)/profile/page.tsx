'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/useToast'
import { Loader2, Mail, User, Shield, LogOut } from 'lucide-react'

interface UserProfile {
  email: string
  name?: string
  kyc_status?: 'none' | 'pending' | 'approved' | 'rejected'
  created_at: string
}

const kycStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  none: { label: 'Não Iniciado', variant: 'secondary' },
  pending: { label: 'Pendente', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'destructive' },
}

export default function ProfilePage() {
  const router = useRouter()
  const toast = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session?.session?.user) {
          router.push('/(auth)/login')
          return
        }

        setUser({
          email: session.session.user.email || '',
          name: session.session.user.user_metadata?.name || '',
          kyc_status: 'none',
          created_at: session.session.user.created_at,
        })
        setName(session.session.user.user_metadata?.name || '')
      } catch (error) {
        toast.error('Erro', 'Não foi possível carregar seu perfil')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, toast])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/(auth)/login')
  }

  const handleSaveName = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name },
      })

      if (error) throw error
      toast.success('Sucesso', 'Perfil atualizado com sucesso')
      setEditing(false)
    } catch (error: any) {
      toast.error('Erro', error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive">Você precisa estar autenticado para visualizar seu perfil</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais e segurança</p>
      </div>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">E-mail</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm">{user.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            {editing ? (
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
                <Button onClick={handleSaveName} className="whitespace-nowrap">
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg border border-border">
                <p className="text-sm">{name || '(não preenchido)'}</p>
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Data de cadastro</label>
            <p className="text-sm">
              {new Date(user.created_at).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KYC Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verificação de Identidade (KYC)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status de Verificação</p>
              <p className="text-sm text-muted-foreground mt-1">
                Verifique sua identidade para aumentar seus limites de saque e depósito
              </p>
            </div>
            <Badge variant={kycStatusConfig[user.kyc_status || 'none'].variant}>
              {kycStatusConfig[user.kyc_status || 'none'].label}
            </Badge>
          </div>

          {user.kyc_status !== 'approved' && (
            <Button className="w-full">
              Iniciar Verificação com Veriff
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium mb-2">Autenticação</p>
            <p className="text-sm text-muted-foreground mb-4">
              Você pode alterar sua senha ou ativar autenticação de dois fatores
            </p>
            <Button variant="outline">Alterar Senha</Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="flex gap-2 pt-4">
        <Button variant="destructive" onClick={handleSignOut} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </Button>
      </div>
    </div>
  )
}
