'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/useToast'
import { Loader2, Mail, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'password' | 'otp'
type AuthAction = 'signin' | 'signup'
type OtpStep = 'request' | 'verify'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('password')
  const [action, setAction] = useState<AuthAction>('signin')
  const [otpStep, setOtpStep] = useState<OtpStep>('request')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      
      if (action === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: email.split('@')[0] }
          }
        })
        if (error) throw error
        toast({ type: 'success', title: 'Conta criada!' })
        router.push('/onboarding')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast({ type: 'success', title: 'Bem-vindo de volta!' })
        router.push('/conta')
        router.refresh()
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: action === 'signup' ? 'Erro ao criar conta' : 'Não foi possível entrar',
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
      const supabase = createClient()
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
      const supabase = createClient()
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

  async function handleGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast({ type: 'error', title: 'Erro ao conectar Google', description: error.message })
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-8rem)] flex-col">
      {/* Content */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_60%)]" />

        <div className="relative w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight">
              {action === 'signup' ? 'Criar sua conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {action === 'signup' 
                ? 'Crie uma conta para começar a prever o futuro.'
                : 'Entre para acessar seus mercados e apostas.'}
            </p>
          </div>

          <Card className="border-border/60 shadow-2xl shadow-primary/5">
            <CardContent className="p-6">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full mb-4 gap-2"
                onClick={handleGoogle}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
              </div>

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
                        {action === 'signup' ? 'Criando...' : 'Entrando...'}
                      </>
                    ) : (
                      action === 'signup' ? 'Criar conta' : 'Entrar'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAction(action === 'signin' ? 'signup' : 'signin')}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {action === 'signin' 
                      ? 'Não tem conta? Criar conta grátis' 
                      : 'Já tem conta? Entrar'}
                  </button>
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
