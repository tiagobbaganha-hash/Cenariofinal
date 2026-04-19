import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
}

const typeConfig = {
  success: {
    className: 'border-success bg-success/10',
    titleClassName: 'text-success',
    descriptionClassName: 'text-success/90',
    icon: CheckCircle2,
  },
  error: {
    className: 'border-destructive bg-destructive/10',
    titleClassName: 'text-destructive',
    descriptionClassName: 'text-destructive/90',
    icon: AlertCircle,
  },
  warning: {
    className: 'border-warning bg-warning/10',
    titleClassName: 'text-warning',
    descriptionClassName: 'text-warning/90',
    icon: AlertCircle,
  },
  info: {
    className: 'border-border bg-card',
    titleClassName: 'text-foreground',
    descriptionClassName: 'text-muted-foreground',
    icon: AlertCircle,
  },
}

export function StatusMessage({ type, title, message, onClose }: StatusMessageProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Alert className={config.className}>
      <Icon className="h-4 w-4" />
      <div className="flex-1">
        {title && (
          <AlertTitle className={config.titleClassName}>
            {title}
          </AlertTitle>
        )}
        <AlertDescription className={config.descriptionClassName}>
          {message}
        </AlertDescription>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      )}
    </Alert>
  )
}
