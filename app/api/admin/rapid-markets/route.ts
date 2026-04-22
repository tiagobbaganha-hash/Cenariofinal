import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://slxzmyiwcsjyahahkppe.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
function getDb(userToken?: string) {
  // Sempre usa anon key + JWT do usuário (ignora service role env — pode estar desatualizada)
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: {
        apikey: ANON_KEY,
        Authorization: userToken ? `Bearer ${userToken}` : `Bearer ${ANON_KEY}`,
      }
    }
  })
}

function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (!payload.sub || payload.exp < Date.now() / 1000) return null
    return { id: payload.sub, email: payload.email }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null
    const user = token ? decodeJWT(token) : null
    if (!user) return NextResponse.json({ error: 'Faça login para criar mercados' }, { status: 401 })

    const db = getDb(token || undefined)
    const body = await req.json()
    const { asset, asset_symbol, price_at_creation, duration_minutes, up_label, down_label, question } = body

    const now = new Date()
    const closesAt = new Date(now.getTime() + duration_minutes * 60000)
    const resolvesAt = new Date(closesAt.getTime() + 60000)
    const slug = `${asset_symbol.toLowerCase()}-${Date.now().toString(36)}`
    const title = question || `${asset_symbol} (${duration_minutes}min): ${up_label || 'Sobe'} ou ${down_label || 'Desce'}?`

    const { data: market, error: mErr } = await db.from('markets').insert({
      title, slug,
      description: `Preço inicial: R$ ${Number(price_at_creation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      category: 'Cripto', status: 'open', market_type: 'rapid',
      closes_at: closesAt.toISOString(),
      resolves_at: resolvesAt.toISOString(),
      rapid_config: { asset, asset_symbol, vs_currency: 'brl', duration_minutes, price_at_creation },
    }).select().single()

    if (mErr) {
      console.error('Market insert error:', mErr)
      return NextResponse.json({ error: mErr.message }, { status: 500 })
    }

    const { error: oErr } = await db.from('market_options').insert([
      { market_id: market.id, label: up_label || 'Sobe', option_key: 'yes', probability: 0.50, odds: 1.90, sort_order: 0, is_active: true },
      { market_id: market.id, label: down_label || 'Desce', option_key: 'no', probability: 0.50, odds: 1.90, sort_order: 1, is_active: true },
    ])

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })
    return NextResponse.json({ market, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const { data, error } = await db.from('markets')
      .select('id, title, slug, status, closes_at, rapid_config, market_options(id, label, odds, probability)')
      .eq('market_type', 'rapid')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ markets: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
