# CenarioX — Plataforma de Mercados Preditivos

Uma plataforma moderna de mercados preditivos com suporte a depósitos/saques via Pix, KYC via Veriff, e controle de riscos baseado em conformidade.

## Visão Geral

CenarioX permite que usuários:
- Criem e participem de mercados preditivos sobre eventos do mundo real
- Façam apostas usando Pix para depositar fundos
- Completem verificação de identidade (KYC) com Veriff
- Visualizem saldo, histórico de transações e limites de risco
- Administrem a plataforma com dashboard completo

## Stack Tecnológico

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Banco de Dados**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth
- **KYC**: Veriff
- **Pagamentos**: Pix (PSP mock, integração real pendente)
- **Deployment**: Vercel

## Setup Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/tiagobbaganha-hash/Cenariofinal.git
cd Cenariofinal
```

### 2. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Auth
NEXTAUTH_SECRET=sua-chave-secreta-aleatoria
NEXTAUTH_URL=http://localhost:3000

# Veriff (KYC)
VERIFF_API_KEY=sua-chave-veriff
VERIFF_WEBHOOK_SECRET=seu-webhook-secret

# PSP (Pagamentos) - Mock por enquanto
PSP_API_KEY=psp-mock-key
PSP_WEBHOOK_SECRET=psp-webhook-secret

# Feature Flags
NEXT_PUBLIC_ENABLE_KYC=true
NEXT_PUBLIC_ENABLE_CRYPTO=false
```

### 4. Executar Migrations do Banco de Dados

No Supabase Console, execute o SQL de `scripts/01-rbac-and-ledger.sql`:

1. Vá para SQL Editor no console Supabase
2. Cole o conteúdo do arquivo
3. Clique em "Run"

### 5. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

## Estrutura de Pastas

```
app/
├── (auth)/                 # Rotas públicas (login, signup)
├── (main)/                 # Rotas autenticadas (mercados, wallet)
├── admin/                  # Admin panel
├── api/                    # API routes
│   ├── auth/
│   ├── kyc/
│   ├── payments/
│   └── webhooks/
└── layout.tsx

components/
├── ui/                     # Componentes base (Button, Card, etc)
├── admin/                  # Admin panel components
├── auth/                   # Auth components
├── kyc/                    # KYC components
├── market/                 # Market components
└── payments/               # Payment components

lib/
├── api/                    # API helpers (admin, wallet)
├── audit/                  # Audit logging
├── auth/                   # Auth helpers (RBAC)
├── compliance/             # Risk limits
├── finance/                # Ledger system
├── kyc/                    # Veriff integration
├── payments/               # PSP integration
├── supabase.ts             # Supabase client
└── utils.ts                # Utilities

scripts/
└── 01-rbac-and-ledger.sql  # Migration SQL

public/                     # Arquivos estáticos
```

## Recursos Implementados

### Fase 1: MVP UI + API Mock
- ✅ Admin Panel com Dashboard, Mercados, Usuários, Finanças
- ✅ Design System com tokens semânticos
- ✅ Componentes UI base reutilizáveis
- ✅ Validação em tempo real nos formulários
- ✅ Página de Settings do Admin

### Fase 2: Pronto para Produção
- ✅ Sistema RBAC (4 roles, 9 permissões)
- ✅ Ledger (double-entry accounting)
- ✅ KYC Veriff (UI + webhooks)
- ✅ Pagamentos Pix (PSP mock)
- ✅ Audit Log completo
- ✅ Risk Limits por nível KYC

### Fase 3: Experiência do Usuário
- ✅ Página de Wallet com saldo
- ✅ Depósito/Saque via Pix
- ✅ Validação de Risk Limits em apostas
- ✅ Histórico de transações
- ✅ Home page melhorada

## Rotas Principais

### Públicas
- `/` — Home com mercados em destaque
- `/(auth)/login` — Login/Sign up

### Autenticadas
- `/wallet` — Saldo e carteira
- `/wallet/deposit` — Depositar
- `/wallet/withdraw` — Sacar
- `/transactions` — Histórico
- `/market/[id]` — Detalhe do mercado

### Admin (requer role admin+)
- `/admin` — Dashboard
- `/admin/markets` — Gerenciar mercados
- `/admin/users` — Gerenciar usuários
- `/admin/finance` — Relatórios financeiros
- `/admin/audit-logs` — Audit log
- `/admin/settings` — Configurações

## APIs Principais

### Mercados
- `GET /api/admin/markets` — Listar mercados
- `POST /api/admin/markets` — Criar mercado
- `GET /api/admin/markets/[id]` — Detalhe
- `PUT /api/admin/markets/[id]` — Atualizar

### KYC
- `POST /api/kyc/veriff/start` — Iniciar verificação
- `GET /api/kyc/veriff/status/[sessionId]` — Status
- `POST /api/webhooks/veriff` — Webhook de resultado

### Pagamentos
- `POST /api/payments/pix/deposit` — Gerar QR code
- `POST /api/payments/pix/confirm` — Confirmar depósito
- `POST /api/webhooks/pix` — Webhook de PSP

## Modelos de Dados

### Users (Supabase Auth)
- id, email, created_at, last_sign_in_at

### User Profiles (Extensão)
- user_id (FK), name, kyc_status, kyc_verification_id, role

### Markets
- id, title, slug, description, category, status, featured
- opens_at, closes_at, resolves_at, resolution_source
- created_by (FK), created_at, updated_at

### Ledger Entries
- id, user_id, entry_type, debit, credit, balance_after
- reference_type, reference_id, idempotency_key
- created_at

### Audit Log
- id, user_id, action, resource_type, resource_id
- changes (JSONB), ip_address, user_agent
- created_at

## Conformidade e Segurança

- **Autenticação**: Supabase Auth com suporte a OTP
- **RBAC**: 4 roles com permissões granulares
- **KYC**: Integração Veriff para verificação de identidade
- **Ledger**: Double-entry accounting com imutabilidade
- **Risk Limits**: Limites diários/mensais baseados em KYC
- **Audit**: Todas operações admin registradas
- **RLS**: Row Level Security ativado no Supabase

## Próximos Passos

1. **Integração PSP Real**: Conectar a um PSP de verdade (Pagar.me, Stripe, etc)
2. **Matching Engine**: Implementar order book e matching em tempo real
3. **Realtime**: WebSocket para updates de odds/trades
4. **Mobile**: App React Native compartilhando design system
5. **Analytics**: Integrar PostHog ou Mixpanel
6. **Testes**: Unit tests, E2E tests, testes de carga

## Troubleshooting

### Erro: "Missing environment variables"
Verifique se todas as variáveis em `.env.local` estão corretas

### Erro: "Supabase connection refused"
- Verifique URL e chaves do Supabase
- Confirme que o projeto está ativo no Supabase

### Erro ao enviar formulário
- Verifique console para detalhes
- Confirme que RLS está configurado corretamente

## Contribuindo

1. Crie um branch: `git checkout -b feature/sua-feature`
2. Commit suas mudanças: `git commit -am 'Add feature'`
3. Push para o branch: `git push origin feature/sua-feature`
4. Abra um Pull Request

## Licença

MIT

## Contato

Para dúvidas ou sugestões, entre em contato através do repositório GitHub.
