import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ApiResponse } from '@/lib/types/api'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DashboardStats {
  totalUsers: number
  activeMarkets: number
  totalVolume: number
  dailyBets: number
  pendingKyc: number
  pendingWithdrawals: number
}

// GET /api/admin/stats - Retorna estatisticas do dashboard
export async function GET() {
  try {
    // Parallel queries for better performance
    const [
      usersResult,
      marketsResult,
      pendingKycResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('markets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
    ])

    const stats: DashboardStats = {
      totalUsers: usersResult.count || 0,
      activeMarkets: marketsResult.count || 0,
      totalVolume: 0, // TODO: Calculate from ledger
      dailyBets: 0, // TODO: Calculate from orders
      pendingKyc: pendingKycResult.count || 0,
      pendingWithdrawals: 0, // TODO: Calculate from transactions
    }

    return NextResponse.json<ApiResponse<DashboardStats>>({ data: stats })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json<ApiResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
