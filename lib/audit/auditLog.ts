import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type AuditResourceType = 
  | 'market' 
  | 'user' 
  | 'order' 
  | 'user_profile' 
  | 'settings'

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: AuditResourceType
  resource_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Registrar ação no audit log
export async function recordAuditLog(params: {
  userId: string
  action: string
  resourceType: AuditResourceType
  resourceId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: params.userId,
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          changes: params.changes,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        },
      ])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error: any) {
    console.error('[recordAuditLog]', error)
    return { data: null, error: error.message }
  }
}

// Obter audit logs por usuário
export async function getAuditLogsByUser(
  userId: string,
  limit = 50
): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[getAuditLogsByUser]', error)
    return []
  }
}

// Obter audit logs por recurso
export async function getAuditLogsByResource(
  resourceType: AuditResourceType,
  resourceId: string,
  limit = 50
): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[getAuditLogsByResource]', error)
    return []
  }
}

// Obter todos os audit logs (apenas para admins)
export async function getAllAuditLogs(limit = 100): Promise<AuditLog[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[getAllAuditLogs]', error)
    return []
  }
}

// Helpers de audit para ações comuns
export async function auditMarketCreate(
  userId: string,
  marketId: string,
  marketData: Record<string, any>
) {
  return recordAuditLog({
    userId,
    action: 'create_market',
    resourceType: 'market',
    resourceId: marketId,
    changes: { created: marketData },
  })
}

export async function auditMarketUpdate(
  userId: string,
  marketId: string,
  changes: Record<string, any>
) {
  return recordAuditLog({
    userId,
    action: 'update_market',
    resourceType: 'market',
    resourceId: marketId,
    changes,
  })
}

export async function auditMarketDelete(
  userId: string,
  marketId: string
) {
  return recordAuditLog({
    userId,
    action: 'delete_market',
    resourceType: 'market',
    resourceId: marketId,
  })
}

export async function auditUserUpdate(
  userId: string,
  targetUserId: string,
  changes: Record<string, any>
) {
  return recordAuditLog({
    userId,
    action: 'update_user',
    resourceType: 'user',
    resourceId: targetUserId,
    changes,
  })
}

export async function auditKycApproval(
  userId: string,
  targetUserId: string,
  approved: boolean
) {
  return recordAuditLog({
    userId,
    action: approved ? 'approve_kyc' : 'reject_kyc',
    resourceType: 'user',
    resourceId: targetUserId,
  })
}
