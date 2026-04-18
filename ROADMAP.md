# Roadmap — CenarioX

Plano de longo prazo para evoluir a plataforma de MVP para SaaS maduro.

## Fase 5: Testes e QA (Q2 2026)

### Testes Automatizados
- [ ] Unit tests (80%+ cobertura)
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Load tests (Artillery)
- [ ] Security tests (OWASP)
- [ ] Setup CI/CD (GitHub Actions)

**Tempo**: 3-4 semanas
**Valor**: Alta confiabilidade antes de produção

### QA Manual
- [ ] Smoke testing checklist
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness
- [ ] Performance (Lighthouse 90+)
- [ ] Segurança (penetration testing básico)
- [ ] Acessibilidade (WCAG 2.1 AA)

**Tempo**: 2 semanas

## Fase 6: Beta Launch (Q2 2026)

### Piloto Fechado
- [ ] Convite de 50-100 usuários
- [ ] Feedback collection
- [ ] Bug fixing
- [ ] Performance monitoring
- [ ] User onboarding refinement

**Tempo**: 4 semanas

### Métricas de Sucesso
- 70%+ retenção diária
- 50+ traders ativos
- 100+ mercados criados
- NPS > 40
- Sem erros críticos

## Fase 7: Compliance e Regulação (Q3 2026)

### Conformidade Legal
- [ ] Consultar advogado (Direito Financeiro BR)
- [ ] Verificar regulamentação de apostas
- [ ] Licenças necessárias
- [ ] Termos e Condições legais
- [ ] Política de Privacidade (LGPD)
- [ ] Documentação de KYC/AML

**Custo**: R$ 10k-20k
**Tempo**: 4-6 semanas

### Compliance Técnico
- [ ] Logs imutáveis (Syslog)
- [ ] Backup e disaster recovery
- [ ] Data retention policies
- [ ] GDPR compliance (se aplicável)
- [ ] Relatórios regulatórios

## Fase 8: Integração PSP Real (Q3 2026)

### Pagar.me / Stripe
- [ ] Integração completa de pagamentos
- [ ] Webhook handling robusto
- [ ] Retry logic
- [ ] Reconciliation diária
- [ ] Payout automático para usuários
- [ ] Tax reporting

**Tempo**: 2-3 semanas

### Suporte Múltiplos Métodos
- [ ] Pix (instantâneo)
- [ ] Cartão de crédito/débito
- [ ] Boleto
- [ ] Transferência bancária (futuramente)

## Fase 9: Expansão de Funcionalidades (Q3-Q4 2026)

### OAuth / Single Sign-On
- [ ] Google Login
- [ ] Apple Sign-In
- [ ] Facebook Login
- [ ] Magic link (passwordless)

**Tempo**: 2 semanas

### 2FA e Segurança
- [ ] TOTP (Google Authenticator)
- [ ] SMS 2FA
- [ ] Backup codes
- [ ] Device trust

**Tempo**: 1-2 semanas

### Notificações
- [ ] Email notifications
- [ ] Push notifications
- [ ] SMS alerts (críticas)
- [ ] In-app notifications

**Tempo**: 2-3 semanas

### Referral Program
- [ ] Tracking de referrals
- [ ] Rewards automáticos
- [ ] Leaderboard de referrers
- [ ] Analytics de conversão

**Tempo**: 1 semana

## Fase 10: Mobile App (Q4 2026 - Q1 2027)

### React Native
- [ ] Setup Expo project
- [ ] Reuso de design system
- [ ] Native features (biometric, deep linking)
- [ ] Offline support
- [ ] Push notifications

**Tempo**: 8-10 semanas

### Plataformas
- [ ] iOS (TestFlight)
- [ ] Android (Google Play Internal)
- [ ] App Store & Play Store

## Fase 11: Advanced Trading (Q1 2027)

### Ordem de Limite
- [ ] Suporte a limit orders completo
- [ ] Stop-loss / Take-profit
- [ ] Order book visual
- [ ] Price alerts

**Tempo**: 3 semanas

### Advanced Charting
- [ ] TradingView charts
- [ ] Technical indicators
- [ ] Price history
- [ ] Volume profile

**Tempo**: 2 semanas

### Histórico de Preços
- [ ] Gravação de preços a cada tick
- [ ] Resoluções (1m, 5m, 1h, 1d)
- [ ] OHLCV data

**Tempo**: 1 semana

## Fase 12: Creator Economy (Q1-Q2 2027)

### Creator Dashboard
- [ ] Criar mercados próprios
- [ ] Monetização (comissões)
- [ ] Analytics de mercado
- [ ] Rankings

**Tempo**: 3 semanas

### Marketplace
- [ ] Marketplace de mercados
- [ ] Filtros e recomendações
- [ ] Rating de criadores
- [ ] Featured markets

**Tempo**: 2 semanas

## Fase 13: Comunidade e Social (Q2 2027)

### Social Features
- [ ] Comentários em mercados
- [ ] Seguir criadores
- [ ] Feed de atividades
- [ ] Giveaways de prédição

