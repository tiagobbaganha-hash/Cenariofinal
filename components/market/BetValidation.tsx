'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  checkBetLimit,
  getUserKycStatus,
  getUserLimitUsage,
  RiskLimitResult,
} from '@/lib/compliance/riskLimits'
import { createClient } from '@/lib/supabase/client'

interface BetValidationProps {
  amount: number
  userId?: string
  onValidationChange?: (isValid: boolean, result?: RiskLimitResult) => void
}

export function BetValidation({ amount, userId, onValidationChange }: BetValidationProps) {
  const [result, setResult] = useState<RiskLimitResult | null>(null)
  const [limitUsage, setLimitUsage] = useState<any>(null)
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validate = async () => {
      try {
        let currentUserId = userId
        if (!currentUserId) {
          const supabase = createClient()
          const { data } = await supabase.auth.getSession()
          currentUserId = data.session?.user?.id
        }

        if (!currentUserId) {
          setLoading(false)
          return
        }

        // Obter status KYC
        const kyc = await getUserKycStatus(currentUserId)
        setKycStatus(kyc)

        // Verificar limite de aposta
        const validation = await checkBetLimit(currentUserId, amount)
        setResult(validation)

        // Obter uso de limite
        const usage = await getUserLimitUsage(currentUserId)
        setLimitUsage(usage)

        onValidationChange?.(validation.allowed, validation)
      } catch (error) {
        console.error('[BetValidation] Error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (amount > 0) {
      validate()
    }
  }, [amount, userId, onValidationChange])

  if (loading || !result) {
    return null
  }

  if (result.allowed) {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertTitle>Aposta Permitida</AlertTitle>
        <AlertDescription>
          Você pode apostar {formatCurrency(amount)} sem problema.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant={result.warning ? 'warning' : 'destructive'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{result.warning ? 'Aviso' : 'Limite Atingido'}</AlertTitle>
      <AlertDescription className="space-y-2 mt-2">
        <p>{result.message}</p>

        {/* Mostrar limites atuais */}
        {limitUsage && (
          <div className="mt-3 space-y-1 text-sm">
            {limitUsage.daily && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Limite diário:</span>
                <span>
                  {formatCurrency(limitUsage.daily.used)} / {formatCurrency(limitUsage.daily.limit)}
                </span>
              </div>
            )}
            {limitUsage.monthly && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Limite mensal:</span>
                <span>
                  {formatCurrency(limitUsage.monthly.used)} / {formatCurrency(limitUsage.monthly.limit)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Sugestões */}
        {result.suggestion && (
          <div className="mt-3 p-2 rounded bg-background/50">
            <p className="text-xs text-muted-foreground">{result.suggestion}</p>
          </div>
        )}

        {/* Status KYC */}
        {kycStatus && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Status KYC:</span>
            <Badge variant={kycStatus === 'approved' ? 'success' : 'warning'}>
              {kycStatus === 'approved' ? 'Aprovado' : 'Pendente'}
            </Badge>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Component auxiliar para mostrar limites do usuário
export function UserLimitsInfo({ userId }: { userId: string }) {
  const [limits, setLimits] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const kyc = await getUserKycStatus(userId)
        const usage = await getUserLimitUsage(userId)
        setLimits({ kycStatus: kyc, usage })
      } catch (error) {
        console.error('[UserLimitsInfo]', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  if (loading || !limits) {
    return null
  }

  return (
    <Alert>
      <AlertTitle className="text-sm">Seus Limites</AlertTitle>
      <AlertDescription className="text-xs space-y-2 mt-2">
        <div>
          <span className="text-muted-foreground">Status KYC:</span>{' '}
          <Badge variant="outline" className="ml-1">
            {limits.kycStatus === 'approved' ? 'Aprovado' : 'Pendente'}
          </Badge>
        </div>

        {limits.usage?.daily && (
          <div>
            <span className="text-muted-foreground">Apostas hoje:</span>{' '}
            {formatCurrency(limits.usage.daily.used)} / {formatCurrency(limits.usage.daily.limit)}
          </div>
        )}

        {limits.usage?.monthly && (
          <div>
            <span className="text-muted-foreground">Apostas este mês:</span>{' '}
            {formatCurrency(limits.usage.monthly.used)} / {formatCurrency(limits.usage.monthly.limit)}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
