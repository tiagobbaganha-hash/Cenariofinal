import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Valores hardcoded como fallback para garantir funcionamento independente das env vars da Vercel
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://slxzmyiwcsjyahahkppe.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'

let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (client) return client
  client = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY)
  return client
}
