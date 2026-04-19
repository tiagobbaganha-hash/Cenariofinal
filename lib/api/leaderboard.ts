'use server'

import { createClient } from '@/lib/supabase/server'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url?: string
  total_profit: number
  win_rate: number
  total_bets: number
  total_volume: number
}

// Buscar leaderboard (usando view v_front_leaderboard_v1)
export async function getLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('v_front_leaderboard_v1')
    .select('*')
    .order('total_profit', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('[getLeaderboard] Error:', error)
    return []
  }
  
  return (data || []).map((entry: any, index: number) => ({
    rank: index + 1,
    user_id: entry.user_id,
    username: entry.username || entry.display_name || `Usuario ${index + 1}`,
    avatar_url: entry.avatar_url,
    total_profit: parseFloat(entry.total_profit || '0'),
    win_rate: parseFloat(entry.win_rate || '0'),
    total_bets: entry.total_bets || 0,
    total_volume: parseFloat(entry.total_volume || '0'),
  }))
}

// Buscar posicao do usuario atual no leaderboard
export async function getUserRank(userId: string): Promise<number | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('v_front_leaderboard_v1')
    .select('user_id')
    .order('total_profit', { ascending: false })
  
  if (error || !data) return null
  
  const index = data.findIndex((entry: any) => entry.user_id === userId)
  return index >= 0 ? index + 1 : null
}
