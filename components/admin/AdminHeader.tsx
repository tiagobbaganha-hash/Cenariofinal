'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Bell, User } from 'lucide-react'

export function AdminHeader() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const read = async () => {
      const { data } = await supabase.auth.getSession()
      setEmail(data.session?.user?.email ?? null)
    }
    read()
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Painel Administrativo</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{email ?? 'Admin'}</span>
        </div>
      </div>
    </header>
  )
}
