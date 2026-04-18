import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default async function RootPage() {
  try {
    // Tentar obter sessão atual
    const { data: { session } } = await supabase.auth.getSession()

    // Se usuário está logado, redirecionar para home
    if (session?.user) {
      redirect('/wallet')
    }

    // Caso contrário, ir para login
    redirect('/login')
  } catch (error) {
    // Em caso de erro, redirecionar para login
    redirect('/login')
  }
}
