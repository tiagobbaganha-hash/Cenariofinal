import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — criar mercado rápido
export async function POST(req: NextRequest) {
  try {
    const { asset, asset_symbol, price_at_creation, duration_minutes, up_label, down_label } = await req.json()

    const now = new Date()
    const closesAt = new Date(now.getTime() + duration_minutes * 60000)
    const resolvesAt = new Date(closesAt.getTime() + 60000) // 1min após fechar para resolução

    const slug = `${asset_symbol.toLowerCase()}-sobe-ou-desce-${Date.now().toString(36)}`
    const title = `${asset_symbol} (${duration_minutes} minutos): sobe ou desce?`

    const { data: market, error: mErr } = await supabaseAdmin.from('markets').insert({
      title,
      slug,
      description: `Preveja se o ${asset_symbol} vai subir ou cair nos próximos ${duration_minutes} minutos. Preço inicial: R$ ${price_at_creation.toFixed(2)}`,
      category: 'Cripto',
      status: 'open',
      market_type: 'rapid',
      featured: false,
      closes_at: closesAt.toISOString(),
      resolves_at: resolvesAt.toISOString(),
      rapid_config: { asset, asset_symbol, vs_currency: 'brl', duration_minutes, price_at_creation },
    }).select().single()

    if (mErr) throw mErr

    // Criar opções Sobe / Desce
    await supabaseAdmin.from('market_options').insert([
      { market_id: market.id, label: up_label || `Sobe`, option_key: 'yes', probability: 0.50, odds: 2.00, sort_order: 0, is_active: true },
      { market_id: market.id, label: down_label || `Desce`, option_key: 'no', probability: 0.50, odds: 2.00, sort_order: 1, is_active: true },
    ])

    return NextResponse.json({ market, success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH — resolver mercado rápido (chamado pelo cron ou admin)
export async function PATCH(req: NextRequest) {
  try {
    const { market_id } = await req.json()

    // Buscar configuração do mercado
    const { data: market } = await supabaseAdmin
      .from('markets')
      .select('id, rapid_config, closes_at, status')
      .eq('id', market_id)
      .single()

    if (!market || market.status === 'resolved') {
      return NextResponse.json({ message: 'Mercado não encontrado ou já resolvido' })
    }

    const config = market.rapid_config as any
    if (!config) return NextResponse.json({ error: 'Sem configuração de mercado rápido' }, { status: 400 })

    // Buscar preço atual
    const priceRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${config.asset}&vs_currencies=brl`,
      { cache: 'no-store' }
    )
    const priceData = await priceRes.json()
    const currentPrice = priceData[config.asset]?.brl

    if (!currentPrice) return NextResponse.json({ error: 'Não foi possível obter preço' }, { status: 500 })

    const priceRose = currentPrice > config.price_at_creation
    const winningKey = priceRose ? 'yes' : 'no'

    // Buscar opção vencedora
    const { data: winOption } = await supabaseAdmin
      .from('market_options')
      .select('id')
      .eq('market_id', market_id)
      .eq('option_key', winningKey)
      .single()

    if (!winOption) return NextResponse.json({ error: 'Opção não encontrada' }, { status: 500 })

    // Resolver o mercado
    await supabaseAdmin.from('markets').update({
      status: 'resolved',
      result_option_id: winOption.id,
      resolves_at: new Date().toISOString(),
      rapid_config: { ...config, final_price: currentPrice, resolved_at: new Date().toISOString() }
    }).eq('id', market_id)

    return NextResponse.json({
      resolved: true,
      initial_price: config.price_at_creation,
      final_price: currentPrice,
      winner: priceRose ? 'Subiu' : 'Desceu',
      change_pct: (((currentPrice - config.price_at_creation) / config.price_at_creation) * 100).toFixed(4)
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
