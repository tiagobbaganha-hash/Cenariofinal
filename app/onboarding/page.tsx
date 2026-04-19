'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { Loader2, User, CreditCard, Phone, Calendar, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    full_name: '',
    cpf: '',
    phone: '',
    birth_date: '',
    accepted_terms: false,
    accepted_privacy: false,
  })

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if onboarding already completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        router.push('/conta')
        return
      }

      // Pre-fill name if available
      if (profile?.full_name) {
        setForm(f => ({ ...f, full_name: profile.full_name }))
      }

      setLoading(false)
    }
    check()
  }, [router])

  function formatCPF(value: string): string {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
    return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
  }

  function formatPhone(value: string): string {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 2) return nums
    if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  }

  async function handleSubmit() {
    if (!form.full_name.trim()) {
      toast({ type: 'error', title: 'Preencha seu nome completo' })
      return
    }
    if (form.cpf.replace(/\D/g, '').length !== 11) {
      toast({ type: 'error', title: 'CPF inválido', description: 'Precisa ter 11 dígitos' })
      return
    }
    if (!form.accepted_terms || !form.accepted_privacy) {
      toast({ type: 'error', title: 'Aceite os termos e a política de privacidade' })
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          cpf: form.cpf.replace(/\D/g, ''),
          phone: form.phone.replace(/\D/g, ''),
          birth_date: form.birth_date || null,
          accepted_terms_at: new Date().toISOString(),
          accepted_privacy_at: new Date().toISOString(),
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast({ type: 'success', title: 'Cadastro completo!', description: 'Seu bônus de R$50 está na carteira.' })
      router.push('/conta')
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro ao salvar', description: err?.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Complete seu cadastro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Precisamos de algumas informações para ativar sua conta.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nome completo</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Seu nome completo"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">CPF</label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.cpf}
                    onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Telefone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    inputMode="numeric"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Data de nascimento</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={form.birth_date}
                    onChange={e => setForm({ ...form, birth_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={() => {
                if (!form.full_name.trim()) {
                  toast({ type: 'error', title: 'Preencha seu nome' })
                  return
                }
                setStep(2)
              }}>
                Continuar
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accepted_terms}
                    onChange={e => setForm({ ...form, accepted_terms: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm">
                    Li e aceito os{' '}
                    <Link href="/termos" className="text-primary underline" target="_blank">Termos de Uso</Link>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.accepted_privacy}
                    onChange={e => setForm({ ...form, accepted_privacy: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm">
                    Li e aceito a{' '}
                    <Link href="/privacidade" className="text-primary underline" target="_blank">Política de Privacidade</Link>
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-400">Bônus de boas-vindas</p>
                    <p className="text-sm text-muted-foreground">Ao completar o cadastro, você recebe R$50 para começar!</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1"
                  disabled={saving || !form.accepted_terms || !form.accepted_privacy}
                  onClick={handleSubmit}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {saving ? 'Salvando...' : 'Completar cadastro'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
