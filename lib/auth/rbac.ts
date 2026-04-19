// Definições de Roles e Permissões
export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin'

export type Permission = 
  | 'view_dashboard'
  | 'manage_markets'
  | 'manage_users'
  | 'manage_finance'
  | 'manage_settings'
  | 'approve_kyc'
  | 'manage_roles'
  | 'view_audit_logs'
  | 'manage_content'

// Mapeamento de roles para permissões
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'view_dashboard',
  ],
  moderator: [
    'view_dashboard',
    'manage_markets',
    'approve_kyc',
    'view_audit_logs',
  ],
  admin: [
    'view_dashboard',
    'manage_markets',
    'manage_users',
    'manage_finance',
    'manage_settings',
    'approve_kyc',
    'view_audit_logs',
    'manage_content',
  ],
  super_admin: [
    'view_dashboard',
    'manage_markets',
    'manage_users',
    'manage_finance',
    'manage_settings',
    'approve_kyc',
    'manage_roles',
    'view_audit_logs',
    'manage_content',
  ],
}

// Estrutura de usuário com role
export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  permissions: Permission[]
  created_at: string
}

// Verificar se um usuário tem uma permissão
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// Verificar se um usuário tem qualquer uma das permissões
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

// Verificar se um usuário tem todas as permissões
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

// Obter todas as permissões de um role
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

// Verificar se um role tem acesso a admin (qualquer permissão admin)
export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

// Verificar se é super admin
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin'
}
