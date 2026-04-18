import { supabase } from '@/lib/supabase'
import { recordAuditLog } from '@/lib/audit/auditLog'

export interface ResolutionJob {
  market_id: string
  winning_option_id: string
  total_payout: number
  winners_count: number
}

export async function resolveMarket(
  market_id: string,
  winning_option_id: string,
  admin_id?: string
): Promise<ResolutionJob | null> {
  try {
    // 1. Buscar mercado e validar
    const { data: market, error: market_error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single()

    if (market_error) throw market_error
    if (market.status !== 'closed') {
      throw new Error(`Market status is ${market.status}, expected closed`)
    }

    // 2. Buscar posições vencedoras
    const { data: winning_positions, error: positions_error } = await supabase
      .from('positions')
      .select('user_id, quantity, avg_price')
      .eq('market_id', market_id)
      .eq('option_id', winning_option_id)
      .gt('quantity', 0)

    if (positions_error) throw positions_error

    // 3. Calcular payouts
    const total_volume = await calculateMarketVolume(market_id)
    const total_payout = total_volume * 0.95 // 5% de taxa

    // 4. Distribuir payouts para vencedores
    for (const position of winning_positions || []) {
      const payout = (position.quantity / (winning_positions?.reduce((sum: number, p: any) => sum + p.quantity, 0) || 1)) * total_payout

      // Registrar no ledger
      await supabase.from('ledger_entries').insert({
        user_id: position.user_id,
        entry_type: 'bet_payout',
        credit: payout,
        debit: 0,
        balance_after: 0, // Será calculado no banco
        reference_type: 'market_resolution',
        reference_id: market_id,
        idempotency_key: `resolution_${market_id}_${position.user_id}`,
      })
    }

    // 5. Atualizar status do mercado
    const { error: update_error } = await supabase
      .from('markets')
      .update({
        status: 'resolved',
        winning_option_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', market_id)

    if (update_error) throw update_error

    // 6. Registrar audit log
    if (admin_id) {
      await recordAuditLog({
        user_id: admin_id,
        action: 'market_resolved',
        resource_type: 'market',
        resource_id: market_id,
        changes: {
          winning_option_id,
          total_payout,
        },
      })
    }

    return {
      market_id,
      winning_option_id,
      total_payout,
      winners_count: winning_positions?.length || 0,
    }
  } catch (error) {
    console.error('[resolveMarket]', error)
    throw error
  }
}

async function calculateMarketVolume(market_id: string): Promise<number> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('credit, debit')
    .eq('reference_type', 'bet_stake')
    .eq('reference_id', market_id)

  if (error) throw error

  return (data || []).reduce((sum, entry) => sum + (entry.debit || 0), 0)
}

export async function checkAndResolveExpiredMarkets(): Promise<ResolutionJob[]> {
  try {
    // Buscar mercados que expiram em 1 dia
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: expiring_markets, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'closed')
      .lte('resolves_at', tomorrow.toISOString())
      .is('winning_option_id', null)

    if (error) throw error

    const results: ResolutionJob[] = []

    for (const market of expiring_markets || []) {
      try {
        // TODO: Integrar com sistema de oracle para obter resultado real
        // Por enquanto, retornar null para indicar que resolução manual é necessária
        console.log(`[checkAndResolveExpiredMarkets] Market ${market.id} needs manual resolution`)
      } catch (e) {
        console.error(`[checkAndResolveExpiredMarkets] Error resolving ${market.id}`, e)
      }
    }

    return results
  } catch (error) {
    console.error('[checkAndResolveExpiredMarkets]', error)
    return []
  }
}
