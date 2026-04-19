import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { type Permission, hasPermission } from '@/lib/auth/rbac'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission: Permission
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (!hasPermission(user.role, requiredPermission)) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="mt-2 text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
