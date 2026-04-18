import { supabase } from '@/lib/supabase'

export interface VeriffSession {
  id: string
  url: string
  sessionToken: string
}

export interface VeriffStatus {
  id: string
  status: 'pending' | 'approved' | 'declined' | 'resubmission_required' | 'expired'
  reasonCode?: string
  declineReason?: string
}

// Iniciar sessão Veriff
export async function startVeriffSession(userId: string) {
  try {
    // Chamada ao seu backend que chama Veriff API
    const response = await fetch('/api/kyc/veriff/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error('Erro ao iniciar sessão Veriff')
    }

    const data: VeriffSession = await response.json()
    
    // Salvar referência da sessão no banco
    await supabase
      .from('user_profiles')
      .update({ veriff_session_id: data.id })
      .eq('id', userId)

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

// Obter status de KYC de um usuário
export async function getKycStatus(userId: string): Promise<VeriffStatus | null> {
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_status, veriff_session_id')
      .eq('id', userId)
      .single()

    if (!profile) return null

    // Se não houver session_id, retornar status atual
    if (!profile.veriff_session_id) {
      return {
        id: userId,
        status: (profile.kyc_status as any) || 'pending',
      }
    }

    // Buscar status de Veriff se necessário
    const response = await fetch(`/api/kyc/veriff/status/${profile.veriff_session_id}`)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar status')
    }

    return await response.json()
  } catch (error) {
    console.error('[getKycStatus]', error)
    return null
  }
}

// Webhook handler para Veriff (deve ser implementado em /api/webhooks/veriff)
export async function handleVeriffWebhook(payload: any) {
  try {
    const { verification: { id: sessionId, status, declineReason } } = payload

    // Buscar usuário pela session_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('veriff_session_id', sessionId)
      .single()

    if (!profile) {
      throw new Error('Usuário não encontrado')
    }

    // Mapear status Veriff para status local
    const kycStatus = mapVeriffStatus(status)

    // Atualizar status
    const { error } = await supabase
      .from('user_profiles')
      .update({
        kyc_status: kycStatus,
        kyc_verified_at: kycStatus === 'approved' ? new Date().toISOString() : null,
        kyc_decline_reason: declineReason || null,
      })
      .eq('id', profile.id)

    if (error) throw error

    // Registrar no audit log
    await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: profile.id,
          action: `kyc_${status}`,
          resource_type: 'user',
          resource_id: profile.id,
        },
      ])

    return { success: true }
  } catch (error: any) {
    console.error('[handleVeriffWebhook]', error)
    return { success: false, error: error.message }
  }
}

function mapVeriffStatus(veriffStatus: string): string {
  switch (veriffStatus) {
    case 'approved':
      return 'approved'
    case 'declined':
      return 'rejected'
    case 'resubmission_required':
      return 'pending'
    case 'expired':
      return 'pending'
    default:
      return 'pending'
  }
}
