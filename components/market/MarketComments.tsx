'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Loader2, Trash2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  author_name: string
  author_id: string
  created_at: string
}

export function MarketComments({ marketId }: { marketId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [postError, setPostError] = useState('')
  const [tableError, setTableError] = useState(false)

  useEffect(() => {
    load()
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
      if (data.user) {
        supabase.from('profiles').select('role').eq('id', data.user.id).single()
          .then(({ data: p }) => setIsAdmin(['admin', 'super_admin'].includes((p as any)?.role)))
      }
    })
  }, [marketId])

  async function load() {
    const supabase = createClient()
    const { data, error: tblErr } = await supabase
      .from('community_comments')
      .select('id, content, user_id, author_name, created_at')
      .eq('market_id', marketId)
      .order('created_at', { ascending: true })
      .limit(50)
    if (tblErr) { setTableError(true); setLoading(false); return }

    if (data) {
      const authorIds = [...new Set(data.map(c => c.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', authorIds.length > 0 ? authorIds : ['none'])

      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name || p.email?.split('@')[0] || 'Anônimo']))

      setComments(data.map(c => ({
        ...c,
        author_name: c.author_name || nameMap.get(c.user_id) || 'Anônimo',
      })))
    }
    setLoading(false)
  }

  async function handlePost() {
    if (!text.trim() || !userId) return
    setPosting(true)
    try {
      const supabase = createClient()
      // Confirmar user autenticado antes de inserir
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Faça login para comentar')
      
      const { error } = await supabase.from('community_comments').insert({
        market_id: marketId,
        author_id: currentUser.id,
        user_id: currentUser.id,
        content: text.trim(),
      })
      if (error) throw new Error(error.message)
      setText('')
      load()
    } catch (err: any) {
      setPostError(err?.message || 'Erro ao enviar comentário')
    } finally { setPosting(false) }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('community_comments').delete().eq('id', id)
    load()
  }

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" /> Comentários ({comments.length})
      </h3>
      {tableError && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400 mb-3">
          ⚠️ Tabela de comentários não configurada. Execute o SQL do Sprint 3 no Supabase.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {c.author_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {(isAdmin || c.author_id === userId) && (
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 ml-auto">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {userId ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => { setText(e.target.value); setPostError('') }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
            placeholder="Escreva um comentário..."
            className="flex-1 h-10 px-4 rounded-lg bg-background border border-border outline-none text-sm"
          />
          <Button size="sm" onClick={handlePost} disabled={posting || !text.trim()}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Faça login para comentar</p>
      )}
    </div>
  )
}
