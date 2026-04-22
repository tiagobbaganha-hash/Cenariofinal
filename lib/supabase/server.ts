import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from './config'

export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}
