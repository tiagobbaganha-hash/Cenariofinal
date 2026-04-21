'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  MessageSquare, Send, Loader2, TrendingUp, Trophy,
  Heart, Flame, Zap, RefreshCw, Pin, Plus, X, Users,
  BarChart3, ChevronRight
} from 'lucide-react'

const AVATARS = ['🚀','🐂','🦁','🔮','🎯','⚡','🌊','🔥','💎','🦅','🎲','🌙','☀️','🏆','⚔️','🦊','🐉','🌟','💫','🎪']
const REACTIONS = [{ emoji: '🔥', label: 'Fogo' }, { emoji: '💯', label: 'Certo' }, { emoji: '🚀', label: 'Lua' }, { emoji: '👍', label: 'Like' }, { emoji: '🤔', label: 'Hmm' }]

function getEmoji(id: string) { return AVATARS[id.charCodeAt(0) % AVATARS.length] }

interface Post {
  id: string
  author_name: string
  author_id?: string
  title: string
  content: string
  market_title: string | null
  market_slug?: string | null
  comments_count: number
  created_at: string
  is_pinned: boolean
}

interface Activity {
  type: 'bet' | 'win' | 'market'
  user: string
  user_id: string
  text: string
  value?: number
  time: string
  market?: string
  market_slug?: string
}

type Tab = 'feed' | 'posts' | 'atividade'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'agora'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

