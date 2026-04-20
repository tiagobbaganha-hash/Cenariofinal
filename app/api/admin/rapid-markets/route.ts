import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb(token?: string) {
  // Usar service role se disponível, senão anon key com token do usuário
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const opts = (!process.env.SUPABASE_SERVICE_ROLE_KEY && token)
    ? { global: { headers: { Authorization: `Bearer ${token}` } } }
    : {}
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, opts)
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const db = getDb(token)

    // Verificar autenticação
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await req.json()
    const { asset, asset_symbol, price_at_creation, duration_minutes, up_label, down_label } = body

    const now = new Date()
    const closesAt = new Date(now.getTime() + duration_minutes * 60000)
    const resolvesAt = new Date(closesAt.getTime() + 60000)
    const slug = `${asset_symbol.toLowerCase()}-${Date.now().toString(36)}`
    const title = `${asset_symbol} (${duration_minutes}min): ${up_label || 'Sobe'} ou ${down_label || 'Desce'}?`

    const { data: market, error: mErr } = await db.from('markets').insert({
      title, slug,
      description: `Preço inicial: R$ ${Number(price_at_creation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      category: 'Cripto', status: 'open', market_type: 'rapid',
      closes_at: closesAt.toISOString(), resolves_at: resolvesAt.toISOString(),
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
    console.error('Rapid market error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const db = getDb(token)
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { market_id } = await req.json()
    const { data: market } = await db.from('markets').select('id, rapid_config, status').eq('id', market_id).single()
    if (!market || market.status === 'resolved') return NextResponse.json({ message: 'Já resolvido' })

    const cfg = market.rapid_config as any
    if (!cfg?.asset) return NextResponse.json({ error: 'Config inválida' }, { status: 400 })

    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cfg.asset}&vs_currencies=brl`, { cache: 'no-store' })
    const pd = await r.json()
    const currentPrice: number = pd[cfg.asset]?.brl
    if (!currentPrice) return NextResponse.json({ error: 'Preço indisponível' }, { status: 500 })

    const priceRose = currentPrice > cfg.price_at_creation
    const { data: winOpt } = await db.from('market_options').select('id').eq('market_id', market_id).eq('option_key', priceRose ? 'yes' : 'no').single()
    if (!winOpt) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 500 })

    await db.from('markets').update({
      status: 'resolved', result_option_id: winOpt.id,
      rapid_config: { ...cfg, final_price: currentPrice, resolved_at: new Date().toISOString() }
    }).eq('id', market_id)

    return NextResponse.json({ resolved: true, winner: priceRose ? 'Subiu' : 'Desceu', initial: cfg.price_at_creation, final: currentPrice })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
