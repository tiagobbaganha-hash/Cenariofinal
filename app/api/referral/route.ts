import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  'https://slxzmyiwcsjyahahkppe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
)

export async function POST(req: NextRequest) {
  try {
    const { referred_id, referral_code } = await req.json()
    if (!referred_id || !referral_code) return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })

    // Encontrar dono do código (usuário comum ou influencer)
    let referrer_id: string | null = null

    const { data: referrer } = await supabase.from('profiles')
      .select('id').eq('referral_code', referral_code).single()
    if (referrer?.id) referrer_id = referrer.id

    if (!referrer_id) {
      const { data: inf } = await supabase.from('influencers')
        .select('user_id').eq('referral_code', referral_code).single()
      if (inf?.user_id) referrer_id = inf.user_id
    }

    if (!referrer_id) return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    if (referrer_id === referred_id) return NextResponse.json({ error: 'Auto-indicação não permitida' }, { status: 400 })

    const { data, error } = await supabase.rpc('credit_referral_bonus', {
      p_referrer_id: referrer_id,
      p_referred_id: referred_id,
      p_referral_code: referral_code,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, ...data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
