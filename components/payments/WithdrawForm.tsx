'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import { requestWithdrawal, getUserBalance } from '@/lib/api/wallet'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'amount' | 'pix_key' | 'confirm' | 'success'

export function WithdrawForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)
  const [user, setUser] = useState<any>(null)

  const handleGetBalance = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        router.push('/login')
        return
      }

      setUser(data.session.user)
      const userBalance = await getUserBalance(data.session.user.id)
      if (userBalance) {
        setBalance(userBalance.balance)
      }
    } catch (error) {
      console.error('Erro ao carregar saldo:', error)
    }
  }

  useState(() => {
    handleGetBalance()
  }, [])

  const amountNum = parseFloat(amount) || 0
  const minAmount = 10
  const maxAmount = balance

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!amount) {
      setError('Digite um valor')
      return
    }

    if (amountNum < minAmount) {
      setError(`Valor mínimo é ${formatCurrency(minAmount)}`)
      return
    }

    if (amountNum > balance) {
      setError('Saldo insuficiente')
      return
    }

    setStep('pix_key')
  }

  const handlePixKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!pixKey) {
      setError('Digite sua chave Pix')
      return
    }

    setStep('confirm')
  }

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('Usuário não autenticado')

      const { error: withdrawError } = await requestWithdrawal(user.id, amountNum, pixKey)
      if (withdrawError) throw new Error(withdrawError)

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Erro ao processar saque')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/wallet">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Solicitar Saque</h1>
          <p className="text-muted-foreground">Saque via Pix em minutos</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="max-w-md">
        {/* Step 1: Amount */}
        {step === 'amount' && (
          <Card>
            <CardHeader>
              <CardTitle>Quanto deseja sacar?</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Saldo disponível: {formatCurrency(balance)}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAmountSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Valor (R$)</label>
                  <Input
                    type="number"
                    placeholder="100.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min={minAmount}
                    max={maxAmount}
                    required
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mínimo: {formatCurrency(minAmount)}
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Continuar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pix Key */}
        {step === 'pix_key' && (
          <Card>
            <CardHeader>
              <CardTitle>Chave Pix para recebimento</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Confirme sua chave Pix registrada
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePixKeySubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Tipo de Chave</label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value as any)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="cpf">CPF</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Chave Pix</label>
                  <Input
                    placeholder={
                      pixKeyType === 'cpf'
                        ? '12345678901'
                        : pixKeyType === 'email'
                          ? 'seu@email.com'
                          : pixKeyType === 'phone'
                            ? '11999999999'
                            : '12345678-1234-1234-1234-123456789012'
                    }
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('amount')}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continuar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle>Confirme seu saque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-medium">{formatCurrency(amountNum)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chave Pix</span>
                    <span className="font-mono text-sm">{pixKey}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">{formatCurrency(amountNum)}</span>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Saques via Pix são processados em 1-2 dias úteis. Você receberá uma confirmação
                    por e-mail.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleConfirmWithdraw} className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('pix_key')}
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Processando...' : 'Confirmar Saque'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Saque Solicitado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Sua solicitação de saque de {formatCurrency(amountNum)} foi recebida com sucesso.
                  Você receberá o valor em 1-2 dias úteis.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => router.push('/wallet')}
                className="w-full"
              >
                Voltar à Carteira
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
