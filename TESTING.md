# Guia de Testes — CenarioX

## Setup de Testes

### Instalação de Dependências

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev @vitest/ui happy-dom
```

### Configuração (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

## Testes Unitários

### Exemplo: Ledger

```typescript
// lib/finance/__tests__/ledger.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateBalance,
  validateLedgerEntry,
  calculateDailyVolume,
} from '../ledger'

describe('Ledger', () => {
  it('calcula saldo corretamente', () => {
    const entries = [
      { debit: 100, credit: 0 },
      { debit: 0, credit: 50 },
      { debit: 25, credit: 0 },
    ]
    
    const balance = calculateBalance(entries)
    expect(balance).toBe(-75) // -100 + 50 - 25
  })

  it('valida entrada ledger', () => {
    const valid = validateLedgerEntry({
      user_id: '123',
      entry_type: 'deposit',
      credit: 100,
      debit: 0,
    })
    
    expect(valid).toBe(true)
  })

  it('rejeita debit sem saldo', () => {
    const entries = [{ debit: 100, credit: 0 }]
    const valid = validateLedgerEntry({
      user_id: '123',
      entry_type: 'withdrawal',
      debit: 150,
      credit: 0,
    }, entries)
    
    expect(valid).toBe(false)
  })
})
```

### Exemplo: Risk Limits

```typescript
// lib/compliance/__tests__/riskLimits.test.ts
import { describe, it, expect } from 'vitest'
import { checkDepositLimit, RiskLevel } from '../riskLimits'

describe('Risk Limits', () => {
  it('permite depósito para KYC aprovado', async () => {
    const result = await checkDepositLimit(
      'user-123',
      'approved',
      5000 // R$5.000
    )
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(5000)
  })

  it('bloqueia depósito acima do limite', async () => {
    const result = await checkDepositLimit(
      'user-123',
      'pending',
      1000 // R$1.000 mas limite é R$500
    )
    
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('excede o limite')
  })
})
```

## Testes de Componentes

### Exemplo: Button Component

```typescript
// components/ui/__tests__/button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renderiza com texto', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('dispara onClick', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('desabilita quando disabled', () => {
    render(<Button disabled>Click</Button>)
    
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Exemplo: Toast Notification

```typescript
// components/ui/__tests__/toast.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Toast } from '../toast'

describe('Toast', () => {
  it('renderiza mensagem', () => {
    render(
      <Toast type="success" message="Sucesso!" />
    )
    
    expect(screen.getByText('Sucesso!')).toBeInTheDocument()
  })

  it('desaparece após timeout', async () => {
    const { unmount } = render(
      <Toast type="success" message="Sucesso!" duration={1000} />
    )
    
    await waitFor(
      () => expect(screen.queryByText('Sucesso!')).not.toBeInTheDocument(),
      { timeout: 1500 }
    )
  })
})
```

## Testes de Integração

### Exemplo: Market Creation Flow

```typescript
// __tests__/integration/market-creation.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Market Creation Flow', () => {
  let marketId: string

  beforeEach(async () => {
    // Setup: login como admin
    await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'password123',
    })
  })

  it('cria mercado com opções', async () => {
    const { data, error } = await supabase
      .from('markets')
      .insert({
        title: 'Test Market',
        slug: 'test-market',
        category: 'test',
        status: 'draft',
      })
      .select()

    expect(error).toBeNull()
    expect(data?.[0].id).toBeDefined()
    marketId = data?.[0].id
  })

  it('publica mercado e abre apostas', async () => {
    const { data, error } = await supabase
      .from('markets')
      .update({ status: 'open' })
      .eq('id', marketId)
      .select()

    expect(error).toBeNull()
    expect(data?.[0].status).toBe('open')
  })

  afterEach(async () => {
    // Cleanup
    await supabase.from('markets').delete().eq('id', marketId)
  })
})
```

## Testes de API

### Exemplo: POST /api/admin/markets

```typescript
// __tests__/api/markets.test.ts
import { describe, it, expect } from 'vitest'

describe('POST /api/admin/markets', () => {
  it('cria novo mercado', async () => {
    const response = await fetch('http://localhost:3000/api/admin/markets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        title: 'Nova Eleição',
        slug: 'eleicao-2026',
        category: 'politica',
        closes_at: '2026-10-01T23:59:59Z',
      }),
    })

    expect(response.status).toBe(201)
    
    const data = await response.json()
    expect(data.id).toBeDefined()
    expect(data.title).toBe('Nova Eleição')
  })

  it('rejeita sem autenticação', async () => {
    const response = await fetch('http://localhost:3000/api/admin/markets', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    })

    expect(response.status).toBe(401)
  })

  it('valida campos obrigatórios', async () => {
    const response = await fetch('http://localhost:3000/api/admin/markets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({}),
    })

    expect(response.status).toBe(400)
  })
})
```

## Testes E2E

### Usando Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('signup e login', async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/login')

    // Switch to signup
    await page.click('text=Criar conta')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit
    await page.click('button:has-text("Criar Conta")')
    
    // Should redirect to home
    await expect(page).toHaveURL('http://localhost:3000/')
    
    // Should show user email
    await expect(page.locator('text=test@example.com')).toBeVisible()
  })

  test('fazer aposta', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Entrar")')

    // Navigate to market
    await page.goto('http://localhost:3000/market/1')

    // Place bet
    await page.fill('input[placeholder="Quantidade"]', '100')
    await page.click('button:has-text("Apostar")')

    // Should show success toast
    await expect(page.locator('text=Aposta registrada')).toBeVisible()
  })
})
```

## Testes de Performance

### Lighthouse CI

```bash
npm install -g @lhci/cli@latest
lhci autorun
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

## Executar Testes

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Lighthouse
npm run test:lighthouse

# Todos os testes
npm run test:all
```

## Cobertura de Testes

Meta: **80%+ de cobertura**

```bash
npm run test:coverage

# Visualizar coverage report
open coverage/index.html
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run test:coverage

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
```

## Checklist de Testes

- [ ] Unit tests para lógica crítica (ledger, risk limits, matching)
- [ ] Component tests para componentes principais
- [ ] Integration tests para fluxos críticos
- [ ] E2E tests para user journeys principais
- [ ] Performance tests (Lighthouse)
- [ ] Security tests (penetration testing)
- [ ] Load tests (capacidade)
- [ ] Cobertura acima de 80%
- [ ] CI/CD rodando automaticamente
- [ ] Documentação de testes atualizada
