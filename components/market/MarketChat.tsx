'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, Users, Loader2, Star } from 'lucide-react'

interface ChatMessage {
  id: string
  user_id: string
  username: string
  message: string
  created_at: string
  is_own: boolean
}

const QUICK_REACTIONS = ['🔥', '💯', '🚀', '😮', '👍', '❌']
const MAX_MSG = 300
const RATE_LIMIT_MS = 3000 // 3s entre mensagens

export function MarketChat({ marketId }: { marketId: string }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState('Anônimo')
  const [onlineCount, setOnlineCount] = useState(1)
  const [error, setError] = useState('')
  const [lastSent, setLastSent] = useState(0)
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)

  // Carregar usuário + mensagens iniciais
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single()
        setUsername((profile as any)?.username || (profile as any)?.full_name?.split(' ')[0] || 'Apostador')
      }

      // Últimas 50 mensagens
      const { data: msgs } = await supabase
        .from('market_chat')
        .select('id, user_id, message, created_at, profiles(username, full_name)')
        .eq('market_id', marketId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (msgs) {
        setMessages(msgs.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          username: m.profiles?.username || m.profiles?.full_name?.split(' ')[0] || 'Apostador',
          message: m.message,
          created_at: m.created_at,
          is_own: m.user_id === user?.id,
        })))
      }
      setLoading(false)
    }
    init()
  }, [marketId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`market_chat:${marketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'market_chat', filter: `market_id=eq.${marketId}` },
        async (payload) => {
          const m = payload.new as any
          // Buscar username
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', m.user_id)
            .single()

          const newMsg: ChatMessage = {
            id: m.id,
            user_id: m.user_id,
            username: (profile as any)?.username || (profile as any)?.full_name?.split(' ')[0] || 'Apostador',
            message: m.message,
            created_at: m.created_at,
            is_own: m.user_id === userId,
          }
          setMessages(prev => [...prev.slice(-99), newMsg])
          if (!open) setUnread(u => u + 1)
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setOnlineCount(Math.max(1, Object.keys(state).length))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userId) {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [marketId, userId, open])

  // Auto-scroll
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
    }
  }, [messages, open])

  async function handleSend(msg?: string) {
    const content = (msg ?? text).trim()
    if (!content || !userId) return
    if (!msg && content.length > MAX_MSG) return

    const now = Date.now()
    if (now - lastSent < RATE_LIMIT_MS) {
      setError(`Aguarde ${Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 1000)}s`)
      setTimeout(() => setError(''), 2000)
      return
    }

    setSending(true)
    setError('')
    try {
      const { error: err } = await supabase.from('market_chat').insert({
        market_id: marketId,
        user_id: userId,
        message: content,
      })
      if (err) throw err
      if (!msg) setText('')
      setLastSent(Date.now())
    } catch (e: any) {
      setError(e.message?.includes('row-level') ? 'Faça login para comentar' : 'Erro ao enviar')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => { setOpen(v => !v); setUnread(0) }}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-card/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
            <MessageSquare className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              Chat ao vivo
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {onlineCount} online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && !open && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          <svg className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-border flex flex-col" style={{ height: '400px' }}>
          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda</p>
                <p className="text-xs text-muted-foreground">Seja o primeiro a comentar!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const showUser = i === 0 || messages[i-1].user_id !== msg.user_id
                return (
                  <div key={msg.id} className={`flex flex-col ${msg.is_own ? 'items-end' : 'items-start'}`}>
                    {showUser && !msg.is_own && (
                      <span className="text-[10px] text-muted-foreground ml-1 mb-0.5 font-medium">
                        @{msg.username}
                      </span>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.is_own
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reações rápidas */}
          <div className="flex gap-1.5 px-4 py-2 border-t border-border/50">
            {QUICK_REACTIONS.map(r => (
              <button
                key={r}
                onClick={() => handleSend(r)}
                disabled={!userId || sending}
                className="text-lg hover:scale-125 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {r}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-border/50">
            {error && <p className="text-xs text-destructive mb-1.5">{error}</p>}
            {!userId ? (
              <p className="text-xs text-center text-muted-foreground py-2">
                <a href="/login" className="text-primary hover:underline">Faça login</a> para participar do chat
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, MAX_MSG))}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Enviar mensagem..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!text.trim() || sending}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            )}
            {text.length > MAX_MSG * 0.8 && (
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{text.length}/{MAX_MSG}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
