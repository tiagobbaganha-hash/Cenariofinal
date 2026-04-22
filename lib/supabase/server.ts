import { createClient as sb } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export function createClient() {
  return sb(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export function createAdminClient() {
  // Service key só existe no servidor — acesso seguro aqui
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
  return sb(SUPABASE_URL, serviceKey)
}
