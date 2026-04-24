import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = 'https://slxzmyiwcsjyahahkppe.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || ''

export async function POST(req: NextRequest) {
  try {
    const { user_id, amount, email } = await req.json()
    if (!user_id || !amount || amount < 10) {
      return NextResponse.json({ error: 'Valor mínimo: R$ 10,00' }, { status: 400 })
    }

    // Se não tem token do Mercado Pago configurado, usar PIX estático de desenvolvimento
    if (!MP_ACCESS_TOKEN) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      const { data: req_data, error } = await supabase.from('deposit_requests').insert({
        user_id, amount, status: 'pending', payment_method: 'pix',
        metadata: { mode: 'manual' }
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // PIX Copia-e-Cola estático (para testes — substitua pela chave PIX real)
      const pixKey = process.env.PIX_KEY_CNPJ || 'cenariox@plataforma.com.br'
      const pixPayload = generatePixPayload(pixKey, amount, req_data.id.slice(0,10))

      return NextResponse.json({
        pix_code: pixPayload,
        payment_id: req_data.id,
        amount,
        mode: 'manual',
        instructions: `Após o pagamento, envie o comprovante pelo suporte. Crédito em até 2h.`
      })
    }

    // Mercado Pago real
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${user_id}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: `Depósito CenárioX`,
        payment_method_id: 'pix',
        payer: { email: email || 'usuario@cenariox.com.br' },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-cenariox-arquitetura-e-plano.vercel.app'}/api/pagamentos/webhook`,
      })
    })

    if (!mpResponse.ok) {
      const err = await mpResponse.json()
      return NextResponse.json({ error: err.message || 'Erro Mercado Pago' }, { status: 500 })
    }

    const mpData = await mpResponse.json()
    const pixCode = mpData.point_of_interaction?.transaction_data?.qr_code
    const pixQr = mpData.point_of_interaction?.transaction_data?.qr_code_base64
    const paymentId = mpData.id

    // Salvar no banco
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    await supabase.from('deposit_requests').insert({
      user_id, amount, status: 'pending', payment_method: 'pix',
      metadata: { mp_payment_id: paymentId, pix_code: pixCode }
    })

    return NextResponse.json({ pix_code: pixCode, pix_qr: pixQr, payment_id: paymentId, amount })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function generatePixPayload(key: string, amount: number, txId: string): string {
  const merchantName = 'CENARIOX'
  const city = 'SAO PAULO'
  const amountStr = amount.toFixed(2)

  function tlv(id: string, value: string) {
    const len = value.length.toString().padStart(2, '0')
    return `${id}${len}${value}`
  }
  const pixKey = tlv('01', key)
  const addInfo = tlv('05', txId.toUpperCase().replace(/-/g,'').slice(0,25))
  const merchantAccountInfo = tlv('00', 'BR.GOV.BCB.PIX') + pixKey + addInfo
  const mInfo = tlv('26', merchantAccountInfo)
  const payload = '000201' + mInfo + '52040000' + '5303986' +
    tlv('54', amountStr) + '5802BR' +
    tlv('59', merchantName) + tlv('60', city) +
    tlv('62', tlv('05', txId.slice(0,25))) + '6304'

  // CRC16 simplificado
  let crc = 0xFFFF
  for (const char of payload + '6304') {
    crc ^= char.charCodeAt(0) << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    crc &= 0xFFFF
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0')
}