export default function ComunidadePage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('feed')
  const [posts, setPosts] = useState<Post[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Apostador')
  const [stats, setStats] = useState({ users: 0, bets: 0, markets: 0, volume: 0 })
  const [reactions, setReactions] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        supabase.from('profiles').select('full_name, email').eq('id', data.user.id).single()
          .then(({ data: p }) => setUserName((p as any)?.email?.split("@")[0] || (p as any)?.full_name?.split(' ')[0] || 'Apostador'))
          .catch(() => {})
      }
    })
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()
    const [postsRes, ordersRes, marketsRes, usersRes] = await Promise.all([
      supabase.from('v_community_posts').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(30),
      supabase.from('orders').select('user_id, stake_amount, status, created_at, option_id, market_id').order('created_at', { ascending: false }).limit(30),
      supabase.from('markets').select('id, title, slug, status').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])

    setPosts((postsRes.data || []) as Post[])

    // Montar feed de atividade a partir de ordens reais
    const acts: Activity[] = []
    for (const o of (ordersRes.data || []).slice(0, 20)) {
      const stake = parseFloat(o.stake_amount || 0)
      if (o.status === 'settled_win') {
        acts.push({ type: 'win', user: `Apostador`, user_id: o.user_id, text: `ganhou uma aposta`, value: stake * 1.9, time: o.created_at })
      } else if (stake > 0) {
        acts.push({ type: 'bet', user: `Apostador`, user_id: o.user_id, text: `fez uma aposta de ${formatCurrency(stake)}`, value: stake, time: o.created_at })
      }
    }
    setActivities(acts)

    // Stats da plataforma
    const totalOrders = ordersRes.data?.length || 0
    const totalVol = ordersRes.data?.reduce((s: number, o: any) => s + parseFloat(o.stake_amount || 0), 0) || 0
    setStats({
      users: (usersRes as any)?.count || 0,
      bets: totalOrders,
      markets: marketsRes.data?.length || 0,
      volume: totalVol,
    })
    setLoading(false)
  }

  async function handlePost() {
    if (!title.trim() || !content.trim() || !userId) return
    setPosting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('community_comments').insert({
        user_id: userId, title, content, is_pinned: false
      })
      if (error) throw error
      toast({ type: 'success', title: '✅ Post publicado!' })
      setTitle(''); setContent(''); setShowForm(false)
      loadAll()
    } catch (e: any) {
      toast({ type: 'error', title: 'Erro', description: e.message })
    } finally { setPosting(false) }
  }

  function toggleReaction(postId: string, emoji: string) {
    setReactions(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), [emoji]: !(prev[postId]?.[emoji]) }
    }))
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/30">
              <Users className="h-6 w-6" />
            </span>
            Comunidade
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">Discuta mercados, compartilhe análises e acompanhe a atividade</p>
        </div>
        {userId && (
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Novo Post'}
          </button>
        )}
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: '👥', label: 'Traders', value: stats.users.toLocaleString('pt-BR') },
          { icon: '🎯', label: 'Apostas', value: stats.bets.toLocaleString('pt-BR') },
          { icon: '📊', label: 'Mercados', value: stats.markets.toLocaleString('pt-BR') },
          { icon: '💰', label: 'Volume', value: formatCurrency(stats.volume) },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form novo post */}
      {showForm && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xl flex-shrink-0">
              {getEmoji(userId || 'x')}
            </div>
            <span className="text-sm font-semibold text-foreground">{userName}</span>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do post..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Compartilhe sua análise, previsão ou dúvida..."
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
          {/* Emojis rápidos */}
          <div className="flex gap-1.5 flex-wrap">
            {['🔥','💯','🎯','📈','🚀','💎','🤔','👍','😂','🏆','⚡','🌙'].map(e => (
              <button key={e} type="button" onClick={() => setContent(c => c + e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={handlePost} disabled={!title.trim() || !content.trim() || posting}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {[
          { id: 'feed', label: '🏠 Feed', },
          { id: 'posts', label: '💬 Discussões' },
          { id: 'atividade', label: '⚡ Atividade' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as Tab)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* COLUNA PRINCIPAL */}
        <div className="space-y-3 min-w-0">

          {/* ─── TAB FEED ─── */}
          {tab === 'feed' && (
            <div className="space-y-3">
              {/* Apostas recentes + posts misturados */}
              {activities.slice(0, 5).map((act, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg">
                    {getEmoji(act.user_id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{AVATARS[act.user_id.charCodeAt(0) % AVATARS.length]} Trader</span>
                      {' '}<span className="text-muted-foreground">{act.text}</span>
                      {act.value && <span className={`font-bold ml-1 ${act.type === 'win' ? 'text-primary' : 'text-foreground'}`}>{act.type === 'win' && '🏆 '}{formatCurrency(act.value)}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(act.time)}</p>
                  </div>
                  <span className="text-lg flex-shrink-0">{act.type === 'win' ? '🏆' : act.type === 'bet' ? '🎯' : '📊'}</span>
                </div>
              ))}

              {posts.slice(0, 5).map(post => (
                <PostCard key={post.id} post={post} userId={userId} reactions={reactions[post.id] || {}} onReact={emoji => toggleReaction(post.id, emoji)} />
              ))}

              {activities.length === 0 && posts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <Flame className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Seja o primeiro a postar!</p>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB POSTS ─── */}
          {tab === 'posts' && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum post ainda</p>
                  {userId && <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-primary hover:underline">Criar o primeiro post →</button>}
                </div>
              ) : posts.map(post => (
                <PostCard key={post.id} post={post} userId={userId} reactions={reactions[post.id] || {}} onReact={emoji => toggleReaction(post.id, emoji)} />
              ))}
            </div>
          )}

          {/* ─── TAB ATIVIDADE ─── */}
          {tab === 'atividade' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atividade recente</p>
                <button onClick={loadAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Atualizar
                </button>
              </div>
              {activities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <Zap className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
                </div>
              ) : activities.map((act, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <div className="text-lg flex-shrink-0">
                    {getEmoji(act.user_id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">Trader</span>
                      {' '}<span className="text-muted-foreground">{act.text}</span>
                    </p>
                    {act.market && (
                      <p className="text-[10px] text-primary truncate mt-0.5">{act.market}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {act.value && (
                      <p className={`text-xs font-bold ${act.type === 'win' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {act.type === 'win' ? '+' : ''}{formatCurrency(act.value)}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground">{timeAgo(act.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* Top traders da semana */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">🏆 Top Traders</p>
              <Link href="/leaderboard" className="text-[10px] text-primary hover:underline">Ver todos →</Link>
            </div>
            <div className="p-3 space-y-2">
              {[1,2,3].map(n => (
                <div key={n} className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent/30 transition-colors">
                  <span className="text-sm font-black text-muted-foreground w-4">{n}</span>
                  <span className="text-lg">{AVATARS[n * 3 % AVATARS.length]}</span>
                  <span className="text-xs text-muted-foreground flex-1">Trader #{n}</span>
                  <span className="text-xs font-bold text-primary">Lv.{5-n}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mercados quentes */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">🔥 Mercados Quentes</p>
              <Link href="/mercados" className="text-[10px] text-primary hover:underline">Ver todos →</Link>
            </div>
            <div className="p-3 space-y-1">
              {['BBB 26', 'Eleições 2026', 'BTC R$400k?'].map((m, i) => (
                <Link href="/mercados" key={m} className="flex items-center gap-2 p-2 rounded-xl hover:bg-accent/30 transition-colors group">
                  <span className="text-sm">{['🎬','🏛️','₿'][i]}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground flex-1 truncate">{m}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </div>

          {/* Regras */}
          <div className="rounded-2xl border border-border bg-card/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">📋 Regras</p>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground">
              {['Seja respeitoso com todos', 'Sem spam ou repetição', 'Análises com fundamento', 'Proibido divulgar esquemas'].map(r => (
                <li key={r} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}

function PostCard({ post, userId, reactions, onReact }: { post: Post; userId: string | null; reactions: Record<string,boolean>; onReact: (e: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isPinned = post.is_pinned
  const emoji = getEmoji(post.author_id || post.author_name)

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-all ${isPinned ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/20'}`}>
      {isPinned && (
        <div className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border-b border-primary/20">
          <Pin className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Fixado</span>
        </div>
      )}
      <div className="p-5">
        {/* Author */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-lg flex-shrink-0">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground">{post.author_name}</span>
            <span className="text-[10px] text-muted-foreground ml-2">{timeAgo(post.created_at)}</span>
          </div>
          {post.market_slug && (
            <Link href={`/mercados/${post.market_slug}`} className="text-[10px] text-primary hover:underline flex items-center gap-1 flex-shrink-0">
              <BarChart3 className="h-3 w-3" />
              Mercado
            </Link>
          )}
        </div>

        {/* Conteúdo */}
        <h3 className="text-sm font-bold text-foreground mb-1.5">{post.title}</h3>
        <p className={`text-sm text-muted-foreground leading-relaxed ${!expanded && post.content.length > 150 ? 'line-clamp-3' : ''}`}>
          {post.content}
        </p>
        {post.content.length > 150 && (
          <button onClick={() => setExpanded(v => !v)} className="text-xs text-primary hover:underline mt-1">
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}

        {/* Mercado vinculado */}
        {post.market_title && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{post.market_title}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {/* Reações */}
          <div className="flex gap-1">
            {REACTIONS.map(r => (
              <button key={r.emoji} onClick={() => onReact(r.emoji)}
                className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all ${reactions[r.emoji] ? 'border-primary/50 bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'}`}>
                {r.emoji}
              </button>
            ))}
          </div>
          {/* Comentários */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <MessageSquare className="h-3.5 w-3.5" />
            {post.comments_count} comentários
          </div>
        </div>
      </div>
    </div>
  )
}
