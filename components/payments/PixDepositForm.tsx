import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Loader2, QrCode } from 'lucide-react'
import { generatePixQrCode, processPixDeposit } from '@/lib/payments/pix'

interface PixDepositProps {
  userId: string
  onSuccess?: (transactionId: string) => void
}

export function PixDepositForm({ userId, onSuccess }: PixDepositProps) {
  const [step, setStep] = useState<'amount' | 'qrcode' | 'success'>('amount')
  const [amount, setAmount] = useState('')
  const [qrCode, setQrCode] = useState<{
    qrCode: string
    qrCodeUrl: string
    txId: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerateQrCode = async () => {
    setLoading(true)
    setError(null)

    try {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Digite um valor válido')
      }

      if (numAmount > 50000) {
        throw new Error('Limite máximo é R$ 50.000')
      }

      const { data, error: genError } = await generatePixQrCode(userId, numAmount)
      if (genError) throw new Error(genError)

      setQrCode(data || null)
      setStep('qrcode')
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPixCode = () => {
    if (qrCode?.qrCode) {
      navigator.clipboard.writeText(qrCode.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmPayment = async () => {
    if (!qrCode) return

    setLoading(true)
    setError(null)

    try {
      const { error: payError } = await processPixDeposit(
        userId,
        parseFloat(amount),
        qrCode.txId
      )

      if (payError) throw new Error(payError)

      setStep('success')
      onSuccess?.(qrCode.txId)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depositar via Pix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'amount' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Valor a Depositar
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  type="number"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  step="0.01"
                  min="1"
                  max="50000"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo: R$ 1,00 | Máximo: R$ 50.000,00
              </p>
            </div>

            <Button
              onClick={handleGenerateQrCode}
              disabled={loading || !amount}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" />
                  Gerar QR Code
                </>
              )}
            </Button>
          </div>
        )}

        {step === 'qrcode' && qrCode && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <img
                src={qrCode.qrCodeUrl}
                alt="Pix QR Code"
                className="mx-auto h-64 w-64"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Ou copie o código:</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={qrCode.qrCode}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyPixCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Faça a transferência de R$ {parseFloat(amount).toLocaleString('pt-BR')} para chave Pix da CenarioX. A transação será confirmada automaticamente em até 30 segundos.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('amount')
                  setAmount('')
                  setQrCode(null)
                  setError(null)
                }}
              >
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                {loading ? 'Confirmando...' : 'Já Paguei'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Check className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-medium">Depósito Confirmado!</p>
              <p className="text-sm text-muted-foreground">
                R$ {parseFloat(amount).toLocaleString('pt-BR')} foi adicionado à sua conta.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setStep('amount')
                setAmount('')
                setQrCode(null)
              }}
            >
              Fazer Outro Depósito
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
