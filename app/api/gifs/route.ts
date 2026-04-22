import { NextRequest, NextResponse } from 'next/server'

// Proxy Giphy - roda server-side, sem bloqueio de CORS/hotlink
const GIPHY_KEY = 'dc6zaTOxFJmzC' // beta key pública

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || 'trending'
  const limit = req.nextUrl.searchParams.get('limit') || '20'

  try {
    const url = q === 'trending'
      ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=g`
      : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'CenarioX/1.0' },
      next: { revalidate: 60 }
    })

    if (!res.ok) {
      return NextResponse.json({ gifs: [] })
    }

    const data = await res.json()
    const gifs = (data.data || []).map((g: any) => ({
      id: g.id,
      title: g.title || q,
      url: g.images?.fixed_height?.url || g.images?.original?.url || '',
      thumb: g.images?.fixed_height_small?.url || g.images?.fixed_height?.url || '',
    })).filter((g: any) => g.url)

    return NextResponse.json({ gifs })
  } catch {
    return NextResponse.json({ gifs: [] })
  }
}
