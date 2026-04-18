import { supabase } from '@/lib/supabase'
import type { FrontMarket } from '@/lib/types'
import { MarketCard } from '@/components/MarketCard'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Server component: use Supabase REST via anon key (works for public views/tables).
  const { data, error } = await supabase
    .from('v_front_markets_v3')
    .select('*')
    .eq('status_text', 'open')
    .order('featured', { ascending: false })
    .order('closes_at', { ascending: true, nullsFirst: false })

  const markets = (data ?? []) as unknown as FrontMarket[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mercados abertos</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Lista vinda da view <span className="font-mono">v_front_markets_v3</span>
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
          Erro ao carregar mercados: {error.message}
        </div>
      ) : null}

      {markets.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-neutral-300">
          Nenhum mercado aberto agora.
        </div>
      ) : (
        <div className="grid gap-4">
          {markets.map((m) => (
            <MarketCard key={m.id} m={m} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
        Dica: para apostar, abra um mercado e faça login.
      </div>
    </div>
  )
}
