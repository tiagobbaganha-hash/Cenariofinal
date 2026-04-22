import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cron Job — resolve mercados expirados automaticamente
// Configurado no vercel.json para rodar a cada 5 minutos

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  const log: any[] = []
  const db = getAdmin()

  try {
    // ── 1. Fechar apostas em mercados que passaram do closes_at ──────────
    const { data: toClose } = await db.from('markets')
      .select('id, title')
      .eq('status', 'open')
      .neq('market_type', 'rapid')
      .lt('closes_at', now)

    if (toClose?.length) {
      await db.from('markets').update({ status: 'closed' }).in('id', toClose.map(m => m.id))
      log.push({ step: 'close_betting', count: toClose.length, titles: toClose.map(m => m.title) })
    }

    // ── 2. Resolver mercados rápidos expirados (via preço cripto) ────────
    const { data: rapidExpired } = await db.from('markets')
      .select('id, title, rapid_config')
      .eq('market_type', 'rapid')
      .in('status', ['open', 'closed'])
      .lt('closes_at', now)

    for (const m of rapidExpired || []) {
      const cfg = m.rapid_config as any
      if (!cfg?.asset) continue

      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cfg.asset}&vs_currencies=brl`, { cache: 'no-store' })
        const pData = await r.json()
        const currentPrice: number = pData[cfg.asset]?.brl
        if (!currentPrice) continue

        const priceRose = currentPrice > cfg.price_at_creation
        const winKey = priceRose ? 'yes' : 'no'

        const { data: winOpt } = await db.from('market_options')
          .select('id').eq('market_id', m.id).eq('option_key', winKey).single()
        if (!winOpt) continue

        await db.from('markets').update({
          status: 'resolved',
          result_option_id: winOpt.id,
          rapid_config: { ...cfg, final_price: currentPrice, resolved_at: now }
        }).eq('id', m.id)

        const settled = await settleOrders(db, m.id, winOpt.id)
        log.push({ step: 'rapid_resolved', market: m.title, winner: priceRose ? 'Subiu' : 'Desceu', price_change: `${cfg.price_at_creation} → ${currentPrice}`, ...settled })
      } catch (e: any) {
        log.push({ step: 'rapid_error', market: m.title, error: e.message })
      }
    }

    // ── 3. Liquidar apostas de mercados já resolvidos manualmente ────────
    const since = new Date(Date.now() - 48 * 3600000).toISOString()
    const { data: resolved } = await db.from('markets')
      .select('id, title, result_option_id')
      .eq('status', 'resolved')
      .not('result_option_id', 'is', null)
      .gt('updated_at', since)

    for (const m of resolved || []) {
      const { count } = await db.from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('market_id', m.id)
        .in('status', ['open', 'pending', 'matched'])
      if (!count) continue

      const settled = await settleOrders(db, m.id, m.result_option_id)
      if (settled.orders > 0) log.push({ step: 'settled_manual', market: m.title, ...settled })
    }

    // 4. Publicar mercados agendados
    try {
      const { data: published } = await db.rpc('publish_scheduled_markets')
      if (published && published > 0) log.push({ step: 'scheduled_published', count: published })
    } catch (e: any) { log.push({ step: 'scheduling_error', error: e.message }) }

    return NextResponse.json({ ok: true, timestamp: now, processed: log })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

async function settleOrders(db: any, marketId: string, winOptionId: string) {
  const { data: orders } = await db.from('orders')
    .select('id, user_id, option_id, stake_amount, potential_payout')
    .eq('market_id', marketId)
    .in('status', ['open', 'pending', 'matched'])

  let wins = 0, losses = 0, totalPaid = 0

  for (const o of orders || []) {
    const isWin = o.option_id === winOptionId
    const payout = isWin ? parseFloat(o.potential_payout || 0) : 0
    const stake = parseFloat(o.stake_amount || 0)

    await db.from('orders').update({
      status: isWin ? 'settled_win' : 'settled_loss',
      settlement_amount: payout,
      settled_at: new Date().toISOString(),
    }).eq('id', o.id)

    // Atualizar carteira
    const { data: wallet } = await db.from('wallets').select('available_balance, locked_balance').eq('user_id', o.user_id).single()
    if (wallet) {
      const newAvailable = parseFloat(wallet.available_balance) + (isWin ? payout : 0)
      const newLocked = Math.max(0, parseFloat(wallet.locked_balance) - stake)
      await db.from('wallets').update({ available_balance: newAvailable, locked_balance: newLocked }).eq('user_id', o.user_id)
    }

    // Ledger
    await db.from('wallet_ledger').insert({
      user_id: o.user_id,
      entry_type: isWin ? 'bet_settle_win' : 'bet_settle_loss',
      direction: isWin ? 'credit' : 'debit',
      amount: isWin ? payout : stake,
      reference_id: o.id,
    }).catch(() => {})

    // Notificação
    await db.from('user_notifications').insert({
      user_id: o.user_id,
      type: isWin ? 'bet_win' : 'bet_loss',
      title: isWin ? '🏆 Você ganhou!' : 'Aposta encerrada',
      body: isWin ? `Parabéns! R$ ${payout.toFixed(2)} creditados na sua carteira.` : 'Sua previsão não foi confirmada. Continue tentando!',
    }).catch(() => {})

    if (isWin) { wins++; totalPaid += payout } else losses++
  }

  return { orders: (orders || []).length, wins, losses, total_paid: totalPaid }
}
