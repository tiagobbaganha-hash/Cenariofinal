import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VERIFF_API_KEY = process.env.VERIFF_API_KEY
const VERIFF_BASE_URL = 'https://api.veriff.com'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    if (!VERIFF_API_KEY) {
      throw new Error('VERIFF_API_KEY não configurada')
    }

    const sessionId = params.sessionId

    // Buscar status da sessão Veriff
    const response = await fetch(`${VERIFF_BASE_URL}/v1/sessions/${sessionId}/decision`, {
      method: 'GET',
      headers: {
        'X-AUTH-CLIENT': VERIFF_API_KEY,
      },
    })

    if (!response.ok) {
      // Se retornar 404, a decisão ainda não está disponível
      if (response.status === 404) {
        return NextResponse.json({
          id: sessionId,
          status: 'pending',
        })
      }
      throw new Error(`Veriff API error: ${response.statusText}`)
    }

    const decision = await response.json()

    return NextResponse.json({
      id: decision.id,
      status: decision.verification.status,
      declineReason: decision.verification.declineReason,
      reasonCode: decision.verification.reasonCode,
    })
  } catch (error: any) {
    console.error('[GET /api/kyc/veriff/status/[sessionId]]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
