'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [showGif, setShowGif] = useState(false)
  const [gifs, setGifs] = useState<{id:string,title:string,url:string,thumb:string}[]>([])
  const [gifSearch, setGifSearch] = useState('')
  const [gifLoading, setGifLoading] = useState(false)
  const [uploadingGif, setUploadingGif] = useState(false)
  const fileGifRef = useRef<HTMLInputElement | null>(null)
  const [pendingGif, setPendingGif] = useState<string|null>(null)
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

  async function handleGifUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingGif(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'community')
      fd.append('folder', 'gifs')
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) { setPendingGif(data.url); setShowGif(false) }
    } catch (_) {}
    setUploadingGif(false)
    if (fileGifRef.current) fileGifRef.current.value = ''
  }

  async function loadGifs(q: string) {
    setGifLoading(true)
    try {
      const res = await fetch(`/api/gifs?q=${encodeURIComponent(q||'trending')}&limit=12`)
      if (res.ok) { const d = await res.json(); setGifs(d.gifs||[]) }
    } catch { setGifs([]) }
    setGifLoading(false)
  }

  useEffect(() => { if (showGif) loadGifs(gifSearch||'trending') }, [showGif])

  async function handlePost() {
    const msg = pendingGif ? `__GIF__:${pendingGif}` : text.trim()
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
      setText(''); setPendingGif(null); setShowEmoji(false); setShowGif(false)
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
          const isGif = c.content.startsWith('__GIF__:')
          const gifUrl = isGif ? c.content.replace('__GIF__:', '') : null
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
                {gifUrl
                  ? <img src={gifUrl} alt="GIF" className="rounded-xl max-w-[200px] mt-1" />
                  : <p className="text-sm text-foreground mt-0.5 break-words">{c.content}</p>
                }
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

          {showGif && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex gap-1.5 p-2 border-b border-border/30">
                <input value={gifSearch} onChange={e => setGifSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadGifs(gifSearch)}
                  placeholder="Buscar GIFs..." className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40" />
                <button onClick={() => loadGifs(gifSearch)} className="rounded-lg bg-primary/20 text-primary px-2 py-1 text-xs">🔍</button>
                <button onClick={() => fileGifRef.current?.click()} disabled={uploadingGif} className="rounded-lg bg-card border border-border text-muted-foreground px-2 py-1 text-xs hover:border-primary/40 disabled:opacity-50">
                  {uploadingGif ? '⏳' : '📎'}
                </button>
                <input ref={fileGifRef} type="file" accept="image/*,image/gif" className="hidden" onChange={handleGifUpload} />
              </div>
              <div className="grid grid-cols-4 gap-1 p-2 max-h-40 overflow-y-auto">
                {gifLoading ? <div className="col-span-4 flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                  : gifs.map(g => (
                    <button key={g.id} onClick={() => { setPendingGif(g.url); setShowGif(false) }}
                      className="rounded-lg overflow-hidden aspect-video bg-muted hover:ring-2 hover:ring-primary transition-all">
                      <img src={g.thumb||g.url} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
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
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handlePost())}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={handlePost} disabled={(!text.trim() && !pendingGif) || posting}
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
