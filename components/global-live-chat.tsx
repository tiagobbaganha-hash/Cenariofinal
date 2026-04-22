'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, X, Send, Loader2, Users, ChevronRight } from 'lucide-react'

interface ChatMsg {
  id: string
  user_id: string
  author_name: string
  message: string
  created_at: string
}

const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫']
function getAvatar(id: string) { return AVATARS[(id?.charCodeAt(0) || 0) % AVATARS.length] }
function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return 'agora'
  if (d < 3600000) return `${Math.floor(d/60000)}m`
  return `${Math.floor(d/3600000)}h`
}

export function GlobalLiveChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Apostador')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('global_chat')
      .select('id, user_id, author_name, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setMessages(data.reverse())
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        supabase.from('profiles').select('full_name, email').eq('id', data.user.id).single()
          .then(({ data: p }) => {
            setUserName((p as any)?.email?.split('@')[0] || (p as any)?.full_name?.split(' ')[0] || 'Apostador')
          })
      }
    })

    load()

    // Simular online count (pode expandir com presença real)
    setOnline(Math.floor(20 + Math.random() * 80))

    // Realtime
    const ch = supabase
      .channel('global-chat-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' },
        (payload) => {
          setMessages(prev => [...prev.slice(-49), payload.new as ChatMsg])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [load])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    if (!text.trim() || !userId) return
    setSending(true)
    try {
      const supabase = createClient()
      await supabase.from('global_chat').insert({
        user_id: userId,
        author_name: userName,
        message: text.trim(),
      })
      setText('')
    } catch (_) {}
    setSending(false)
  }

  return (
    <>
      {/* Painel lateral */}
      <div className={`fixed right-0 top-0 h-full w-80 z-40 flex flex-col border-l border-border bg-card/95 backdrop-blur-md shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-foreground">CHAT AO VIVO</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3" /> {online} online
            </span>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Seja o primeiro a comentar!</p>
          )}
          {messages.map(msg => {
            const isMe = msg.user_id === userId
            return (
              <div key={msg.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="text-base flex-shrink-0">{getAvatar(msg.user_id)}</div>
                <div className={`max-w-[200px] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!isMe && (
                    <span className="text-[10px] font-semibold text-primary mb-0.5">@{msg.author_name}</span>
                  )}
                  <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5">{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          {userId ? (
            <div className="flex gap-2 items-center">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Enviar mensagem..."
                maxLength={200}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              />
              <button onClick={send} disabled={!text.trim() || sending}
                className="flex-shrink-0 h-8 w-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-foreground" /> : <Send className="h-3.5 w-3.5 text-primary-foreground" />}
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              <a href="/login" className="text-primary hover:underline">Faça login</a> para participar
            </p>
          )}
          <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5">Seja respeitoso. Siga as regras da comunidade.</p>
        </div>
      </div>

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 rounded-l-xl border border-r-0 border-border bg-card px-3 py-4 shadow-lg transition-all hover:bg-primary/10 hover:border-primary/40 ${open ? 'translate-x-80' : 'translate-x-0'}`}
        style={{ transition: 'transform 300ms, background 150ms, border-color 150ms' }}
      >
        <div className="flex flex-col items-center gap-1.5">
          {open ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <>
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-[9px] font-bold text-primary writing-mode-vertical" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
                CHAT AO VIVO
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {online}
              </span>
            </>
          )}
        </div>
      </button>

      {/* Overlay no mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
