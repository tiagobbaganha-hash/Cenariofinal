import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  'https://slxzmyiwcsjyahahkppe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    // Apenas processar pagamentos aprovados
    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ ok: true })
    }

    const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''
    if (!MP_ACCESS_TOKEN) return NextResponse.json({ ok: true })

    // Buscar detalhes do pagamento no Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    })
    const payment = await mpRes.json()

    if (payment.status !== 'approved') return NextResponse.json({ ok: true })

    const amount = payment.transaction_amount
    const paymentId = String(payment.id)

    // Encontrar o deposit_request correspondente
    const { data: deposit } = await supabase.from('deposit_requests')
      .select('id, user_id, amount, status')
      .eq('status', 'pending')
      .contains('metadata', { mp_payment_id: data.id })
      .single()

    if (!deposit || deposit.status === 'paid') {
      return NextResponse.json({ ok: true, msg: 'Já processado' })
    }

    // Creditar na carteira
    await supabase.rpc('ensure_wallet_for', { p_user_id: deposit.user_id }).catch(() => {})

    await supabase.from('wallets').update({
      available_balance: supabase.rpc('available_balance + ' + amount) as any,
      updated_at: new Date().toISOString()
    }).eq('user_id', deposit.user_id)

    // Usar SQL direto para incrementar saldo
    const { error: walletErr } = await supabase.rpc('admin_credit_wallet', {
      p_user_id: deposit.user_id,
      p_amount: amount,
      p_reference_id: deposit.id,
      p_note: `Depósito PIX #${paymentId}`
    }).catch(() => ({ error: null })) as any

    // Registrar no ledger
    await supabase.from('wallet_ledger').insert({
      user_id: deposit.user_id,
      entry_type: 'deposit',
      direction: 'credit',
      amount,
      reference_id: deposit.id,
    })

    // Marcar como pago
    await supabase.from('deposit_requests').update({
      status: 'paid',
      metadata: { mp_payment_id: paymentId, paid_at: new Date().toISOString() }
    }).eq('id', deposit.id)

    // Notificar usuário
    await supabase.from('user_notifications').insert({
      user_id: deposit.user_id,
      type: 'deposit_approved',
      title: '💰 Depósito confirmado!',
      body: `R$ ${amount.toFixed(2)} creditados na sua carteira.`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, credited: amount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
