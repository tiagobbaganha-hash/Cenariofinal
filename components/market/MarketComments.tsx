'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Heart, Trash2, Smile } from 'lucide-react'

interface Comment {
  id: string
  content: string
  author_name: string
  author_id: string
  user_id: string
  created_at: string
  likes_count?: number
  user_liked?: boolean
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000) return 'agora'
  if (d < 3600000) return `${Math.floor(d / 60000)}m`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h`
  return `${Math.floor(d / 86400000)}d`
}

const EMOJIS = ['😂','🔥','💯','👍','🚀','😍','🤔','😱','💎','🏆','⚡','🎯','📈','💸','🎉','😤','🥺','😎','🤯','💪','🫡','🙌','❤️','👀','✅','❌','⚽','🏀']

export function MarketComments({ marketId }: { marketId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showEmoji, setShowEmoji] = useState(false)
  const [liking, setLiking] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
    loadComments()
  }, [marketId])

  async function loadComments() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data } = await supabase
      .from('market_comments')
      .select('id, content, author_name, author_id, user_id, created_at, profiles:user_id(avatar_url)')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (!data) { setLoading(false); return }
    
    // Buscar likes para cada comentário
    const commentsWithLikes = await Promise.all(data.map(async (c) => {
      const { count } = await supabase
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', c.id)
      
      let userLiked = false
      if (user) {
        const { data: myLike } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', c.id)
          .eq('user_id', user.id)
          .single()
        userLiked = !!myLike
      }
      
      return { 
        ...c, 
        author_avatar: (c as any).profiles?.avatar_url || null,
        likes_count: count || 0, 
        user_liked: userLiked 
      }
    }))
    
    setComments(commentsWithLikes)
    setLoading(false)
  }

  async function send() {
    const msg = text.trim()
    if (!msg || !userId) return
    setSending(true)
    setShowEmoji(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user!.id).single()
    const name = (profile as any)?.full_name || (profile as any)?.email?.split('@')[0] || 'Usuário'
    
    await supabase.from('market_comments').insert({
      market_id: marketId,
      user_id: user!.id,
      author_id: user!.id,
      author_name: name,
      content: msg,
    })
    setText('')
    loadComments()
    setSending(false)
  }

  async function toggleLike(commentId: string, currentlyLiked: boolean) {
    if (!userId || liking) return
    setLiking(commentId)
    const supabase = createClient()
    
    if (currentlyLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId })
    }
    
    setComments(prev => prev.map(c => c.id === commentId
      ? { ...c, likes_count: currentlyLiked ? (c.likes_count || 1) - 1 : (c.likes_count || 0) + 1, user_liked: !currentlyLiked }
      : c
    ))
    setLiking(null)
  }

  async function deleteComment(id: string) {
    const supabase = createClient()
    await supabase.from('market_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Input */}
      {userId ? (
        <div className="space-y-2">
          {showEmoji && (
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
                {EMOJIS.map(e => (
                  <button key={e} type="button"
                    onClick={() => { setText(t => t + e); setShowEmoji(false) }}
                    className="text-xl p-1 hover:bg-muted rounded-lg transition-colors text-center">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowEmoji(v => !v)}
              className={`flex-shrink-0 rounded-xl p-2.5 border transition-colors ${showEmoji ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
              <Smile className="h-4 w-4" />
            </button>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Adicione sua análise..."
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={send} disabled={!text.trim() || sending}
              className="flex-shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">
          <a href="/login" className="text-primary hover:underline">Faça login</a> para comentar
        </p>
      )}

      {/* Lista */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Seja o primeiro a comentar!</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 group">
              <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {(c as any).author_avatar
                  ? <img src={(c as any).author_avatar} alt="" className="h-full w-full object-cover" />
                  : c.author_name?.charAt(0)?.toUpperCase() || '?'
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-foreground">{c.author_name || 'Usuário'}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{c.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => toggleLike(c.id, !!c.user_liked)}
                    disabled={!userId || liking === c.id}
                    className={`flex items-center gap-1 text-xs transition-colors ${c.user_liked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}>
                    <Heart className={`h-3.5 w-3.5 ${c.user_liked ? 'fill-current' : ''}`} />
                    {(c.likes_count || 0) > 0 && <span>{c.likes_count}</span>}
                  </button>
                  {(userId === c.user_id || userId === c.author_id) && (
                    <button onClick={() => deleteComment(c.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
