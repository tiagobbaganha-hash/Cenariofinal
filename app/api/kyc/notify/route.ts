import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TELEGRAM_BOT = '8756588867:AAEwVK97jjSiMGKhm9Ola-YCGQL_ePMJuf0'
const TELEGRAM_CHAT = '1619064772'

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, docUrl, selfieUrl } = await req.json()

    const msg = `🔔 *NOVO KYC PARA APROVAR*\n\n👤 *Nome:* ${name}\n📧 *Email:* ${email}\n\n✅ Aprovar em:\nhttps://cenariox.com.br/admin/kyc\n\n⏱️ _Prometido em até 10 minutos_`

    // Mensagem de texto
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: msg, parse_mode: 'Markdown' })
    })

    // Foto do documento
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, photo: docUrl, caption: `📄 Documento - ${name}` })
    }).catch(() => {})

    // Selfie
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, photo: selfieUrl, caption: `🤳 Selfie - ${name}` })
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
