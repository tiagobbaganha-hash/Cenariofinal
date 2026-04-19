'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { MessageSquare, Users, Send, Loader2 } from 'lucide-react'

interface Post {
  id: string
  author_name: string
  title: string
  content: string
  market_title: string | null
  comments_count: number
  created_at: string
  is_pinned: boolean
}

export default function CommunityPage() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  async function loadPosts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('v_community_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
    setPosts((data || []) as Post[])
    setLoading(false)
  }

  async function handlePost() {
    if (!title.trim() || !content.trim()) {
      toast({ type: 'error', title: 'Preencha título e conteúdo' })
      return
    }
    setPosting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('community_posts').insert({
        author_id: userId, title: title.trim(), content: content.trim(),
      } as any)
      if (error) throw error
      toast({ type: 'success', title: 'Post publicado!' })
      setTitle(''); setContent(''); setShowForm(false)
      loadPosts()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro', description: err?.message })
    } finally { setPosting(false) }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" /> Comunidade
          </h1>
          <p className="text-muted-foreground mt-1">Discuta mercados e compartilhe previsões</p>
        </div>
        {userId && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Novo Post'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Título do post" className="w-full h-10 px-4 rounded-lg bg-background border border-border outline-none font-medium" />
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="O que você está pensando?" rows={3}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border outline-none text-sm" />
            <Button onClick={handlePost} disabled={posting} className="w-full">
              {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Publicar
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum post ainda</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className="hover:bg-accent/20 transition-colors">
              <CardContent className="p-4">
                {post.is_pinned && <span className="text-xs text-primary font-bold">📌 Fixado</span>}
                <h3 className="font-bold mt-1">{post.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{post.content}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{post.author_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.comments_count}</span>
                    <span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
