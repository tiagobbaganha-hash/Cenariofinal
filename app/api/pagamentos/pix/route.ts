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

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // PIX estático sempre ativo (MP como opcional)
    if (true) {
      const { data: req_data, error } = await supabase.from('deposit_requests').insert({
        user_id, amount, status: 'pending'
      }).select().single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // PIX Copia-e-Cola estático (para testes — substitua pela chave PIX real)
      // Formatar chave PIX (CPF: só números)
      const rawKey = process.env.PIX_KEY_CNPJ || ''
      const pixKey = rawKey.replace(/[^0-9a-zA-Z@._+-]/g, '')
      if (!pixKey) return NextResponse.json({ error: 'Chave PIX não configurada. Configure PIX_KEY_CNPJ no Vercel.' }, { status: 500 })
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
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://cenariox.com.br'}/api/pagamentos/webhook`,
      })
    })

    const mpData = await mpResponse.json()
    
    // Se MP falhou ou não retornou PIX, usar PIX estático com CPF
    const pixCode = mpData.point_of_interaction?.transaction_data?.qr_code
    
    if (!mpResponse.ok || !pixCode) {
      // Fallback: PIX estático com chave CPF do dono
      const rawKey = process.env.PIX_KEY_CNPJ || ''
      const pixKey = rawKey.replace(/[^0-9a-zA-Z@._+-]/g, '')
      if (!pixKey) return NextResponse.json({ error: 'Configure PIX_KEY_CNPJ no Vercel' }, { status: 500 })
      
      const { data: req_data, error: dbErr } = await supabase.from('deposit_requests').insert({
        user_id, amount, status: 'pending',
        metadata: { mode: 'manual_fallback', mp_error: mpData.message || 'MP sem PIX' }
      }).select().single()
      
      if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
      
      const staticPix = generatePixPayload(pixKey, amount, req_data.id.slice(0,10))
      return NextResponse.json({
        pix_code: staticPix,
        payment_id: req_data.id,
        amount,
        mode: 'manual',
        instructions: `Pague via PIX e envie o comprovante pelo suporte. Crédito em até 2h.`
      })
    }

    const pixQr = mpData.point_of_interaction?.transaction_data?.qr_code_base64
    const paymentId = mpData.id

    // Salvar no banco
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
  function tlv(id: string, value: string): string {
    return `${id}${value.length.toString().padStart(2, '0')}${value}`
  }

  // Merchant Account Info (ID 26)
  const merchantAccount = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', key)
  
  // Additional Data Field (ID 62) - txid limpo
  const cleanTxId = (txId || 'CENARIOX').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || 'CENARIOX'
  const additionalData = tlv('62', tlv('05', cleanTxId))

  // Montar payload sem CRC
  const payload = [
    '000201',                                    // Payload Format Indicator
    tlv('26', merchantAccount),                  // Merchant Account
    '52040000',                                  // MCC
    '5303986',                                   // Moeda BRL
    amount > 0 ? tlv('54', amount.toFixed(2)) : '', // Valor
    '5802BR',                                    // País
    tlv('59', 'CENARIOX'),                       // Nome do recebedor
    tlv('60', 'ALTA FLORESTA'),                  // Cidade
    additionalData,                              // Dados adicionais
    '6304',                                      // CRC placeholder
  ].join('')

  // CRC16-CCITT calculado sobre TODO o payload incluindo '6304'
  let crc = 0xFFFF
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
    }
  }
  return payload + crc.toString(16).toUpperCase().padStart(4, '0')
}
