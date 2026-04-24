import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cron Job — resolve mercados expirados automaticamente
// Configurado no vercel.json para rodar a cada 5 minutos

function getAdmin() {
  return createSupabaseClient(
    'https://slxzmyiwcsjyahahkppe.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
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
        // Tentar Binance primeiro (sem rate limit), fallback para CoinGecko
        let currentPrice: number = 0
        const wsSymbol = (cfg.asset_symbol || cfg.asset).toUpperCase() + 'BRL'
        try {
          const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${wsSymbol}`, { cache: 'no-store', signal: AbortSignal.timeout(3000) })
          if (binanceRes.ok) {
            const bd = await binanceRes.json()
            if (bd.price) currentPrice = parseFloat(bd.price)
          }
        } catch (_) {}
        
        // Fallback: CoinGecko
        if (!currentPrice) {
          const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cfg.asset}&vs_currencies=brl`, { cache: 'no-store', signal: AbortSignal.timeout(5000) })
          const pData = await r.json()
          currentPrice = pData[cfg.asset]?.brl || 0
        }
        if (!currentPrice) continue

        const priceRose = currentPrice > cfg.price_at_creation
        const winKey = priceRose ? 'yes' : 'no'

        const { data: winOpt } = await db.from('market_options')
          .select('id, label').eq('market_id', m.id).eq('option_key', winKey).single()
        if (!winOpt) continue

        // Usar RPC admin_settle_market para liquidar corretamente com enum
        const { data: settled, error: settleErr } = await db.rpc('admin_settle_market', {
          p_market_id: m.id,
          p_result_option_id: winOpt.id,
          p_note: `Auto-resolvido: ${cfg.asset_symbol || cfg.asset} ${priceRose ? '▲' : '▼'} R$${currentPrice.toLocaleString('pt-BR')}`
        })
        if (settleErr) throw new Error(settleErr.message)

        // Atualizar rapid_config com preço final
        await db.from('markets').update({
          rapid_config: { ...cfg, final_price: currentPrice, resolved_at: now }
        }).eq('id', m.id)

        log.push({ step: 'rapid_resolved', market: m.title, winner: winOpt.label, price_change: `${cfg.price_at_creation} → ${currentPrice}`, settled })
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
  // Buscar configurações de comissão
  const { data: settings } = await db.from('platform_settings').select('key, value')
  const settingsMap: Record<string, string> = {}
  for (const s of settings || []) settingsMap[s.key] = s.value
  const platformPct = parseFloat(settingsMap['commission_pct'] || '5') / 100

  // Buscar mercado para pegar influencer e commission_pct
  const { data: market } = await db.from('markets')
    .select('id, total_volume, platform_commission, influencer_id, influencer_commission_pct')
    .eq('id', marketId).single()

  const marketCommPct = market?.platform_commission ? parseFloat(market.platform_commission) / 100 : platformPct
  const influencerPct = market?.influencer_commission_pct ? parseFloat(market.influencer_commission_pct) / 100 : 0
  const influencerId = market?.influencer_id || null

  // Buscar todas as ordens
  const { data: orders } = await db.from('orders')
    .select('id, user_id, option_id, stake_amount, potential_payout')
    .eq('market_id', marketId)
    .in('status', ['open', 'pending', 'matched', 'open'])

  let wins = 0, losses = 0, totalPaid = 0
  let totalVolume = 0, totalLosses = 0

  for (const o of orders || []) {
    totalVolume += parseFloat(o.stake_amount || 0)
    if (o.option_id !== winOptionId) totalLosses += parseFloat(o.stake_amount || 0)
  }

  // Calcular comissões sobre o volume total
  const platformEarned = totalVolume * marketCommPct
  const influencerEarned = totalVolume * influencerPct
  const netPlatform = platformEarned - influencerEarned

  for (const o of orders || []) {
    const isWin = o.option_id === winOptionId
    const stake = parseFloat(o.stake_amount || 0)
    // Payout já tem o spread dos odds baked in (1.90x vs 2.0x)
    const payout = isWin ? parseFloat(o.potential_payout || 0) : 0

    await db.from('orders').update({
      status: isWin ? 'settled_win' : 'settled_loss',
      settlement_amount: payout,
      settled_at: new Date().toISOString(),
    }).eq('id', o.id)

    // Atualizar carteira
    const { data: wallet } = await db.from('wallets')
      .select('available_balance, locked_balance').eq('user_id', o.user_id).single()
    if (wallet) {
      const newAvailable = parseFloat(wallet.available_balance) + (isWin ? payout : 0)
      const newLocked = Math.max(0, parseFloat(wallet.locked_balance) - stake)
      await db.from('wallets').update({ available_balance: newAvailable, locked_balance: newLocked }).eq('user_id', o.user_id)
    }

    // Ledger do usuário
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

  // Registrar comissão da plataforma
  if (totalVolume > 0) {
    await db.from('platform_ledger').insert({
      market_id: marketId,
      entry_type: 'market_settlement',
      gross_volume: totalVolume,
      platform_commission_pct: marketCommPct * 100,
      platform_amount: platformEarned,
      influencer_id: influencerId,
      influencer_commission_pct: influencerPct * 100,
      influencer_amount: influencerEarned,
      net_platform_profit: netPlatform,
    }).catch(() => {})

    // Atualizar total_earned do influencer
    if (influencerId && influencerEarned > 0) {
      await db.from('influencers').update({
        total_earned: db.raw(`total_earned + ${influencerEarned}`),
        total_commission: db.raw(`total_commission + ${influencerEarned}`),
      }).eq('id', influencerId).catch(() => {})
    }
  }

  return { orders: (orders || []).length, wins, losses, total_paid: totalPaid, platform_earned: platformEarned, influencer_earned: influencerEarned }
}
