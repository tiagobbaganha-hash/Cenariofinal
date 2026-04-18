import { supabase } from '@/lib/supabase'
import type { FrontMarket } from '@/lib/types'
import { BetBox } from '@/components/BetBox'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default async function MarketPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('v_front_markets_v3')
    .select('*')
    .eq('id', params.id)
    .single()

  const market = data as unknown as FrontMarket | null

  if (error || !market) {
    return (
      <div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
        Mercado não encontrado: {error?.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="text-xs text-neutral-400">{market.category ?? 'Geral'}</div>
        <h1 className="text-2xl font-semibold">{market.title}</h1>
        <div className="text-sm text-neutral-300">{market.description ?? ''}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="text-sm text-neutral-300">Detalhes</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-neutral-200">
            <div>
              <div className="text-xs text-neutral-500">Status</div>
              <div className="capitalize">{market.status_text}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Abre em</div>
              <div>{fmtDate(market.opens_at)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Fecha em</div>
              <div>{fmtDate(market.closes_at)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Resolve em</div>
              <div>{fmtDate(market.resolves_at)}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-neutral-500">Opções</div>
            <div className="mt-2 grid gap-2">
              {market.options?.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/20 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{o.label}</div>
                    <div className="text-xs text-neutral-500">{o.option_key}</div>
                  </div>
                  <div className="text-right">
                    <div>odds {o.odds}</div>
                    <div className="text-xs text-neutral-500">prob {o.probability ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BetBox market={market} />
      </div>
    </div>
  )
}
