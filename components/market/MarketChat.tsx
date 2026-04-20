'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Smile, Loader2 } from 'lucide-react'

interface Message { id: string; user_id: string; message: string; created_at: string; username?: string }

const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']
const QUICK_EMOJIS = ['🔥','💯','🎯','📈','📉','🚀','💎','🤔','👍','👎','😂','🏆']
const QUICK_GIFS = [
  { label: 'Stonks', url: 'https://media.giphy.com/media/XNBcChLQt3beckMGhZ/giphy.gif' },
  { label: 'Moon', url: 'https://media.giphy.com/media/YnkMcHgNIMW4Yfmjxr/giphy.gif' },
  { label: 'Hype', url: 'https://media.giphy.com/media/l41Ymrnk3UYOAJ1rO/giphy.gif' },
  { label: 'Isso!', url: 'https://media.giphy.com/media/OkJat1YNdoD3W/giphy.gif' },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  return `${Math.floor(diff / 3600000)}h`
}

export function MarketChat({ marketId }: { marketId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))

    // Carregar mensagens
    supabase.from('market_chat')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => { setMessages(data || []); setLoading(false) })

    // Realtime
    const channel = supabase.channel(`chat:${marketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_chat', filter: `market_id=eq.${marketId}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [marketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(content?: string) {
    const msg = content || text.trim()
    if (!msg || !userId) return
    setSending(true)
    setShowEmoji(false)
    setShowGif(false)
    try {
      const supabase = createClient()
      await supabase.from('market_chat').insert({ market_id: marketId, user_id: userId, message: msg })
      setText('')
    } catch (e) {}
    setSending(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: 360 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-semibold text-foreground">Chat ao vivo</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{messages.length} mensagens</span>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
            <span className="text-3xl">💬</span>
            <p className="text-xs text-muted-foreground text-center">Seja o primeiro a comentar!</p>
          </div>
        ) : messages.map(m => {
          const isMe = m.user_id === userId
          const emoji = AVATARS[m.user_id.charCodeAt(0) % AVATARS.length]
          const isGif = m.message.startsWith('__GIF__:')
          const gifUrl = isGif ? m.message.replace('__GIF__:', '') : null

          return (
            <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="text-base flex-shrink-0">{emoji}</div>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-border'}`}>
                {gifUrl ? (
                  <img src={gifUrl} alt="GIF" className="rounded-xl max-w-[180px]" />
                ) : (
                  <p className="text-sm text-foreground break-words">{m.message}</p>
                )}
                <p className={`text-[9px] mt-0.5 ${isMe ? 'text-primary/60 text-right' : 'text-muted-foreground'}`}>{timeAgo(m.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {userId ? (
        <div className="border-t border-border/50 p-3 space-y-2">
          {/* Emoji picker */}
          {showEmoji && (
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/50 border border-border">
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => send(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
              ))}
            </div>
          )}
          {/* GIF picker */}
          {showGif && (
            <div className="flex gap-2 overflow-x-auto p-2 rounded-xl bg-muted/50 border border-border">
              {QUICK_GIFS.map(g => (
                <button key={g.label} onClick={() => send(`__GIF__:${g.url}`)} className="flex-shrink-0">
                  <img src={g.url} alt={g.label} className="h-16 w-auto rounded-lg hover:scale-105 transition-transform" />
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowEmoji(v => !v); setShowGif(false) }}
              className={`flex-shrink-0 rounded-xl p-2 border transition-colors ${showEmoji ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              <Smile className="h-4 w-4" />
            </button>
            <button onClick={() => { setShowGif(v => !v); setShowEmoji(false) }}
              className={`flex-shrink-0 rounded-xl px-2.5 py-2 border text-xs font-bold transition-colors ${showGif ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              GIF
            </button>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Escreva sua análise..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={() => send()} disabled={!text.trim() || sending}
              className="flex-shrink-0 rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 p-3">
          <a href="/login" className="block w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-2">
            Faça login para participar do chat →
          </a>
        </div>
      )}
    </div>
  )
}
