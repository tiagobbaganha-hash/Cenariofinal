'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { Loader2, Mail, Lock, TrendingUp, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'password' | 'otp'
type OtpStep = 'request' | 'verify'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('password')
  const [otpStep, setOtpStep] = useState<OtpStep>('request')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast({ type: 'success', title: 'Bem-vindo de volta!' })
      router.push('/conta')
      router.refresh()
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Não foi possível entrar',
        description: err?.message ?? 'Verifique suas credenciais.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setOtpStep('verify')
      toast({ type: 'success', title: 'Código enviado!', description: 'Verifique seu e-mail.' })
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro ao enviar código', description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error
      toast({ type: 'success', title: 'Entrou com sucesso!' })
      router.push('/conta')
      router.refresh()
    } catch (err: any) {
      toast({ type: 'error', title: 'Código inválido', description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Header minimalista */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold">
              Cenario<span className="text-primary">X</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_60%)]" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre para acessar seus mercados e apostas.
            </p>
          </div>

          <Card className="border-border/60 shadow-2xl shadow-primary/5">
            <CardContent className="p-6">
              {/* Tab switcher */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {(['password', 'otp'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m)
                      setOtpStep('request')
                    }}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-all',
                      mode === m
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {m === 'password' ? 'Senha' : 'Código por e-mail'}
                  </button>
                ))}
              </div>

              {/* Password mode */}
              {mode === 'password' && (
                <form onSubmit={handlePassword} className="space-y-4">
                  <Field
                    icon={Mail}
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(v) => setEmail(v)}
                    placeholder="voce@email.com"
                    required
                  />
                  <Field
                    icon={Lock}
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={(v) => setPassword(v)}
                    placeholder="••••••••"
                    required
                  />
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              )}

              {/* OTP mode */}
              {mode === 'otp' && otpStep === 'request' && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <Field
                    icon={Mail}
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(v) => setEmail(v)}
                    placeholder="voce@email.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviaremos um código de 6 dígitos para seu e-mail.
                  </p>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar código'
                    )}
                  </Button>
                </form>
              )}

              {mode === 'otp' && otpStep === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Código enviado para <span className="font-medium text-foreground">{email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="mt-1 text-xs text-primary hover:underline"
                    >
                      Usar outro e-mail
                    </button>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Código de verificação
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Verificar e entrar'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-foreground">
              Termos
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="underline hover:text-foreground">
              Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: any
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="pl-10"
        />
      </div>
    </div>
  )
}
