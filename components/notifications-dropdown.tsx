'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Trophy, AlertCircle, TrendingUp, Gift, Loader2, CheckCheck } from 'lucide-react'
import Link from 'next/link'

interface Notif {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read_at: string | null
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  bet_win:       { icon: '🏆', color: 'text-primary',      bg: 'bg-primary/10'      },
  bet_loss:      { icon: '❌', color: 'text-destructive',  bg: 'bg-destructive/10'  },
  bet_refund:    { icon: '↩️', color: 'text-blue-400',     bg: 'bg-blue-500/10'     },
  deposit:       { icon: '💰', color: 'text-green-400',    bg: 'bg-green-500/10'    },
  withdrawal:    { icon: '📤', color: 'text-orange-400',   bg: 'bg-orange-500/10'   },
  market_new:    { icon: '📊', color: 'text-cyan-400',     bg: 'bg-cyan-500/10'     },
  level_up:      { icon: '⭐', color: 'text-yellow-400',   bg: 'bg-yellow-500/10'   },
  system:        { icon: '🔔', color: 'text-muted-foreground', bg: 'bg-muted'       },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function NotificationsDropdown({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUnreadCount()
    // Realtime para novas notificações
    const supabase = createClient()
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadUnreadCount()
        if (open) loadNotifs()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, open])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadUnreadCount() {
    const supabase = createClient()
    const { count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
    setUnread(count || 0)
  }

  async function loadNotifs() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15)
    setNotifs((data || []) as Notif[])
    setLoading(false)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setUnread(u => Math.max(0, u - 1))
  }

  async function markAllRead() {
    const supabase = createClient()
    await supabase.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  function handleOpen() {
    setOpen(v => {
      if (!v) loadNotifs()
      return !v
    })
  }

  const cfg = (type: string) => TYPE_CONFIG[type] ?? TYPE_CONFIG.system

  return (
    <div ref={ref} className="relative">
      {/* Botão sino */}
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-bounce">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Notificações</span>
              {unread > 0 && (
                <span className="rounded-full bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5">{unread}</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Sem notificações</p>
              </div>
            ) : (
              notifs.map(n => {
                const c = cfg(n.type)
                const isUnread = !n.read_at
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (isUnread) markRead(n.id) }}
                    className={`flex items-start gap-3 px-4 py-3.5 border-b border-border/50 cursor-pointer hover:bg-accent/30 transition-colors ${isUnread ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-lg ${c.bg}`}>
                      {c.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-semibold leading-snug ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border text-center">
            <Link href="/notificacoes" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
              Ver todas as notificações →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
