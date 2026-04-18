export interface PixPayment {
  id: string
  userId: string
  amount: number
  type: 'deposit' | 'withdrawal'
  status: 'pending' | 'completed' | 'failed'
  pixKey?: string
  qrCode?: string
  txId?: string
  createdAt: string
  completedAt?: string
}

export interface PixQrCode {
  qrCode: string
  qrCodeUrl: string
  txId: string
  expiresIn: number
}

// PSP Mock - em produção, usar provider real (Stripe, Pagar.me, Asaas)
export async function generatePixQrCode(
  userId: string,
  amount: number
): Promise<{ data?: PixQrCode; error?: string }> {
  try {
    // Mock: gerar um QR code fictício
    const txId = `cenariox_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const mockQrCode = `00020126580014br.gov.bcb.pix0136${txId}5204000053039865802BR5913CENARIOX6009SAO PAULO62360532${amount.toString().padStart(10, '0')}63041D3D`

    return {
      data: {
        qrCode: mockQrCode,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mockQrCode)}`,
        txId,
        expiresIn: 600, // 10 minutos
      },
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Processar depósito via Pix
export async function processPixDeposit(
  userId: string,
  amount: number,
  pixQrCodeTxId: string
) {
  try {
    // Validar montante
    if (amount <= 0) {
      throw new Error('Valor deve ser maior que zero')
    }

    if (amount > 50000) {
      throw new Error('Limite máximo de R$ 50.000 por transação')
    }

    // Chamar API de confirmação do PSP
    const response = await fetch('/api/payments/pix/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount,
        txId: pixQrCodeTxId,
        type: 'deposit',
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao processar pagamento')
    }

    return await response.json()
  } catch (error: any) {
    return { error: error.message }
  }
}

// Processar saque via Pix
export async function processPixWithdrawal(
  userId: string,
  amount: number,
  pixKey: string // CPF, Email ou Chave aleatória
) {
  try {
    // Validar montante
    if (amount <= 0) {
      throw new Error('Valor deve ser maior que zero')
    }

    if (amount > 50000) {
      throw new Error('Limite máximo de R$ 50.000 por transação')
    }

    // Validar chave Pix (simulado)
    if (!pixKey || pixKey.length < 3) {
      throw new Error('Chave Pix inválida')
    }

    // Chamar API de saque
    const response = await fetch('/api/payments/pix/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount,
        pixKey,
      }),
    })

    if (!response.ok) {
      throw new Error('Erro ao processar saque')
    }

    return await response.json()
  } catch (error: any) {
    return { error: error.message }
  }
}

// Obter histórico de transações Pix
export async function getPixTransactionHistory(userId: string, limit = 20) {
  try {
    const response = await fetch(
      `/api/payments/pix/history?limit=${limit}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar histórico')
    }

    return await response.json()
  } catch (error: any) {
    return { error: error.message, data: [] }
  }
}

// Webhooks para confirmação de pagamento (PSP → Backend)
export async function handlePixWebhook(payload: any) {
  try {
    const { id, status, amount, userId, type } = payload

    // Validar webhook (adicionar validação de signature)
    if (!id || !status || !userId) {
      throw new Error('Payload inválido')
    }

    // Processar confirmação de pagamento
    const response = await fetch('/api/webhooks/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, amount, userId, type }),
    })

    if (!response.ok) {
      throw new Error('Erro ao processar webhook')
    }

    return { success: true }
  } catch (error: any) {
    console.error('[handlePixWebhook]', error)
    return { success: false, error: error.message }
  }
}
