import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  'https://slxzmyiwcsjyahahkppe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP envia: { action, type, data: { id } } ou { topic, resource }
    const paymentId = body?.data?.id || body?.id
    const topic = body?.type || body?.topic

    // Ignorar se não for pagamento
    if (!paymentId || (topic && topic !== 'payment')) {
      return NextResponse.json({ ok: true })
    }

    const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    if (!MP_ACCESS_TOKEN) return NextResponse.json({ ok: true })

    // Buscar pagamento no MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    })
    const payment = await mpRes.json()

    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true, status: payment.status })
    }

    const amount = Number(payment.transaction_amount)

    // Identificar usuário pelo external_reference (user_id que enviamos)
    const userId = payment.external_reference

    if (!userId) {
      return NextResponse.json({ ok: true, msg: 'Sem external_reference' })
    }

    // Verificar se já creditou (idempotência)
    const { data: existing } = await supabase.from('wallet_ledger')
      .select('id')
      .eq('reference_id', String(paymentId))
      .single()

    if (existing) {
      return NextResponse.json({ ok: true, msg: 'Já creditado' })
    }

    // Creditar na carteira
    const { error: creditErr } = await supabase.rpc('admin_credit_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_note: `Depósito PIX MP #${paymentId}`
    })

    if (creditErr) {
      // Fallback: UPDATE direto
      await supabase.from('wallets')
        .upsert({ user_id: userId, available_balance: amount }, { onConflict: 'user_id' })
      
      // Tentar incrementar
      await supabase.rpc('increment_wallet', { p_user_id: userId, p_amount: amount }).catch(() => {})
    }

    // Registrar no ledger
    await supabase.from('wallet_ledger').insert({
      user_id: userId,
      entry_type: 'deposit',
      direction: 'credit',
      amount,
      description: `Depósito PIX R$ ${amount.toFixed(2)}`,
      reference_id: String(paymentId),
    })

    // Atualizar deposit_request se existir
    await supabase.from('deposit_requests')
      .update({ status: 'paid' })
      .eq('user_id', userId)
      .eq('amount', amount)
      .eq('status', 'pending')

    // Notificar usuário
    await supabase.from('user_notifications').insert({
      user_id: userId,
      type: 'deposit_approved',
      title: '💰 Depósito confirmado!',
      body: `R$ ${amount.toFixed(2)} foram creditados na sua carteira.`,
      link: '/carteira',
    }).catch(() => {})

    return NextResponse.json({ ok: true, credited: amount, user: userId })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// MP também faz GET para verificar o endpoint
export async function GET() {
  return NextResponse.json({ ok: true, webhook: 'CenárioX PIX' })
}
