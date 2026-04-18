import { supabase } from '@/lib/supabase'

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  title: string
  content: string
  likesCount: number
  commentsCount: number
  createdAt: string
  liked?: boolean
}

export interface CommunityComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export async function getCommunityPosts(limit = 20): Promise<CommunityPost[]> {
  try {
    const { data, error } = await supabase
      .from('v_community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((p: any) => ({
      id: p.id,
      authorId: p.author_id,
      authorName: p.author_name,
      title: p.title,
      content: p.content,
      likesCount: p.likes_count || 0,
      commentsCount: p.comments_count || 0,
      createdAt: p.created_at,
    }))
  } catch (error) {
    console.error('[getCommunityPosts]', error)
    return []
  }
}

export async function createCommunityPost(title: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert([{ title, content }])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getPostComments(postId: string, limit = 10): Promise<CommunityComment[]> {
  try {
    const { data, error } = await supabase
      .from('v_community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error

    return (data || []).map((c: any) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.author_id,
      authorName: c.author_name,
      content: c.content,
      createdAt: c.created_at,
    }))
  } catch (error) {
    console.error('[getPostComments]', error)
    return []
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .insert([{ post_id: postId, content }])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
