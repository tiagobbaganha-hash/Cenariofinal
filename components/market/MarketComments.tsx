'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Smile, Loader2, Trash2 } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

interface Comment {
  id: string; content: string; author_name: string
  author_id: string; created_at: string; user_id: string
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return 'agora'
  if (d < 3600000) return `${Math.floor(d/60000)}m`
  if (d < 86400000) return `${Math.floor(d/3600000)}h`
  return `${Math.floor(d/86400000)}d`
}

export function MarketComments({ marketId }: { marketId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Anônimo')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      setUserId(u.id)
      supabase.from('profiles').select('full_name, email, role').eq('id', u.id).single()
        .then(({ data: p }) => {
          setUserName((p as any)?.full_name || (p as any)?.email?.split('@')[0] || 'Apostador')
          setIsAdmin(['admin','super_admin'].includes((p as any)?.role))
        })
    })
  }, [marketId])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('community_comments')
      .select('id, content, user_id, author_name, author_id, created_at')
      .eq('market_id', marketId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(50)
    setComments(data || [])
    setLoading(false)
  }



  async function handlePost() {
    const msg = text.trim()
    if (!msg || !userId) return
    setPosting(true); setError('')
    try {
      const supabase = createClient()
      const { error: e } = await supabase.from('community_comments').insert({
        market_id: marketId,
        author_id: userId,
        user_id: userId,
        author_name: userName,
        content: msg,
        is_deleted: false,
      })
      if (e) throw new Error(e.message)
      setText(''); setShowEmoji(false)
      await load()
    } catch (e: any) {
      setError(e.message)
    }
    setPosting(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('community_comments').update({ is_deleted: true }).eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <span className="text-sm font-semibold">💬 Comentários ({comments.length})</span>
      </div>

      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : comments.map(c => {
          return (
            <div key={c.id} className="flex gap-3 group">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {(c.author_name||'A')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{c.author_name||'Anônimo'}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  {(c.user_id === userId || isAdmin) && (
                    <button onClick={() => handleDelete(c.id)} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground mt-0.5 break-words">{c.content}</p>
              </div>
            </div>
          )
        })}
      </div>

      {userId ? (
        <div className="border-t border-border/50 p-3 space-y-2">
          {error && <p className="text-xs text-destructive">{error}</p>}

          {showEmoji && (
            <div className="rounded-xl overflow-hidden border border-border">
              <EmojiPicker onEmojiClick={(d: any) => { setText(t => t + d.emoji); setShowEmoji(false) }}
                width="100%" height={260} lazyLoadEmojis skinTonesDisabled
                theme={"dark" as any} previewConfig={{ showPreview: false }} />
            </div>
          )}



          <div className="flex gap-2">
            <button onClick={() => { setShowEmoji(v => !v) }}
              className={`flex-shrink-0 rounded-xl p-2 border transition-colors ${showEmoji ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              <Smile className="h-4 w-4" />
            </button>

            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePost())}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={handlePost} disabled={!text.trim() || posting}
              className="flex-shrink-0 rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/50 p-3 text-center">
          <a href="/login" className="text-xs text-primary hover:underline">Faça login para comentar →</a>
        </div>
      )}
    </div>
  )
}
