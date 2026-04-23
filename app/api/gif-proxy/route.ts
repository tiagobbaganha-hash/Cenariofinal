import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse(null, { status: 400 })
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://giphy.com/',
        'Accept': 'image/gif,image/*,*/*',
      },
      next: { revalidate: 86400 }
    })
    if (!res.ok) return new NextResponse(null, { status: res.status })
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/gif',
        'Cache-Control': 'public, max-age=86400',
      }
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
