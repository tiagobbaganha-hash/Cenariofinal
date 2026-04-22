import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// Sem singleton — evita estado stale entre deploys
export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
