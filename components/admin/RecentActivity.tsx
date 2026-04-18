import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

interface Activity {
  id: string
  type: 'bet' | 'deposit' | 'withdrawal' | 'market_created' | 'user_registered'
  description: string
  amount?: number
  timestamp: string
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'bet',
    description: 'Aposta em "Lula vence 2026"',
    amount: 150,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    type: 'deposit',
    description: 'Deposito via Pix',
    amount: 500,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '3',
    type: 'user_registered',
    description: 'Novo usuario: joao@email.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '4',
    type: 'market_created',
    description: 'Mercado criado: "Bitcoin acima de 100k"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '5',
    type: 'withdrawal',
    description: 'Saque aprovado',
    amount: 200,
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
]

const typeLabels: Record<Activity['type'], { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
  bet: { label: 'Aposta', variant: 'default' },
  deposit: { label: 'Deposito', variant: 'success' },
  withdrawal: { label: 'Saque', variant: 'warning' },
  market_created: { label: 'Mercado', variant: 'secondary' },
  user_registered: { label: 'Usuario', variant: 'secondary' },
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Badge variant={typeLabels[activity.type].variant}>
                  {typeLabels[activity.type].label}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
              {activity.amount && (
                <span className="text-sm font-semibold">
                  R$ {activity.amount.toFixed(2)}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
