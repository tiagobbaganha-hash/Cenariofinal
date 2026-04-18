import { supabase } from '@/lib/supabase'

export interface PromoCode {
  code: string
  description: string
  discountPercent: number
  maxUses: number
  usesRemaining: number
  expiresAt: string | null
}

export async function getActivePromoCodes(): Promise<PromoCode[]> {
  try {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, description, discount_percent, max_uses, expires_at')
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((p: any) => ({
      code: p.code,
      description: p.description,
      discountPercent: p.discount_percent,
      maxUses: p.max_uses,
      usesRemaining: p.max_uses, // TODO: calcular usos reais
      expiresAt: p.expires_at,
    }))
  } catch (error) {
    console.error('[getActivePromoCodes]', error)
    return []
  }
}

export async function redeemPromoCode(code: string, amount: number) {
  try {
    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code: code,
      p_amount: amount,
    })

    if (error) throw error
    return { discount: data, error: null }
  } catch (error: any) {
    return { discount: 0, error: error.message }
  }
}

export async function validatePromoCode(code: string) {
  try {
    const { data, error } = await supabase.rpc('validate_promo_code_v2', {
      p_code: code,
    })

    if (error) throw error
    return { valid: data, error: null }
  } catch (error: any) {
    return { valid: false, error: error.message }
  }
}
