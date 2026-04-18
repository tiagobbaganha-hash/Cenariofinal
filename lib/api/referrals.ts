import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface ReferralCode {
  code: string
  createdAt: string
  referralsCount: number
  rewardsEarned: number
}

export interface ReferralStats {
  code: string
  totalReferrals: number
  totalRewards: number
  activeReferrals: number
}

export async function getOrCreateReferralCode(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_or_create_referral_code')
    if (error) throw error
    return data
  } catch (error) {
    console.error('[getOrCreateReferralCode]', error)
    return null
  }
}

export async function getReferralStats(): Promise<ReferralStats | null> {
  try {
    const { data: session } = await supabase.auth.getSession()
    if (!session?.user?.id) return null

    // Buscar código de referência
    const { data: code } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', session.user.id)
      .single()

    if (!code) return null

    // Buscar estatísticas de referências
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id, referred_user_id')
      .eq('referrer_id', session.user.id)

    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('amount')
      .eq('referrer_id', session.user.id)

    const totalRewards = (rewards || []).reduce((sum, r) => sum + (r.amount || 0), 0)

    return {
      code: code.code,
      totalReferrals: referrals?.length ?? 0,
      totalRewards,
      activeReferrals: referrals?.length ?? 0,
    }
  } catch (error) {
    console.error('[getReferralStats]', error)
    return null
  }
}

export async function applyReferralCode(code: string) {
  try {
    const { data, error } = await supabase.rpc('apply_referral_code', {
      p_code: code,
    })
    if (error) throw error
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