**Tempo**: 4 semanas

### Gamificação
- [ ] Badges/Achievements
- [ ] Leaderboards (global, mensal)
- [ ] Streaks
- [ ] Seasonal competitions

**Tempo**: 2 semanas

## Fase 14: Analytics e Insights (Q2 2027)

### User Analytics
- [ ] Dashboard pessoal de trading
- [ ] Win rate, ROI, Sharpe ratio
- [ ] Histórico detalhado
- [ ] Exportação (CSV, PDF)

**Tempo**: 2 semanas

### Platform Analytics
- [ ] Dashboard admin expandido
- [ ] User cohorts
- [ ] Retention curves
- [ ] Churn analysis
- [ ] Integração PostHog/Mixpanel

**Tempo**: 2 semanas

## Fase 15: Cripto (Q3 2027)

### Stablecoin Support
- [ ] USDC em Polygon
- [ ] Depósitos/saques automáticos
- [ ] Smart contract custódia
- [ ] Gas optimization

**Tempo**: 4-5 semanas

### Blockchain
- [ ] Events on-chain
- [ ] Proof of reserve
- [ ] DAO governance (futuramente)

## Fase 16: Internacionalização (Q3-Q4 2027)

### Múltiplos Idiomas
- [ ] Português (BR)
- [ ] Inglês
- [ ] Espanhol
- [ ] Francês
- [ ] Alemão

**Tempo**: 3-4 semanas

### Suporte Multi-moeda
- [ ] BRL, USD, EUR, etc
- [ ] Conversão automática
- [ ] Taxas transparentes

**Tempo**: 2 semanas

### Compliance Local
- [ ] Regulação por país
- [ ] KYC local
- [ ] Impostos e taxas

## Fase 17: Escalabilidade Avançada (Contínua)

### Database Optimization
- [ ] Read replicas
- [ ] Partitioning
- [ ] Caching estratégico (Redis)
- [ ] Query optimization

### Infrastructure
- [ ] Multi-region deployment
- [ ] Auto-scaling
- [ ] CDN global
- [ ] DDoS protection

### Observability
- [ ] Distributed tracing
- [ ] Custom metrics
- [ ] Alerting automático
- [ ] Runbooks

## Roadmap Timeline

```
2026:
Q1 (jan-mar): Fase 1-3 ✅ Concluído
Q2 (abr-jun): Fase 4-5 (testes + beta)
Q3 (jul-set): Fase 6-9 (compliance + expansão)
Q4 (out-dez): Fase 10-11 (mobile + trading)

2027:
Q1 (jan-mar): Fase 12-13 (creator + community)
Q2 (abr-jun): Fase 14-15 (analytics + cripto)
Q3 (jul-set): Fase 16-17 (i18n + escala)
Q4 (out-dez): Otimizações e novos recursos
```

## Métricas de Sucesso

### Fase 5 (Testes)
- Cobertura de testes: 80%+
- CI/CD pipeline rodando
- 0 erros críticos encontrados

### Fase 6 (Beta)
- 50+ usuários ativos
- 70%+ retenção D1
- NPS > 40

### Fase 7 (Compliance)
- Licenças obtidas
- Documentação legal completa
- Compliance audit passado

### Fase 8 (PSP)
- 95%+ sucesso de pagamentos
- Tempo de processamento < 30s
- Reconciliation 100%

### Fase 10 (Mobile)
- 50k+ downloads
- Rating 4.5+
- Mesmas features do web

### Fase 12 (Creator)
- 1.000+ mercados criados
- 30%+ do volume de creators
- Top creators ganham R$ 1k-10k

## Investimento Necessário

| Fase | Custo | Tempo |
|------|-------|-------|
| 5-6 (Testes + Beta) | R$ 5k | 8 semanas |
| 7 (Compliance) | R$ 20k | 6 semanas |
| 8 (PSP) | R$ 10k | 3 semanas |
| 9 (Features) | R$ 0 | 6 semanas |
| 10 (Mobile) | R$ 30k | 10 semanas |
| 11 (Trading) | R$ 15k | 5 semanas |
| 12-13 (Creator + Social) | R$ 20k | 8 semanas |
| 14-17 (Analytics + Infra) | R$ 40k | 16 semanas |
| **Total** | **~R$ 140k** | **~1-1.5 anos** |

## Alternativa: MVPs Menores

Se tempo/orçamento limitado:

**Mês 1**: Testes + Beta Launch
**Mês 2**: Compliance mínimo + PSP real
**Mês 3**: OAuth + Notificações
**Mês 4**: Mobile (MVP simples)
**Mês 5+**: Resto conforme feedback

## Conclusão

CenarioX tem potencial enorme. Este roadmap é baseado em:
- User feedback (será coletado)
- Market trends (prediction markets crescem globalmente)
- Oportunidades BR (Pix facilita pagamentos, adoção crescente)

Foco em quality first, depois scale. 🚀
