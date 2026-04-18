import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const VERIFF_API_KEY = process.env.VERIFF_API_KEY
const VERIFF_BASE_URL = 'https://api.veriff.com'

export async function POST(request: NextRequest) {
  try {
    if (!VERIFF_API_KEY) {
      throw new Error('VERIFF_API_KEY não configurada')
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário para obter email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)

    if (!user?.email) {
      throw new Error('Usuário não encontrado')
    }

    // Criar sessão Veriff
    const response = await fetch(`${VERIFF_BASE_URL}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': VERIFF_API_KEY,
      },
      body: JSON.stringify({
        verification: {
          person: {
            givenName: 'User',
            lastName: user.email.split('@')[0],
          },
          document: {
            type: 'PASSPORT',
          },
          locale: 'pt_BR',
        },
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/kyc/verify`,
        notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/veriff`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Veriff API error: ${error}`)
    }

    const session = await response.json()

    return NextResponse.json({
      id: session.verification.id,
      url: session.verification.url,
      sessionToken: session.verification.sessionToken,
    })
  } catch (error: any) {
    console.error('[POST /api/kyc/veriff/start]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
