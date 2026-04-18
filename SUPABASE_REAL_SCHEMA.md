Seu Supabase - Schema Real

38 Tabelas (vs 10 que assumi)
90+ RPCs (vs 5 que criei)
55+ Views (vs 2 que usei)

TABELAS PRINCIPAIS NOVAS:
- admin_audit_log: Auditoria completa de ações admin
- profiles: User profiles com KYC, roles, onboarding
- wallets: Saldo do usuário
- wallet_ledger: Histórico de transações (double-entry)
- deposit_requests / withdrawal_requests: Fluxo de depósito/saque
- financial_transactions: Histórico de movimentação
- bets / orders / positions: Sistema de trading
- market_options: Opções de cada mercado
- community_posts / community_comments: Community features
- referrals / referral_codes: Sistema de referência
- promo_codes / promo_redemptions: Promocodes
- live_events: Eventos ao vivo
- implementation_*: Rastreamento de tasks

TABELAS DE CONFIG:
- branding_settings: Branding da plataforma
- cms_pages: CMS para páginas estáticas
- media_assets: Gerenciamento de mídia
- admin_modules / role_module_permissions: RBAC granular
- user_notifications: Sistema de notificações

VIEWS CRÍTICAS:
- v_front_markets_v4: Lista de mercados para frontend
- v_front_market_options_v3: Opções formatadas
- v_admin_markets_extended: Dados admin de mercados
- v_front_me: Dados do usuário atual
- v_front_leaderboard_v1: Leaderboard
- v_admin_kyc_queue: Fila de KYC
- v_dashboard_summary: Resumo dashboard
- v_admin_kpis: KPIs da plataforma

RPCS CRÍTICAS:
- rpc_place_bet / place_order: Colocar aposta
- admin_resolve_market_v3: Resolver mercado
- admin_review_kyc: Revisar KYC
- admin_review_deposit / admin_review_withdrawal: Revisar transações
- apply_referral_code: Aplicar referência
- redeem_promo_code: Resgatar promo
- get_public_markets / list_public_markets: Listar mercados
- get_leaderboard: Leaderboard
- get_my_notifications_v2: Notificações do usuário

PRÓXIMOS PASSOS:
1. Adaptar lib/api/admin.ts para usar v_admin_markets_extended
2. Adaptar lib/api/wallet.ts para usar wallets + wallet_ledger
3. Adaptar BetBox para usar place_order RPC
4. Criar helpers para referrals, promos, community
5. Adaptar auth/RBAC para usar admin_modules + role_module_permissions
6. Remover código mock redundante
