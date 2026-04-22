import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ApiResponse, User } from '@/lib/types/api'

const supabaseAdmin = createClient(
  'https://slxzmyiwcsjyahahkppe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/users - Lista todos os usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kycStatus = searchParams.get('kyc_status')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (kycStatus) {
      query = query.eq('kyc_status', kycStatus)
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json<ApiResponse>(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<User[]>>({ data })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json<ApiResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
