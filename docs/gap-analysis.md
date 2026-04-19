## CENÁRIOX — GAPS vs CONCORRENTES (Análise Final)

### ❌ FUNCIONALIDADES CRÍTICAS QUE FALTAM

**1. VENDER POSIÇÃO ANTES DA RESOLUÇÃO**
Polymarket/Kalshi: usuário pode VENDER sua aposta a qualquer momento (como vender ação)
CenárioX: aposta é final, só recebe na resolução
Impacto: ENORME — é o que diferencia mercado preditivo de aposta simples

**2. ORDER BOOK / LIMIT ORDERS**
Polymarket: order book com bids/asks, limit orders com preço específico
CenárioX: apenas market orders via AMM
Impacto: ALTO — traders avançados precisam disso

**3. PORTFOLIO TRACKER AVANÇADO**
Polymarket: PnL em tempo real, unrealized gains, gráfico de desempenho
CenárioX: lista básica de apostas
Impacto: ALTO — traders querem acompanhar desempenho

**4. WATCHLIST / FAVORITOS**
Todas: salvar mercados para acompanhar
CenárioX: não tem
Impacto: MÉDIO — retenção de usuários

**5. VARIAÇÃO 24H NOS CARDS**
VoxFi/Polymarket: mostram "+5% nas últimas 24h" no card do mercado
CenárioX: mostra só probabilidade atual
Impacto: MÉDIO — urgência e engajamento

**6. TRENDING / HOT MARKETS**
Polymarket: seção "Trending" com mercados mais movimentados
CenárioX: só "Destaques" manual do admin
Impacto: MÉDIO — descoberta de mercados

**7. SUBCATEGORIAS**
Polymarket: Política > Eleições Brasil, Esportes > NBA > NFL
CenárioX: categorias flat
Impacto: BAIXO agora, ALTO com escala

**8. REGRAS DE RESOLUÇÃO ESTRUTURADAS**
Kalshi: cada mercado tem seção "Rules" separada e detalhada
CenárioX: regras na descrição, misturado
Impacto: MÉDIO — credibilidade

### ❌ CMS / SUPORTE QUE FALTA

**9. CENTRAL DE AJUDA CATEGORIZADA**
Kalshi/Polymarket: Help Center com categorias (Conta, Depósito, Apostas, etc)
CenárioX: página única de FAQ
Precisa: /ajuda com seções expansíveis, busca

**10. SAC / CHAT DE SUPORTE**
Todas: email + chat (Intercom/Zendesk)
CenárioX: só email
Precisa: WhatsApp de suporte + formulário de contato

**11. STATUS DA PLATAFORMA**
Polymarket: página de status (uptime, incidentes)
CenárioX: não tem
Precisa: /status ou link para statuspage.io

**12. BLOG / NOTÍCIAS**
VoxFi/Kalshi: blog com análises de mercados
CenárioX: não tem
Precisa: /blog com posts do admin sobre mercados

### ❌ FINANCEIRO / COMPLIANCE

**13. KYC REAL (VERIFF)**
Todas: verificação de identidade obrigatória
CenárioX: campo KYC existe mas sem integração real
Precisa: Veriff API ou manual (upload de documento + aprovação admin)

**14. PIX REAL (GATEWAY)**
Todas: depósito/saque automático
CenárioX: depósito manual (admin aprova)
Precisa: Asaas, MercadoPago ou PagBank API

**15. IMPOSTOS BRASILEIROS**
Nenhuma brasileira implementou ainda (oportunidade!)
Precisa: cálculo de IR sobre ganhos, informe de rendimentos

**16. ANTI-LAVAGEM (AML)**
Kalshi: monitoramento de transações suspeitas
CenárioX: não tem
Precisa: alertas para transações acima de limite

### ❌ ENGAJAMENTO

**17. PROGRAMA DE RECOMPENSAS / GAMIFICAÇÃO**
Polymarket: badges, achievements, streaks
CenárioX: leaderboard básico
Precisa: badges (Primeira Aposta, 10 Acertos, etc), daily streak

**18. NOTIFICAÇÕES GRANULARES**
Polymarket: push quando mercado que apostou moveu X%, quando resolveu
CenárioX: notificações básicas
Precisa: configuração de alertas por mercado

**19. SOCIAL SHARING AVANÇADO**
Polymarket: compartilhar posição com imagem gerada
CenárioX: link simples WhatsApp/Twitter
Precisa: card de compartilhamento com imagem OG dinâmica

**20. TUTORIAL INTERATIVO / ONBOARDING**
Kalshi: tutorial step-by-step para novos usuários
CenárioX: onboarding básico (nome/CPF)
Precisa: tour guiado mostrando como apostar

### RESUMO POR PRIORIDADE

URGENTE (antes de lançar com dinheiro real):
- KYC (Veriff ou manual)
- PIX real (gateway de pagamento)
- Termos/Privacidade LGPD ✅ JÁ FEITO
- Aviso de riscos ✅ JÁ FEITO

IMPORTANTE (primeiros 30 dias):
- Central de ajuda expandida com SAC
- Watchlist/favoritos
- Variação 24h nos cards
- Trending markets
- Tutorial de onboarding

DIFERENCIAL (próximos 90 dias):
- Vender posição antes da resolução
- Portfolio tracker avançado
- Order book / limit orders
- Blog com análises
- Programa de recompensas/badges
- Notificações granulares
