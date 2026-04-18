import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resolveMarket } from '@/lib/trading/resolution'

export async function POST(req: NextRequest) {
  try {
    const { market_id, winning_option_id } = await req.json()

    if (!market_id || !winning_option_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verificar autenticação e role de admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Verificar role do usuário

    const result = await resolveMarket(market_id, winning_option_id, session.user.id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[POST /api/admin/markets/resolve]', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
