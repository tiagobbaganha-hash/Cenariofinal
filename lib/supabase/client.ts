import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://slxzmyiwcsjyahahkppe.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseHpteWl3Y3NqeWFoYWhrcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjExOTMsImV4cCI6MjA4NjczNzE5M30.S_r0W7rJ-KapNXO-Lkb_ggL6jUob0fUeR9nuwZH3Bn4'

// Singleton — padrão recomendado pelo Supabase para browser
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!client) {
    client = createSupabaseClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    })
  }
  return client
}
