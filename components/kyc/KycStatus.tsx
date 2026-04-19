import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { getKycStatus, startVeriffSession, VeriffStatus } from '@/lib/kyc/veriff'

interface KycStatusProps {
  userId: string
  onStatusChange?: (status: VeriffStatus) => void
}

export function KycStatus({ userId, onStatusChange }: KycStatusProps) {
  const [status, setStatus] = useState<VeriffStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifyLoading, setVerifyLoading] = useState(false)

  useEffect(() => {
    loadKycStatus()
  }, [userId])

  const loadKycStatus = async () => {
    try {
      const kycStatus = await getKycStatus(userId)
      setStatus(kycStatus)
      if (kycStatus) {
        onStatusChange?.(kycStatus)
      }
    } catch (error) {
      console.error('[KycStatus] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartVerification = async () => {
    setVerifyLoading(true)
    try {
      const { data, error } = await startVeriffSession(userId)
      if (error) throw error

      // Redirecionar para Veriff
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('[KycStatus] Error starting verification:', error)
    } finally {
      setVerifyLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificação KYC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    pending: {
      label: 'Pendente',
      icon: Clock,
      variant: 'warning' as const,
      color: 'text-warning',
    },
    approved: {
      label: 'Aprovado',
      icon: CheckCircle,
      variant: 'success' as const,
      color: 'text-success',
    },
    declined: {
      label: 'Rejeitado',
      icon: AlertTriangle,
      variant: 'destructive' as const,
      color: 'text-destructive',
    },
    resubmission_required: {
      label: 'Reenvio Necessário',
      icon: AlertCircle,
      variant: 'warning' as const,
      color: 'text-warning',
    },
    expired: {
      label: 'Expirado',
      icon: AlertTriangle,
      variant: 'warning' as const,
      color: 'text-warning',
    },
  }

  const currentStatus = status?.status || 'pending'
  const config = statusConfig[currentStatus as keyof typeof statusConfig]
  const Icon = config?.icon

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Verificação KYC</CardTitle>
        <Badge variant={config?.variant}>{config?.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${config?.color}`} />}
          <div>
            <p className="font-medium">{config?.label}</p>
            <p className="text-sm text-muted-foreground">
              {currentStatus === 'approved' && 'Sua identidade foi verificada com sucesso'}
              {currentStatus === 'pending' && 'Sua verificação está em andamento'}
              {currentStatus === 'declined' && 'Sua verificação foi rejeitada'}
              {currentStatus === 'resubmission_required' && 'Você precisa reenviar seus documentos'}
              {currentStatus === 'expired' && 'Sua sessão de verificação expirou'}
            </p>
          </div>
        </div>

        {currentStatus === 'declined' && status?.declineReason && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Motivo da Rejeição</AlertTitle>
            <AlertDescription>{status.declineReason}</AlertDescription>
          </Alert>
        )}

        {(currentStatus === 'pending' || currentStatus === 'resubmission_required' || currentStatus === 'expired') && (
          <Button
            onClick={handleStartVerification}
            disabled={verifyLoading}
            className="w-full"
          >
            {verifyLoading ? 'Iniciando...' : 'Iniciar Verificação'}
            {!verifyLoading && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          A verificação é necessária para depósitos, saques e participação em mercados com dinheiro real.
        </p>
      </CardContent>
    </Card>
  )
}
