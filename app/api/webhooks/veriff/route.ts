import { NextRequest, NextResponse } from 'next/server'
import { handleVeriffWebhook } from '@/lib/kyc/veriff'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Validar assinatura do webhook (implementar no futuro com Veriff signature)
    // Por enquanto, apenas processar o payload

    const result = await handleVeriffWebhook(payload)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[POST /api/webhooks/veriff]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
