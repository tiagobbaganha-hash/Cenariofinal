# Guia de Deployment — CenarioX

## Pré-requisitos

1. **Conta Vercel** — Para deploy de frontend
2. **Projeto Supabase** — Banco de dados PostgreSQL
3. **Domínios** — cenariox.com.br (main), api.cenariox.com.br (backend)
4. **SSL/TLS** — Certificados configurados
5. **Variáveis de Ambiente** — Todas as chaves de integração

## Arquitetura de Deployment

```
┌─────────────────────────────────────────┐
│            USUÁRIOS                     │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    Browser      Mobile      API Clients
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────▼────────────┐
        │   VERCEL EDGE (CDN)     │
        │  cenariox.com.br        │
        │                         │
        │  • Next.js SSR          │
        │  • Edge Functions       │
        │  • Static Assets        │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   AWS (São Paulo)       │
        │                         │
        │  • RDS Postgres         │
        │  • Application Layer    │
        │  • Background Jobs      │
        └─────────────────────────┘
```

## Passo 1: Setup Supabase para Produção

### 1.1 Criar Projeto Production

```bash
# No console Supabase:
1. New Project
2. Name: "CenarioX Production"
3. Password: [gerar chave segura]
4. Region: São Paulo (sa-east-1)
5. Pricing: Pro ($25/mês)
```

### 1.2 Executar Migrations

No SQL Editor do Supabase, execute em ordem:

```sql
-- 1. RBAC + Ledger
scripts/01-rbac-and-ledger.sql

-- 2. Market Tables
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR,
  status VARCHAR DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  opens_at TIMESTAMP,
  closes_at TIMESTAMP,
  resolves_at TIMESTAMP,
  resolution_source TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "markets_readable" ON markets
  FOR SELECT USING (true);

CREATE POLICY "markets_admin_only" ON markets
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

### 1.3 Configurar Backups

```
Settings → Backups → Enable automated backups (daily)
```

## Passo 2: Configurar Vercel

### 2.1 Importar Repositório

```bash
1. Vercel Dashboard → New Project
2. Import Git Repository → selecionar Cenariofinal
3. Framework Preset: Next.js
4. Root Directory: ./
```

### 2.2 Variáveis de Ambiente (Production)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Auth
NEXTAUTH_SECRET=gerar-com-openssl-rand-base64-32
NEXTAUTH_URL=https://cenariox.com.br

# Veriff (KYC)
VERIFF_API_KEY=sua-chave-veriff
VERIFF_WEBHOOK_SECRET=seu-webhook-secret-veriff

# PSP (Pagamentos Pix)
PSP_API_KEY=sua-chave-psp-producao
PSP_WEBHOOK_SECRET=seu-webhook-secret-psp
PSP_ENDPOINT=https://api.psp.com.br

# Filas e Cache
UPSTASH_REDIS_URL=sua-url-redis
UPSTASH_REDIS_TOKEN=seu-token-redis

# Feature Flags
NEXT_PUBLIC_ENABLE_KYC=true
NEXT_PUBLIC_ENABLE_CRYPTO=false
```

### 2.3 Domínios e DNS

```
1. Vercel → Settings → Domains
2. Adicionar: cenariox.com.br
3. Copiar CNAME records
4. Configurar no seu DNS provider

DNS Records:
- cenariox.com.br CNAME cname.vercel-dns.com
- www.cenariox.com.br CNAME cname.vercel-dns.com
```

### 2.4 Deploy Inicial

```bash
# Vercel detecta novo push e faz deploy automático
git push origin main

# Ou via CLI
vercel --prod
```

## Passo 3: Configurar Integrações de Terceiros

### 3.1 Veriff (KYC)

```
1. Criar conta em veriff.com
2. Obter API key
3. Configurar webhook: https://cenariox.com.br/api/webhooks/veriff
4. Testar no sandbox primeiro
```

### 3.2 PSP (Pix)

Exemplo com Pagar.me:

```
1. Dashboard Pagar.me → API Keys
2. Copiar API Key e Secret
3. Configurar webhook: https://cenariox.com.br/api/webhooks/pix
4. Habilitar eventos: payment.completed, payment.failed
```

### 3.3 Redis (Upstash)

```
1. Dashboard Upstash → Create Database
2. Region: São Paulo
3. Copiar connection string
4. Testar conexão
```

## Passo 4: Monitoramento e Logging

### 4.1 Vercel Analytics

```
Settings → Analytics → Enable
Visualizar em: Vercel Dashboard → Analytics
```

### 4.2 Supabase Logs

```
Supabase Console → Logs
- API calls
- Database queries
- Auth events
```

### 4.3 Error Tracking (Sentry)

```
1. Criar conta em sentry.io
2. Criar projeto Next.js
3. Obter DSN
4. Instalar: npm install @sentry/nextjs
5. Configurar in next.config.js

# next.config.js
const withSentry = require('@sentry/nextjs/withSentryConfig')

module.exports = withSentry({
  // config
}, {
  org: "seu-org",
  project: "seu-projeto",
  authToken: process.env.SENTRY_AUTH_TOKEN,
})
```

## Passo 5: Performance e Otimização

### 5.1 Vercel Edge Functions

Usar para reduzir latência:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // Executar no edge (mais rápido)
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
```

### 5.2 Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/market-image.jpg"
  alt="Market"
  width={400}
  height={300}
  priority
/>
```

### 5.3 Database Query Optimization

```sql
-- Adicionar indexes
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_ledger_user_id ON ledger_entries(user_id);
```

## Passo 6: Segurança

### 6.1 CORS e Headers

```typescript
// lib/security/headers.ts
export const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
]
```

### 6.2 Rate Limiting

```typescript
// lib/security/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
})

export async function checkRateLimit(ip: string) {
  const { success } = await ratelimit.limit(ip)
  return success
}
```

### 6.3 Secrets Management

```
# NÃO commitar .env.local
# Usar Vercel Secrets:
vercel env pull

# Ou 1Password / AWS Secrets Manager
```

## Passo 7: Testes de Produção

### 7.1 Health Check

```bash
curl https://cenariox.com.br/api/health
# Expected: { "status": "ok" }
```

### 7.2 Smoke Tests

```bash
npm run test:smoke
```

### 7.3 Load Testing

```bash
npm install -g artillery

artillery quick --count 100 --num 10 https://cenariox.com.br
```

## Rollback Plan

Se algo der errado:

```bash
# 1. Vercel tem histórico de deploys
#    Settings → Deployments → clique no deploy anterior → Redeploy

# 2. Database rollback (Supabase backups)
#    Settings → Backups → Restore to a point in time

# 3. Environment variables
#    Verificar se foram alteradas
```

## Checklist de Deploy

- [ ] Supabase migrations executadas
- [ ] Env vars configuradas no Vercel
- [ ] Domínio apontando para Vercel
- [ ] SSL/TLS ativo
- [ ] Veriff integrado
- [ ] PSP integrado
- [ ] Redis/Cache funcionando
- [ ] Sentry configurado
- [ ] Backups automáticos ativados
- [ ] Health check respondendo
- [ ] Testes de smoke passando
- [ ] Analytics ativado
- [ ] Rate limiting ativo
- [ ] CORS configurado
- [ ] Documentação atualizada

## Suporte

Para issues:
1. Verificar Vercel deployment logs
2. Verificar Supabase logs
3. Verificar Sentry errors
4. Abrir issue no GitHub
