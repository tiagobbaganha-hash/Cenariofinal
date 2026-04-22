'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Smile, Loader2 } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

interface Message { id: string; user_id: string; message: string; created_at: string }
const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return 'agora'
  if (d < 3600000) return `${Math.floor(d / 60000)}m`
  return `${Math.floor(d / 3600000)}h`
}

export function MarketChat({ marketId }: { marketId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [gifs, setGifs] = useState<{id:string,title:string,url:string,thumb:string}[]>([])
  const [gifSearch, setGifSearch] = useState('')
  const [gifLoading, setGifLoading] = useState(false)
  const [pendingGif, setPendingGif] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
    supabase.from('market_chat').select('id,user_id,message,created_at')
      .eq('market_id', marketId).order('created_at', { ascending: true }).limit(50)
      .then(({ data }) => { setMessages(data || []); setLoading(false) })
    const ch = supabase.channel(`chat:${marketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_chat', filter: `market_id=eq.${marketId}` },
        (p) => setMessages(prev => [...prev, p.new as Message])).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [marketId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadGifs(q: string) {
    setGifLoading(true)
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(q || 'trending')}&limit=12`)
      if (res.ok) { const d = await res.json(); setGifs(d.gifs || []) }
    } catch { setGifs([]) }
    setGifLoading(false)
  }

  useEffect(() => { if (showGif) loadGifs(gifSearch || 'trending') }, [showGif])

  async function send(override?: string) {
    const msg = override || (pendingGif ? `__GIF__:${pendingGif}` : text.trim())
    if (!msg || !userId) return
    setSending(true); setShowEmoji(false); setShowGif(false)
    try {
      await createClient().from('market_chat').insert({ market_id: marketId, user_id: userId, message: msg })
      setText(''); setPendingGif(null)
    } catch (_) {}
    setSending(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col" style={{ height: 420 }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-semibold">Chat ao vivo</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{messages.length} mensagens</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : messages.length === 0 ? <div className="flex flex-col items-center justify-center h-full gap-2"><span className="text-3xl">💬</span><p className="text-xs text-muted-foreground">Seja o primeiro!</p></div>
        : messages.map(m => {
          const isMe = m.user_id === userId
          const av = AVATARS[(m.user_id?.charCodeAt(0) || 0) % AVATARS.length]
          const isGif = m.message.startsWith('__GIF__:')
          const gifUrl = isGif ? m.message.replace('__GIF__:', '') : null
          return (
            <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="text-base flex-shrink-0">{av}</div>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-border'}`}>
                {gifUrl ? <img src={gifUrl} alt="GIF" className="rounded-xl max-w-[160px]" />
                  : <p className="text-sm break-words">{m.message}</p>}
                <p className={`text-[9px] mt-0.5 ${isMe ? 'text-right text-primary/50' : 'text-muted-foreground'}`}>{timeAgo(m.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {userId ? (
        <div className="border-t border-border/50 p-3 space-y-2">
          {showEmoji && (
            <div className="rounded-xl overflow-hidden border border-border">
              <EmojiPicker onEmojiClick={(d: any) => { setText(t => t + d.emoji); setShowEmoji(false) }}
                width="100%" height={280} lazyLoadEmojis skinTonesDisabled theme={"dark" as any} previewConfig={{ showPreview: false }} />
            </div>
          )}
          {showGif && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex gap-1.5 p-2 border-b border-border/30">
                <input value={gifSearch} onChange={e => setGifSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadGifs(gifSearch)}
                  placeholder="Buscar GIFs..." className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
                <button onClick={() => loadGifs(gifSearch)} className="rounded-lg bg-primary/20 text-primary px-2 py-1 text-xs">🔍</button>
              </div>
              <div className="grid grid-cols-3 gap-1 p-2 max-h-36 overflow-y-auto">
                {gifLoading ? <div className="col-span-3 flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                  : gifs.map(g => (
                    <button key={g.id} onClick={() => { setPendingGif(g.url); setShowGif(false) }}
                      className="rounded-lg overflow-hidden aspect-video bg-muted hover:ring-2 hover:ring-primary transition-all">
                      <img src={g.thumb || g.url} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
              </div>
            </div>
          )}
          {pendingGif && (
            <div className="relative inline-block">
              <img src={pendingGif} alt="GIF" className="rounded-xl max-h-20 border border-primary/30" />
              <button onClick={() => setPendingGif(null)} className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">✕</button>
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
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Escreva sua análise..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={() => send()} disabled={(!text.trim() && !pendingGif) || sending}
              className="flex-shrink-0 rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 p-3 text-center">
          <a href="/login" className="text-xs text-primary hover:underline">Faça login para participar →</a>
        </div>
      )}
    </div>
  )
}
