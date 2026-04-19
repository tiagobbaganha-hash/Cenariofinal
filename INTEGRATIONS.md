# Guia de Integrações — CenarioX

## Visão Geral

Este documento detalha como integrar serviços externos necessários para a plataforma funcionar completamente em produção.

## 1. Veriff (KYC)

### Configuração

1. Criar conta em https://www.veriff.com
2. Gerar API Key em Dashboard → Settings → API Keys
3. Adicionar ao `.env.local`:

```env
VERIFF_API_KEY=seu-api-key
VERIFF_WEBHOOK_SECRET=seu-webhook-secret
```

### Implementação

A integração já está pronta em `lib/kyc/veriff.ts`:

```typescript
import { createVeriffSession, handleVeriffWebhook } from '@/lib/kyc/veriff'

// Iniciar verificação
const session = await createVeriffSession(userId, userData)

// Receber webhook
app.post('/api/webhooks/veriff', async (req, res) => {
  const result = await handleVeriffWebhook(req.body)
  // Atualizar status KYC do usuário
})
```

### Testes

```bash
# Usar sandbox de Veriff
VERIFF_API_KEY=sandbox-key
```

## 2. Pagamentos - PSP (Pagar.me ou Stripe)

### Opção A: Pagar.me (Recomendado para Brasil)

1. Criar conta em https://pagar.me
2. Obter API Key em Configurações
3. Adicionar ao `.env.local`:

```env
PSP_PROVIDER=pagarme
PSP_API_KEY=seu-api-key
PSP_WEBHOOK_SECRET=seu-webhook-secret
```

### Opção B: Stripe

1. Criar conta em https://stripe.com
2. Obter Secret Key em Dashboard
3. Adicionar ao `.env.local`:

```env
PSP_PROVIDER=stripe
PSP_API_KEY=sk_live_...
PSP_WEBHOOK_SECRET=whsec_...
```

### Implementação

Adapter pattern em `lib/payments/psp.ts`:

```typescript
export interface PSPAdapter {
  generatePixQrCode(amount: number): Promise<string>
  confirmPayment(transactionId: string): Promise<boolean>
  refund(transactionId: string): Promise<void>
}

export class PagarmeAdapter implements PSPAdapter {
  async generatePixQrCode(amount: number) {
    // Implementação específica do Pagar.me
  }
}

// Usar adaptador
const psp = getPspAdapter(process.env.PSP_PROVIDER)
const qrCode = await psp.generatePixQrCode(100)
```

### Webhook

```typescript
export async function POST(request: Request) {
  const body = await request.json()
  
  // Verificar assinatura
  if (!verifyWebhookSignature(body, process.env.PSP_WEBHOOK_SECRET)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Processar pagamento confirmado
  await recordLedgerEntry(userId, 'deposit', { credit: amount })
  
  return new Response('OK')
}
```

## 3. Autenticação Social (OAuth)

### Google OAuth

1. Ir para https://console.cloud.google.com
2. Criar novo projeto
3. Habilitar Google+ API
4. Criar Credenciais → OAuth 2.0 Client ID
5. Adicionar ao `.env.local`:

```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
```

### Apple Sign In

1. Ir para https://developer.apple.com
2. Criar App ID
3. Habilitar "Sign in with Apple"
4. Gerar certificados
5. Adicionar ao `.env.local`:

```env
APPLE_CLIENT_ID=seu-bundle-id
APPLE_TEAM_ID=seu-team-id
APPLE_KEY_ID=seu-key-id
APPLE_PRIVATE_KEY=sua-private-key
```

### Integração em Supabase Auth

No Supabase Console:
1. Auth → Providers
2. Ativar Google/Apple
3. Adicionar Client ID e Secret
4. Salvar

## 4. Email (Transacional)

### SendGrid

1. Criar conta em https://sendgrid.com
2. Gerar API Key
3. Adicionar ao `.env.local`:

```env
SENDGRID_API_KEY=seu-api-key
SENDGRID_FROM_EMAIL=noreply@cenariox.com
```

### Uso

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

