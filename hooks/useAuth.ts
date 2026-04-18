import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { type UserRole, type Permission, ROLE_PERMISSIONS } from '@/lib/auth/rbac'

interface UserSession {
  id: string
  email: string
  role: UserRole
  permissions: Permission[]
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
          setUser(null)
          setLoading(false)
          return
        }

        // Buscar role do usuário na tabela de perfis
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        const role: UserRole = (profile?.role as UserRole) || 'user'
        const permissions = ROLE_PERMISSIONS[role] || []

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role,
          permissions,
        })
      } catch (error) {
        console.error('[useAuth] Error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async () => {
      await getUser()
    })

    return () => subscription?.unsubscribe()
  }, [])

  return { user, loading }
}
