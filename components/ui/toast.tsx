import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Toast } from '@/lib/context/ToastContext'

interface ToastProps extends Toast {
  onClose: () => void
}

export function Toast({ id, title, description, type, onClose }: ToastProps) {
  const typeConfig = {
    success: {
      bg: 'bg-success/10',
      border: 'border-success',
      text: 'text-success',
      icon: CheckCircle,
    },
    error: {
      bg: 'bg-destructive/10',
      border: 'border-destructive',
      text: 'text-destructive',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-primary/10',
      border: 'border-primary',
      text: 'text-primary',
      icon: Info,
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning',
      text: 'text-warning',
      icon: AlertTriangle,
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 backdrop-blur-sm animate-in fade-in slide-in-from-right-5',
        config.bg,
        config.border,
        'border'
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.text)} />
      <div className="flex-1">
        <p className={cn('font-medium', config.text)}>{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
