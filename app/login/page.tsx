'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

type LoginMode = 'signin' | 'signup' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [mode, setMode] = useState<LoginMode>('signin')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/')
    })
  }, [router])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email || !password) {
        throw new Error('Preencha e-mail e senha')
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email || !password) {
        throw new Error('Preencha e-mail e senha')
      }

      if (password.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres')
      }

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!email) {
        throw new Error('Preencha seu e-mail')
      }

      // Enviar OTP - será implementado com real OTP service
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error

      setSuccess(true)
      setOtp('')
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar código')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!otp) {
        throw new Error('Preencha o código de verificação')
      }

      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error

      router.push('/')
    } catch (err: any) {
      setError(err?.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {mode === 'signin' && 'Bem-vindo ao CenarioX'}
            {mode === 'signup' && 'Criar Conta'}
            {mode === 'otp' && 'Verificação por E-mail'}
          </CardTitle>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {mode === 'signin' && 'Entre com sua conta para começar'}
            {mode === 'signup' && 'Crie sua conta gratuitamente'}
            {mode === 'otp' && 'Enviamos um código para seu e-mail'}
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && mode === 'signup' && (
            <Alert className="mb-4">
              <AlertTitle>Conta criada com sucesso!</AlertTitle>
              <AlertDescription>
                Redirecionando para a página inicial...
              </AlertDescription>
            </Alert>
          )}

          {success && mode === 'otp' && (
            <Alert className="mb-4">
              <AlertTitle>Código enviado!</AlertTitle>
              <AlertDescription>
                Verifique seu e-mail e digite o código abaixo.
              </AlertDescription>
            </Alert>
          )}

          {/* Email/Password Sign In */}
          {mode === 'signin' && (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  E-mail
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMode('otp')
                  setPassword('')
                  setError(null)
                }}
                disabled={loading}
              >
                Entrar com E-mail
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Criar conta
                </button>
              </p>
            </form>
          )}

          {/* Email/Password Sign Up */}
          {mode === 'signup' && (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  E-mail
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Senha
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Criando...' : 'Criar Conta'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Entrar
                </button>
              </p>
            </form>
          )}

          {/* OTP */}
          {mode === 'otp' && (
            <form onSubmit={success ? handleOtpVerify : handleOtpSignIn} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  E-mail
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  required
                />
              </div>

              {success && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Código de Verificação
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    maxLength={6}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Verifique seu e-mail pelo código
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {success ? (loading ? 'Verificando...' : 'Verificar Código') : (loading ? 'Enviando...' : 'Enviar Código')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setOtp('')
                    setSuccess(false)
                    setError(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  Voltar
                </button>
              </p>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            <p>
              Ao entrar, você concorda com nossos{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Termos
              </Link>
              {' '}e{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacidade
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
