'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingDown, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface Position {
  id: string; option_id: string; stake_amount: number
  potential_payout: number; option_label: string; sell_value: number
}

export function MyPositions({ marketId, options }: { marketId: string; options: {id:string,label:string,probability:number}[] }) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [selling, setSelling] = useState<string|null>(null)
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase.rpc('get_my_orders', { p_market_id: marketId })
    if (data && data.length > 0) {
      setPositions(data.map((o: any) => {
        const opt = options.find(x => x.id === o.option_id)
        const prob = opt?.probability || 0.5
        return {
          id: o.id, option_id: o.option_id,
          stake_amount: parseFloat(o.stake_amount),
          potential_payout: parseFloat(o.potential_payout),
          option_label: opt?.label || 'Opção',
          sell_value: parseFloat((parseFloat(o.stake_amount) * prob * 0.95).toFixed(2)),
        }
      }))
      setOpen(true)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [marketId])

  async function handleSell(pos: Position) {
    setSelling(pos.id); setMsg('')
    const supabase = createClient()
    const { error } = await supabase.rpc('rpc_sell_position', { p_order_id: pos.id, p_sell_value: pos.sell_value })
    if (error) { setMsg('Erro: ' + error.message) }
    else { setMsg(`✅ Vendido! R$ ${pos.sell_value.toFixed(2)} creditados`); load() }
    setSelling(null)
  }

  if (loading || positions.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Suas Posições ({positions.length})</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {msg && <p className={`text-xs font-medium ${msg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
          {positions.map(pos => (
            <div key={pos.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold">{pos.option_label}</p>
                <p className="text-xs text-muted-foreground">Apostado: R$ {pos.stake_amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Venda agora: <span className="text-amber-400 font-mono">R$ {pos.sell_value.toFixed(2)}</span></p>
              </div>
              <button onClick={() => handleSell(pos)} disabled={!!selling}
                className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                {selling === pos.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingDown className="h-3 w-3" />}
                Vender
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
