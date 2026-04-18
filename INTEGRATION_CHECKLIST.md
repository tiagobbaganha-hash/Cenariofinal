Integração com Supabase Real - Checklist

ARQUIVOS ADAPTADOS:
✅ lib/api/admin.ts - Usando v_admin_kpis_final, v_admin_markets_extended, v_admin_users, admin_audit_log
✅ lib/api/wallet.ts - Usando wallets, wallet_ledger, deposit_requests, withdrawal_requests
✅ components/market/MarketBetBox.tsx - Usando RPC place_order (não mais rpc_place_bet_as_v2)
✅ lib/api/referrals.ts - Criado com RPCs: get_or_create_referral_code, apply_referral_code
✅ lib/api/promos.ts - Criado com RPCs: redeem_promo_code, validate_promo_code_v2
✅ lib/api/community.ts - Criado com views: v_community_posts, v_community_comments

PRÓXIMOS PASSOS PARA INTEGRAÇÃO:

1. HOME PAGE (app/(main)/page.tsx)
   - [ ] Remover markets mock, usar v_front_markets_v4
   - [ ] Integrar v_kpi_public_dashboard para estatísticas
   - [ ] Usar v_front_leaderboard_v1 para leaderboard na home

2. MARKET DETAIL PAGE (app/(main)/market/[id]/page.tsx)
   - [ ] Usar v_front_markets_v4 ao invés de query simples
   - [ ] Usar v_front_market_options_v3 para opções formatadas
   - [ ] Integrar live_events para atualizações em tempo real

3. PROFILE PAGE (app/(main)/profile/page.tsx)
   - [ ] Usar v_front_me para dados do usuário
   - [ ] Integrar v_my_onboarding_status para status onboarding
   - [ ] Usar v_my_notifications para notificações

4. LEADERBOARD PAGE (criar app/(main)/leaderboard/page.tsx)
   - [ ] Usar v_leaderboard_all, v_leaderboard_7d, v_leaderboard_30d
   - [ ] Usar v_leaderboard_volume, v_leaderboard_pnl
   - [ ] Usar v_ranking_general para ranking geral

5. ADMIN DASHBOARD (app/admin/page.tsx)
   - [ ] Usar v_admin_kpis para KPIs detalhados
   - [ ] Usar v_admin_kyc_queue para fila de KYC
   - [ ] Usar v_admin_users para relatório de usuários

6. ADMIN USERS PAGE (app/admin/users/page.tsx)
   - [ ] Usar v_admin_user_report para dados completos
   - [ ] Usar v_admin_user_deposit_amount para depósitos
   - [ ] Usar v_admin_user_money_paid para saques

7. ADMIN FINANCE PAGE (app/admin/finance/page.tsx)
   - [ ] Usar v_admin_finance_report para relatório financeiro
   - [ ] Usar v_admin_transaction_list para transações
   - [ ] Usar v_admin_deposit_list para depósitos
   - [ ] Usar v_admin_withdrawal_list para saques

8. NOTIFICAÇÕES (criar hooks/useNotifications.ts)
   - [ ] Integrar v_my_notifications para realtime
   - [ ] Usar get_my_notifications_v2 para fetch
   - [ ] Implementar mark_notification_read RPC

9. COMMUNITY PAGE (criar app/(main)/community/page.tsx)
   - [ ] Usar v_community_posts para posts
   - [ ] Usar v_community_comments para comentários
   - [ ] Integrar createCommunityPost e createComment

10. REFERRALS PAGE (criar app/(main)/referrals/page.tsx)
    - [ ] Mostrar código de referência do usuário
    - [ ] Listar referências ativas
    - [ ] Mostrar recompensas ganhas
    - [ ] Integrar applyReferralCode

11. PROMOS PAGE (criar app/(main)/promos/page.tsx)
    - [ ] Listar códigos de promoção ativos
    - [ ] Permitir resgate de promo codes
    - [ ] Validar códigos antes de aplicar

12. ADMIN KYC QUEUE (app/admin/kyc/page.tsx)
    - [ ] Usar v_admin_kyc_queue para fila
    - [ ] Integrar admin_review_kyc RPC
    - [ ] Mostrar fotos/docs do Veriff

13. PAYMENT FLOW
    - [ ] Integrar deposit_requests ao fluxo real
    - [ ] Usar admin_review_deposit para aprovação
    - [ ] Integrar withdrawal_requests
    - [ ] Usar admin_review_withdrawal para aprovação

14. MARKET RESOLUTION
    - [ ] Usar admin_resolve_market_v3 RPC
    - [ ] Integrar admin_settle_market para finalizar
    - [ ] Calcular payouts automaticamente

ARQUIVOS A REMOVER (código duplicado):
- [ ] lib/trading/types.ts (não needed, schema já existe)
- [ ] lib/trading/orderBook.ts (não needed, orders table existe)
- [ ] lib/trading/matchingEngine.ts (não needed, place_order RPC existe)
- [ ] lib/compliance/riskLimits.ts (adaptar para usar profiles.kyc_level)
- [ ] lib/finance/ledger.ts (remover, usar wallet_ledger direto)
- [ ] lib/audit/auditLog.ts (adaptar para usar admin_audit_log)
- [ ] lib/kyc/veriff.ts (adaptar para usar profiles.kyc_verification_id)
- [ ] lib/payments/pix.ts (adaptar para usar deposit_requests/withdrawal_requests)

VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
- NEXT_PUBLIC_SUPABASE_URL ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- SUPABASE_SERVICE_ROLE_KEY (se precisar de funções server-side admin)
- VERIFF_API_KEY (se usar KYC)
- PSP_API_KEY (se usar pagamentos)

STATUS: 40% integrado, 60% para fazer
Tempo estimado para integração completa: 4-5 dias
