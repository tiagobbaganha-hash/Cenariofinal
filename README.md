# CenarioX (Cenariofinal)

App Next.js (Vercel) conectado ao Supabase.

## O que já funciona
- Lista de **mercados abertos** (view `v_front_markets_v3`)
- Página de **detalhe do mercado** com opções
- **Login** via Supabase Auth (email/senha)
- **Apostar** chamando a RPC `rpc_place_bet_as_v2(p_user_id, p_option_id, p_stake)`
- **Leaderboard** (view `v_front_leaderboard_v1`)

## Variáveis de ambiente (Vercel)
Crie 2 variáveis (Production + Preview):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> Use a **Publishable key** (ou anon) do Supabase. **Nunca** use `service_role` no frontend.

## Deploy na Vercel (sem rodar no PC)
1) Suba este código no seu GitHub (pelo Codespaces mesmo)
2) Na Vercel: **New Project** → importe o repositório
3) Framework: **Next.js** (detecta automático)
4) Adicione as env vars acima
5) Deploy

## Segurança importante (antes de abrir pro público)
A função `rpc_place_bet_as_v2` recebe `p_user_id`. Você deve validar no banco:
- `p_user_id = auth.uid()`
- e/ou ignorar o parâmetro e usar somente `auth.uid()`.

Sem isso, um usuário poderia tentar apostar usando o `user_id` de outra pessoa.
