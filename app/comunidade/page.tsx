'use client'

import { useEffect, useState, useRef } from 'react'
import EmojiPicker from 'emoji-picker-react'
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
const REACTIONS = [
  { emoji: '🔥', label: 'Fogo' }, { emoji: '💯', label: 'Certo' }, { emoji: '🚀', label: 'Acertou' },
  { emoji: '👍', label: 'Like' }, { emoji: '🤔', label: 'Hmm' }, { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Uau' }, { emoji: '❤️', label: 'Amor' }, { emoji: '💎', label: 'Diamante' },
  { emoji: '🏆', label: 'Campeão' },
]

const EMOJI_CATEGORIES = {
  '🎯 Apostas': ['🎯','💰','🏆','💎','📈','📉','🎲','🃏','🎰','💸','🤑','💵'],
  '😄 Reações': ['😂','😮','🤔','😎','🥳','😤','🙄','😱','🤯','😍','🥹','😴'],
  '👍 Gestos': ['👍','👎','🙌','🤝','💪','🫡','✌️','🤞','👏','🫶','❤️','🔥'],
  '⚽ Esportes': ['⚽','🏀','🎾','🏈','⚾','🏐','🎯','🏋️','🤸','🏊','🚴','🥊'],
  '🐂 Mercado': ['🐂','🐻','📊','📉','📈','💹','🏦','💳','🪙','⚡','🌙','☀️'],
}

const GIFS_CATEGORIES = {
  '📈 Mercado': [
    { label: 'Stonks', url: 'https://media.giphy.com/media/XNBcChLQt3beckMGhZ/giphy.gif' },
    { label: 'Moon', url: 'https://media.giphy.com/media/YnkMcHgNIMW4Yfmjxr/giphy.gif' },
    { label: 'Gains', url: 'https://media.giphy.com/media/l0MYB8Ory7Hqefo9a/giphy.gif' },
    { label: 'Loss', url: 'https://media.giphy.com/media/3o7ZeTmU77UlPyeR2w/giphy.gif' },
  ],
  '🎉 Comemoração': [
    { label: 'Hype', url: 'https://media.giphy.com/media/l41Ymrnk3UYOAJ1rO/giphy.gif' },
    { label: 'Isso!', url: 'https://media.giphy.com/media/OkJat1YNdoD3W/giphy.gif' },
    { label: 'Yes!', url: 'https://media.giphy.com/media/3o7TKnCdBx5cMg0qti/giphy.gif' },
    { label: 'Party', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  ],
  '😂 Memes': [
    { label: 'Bruh', url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif' },
    { label: 'Wait', url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif' },
    { label: 'Facepalm', url: 'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif' },
    { label: 'Nope', url: 'https://media.giphy.com/media/3oEduIT4h4QFZH1jaw/giphy.gif' },
  ],
}
function EmojiGifPicker({ onEmoji, onGif, compact = false }: { 
  onEmoji: (e: string) => void
  onGif: (url: string) => void
  compact?: boolean 
}) {
  const [tab, setTab] = useState<'emoji' | 'gif'>('emoji')
  const [open, setOpen] = useState(false)

  // GIFs: links diretos media.giphy.com (sem API key — puro CDN)
  type Gif = { id: string; title: string; url: string }
  const GIF_DB: Record<string, Gif[]> = {
    '📈 Mercado': [
      {id:'m1',title:'Stonks',url:'https://media.giphy.com/media/XNBcChLQt3beckMGhZ/giphy.gif'},
      {id:'m2',title:'To the Moon',url:'https://media.giphy.com/media/YnkMcHgNIMW4Yfmjxr/giphy.gif'},
      {id:'m3',title:'Money Rain',url:'https://media.giphy.com/media/26tPplGWjN0xLybiU/giphy.gif'},
      {id:'m4',title:'Bull Run',url:'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'},
      {id:'m5',title:'Gains',url:'https://media.giphy.com/media/l0MYB8Ory7Hqefo9a/giphy.gif'},
      {id:'m6',title:'Loss',url:'https://media.giphy.com/media/3o7ZeTmU77UlPyeR2w/giphy.gif'},
      {id:'m7',title:'Money',url:'https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif'},
      {id:'m8',title:'Bear',url:'https://media.giphy.com/media/l2JhpjWPccQtartio/giphy.gif'},
      {id:'m9',title:'Chart Up',url:'https://media.giphy.com/media/feN0YJbVs0fwA/giphy.gif'},
      {id:'m10',title:'Crypto',url:'https://media.giphy.com/media/WFZvB7VIXBgiz3oDXE/giphy.gif'},
      {id:'m11',title:'Rich',url:'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif'},
      {id:'m12',title:'Broke',url:'https://media.giphy.com/media/l2YWuMPCsJ1y1KCCI/giphy.gif'},
    ],
    '🚀 Hype': [
      {id:'h1',title:'LFG',url:'https://media.giphy.com/media/S9i8jJxTvAKVHVMvvW/giphy.gif'},
      {id:'h2',title:'Hype',url:'https://media.giphy.com/media/l41Ymrnk3UYOAJ1rO/giphy.gif'},
      {id:'h3',title:'Yes!',url:'https://media.giphy.com/media/3o7TKnCdBx5cMg0qti/giphy.gif'},
      {id:'h4',title:'Isso!',url:'https://media.giphy.com/media/OkJat1YNdoD3W/giphy.gif'},
      {id:'h5',title:'Win',url:'https://media.giphy.com/media/rY93u9tQbybks/giphy.gif'},
      {id:'h6',title:'Lets Go',url:'https://media.giphy.com/media/5L57g5ek3OaNa/giphy.gif'},
      {id:'h7',title:'Pump',url:'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif'},
      {id:'h8',title:'Champion',url:'https://media.giphy.com/media/26FL4KZPYHA0iIoJi/giphy.gif'},
      {id:'h9',title:'Goat',url:'https://media.giphy.com/media/l0MYuHMSCDQDBdm36/giphy.gif'},
      {id:'h10',title:'Fire',url:'https://media.giphy.com/media/l46Cy1rHbQ92uuLXa/giphy.gif'},
      {id:'h11',title:'Amazing',url:'https://media.giphy.com/media/26gsccje7r2LQAA12/giphy.gif'},
      {id:'h12',title:'Acertou',url:'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif'},
    ],
    '🎉 Festa': [
      {id:'f1',title:'Party',url:'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif'},
      {id:'f2',title:'Confetti',url:'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif'},
      {id:'f3',title:'Dancing',url:'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif'},
      {id:'f4',title:'Celebrate',url:'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif'},
      {id:'f5',title:'Trophy',url:'https://media.giphy.com/media/xT0xeuOy2Fcl9vDGiA/giphy.gif'},
      {id:'f6',title:'Happy',url:'https://media.giphy.com/media/ZdUnQS4AXEl1AERdil/giphy.gif'},
      {id:'f7',title:'Fireworks',url:'https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif'},
      {id:'f8',title:'Woohoo',url:'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif'},
      {id:'f9',title:'Dance',url:'https://media.giphy.com/media/l3V0dy1zzyjbYTQQM/giphy.gif'},
      {id:'f10',title:'Weekend',url:'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif'},
    ],
    '😂 Memes': [
      {id:'mm1',title:'Bruh',url:'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif'},
      {id:'mm2',title:'Facepalm',url:'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif'},
      {id:'mm3',title:'Nope',url:'https://media.giphy.com/media/3oEduIT4h4QFZH1jaw/giphy.gif'},
      {id:'mm4',title:'Wait',url:'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif'},
      {id:'mm5',title:'Really?',url:'https://media.giphy.com/media/5t9wJjyHAOxvnxcPNk/giphy.gif'},
      {id:'mm6',title:'Not My Problem',url:'https://media.giphy.com/media/LRVnPYqM8DLag/giphy.gif'},
      {id:'mm7',title:'Crying',url:'https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif'},
      {id:'mm8',title:'Awkward',url:'https://media.giphy.com/media/l1J9EdzfOSgfyueLm/giphy.gif'},
      {id:'mm9',title:'SMH',url:'https://media.giphy.com/media/3o6MbnqLhX5tJ5gXSk/giphy.gif'},
      {id:'mm10',title:'No',url:'https://media.giphy.com/media/3oEjHEkzCTyFQhE4qQ/giphy.gif'},
      {id:'mm11',title:'Ok',url:'https://media.giphy.com/media/l3q2Z6S6n38zjPswo/giphy.gif'},
      {id:'mm12',title:'Confused',url:'https://media.giphy.com/media/8abAbOrQ9rvLG/giphy.gif'},
    ],
    '😮 Surpresa': [
      {id:'s1',title:'OMG',url:'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif'},
      {id:'s2',title:'Shocked',url:'https://media.giphy.com/media/xT9IgG50Lg7rusRgqU/giphy.gif'},
      {id:'s3',title:'Mind Blown',url:'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif'},
      {id:'s4',title:'No Way',url:'https://media.giphy.com/media/3o6Mbrjw5ynGp61yOA/giphy.gif'},
      {id:'s5',title:'Wow',url:'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyO/giphy.gif'},
      {id:'s6',title:'What',url:'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'},
      {id:'s7',title:'Unexpected',url:'https://media.giphy.com/media/xUPGGDNsLvqsBOhuU0/giphy.gif'},
      {id:'s8',title:'Wait What',url:'https://media.giphy.com/media/lKZEeXJGhU1d6/giphy.gif'},
    ],
    '💀 Perdeu': [
      {id:'p1',title:'RIP',url:'https://media.giphy.com/media/l2JhpjWPccQtartio/giphy.gif'},
      {id:'p2',title:'F',url:'https://media.giphy.com/media/3o6Mbn2NmHHLRf4D8Q/giphy.gif'},
      {id:'p3',title:'L',url:'https://media.giphy.com/media/PjJ1cLHqLEveXysGDB/giphy.gif'},
      {id:'p4',title:'Crying',url:'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif'},
      {id:'p5',title:'Fail',url:'https://media.giphy.com/media/26ybwvTX4DTkwst6U/giphy.gif'},
      {id:'p6',title:'Broke',url:'https://media.giphy.com/media/l2YWuMPCsJ1y1KCCI/giphy.gif'},
      {id:'p7',title:'Loss',url:'https://media.giphy.com/media/3o7ZeTmU77UlPyeR2w/giphy.gif'},
      {id:'p8',title:'Sad',url:'https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif'},
    ],
    '🔥 Futebol': [
      {id:'ft1',title:'Gol',url:'https://media.giphy.com/media/l0MYGb1LuZ3n7dRnO/giphy.gif'},
      {id:'ft2',title:'Comemoração',url:'https://media.giphy.com/media/3oEjHAUOqG3lSS0f1C/giphy.gif'},
      {id:'ft3',title:'Defesa',url:'https://media.giphy.com/media/3o6MbbwX7oMbxzQ01W/giphy.gif'},
      {id:'ft4',title:'Chute',url:'https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif'},
      {id:'ft5',title:'Flamengo',url:'https://media.giphy.com/media/d31w24psGYeekCZy/giphy.gif'},
      {id:'ft6',title:'Seleção',url:'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif'},
    ],
    '👍 Reações': [
      {id:'r1',title:'Like',url:'https://media.giphy.com/media/3oEjHchKlHiHcMhQle/giphy.gif'},
      {id:'r2',title:'Dislike',url:'https://media.giphy.com/media/26BRrSvJEDlpqyMqY/giphy.gif'},
      {id:'r3',title:'Clap',url:'https://media.giphy.com/media/3oz8xP6SaSkSU9dhcI/giphy.gif'},
      {id:'r4',title:'OK',url:'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif'},
      {id:'r5',title:'Love',url:'https://media.giphy.com/media/3oEdva9BUHPHz2yEnO/giphy.gif'},
      {id:'r6',title:'100',url:'https://media.giphy.com/media/l4q8cJzGdR9J8w3hS/giphy.gif'},
      {id:'r7',title:'Salute',url:'https://media.giphy.com/media/26FLgGTPUDH6UGAbm/giphy.gif'},
      {id:'r8',title:'Strong',url:'https://media.giphy.com/media/3o7TKSha51ATTx9KzC/giphy.gif'},
    ],
  }

  const [gifCategory, setGifCategory] = useState('📈 Mercado')
  const [gifSearch, setGifSearch] = useState('')
  const gifCategories = Object.keys(GIF_DB)
  const currentGifs = gifSearch.trim()
    ? Object.values(GIF_DB).flat().filter(g => g.title.toLowerCase().includes(gifSearch.toLowerCase()))
    : (GIF_DB[gifCategory] || [])

  useEffect(() => {}, [open, tab])

  if (!open) return (
    <div className="flex gap-1.5">
      <button type="button" onClick={() => { setTab('emoji'); setOpen(true) }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-xl px-2.5 py-1.5 hover:text-foreground hover:border-primary/40 transition-colors">
        😊 {!compact && 'Emoji'}
      </button>
      <button type="button" onClick={() => { setTab('gif'); setOpen(true) }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-xl px-2.5 py-1.5 hover:text-foreground hover:border-primary/40 transition-colors">
        🎬 {!compact && 'GIF'}
      </button>
    </div>
  )

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex gap-1">
          {(['emoji', 'gif'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'emoji' ? '😊 Emoji' : '🎬 GIF'}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(false)} type="button"
          className="text-xs text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded-lg hover:bg-accent">✕</button>
      </div>

      {tab === 'emoji' && (
        <EmojiPicker
          onEmojiClick={(data: any) => { onEmoji(data.emoji); setOpen(false) }}
          searchPlaceholder="Buscar emoji..."
          width="100%"
          height={320}
          lazyLoadEmojis
          skinTonesDisabled
          theme={"dark" as any}
          previewConfig={{ showPreview: false }}
        />
      )}

      {tab === 'gif' && (
        <div>

          {/* Busca */}
          <div className="px-2 py-1.5 border-b border-border/30 space-y-1.5">
            <input value={gifSearch} onChange={e => setGifSearch(e.target.value)}
              placeholder="Buscar GIFs..."
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            {!gifSearch && (
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {gifCategories.map(cat => (
                  <button key={cat} onClick={() => setGifCategory(cat)} type="button"
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all flex-shrink-0 ${gifCategory === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 max-h-48 overflow-y-auto">
            {currentGifs.length === 0 ? (
              <div className="col-span-4 text-center py-4 text-xs text-muted-foreground">Nenhum GIF encontrado</div>
            ) : currentGifs.map((g) => (
              <button key={g.id} onClick={() => { onGif(g.url); setOpen(false) }} type="button"
                className="relative group rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all aspect-video bg-muted">
                <img src={g.url} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-0.5">
                  <span className="text-white text-[8px] truncate w-full">{g.title}</span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground/40 text-center pb-1">Powered by Giphy</p>
        </div>
      )}
    </div>
  )
}


function getEmoji(id: string | null | undefined) { if (!id) return '🎯'; return AVATARS[id.charCodeAt(0) % AVATARS.length] }

interface Post {
  id: string
  author_name: string
  author_id?: string
  title: string
  content: string
  gif_url?: string | null
  market_title: string | null
  market_slug?: string | null
  comments_count: number
  likes_count: number
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
  const [selectedGif, setSelectedGif] = useState<string | null>(null)
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
    try {
    const [postsRes, ordersRes, marketsRes, usersRes] = await Promise.all([
      supabase.from('community_posts').select('id, title, content, gif_url, created_at, market_id, user_id, author_id, is_pinned').order('created_at', { ascending: false }).limit(30),
      supabase.from('orders').select('user_id, stake_amount, status, created_at, option_id, market_id').order('created_at', { ascending: false }).limit(30),
      supabase.from('markets').select('id, title, slug, status').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ])

    const rawPosts = (postsRes.data || []) as Post[]

    if (rawPosts.length > 0) {
      const postIds = rawPosts.map(p => p.id)
      const { data: { user } } = await supabase.auth.getUser()

      // Contar comentários
      const { data: commentCounts } = await supabase
        .from('community_comments').select('post_id').in('post_id', postIds)
      const commentMap: Record<string, number> = {}
      for (const c of (commentCounts || [])) {
        commentMap[(c as any).post_id] = (commentMap[(c as any).post_id] || 0) + 1
      }

      // Contar likes
      const { data: likeCounts } = await supabase
        .from('post_likes').select('post_id').in('post_id', postIds)
      const likeMap: Record<string, number> = {}
      for (const l of (likeCounts || [])) {
        likeMap[(l as any).post_id] = (likeMap[(l as any).post_id] || 0) + 1
      }

      // Likes do usuário atual
      if (user) {
        const { data: myLikes } = await supabase
          .from('post_likes').select('post_id')
          .in('post_id', postIds).eq('user_id', user.id)
        const myLikeSet = new Set((myLikes || []).map((l: any) => l.post_id))
        const newReactions: Record<string, Record<string, boolean>> = {}
        for (const pid of postIds) {
          newReactions[pid] = { '❤️': myLikeSet.has(pid) }
        }
        setReactions(newReactions)
      }

      setPosts(rawPosts.map(p => ({
        ...p,
        comments_count: commentMap[p.id] || 0,
        likes_count: likeMap[p.id] || 0,
      })))
    } else {
      setPosts(rawPosts)
    }

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
    } catch (err) { console.error('Comunidade error:', err); setLoading(false) }
  }

  async function handlePost() {
    if (!title.trim() || !content.trim() || !userId) return
    setPosting(true)
    try {
      const supabase = createClient()
      const insertData: any = { author_id: userId, user_id: userId, title, content }
      if (selectedGif) insertData.gif_url = selectedGif
      const { error } = await supabase.from('community_posts').insert(insertData)
      if (error) throw error
      toast({ type: 'success', title: '✅ Post publicado!' })
      setTitle(''); setContent(''); setSelectedGif(null); setShowForm(false)
      loadAll()
    } catch (e: any) {
      toast({ type: 'error', title: 'Erro', description: e.message })
    } finally { setPosting(false) }
  }

  async function toggleLike(postId: string) {
    if (!userId) return
    const supabase = createClient()
    const already = reactions[postId]?.['❤️']
    // Otimista: atualiza UI na hora
    setReactions(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), '❤️': !already }
    }))
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + (already ? -1 : 1)) }
      : p
    ))
    // Persiste no banco
    try {
      if (already) {
        await supabase.from('post_likes').delete()
          .eq('post_id', postId).eq('user_id', userId)
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
          .select().single()
      }
    } catch (_) {
      // Reverter se erro
      setReactions(prev => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), '❤️': already }
      }))
    }
  }

  function toggleReaction(postId: string, emoji: string) {
    if (emoji === '❤️') { toggleLike(postId); return }
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
          {/* Emoji + GIF picker */}
          <EmojiGifPicker onEmoji={(e) => setContent(c => c + e)} onGif={(url) => setSelectedGif(url)} />
          {/* Preview do GIF selecionado */}
          {selectedGif && (
            <div className="relative inline-block">
              <img src={selectedGif} alt="GIF" className="rounded-xl max-h-40 border border-primary/30" />
              <button onClick={() => setSelectedGif(null)} type="button"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white text-xs flex items-center justify-center hover:bg-destructive/80 transition-colors">
                ✕
              </button>
            </div>
          )}
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
                      <span className="font-semibold">{getEmoji(act.user_id)} Trader</span>
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

function PostComments({ postId, userId }: { postId: string; userId: string | null }) {
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')
  const [commentGif, setCommentGif] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('community_comments').select('id', { count: 'exact', head: true })
      .eq('post_id', postId).then(({ count: n }) => setCount(n || 0))
  }, [postId])

  async function loadComments() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('community_comments')
      .select('id, content, author_name, author_id, user_id, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(50)
    setComments(data || [])
    setLoading(false)
  }

  async function sendComment(content: string) {
    const msg = content || text.trim()
    if (!msg || !userId) return
    setPosting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
      const authorName = (profile as any)?.full_name || (profile as any)?.email?.split('@')[0] || 'Anônimo'
      const { error } = await supabase.from('community_comments').insert({
        post_id: postId, author_id: user.id, user_id: user.id,
        content: msg, author_name: authorName,
      })
      if (!error) { setText(''); setCount(n => n + 1); loadComments() }
      else console.error('Erro comentário:', error)
    } finally { setPosting(false) }
  }

  // Envia comentário com texto + GIF juntos
  async function sendCommentFull() {
    const msg = text.trim()
    if (!msg && !commentGif) return
    if (!userId) return
    setPosting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
      const authorName = (profile as any)?.full_name || (profile as any)?.email?.split('@')[0] || 'Anônimo'
      // Se tem texto e GIF, envia dois comentários (texto + gif separados)
      if (msg) {
        await supabase.from('community_comments').insert({
          post_id: postId, author_id: user.id, user_id: user.id,
          content: msg, author_name: authorName,
        })
      }
      if (commentGif) {
        await supabase.from('community_comments').insert({
          post_id: postId, author_id: user.id, user_id: user.id,
          content: commentGif, author_name: authorName,
        })
      }
      setText(''); setCommentGif(null)
      setCount(n => n + (msg ? 1 : 0) + (commentGif ? 1 : 0))
      loadComments()
    } finally { setPosting(false) }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60000) return 'agora'
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h`
    return `${Math.floor(diff/86400000)}d`
  }

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <button onClick={() => { setOpen(v => !v); if (!open) loadComments() }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <MessageSquare className="h-3.5 w-3.5" />
        {open ? 'Fechar comentários' : `💬 ${count} comentário${count !== 1 ? 's' : ''}`}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Seja o primeiro a comentar!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {comments.map(cm => {
                const isGif = cm.content?.match(/https?:\/\/media\.giphy\.com/i)
                return (
                  <div key={cm.id} className="flex items-start gap-2">
                    <div className="text-sm flex-shrink-0 mt-0.5">{getEmoji(cm.author_id || cm.user_id)}</div>
                    <div className="flex-1 min-w-0 rounded-2xl bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-foreground">{cm.author_name || 'Anônimo'}</span>
                        <span className="text-[9px] text-muted-foreground">{timeAgo(cm.created_at)}</span>
                      </div>
                      {isGif ? (
                        <img src={cm.content.trim()} alt="GIF" className="rounded-xl max-h-40 max-w-full" />
                      ) : (
                        <p className="text-xs text-foreground break-words leading-relaxed">{cm.content}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {userId ? (
            <div className="space-y-2">
              {/* Campo de comentário com emoji/GIF inserindo no texto */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  {commentGif && (
                    <div className="relative inline-block">
                      <img src={commentGif} alt="GIF" className="rounded-xl max-h-24 border border-primary/30" />
                      <button onClick={() => setCommentGif(null)} type="button"
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">✕</button>
                    </div>
                  )}
                  <div className="flex gap-1 items-center">
                    <EmojiGifPicker
                      onEmoji={(e) => setText(t => t + e)}
                      onGif={(url) => { setCommentGif(url) }}
                      compact
                    />
                    {/* Upload de GIF/imagem do dispositivo */}
                    <label className="cursor-pointer flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-xl px-2 py-1.5 hover:border-primary/40 hover:text-foreground transition-colors">
                      📎
                      <input type="file" accept="image/gif,image/png,image/jpeg,image/webp" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const supabase = createClient()
                          const ext = file.name.split('.').pop()
                          const path = `comments/${Date.now()}.${ext}`
                          const { data, error } = await supabase.storage.from('community').upload(path, file, { upsert: true })
                          if (!error && data) {
                            const { data: urlData } = supabase.storage.from('community').getPublicUrl(path)
                            setCommentGif(urlData.publicUrl)
                          }
                          e.target.value = ''
                        }}
                      />
                    </label>
                  </div>
                  <input value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendCommentFull())}
                    placeholder="Comentar..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <button onClick={sendCommentFull} disabled={(!text.trim() && !commentGif) || posting}
                  className="flex-shrink-0 rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors">
                  {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              <Link href="/login" className="text-primary hover:underline">Faça login</Link> para comentar
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, userId, reactions, onReact }: { post: Post; userId: string | null; reactions: Record<string,boolean>; onReact: (e: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isPinned = (post as any).is_pinned || false
  const emoji = getEmoji((post as any).user_id || post.author_id || 'default')

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
            <span className="text-xs font-semibold text-foreground">{post.author_name || 'Trader'}</span>
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
        {/* GIF do post */}
        {(post as any).gif_url && (
          <div className="mt-2 rounded-xl overflow-hidden border border-border">
            <img src={(post as any).gif_url} alt="GIF" className="max-h-48 w-auto rounded-xl" loading="lazy" />
          </div>
        )}
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
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => onReact('❤️')}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${reactions['❤️'] ? 'border-rose-500/50 bg-rose-500/10 text-rose-400' : 'border-border text-muted-foreground hover:border-rose-500/30 hover:text-rose-400'}`}>
            ❤️ <span>{post.likes_count || 0}</span>
          </button>
          <span className="text-xs text-muted-foreground">💬 {post.comments_count || 0}</span>
        </div>
        {/* Comentários interativos */}
        <PostComments postId={post.id} userId={userId} />
      </div>
    </div>
  )
}
