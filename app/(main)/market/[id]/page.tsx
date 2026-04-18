import { supabase } from '@/lib/supabase'
import { getMarketById } from '@/lib/api/markets'
import { MarketBetBox } from '@/components/market/MarketBetBox'
import { MarketInfo } from '@/components/market/MarketInfo'

export const dynamic = 'force-dynamic'

export default async function MarketDetailPage({ params }: { params: { id: string } }) {
  const market = await getMarketById(params.id)

  if (!market) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        <p className="font-medium">Mercado não encontrado</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <MarketInfo market={market} />
      </div>
      <div>
        <MarketBetBox market={market} />
      </div>
    </div>
  )
}
