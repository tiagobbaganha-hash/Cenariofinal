import { NextRequest, NextResponse } from 'next/server'

// GIFs via Giphy API server-side — browser carrega via /api/gif-proxy
const GIPHY_KEY = 'dc6zaTOxFJmzC'

const CATEGORIES: Record<string, string> = {
  'trending': 'trending',
  'stonks money finance': 'stonks money',
  'lets go hype excited': 'lets go excited',
  'party celebrate': 'party celebration',
  'funny meme bruh': 'funny meme',
  'shocked surprised omg': 'shocked omg',
  'fail lose rip': 'fail lose',
  'soccer goal football': 'goal soccer',
  'thumbs up reaction': 'thumbs up reaction',
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || 'trending').toLowerCase()
  const limit = req.nextUrl.searchParams.get('limit') || '12'

  // Mapear para query Giphy
  const query = CATEGORIES[q] || q

  try {
    const url = query === 'trending'
      ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=g`
      : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g&lang=pt`

    const res = await fetch(url, { next: { revalidate: 300 } })

    if (res.ok) {
      const data = await res.json()
      const gifs = (data.data || []).map((g: any) => {
        const rawUrl = g.images?.fixed_height?.url || g.images?.original?.url || ''
        const rawThumb = g.images?.fixed_height_small?.url || rawUrl
        // Usar proxy para evitar bloqueio de hotlink
        return {
          id: g.id,
          title: g.title || query,
          url: rawUrl ? `/api/gif-proxy?url=${encodeURIComponent(rawUrl)}` : '',
          thumb: rawThumb ? `/api/gif-proxy?url=${encodeURIComponent(rawThumb)}` : '',
        }
      }).filter((g: any) => g.url)

      if (gifs.length > 0) return NextResponse.json({ gifs })
    }
  } catch (_) {}

  // Fallback: lista curada com proxy
  const FALLBACK = [
    { id: 'f1', title: 'Stonks', url: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/XNBcChLQt3beckMGhZ/giphy.gif'), thumb: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/XNBcChLQt3beckMGhZ/giphy.gif') },
    { id: 'f2', title: 'LFG', url: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/S9i8jJxTvAKVHVMvvW/giphy.gif'), thumb: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/S9i8jJxTvAKVHVMvvW/giphy.gif') },
    { id: 'f3', title: 'Win', url: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/rY93u9tQbybks/giphy.gif'), thumb: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/rY93u9tQbybks/giphy.gif') },
    { id: 'f4', title: 'OMG', url: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif'), thumb: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif') },
    { id: 'f5', title: 'Bruh', url: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif'), thumb: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif') },
    { id: 'f6', title: 'Facepalm', url: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif'), thumb: '/api/gif-proxy?url=' + encodeURIComponent('https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif') },
  ]
  return NextResponse.json({ gifs: FALLBACK })
}
