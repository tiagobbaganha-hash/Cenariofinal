'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCommunityPosts, createCommunityPost } from '@/lib/api/community'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate } from '@/lib/utils'
import { MessageSquare, ThumbsUp, Send } from 'lucide-react'

interface CommunityPost {
  id: string
  user_email: string
  title: string
  content: string
  created_at: string
  likes: number
  comments_count: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await getCommunityPosts()
        setPosts(data)
      } catch (error) {
        console.error('Error loading posts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostTitle.trim() || !newPostContent.trim()) return

    try {
      setSubmitting(true)
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user?.id) {
        alert('Você precisa estar autenticado')
        return
      }

      const result = await createCommunityPost(newPostTitle, newPostContent)
      if (result) {
        setPosts([result, ...posts])
        setNewPostTitle('')
        setNewPostContent('')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Erro ao criar post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Comunidade</h1>
        <p className="text-muted-foreground mt-2">Compartilhe dicas, estratégias e discuta sobre mercados preditivos</p>
      </div>

      {/* New Post Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Criar Novo Post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <Input
              placeholder="Título do post..."
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              disabled={submitting}
            />
            <Textarea
              placeholder="Compartilhe suas ideias..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Postando...' : 'Publicar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro a compartilhar!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar>
                      <AvatarFallback>{post.user_email.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {post.user_email} • {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed line-clamp-4">{post.content}</p>
                
                <div className="flex gap-4 pt-2 border-t">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    {post.comments_count}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
