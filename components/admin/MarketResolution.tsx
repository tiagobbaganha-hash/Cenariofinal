'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface MarketResolutionProps {
  marketId: string
  marketTitle: string
  options: Array<{ id: string; label: string }>
  onResolved?: () => void
}

export function MarketResolution({ marketId, marketTitle, options, onResolved }: MarketResolutionProps) {
  const toast = useToast()
  const [step, setStep] = useState<'select' | 'confirm' | 'void'>('select')
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedOption = options.find((o) => o.id === selectedOptionId)

  const handleResolve = async (voidMarket = false) => {
    setLoading(true)

    try {
      if (!voidMarket && !selectedOptionId) {
        toast.error('Erro', 'Selecione uma opção vencedora')
        return
      }

      // TODO: Implementar chamada API para resolver mercado
      // const { error } = await supabase
      //   .from('markets')
      //   .update({
      //     status: 'resolved',
      //     winning_option_id: voidMarket ? null : selectedOptionId,
      //   })
      //   .eq('id', marketId)

      toast.success(
        'Mercado resolvido!',
        voidMarket
          ? 'Este mercado foi anulado. Todas as apostas serão reembolsadas.'
          : `${selectedOption?.label} foi declarado como vencedor.`
      )

      setStep('select')
      setSelectedOptionId(null)
      onResolved?.()
    } catch (error: any) {
      toast.error('Erro', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertCircle className="h-5 w-5" />
          Resolver Mercado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {marketTitle}
        </p>

        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Selecione a opção vencedora:</p>
            <div className="space-y-2">
              {options.map((option) => (
                <label key={option.id} className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="radio"
                    name="winning-option"
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={(e) => setSelectedOptionId(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setStep('confirm')}
                disabled={!selectedOptionId}
                className="flex-1"
              >
                Resolver com esta opção
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('void')}
                className="flex-1"
              >
                Anular Mercado
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedOption && (
          <div className="space-y-4">
            <div className="rounded-lg bg-success/10 border border-success p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-success">Confirmação</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você está declarando <strong>{selectedOption.label}</strong> como a opção vencedora.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Todos os usuários que apostaram nesta opção receberão seus ganhos automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleResolve(false)}
                loading={loading}
                className="flex-1"
                disabled={loading}
              >
                Confirmar Resolução
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {step === 'void' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-warning/10 border border-warning p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-warning">Anular Mercado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tem certeza que deseja anular este mercado?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Todos os usuários receberão o reembolso de suas apostas.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleResolve(true)}
                loading={loading}
                variant="destructive"
                className="flex-1"
                disabled={loading}
              >
                Anular Mercado
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
