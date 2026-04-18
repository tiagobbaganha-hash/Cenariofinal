import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link href={action.href}>
          <Button>
            <Plus className="h-4 w-4" />
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  )
}
