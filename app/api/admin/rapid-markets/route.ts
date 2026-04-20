import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST — criar mercado rápido
export async function POST(req: NextRequest) {
  try {
    // Pegar o token do header Authorization enviado pelo cliente
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Verificar admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = (profile as any)?.role || ''
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Acesso negado — você não é admin' }, { status: 403 })
    }

    const { asset, asset_symbol, price_at_creation, duration_minutes, up_label, down_label } = await req.json()

    const now = new Date()
    const closesAt = new Date(now.getTime() + duration_minutes * 60000)
    const resolvesAt = new Date(closesAt.getTime() + 60000)
    const slug = `${asset_symbol.toLowerCase()}-sobe-ou-desce-${Date.now().toString(36)}`
    const title = `${asset_symbol} (${duration_minutes} minutos): sobe ou desce?`

    const { data: market, error: mErr } = await supabase.from('markets').insert({
      title, slug,
      description: `Preveja se o ${asset_symbol} vai subir ou cair nos próximos ${duration_minutes} minutos. Preço inicial: R$ ${Number(price_at_creation).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      category: 'Cripto', status: 'open', market_type: 'rapid', featured: false,
      closes_at: closesAt.toISOString(), resolves_at: resolvesAt.toISOString(),
      rapid_config: { asset, asset_symbol, vs_currency: 'brl', duration_minutes, price_at_creation },
    }).select().single()

    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

    const { error: oErr } = await supabase.from('market_options').insert([
      { market_id: market.id, label: up_label || 'Sobe', option_key: 'yes', probability: 0.50, odds: 2.00, sort_order: 0, is_active: true },
      { market_id: market.id, label: down_label || 'Desce', option_key: 'no', probability: 0.50, odds: 2.00, sort_order: 1, is_active: true },
    ])
    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 })

    return NextResponse.json({ market, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — resolver mercado rápido
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes((profile as any)?.role || '')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { market_id } = await req.json()
    const { data: market } = await supabase.from('markets').select('id, rapid_config, closes_at, status').eq('id', market_id).single()

    if (!market || market.status === 'resolved') return NextResponse.json({ message: 'Já resolvido' })

    const config = market.rapid_config as any
    if (!config?.asset) return NextResponse.json({ error: 'Sem config rapid' }, { status: 400 })

    const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${config.asset}&vs_currencies=brl`, { cache: 'no-store' })
    const priceData = await priceRes.json()
    const currentPrice = priceData[config.asset]?.brl
    if (!currentPrice) return NextResponse.json({ error: 'Preço indisponível' }, { status: 500 })

    const priceRose = currentPrice > config.price_at_creation
    const { data: winOption } = await supabase.from('market_options').select('id').eq('market_id', market_id).eq('option_key', priceRose ? 'yes' : 'no').single()
    if (!winOption) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 500 })

    await supabase.from('markets').update({
      status: 'resolved', result_option_id: winOption.id,
      rapid_config: { ...config, final_price: currentPrice, resolved_at: new Date().toISOString() }
    }).eq('id', market_id)

    return NextResponse.json({ resolved: true, winner: priceRose ? 'Subiu' : 'Desceu', initial_price: config.price_at_creation, final_price: currentPrice, change_pct: (((currentPrice - config.price_at_creation) / config.price_at_creation) * 100).toFixed(4) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
