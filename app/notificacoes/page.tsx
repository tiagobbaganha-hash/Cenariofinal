'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCheck, Loader2, Filter } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  bet_win:    { icon: '🏆', label: 'Aposta ganha' },
  bet_loss:   { icon: '❌', label: 'Aposta perdida' },
  bet_refund: { icon: '↩️', label: 'Reembolso' },
  deposit:    { icon: '💰', label: 'Depósito' },
  withdrawal: { icon: '📤', label: 'Saque' },
  market_new: { icon: '📊', label: 'Novo mercado' },
  level_up:   { icon: '⭐', label: 'Nível subiu' },
  system:     { icon: '🔔', label: 'Sistema' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function NotificacoesPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      setNotifs(data || [])
      setLoading(false)

      // Marcar todas como lidas ao abrir a página
      await supabase.from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null)
    }
    load()
  }, [])

  const filtered = filter === 'all'
    ? notifs
    : filter === 'unread'
      ? notifs.filter(n => !n.read_at)
      : notifs.filter(n => n.type === filter)

  const unreadCount = notifs.filter(n => !n.read_at).length

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Notificações</h1>
            {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} não lidas</p>}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'unread', label: `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
          { id: 'bet_win', label: '🏆 Ganhos' },
          { id: 'deposit', label: '💰 Depósitos' },
          { id: 'market_new', label: '📊 Mercados' },
          { id: 'system', label: '🔔 Sistema' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${filter === f.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhuma notificação{filter !== 'all' ? ' nesta categoria' : ' ainda'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system
            const isUnread = !n.read_at
            return (
              <div key={n.id} className={`rounded-2xl border p-4 flex items-start gap-3 transition-colors ${isUnread ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-card border border-border text-xl">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                    {isUnread && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</span>
                    <span className={`text-[10px] rounded-full px-1.5 py-0.5 bg-muted text-muted-foreground`}>{cfg.label}</span>
                    {n.link && (
                      <a href={n.link} className="text-[10px] text-primary hover:underline">Ver detalhes →</a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
