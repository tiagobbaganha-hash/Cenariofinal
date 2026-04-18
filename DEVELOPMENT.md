# Guia de Desenvolvimento — CenarioX

## Visão Geral da Arquitetura

### Camadas

```
┌─────────────────────────────────┐
│   Frontend (React Components)   │
├─────────────────────────────────┤
│   Next.js API Routes            │
├─────────────────────────────────┤
│   Business Logic (lib/)         │
├─────────────────────────────────┤
│   Supabase (Database + Auth)    │
└─────────────────────────────────┘
```

## Convenções de Código

### 1. Componentes React

**Use Client Components** para interatividade, **Server Components** para dados:

```typescript
// ✅ Bom: Busca no servidor, renderiza no cliente
async function getData() {
  const data = await supabase.from('markets').select()
  return data
}

export default async function Page() {
  const markets = await getData()
  return <ClientComponent markets={markets} />
}

// ❌ Evitar: useEffect para buscar dados
'use client'
export function Component() {
  useEffect(() => {
    fetch('/api/...')  // Desnecessário
  }, [])
}
```

### 2. API Routes

Estrutura padrão:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase.from('...').select()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### 3. Helpers (lib/)

Encapsular lógica de negócio:

```typescript
export async function doSomething(params: Params) {
  try {
    // Lógica aqui
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
```

### 4. Validação

Usar hooks de validação em tempo real:

```typescript
import { useFormValidation } from '@/hooks/useFormValidation'

export function Form() {
  const { values, errors, touch } = useFormValidation({
    initialValues: { email: '' },
    validations: {
      email: [
        { type: 'required' },
        { type: 'pattern', pattern: /.+@.+\..+/ }
      ]
    }
  })
}
```

## Implementando Novas Features

### Exemplo: Adicionar Nova Tabela de Dados

1. **Criar Migration SQL**:

```sql
-- scripts/02-new-feature.sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own records"
  ON new_table
  FOR SELECT
  USING (auth.uid() = user_id);
```

2. **Executar Migration**: Rodar SQL no Supabase Console

3. **Criar API Helper** (`lib/api/feature.ts`):

```typescript
export async function getFeatureData(userId: string) {
  const { data, error } = await supabase
    .from('new_table')
    .select('*')
    .eq('user_id', userId)

  if (error) throw error
  return data
}
```

4. **Criar Componente** (`components/Feature.tsx`):

```typescript
'use client'

import { getFeatureData } from '@/lib/api/feature'

export function Feature() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getFeatureData(userId).then(setData)
  }, [userId])

  return <div>{data}</div>
}
```

5. **Integrar Rota** (`app/(main)/feature/page.tsx`):

```typescript
import { Feature } from '@/components/Feature'

export default function FeaturePage() {
  return <Feature />
}
```

## Adicionando RBAC a Novas Rotas

### 1. Definir Permissão em `lib/auth/rbac.ts`:

```typescript
export const PERMISSIONS = {
  // ...existentes
  MANAGE_FEATURE: 'manage_feature',
}

export const ROLE_PERMISSIONS = {
  // ...existentes
  admin: [/* ..., */ PERMISSIONS.MANAGE_FEATURE],
}
```

### 2. Proteger Rota:

```typescript
'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PERMISSIONS } from '@/lib/auth/rbac'

export default function FeaturePage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.MANAGE_FEATURE}>
      <FeatureContent />
    </ProtectedRoute>
  )
}
```

## Integrando com Ledger

Para qualquer transação financeira:

```typescript
import { recordLedgerEntry } from '@/lib/finance/ledger'

export async function processPayment(userId: string, amount: number) {
  const { data, error } = await recordLedgerEntry(
    userId,
    'deposit',
    { credit: amount, debit: 0 },
    'payment',
    paymentId,
    { idempotency_key: `payment_${paymentId}` }
  )

  if (error) throw error
  return data
}
```

## Integrando com Audit Log

Para ações administrativas importantes:

```typescript
import { logAction } from '@/lib/audit/auditLog'

export async function adminAction(adminId: string, resourceId: string) {
  // ... fazer ação

  await logAction(adminId, 'update_market', 'market', resourceId, {
    before: oldData,
    after: newData
  })
}
```

## Testing

### Setup Jest

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Exemplo: Teste de Helper

```typescript
// lib/api/__tests__/wallet.test.ts
import { getUserBalance } from '../wallet'

jest.mock('@/lib/supabase')

describe('getUserBalance', () => {
  it('should return balance', async () => {
    const balance = await getUserBalance('user-123')
    expect(balance).toHaveProperty('balance')
    expect(balance?.balance).toBeGreaterThanOrEqual(0)
  })
})
```

## Debugging

### Console Logs Temporários

Usar padrão `[v0]` para identificar logs:

```typescript
console.log('[v0] User balance:', balance)
console.log('[v0] Error:', error)
```

### Inspecionar Estado

```typescript
'use client'

export function Debug({ value }: { value: any }) {
  return (
    <pre className="bg-muted p-2 rounded text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

// No componente
<Debug value={state} />
```

## Variáveis de Ambiente por Ambiente

### Desenvolvimento (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Staging (.env.staging)
```env
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Production (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_ENABLE_KYC=true
```

## Deployment

### 1. Vercel

```bash
vercel deploy
```

### 2. Executar Migrations em Produção

1. Backup do banco de dados
2. Executar SQL no Supabase Console (Production)
3. Testar em staging primeiro
4. Deploiar código

### 3. Monitoramento

- Vercel: Analytics, Logs, Performance
- Supabase: Database Logs, Auth Logs
- Integrar Sentry para error tracking

## Performance

### Otimizações Críticas

1. **Lazy Loading de Componentes**:
```typescript
const Admin = dynamic(() => import('@/components/Admin'), {
  loading: () => <Skeleton />
})
```

2. **Memoização**:
```typescript
const Component = memo(({ data }) => ...)
```

3. **SWR para Dados**:
```typescript
import useSWR from 'swr'

function useMarkets() {
  const { data } = useSWR('/api/markets', fetcher)
  return data
}
```

4. **Images**:
```typescript
import Image from 'next/image'

<Image src="/img.jpg" alt="..." width={200} height={200} />
```

## Recursos Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Contato & Issues

Dúvidas? Abra uma issue no repositório GitHub.
