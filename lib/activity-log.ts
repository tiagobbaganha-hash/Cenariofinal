import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LogAction =
  | 'user.login' | 'user.logout' | 'user.register' | 'user.upgrade_pro'
  | 'bet.placed' | 'bet.cancelled'
  | 'market.created' | 'market.edited' | 'market.resolved' | 'market.cancelled'
  | 'market.proposed' | 'market.proposal_approved' | 'market.proposal_rejected'
  | 'influencer.created' | 'influencer.market_linked' | 'influencer.commission_paid'
  | 'ai.analysis_viewed' | 'ai.cover_generated' | 'ai.market_generated'
  | 'admin.user_role_changed' | 'admin.market_featured'
  | 'wallet.deposit' | 'wallet.withdrawal'
  | 'subscription.activated' | 'subscription.cancelled'

interface LogParams {
  userId?: string
  action: LogAction
  entityType?: string
  entityId?: string
  entityLabel?: string
  metadata?: Record<string, any>
  request?: Request
}

export async function logActivity(params: LogParams) {
  try {
    const ip = params.request?.headers.get('x-forwarded-for')?.split(',')[0] || 
               params.request?.headers.get('x-real-ip') || null
    const userAgent = params.request?.headers.get('user-agent') || null

    await supabaseAdmin.from('activity_logs').insert({
      user_id: params.userId || null,
      action: params.action,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      entity_label: params.entityLabel || null,
      metadata: params.metadata || {},
      ip_address: ip,
      user_agent: userAgent,
    })
  } catch (_) {
    // Log nunca deve quebrar a app
  }
}