await sgMail.send({
  to: userEmail,
  from: process.env.SENDGRID_FROM_EMAIL!,
  subject: 'Seu saque foi processado',
  html: '<p>R$ 100.00 em caminho...</p>'
})
```

## 5. SMS (OTP)

### Twilio

1. Criar conta em https://www.twilio.com
2. Gerar Account SID e Auth Token
3. Adicionar números de telefone
4. Adicionar ao `.env.local`:

```env
TWILIO_ACCOUNT_SID=seu-sid
TWILIO_AUTH_TOKEN=seu-token
TWILIO_PHONE_NUMBER=+5511999999999
```

### Uso

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

await client.messages.create({
  body: `Seu código: ${otp}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: userPhone
})
```

## 6. Analytics

### PostHog

1. Criar conta em https://posthog.com
2. Copiar API Key
3. Adicionar ao `.env.local`:

```env
NEXT_PUBLIC_POSTHOG_KEY=seu-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Uso

```typescript
import { usePostHog } from 'posthog-js/react'

export function Component() {
  const posthog = usePostHog()

  const handleBet = () => {
    posthog.capture('bet_placed', {
      market_id: '123',
      amount: 100,
      option: 'yes'
    })
  }
}
```

## 7. Error Tracking

### Sentry

1. Criar conta em https://sentry.io
2. Criar projeto Next.js
3. Copiar DSN
4. Adicionar ao `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=seu-dsn
SENTRY_ORG=sua-org
SENTRY_PROJECT=seu-projeto
SENTRY_AUTH_TOKEN=seu-token
```

### Uso

Automático em production - erros são capturados automaticamente.

```typescript
import * as Sentry from "@sentry/nextjs"

try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error)
}
```

## 8. Cache (Redis)

### Upstash

1. Criar conta em https://upstash.com
2. Criar banco Redis
3. Copiar URL
4. Adicionar ao `.env.local`:

```env
REDIS_URL=redis://default:password@host:port
```

### Uso

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!
})

// Cache de saldo
const cacheKey = `balance:${userId}`
const cached = await redis.get(cacheKey)
if (cached) return cached

const balance = await calculateBalance(userId)
await redis.setex(cacheKey, 3600, balance) // 1 hora
return balance
```

## 9. Documentação API

### Swagger/OpenAPI

```typescript
// pages/api/swagger.json
import { generateOpenApi } from 'next-swagger-doc'

export default generateOpenApi({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CenarioX API',
      version: '1.0.0'
    },
    paths: {
      '/api/markets': {
        get: {
          summary: 'Listar mercados'
        }
      }
    }
  },
  apiFolder: 'app/api'
})
```

Acessar em `/api-docs` via Swagger UI.

## 10. Monitoramento

### Vercel Analytics

Automático - não requer setup. Verificar em Vercel Dashboard.

### Supabase Logs

1. Ir para Supabase Console
2. Logs → Database Logs / Auth Logs
3. Verificar queries lentas em Query Performance

## Checklist de Segurança antes de Produção

- [ ] Todas as chaves de API em `.env.local` (não em código)
- [ ] CORS configurado corretamente
- [ ] Rate limiting em APIs públicas
- [ ] Validação de entrada em todos endpoints
- [ ] RLS ativado em todas tabelas
- [ ] Backups automáticos do banco de dados
- [ ] HTTPS ativado
- [ ] Cookies HTTP-only para sessões
- [ ] Senhas hasheadas com bcrypt
- [ ] Audit logs em todas operações críticas

## Troubleshooting Integrações

### Veriff não funciona
- Verificar `VERIFF_API_KEY` e `VERIFF_WEBHOOK_SECRET`
- Confirmar que webhook URL está registrado em Veriff Console
- Verificar logs em `/api/webhooks/veriff`

### Pagamentos falhando
- Verificar `PSP_API_KEY` e modo (sandbox vs live)
- Confirmar que chave Pix está correta
- Testar com valores pequenos primeiro

### Email não chega
- Verificar domínio em SendGrid (DNS records)
- Testar com endereço de teste
- Verificar spam folder

### SMS não chega
- Verificar número de telefone (incluir +55)
- Confirmar créditos Twilio
- Testar com número próprio

## Referências

- Veriff: https://developers.veriff.com
- Pagar.me: https://docs.pagar.me
- Stripe: https://stripe.com/docs
- SendGrid: https://docs.sendgrid.com
- Twilio: https://www.twilio.com/docs
- PostHog: https://posthog.com/docs
- Sentry: https://docs.sentry.io
