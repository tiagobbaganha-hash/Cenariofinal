'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Loader2, Lock, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface RapidMarket {
  id: string; title: string; slug: string; status: string; status_text: string
  closes_at: string
  rapid_config: { asset: string; asset_symbol: string; vs_currency: string; duration_minutes: number; price_at_creation: number }
  opt_up_id: string; opt_up_label: string; opt_up_odds: number; opt_up_prob: number
  opt_down_id: string; opt_down_label: string; opt_down_odds: number; opt_down_prob: number
}

interface Props {
  market: RapidMarket
  livePrice?: { brl: number; usd?: number }
  onExpired: () => void
  isEnded?: boolean
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function RapidMarketCard({ market, livePrice, onExpired, isEnded }: Props) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(0)
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null)
  const [amount, setAmount] = useState('')
  const [betting, setBetting] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [result, setResult] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user)
      if (user) {
        supabase.from('v_front_me').select('available_balance').single()
          .then(({ data }) => setBalance((data as any)?.available_balance ?? 0))
          .catch(() => setBalance(0))
      }
    })
  }, [])

  useEffect(() => {
    if (isEnded) return
    function tick() {
      const diff = new Date(market.closes_at).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft(0); onExpired(); return }
      setTimeLeft(diff)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [market.closes_at, isEnded])

  async function handleBet() {
    if (!selected || !amount || !authed) return
    const stake = parseFloat(amount)
    if (!stake || stake <= 0) return
    setBetting(true)
    try {
      const supabase = createClient()
      const optionId = selected === 'yes' ? market.opt_up_id : market.opt_down_id
      const { error } = await supabase.rpc('rpc_place_bet', { p_option_id: optionId, p_stake: stake })
      if (error) throw error
      setResult(`✅ Aposta de ${formatCurrency(stake)} em "${selected === 'yes' ? market.opt_up_label : market.opt_down_label}" confirmada!`)
      setAmount('')
      setSelected(null)
      if (balance !== null) setBalance(b => b! - stake)
    } catch (e: any) {
      setResult(`❌ ${e.message || 'Erro ao apostar'}`)
    } finally { setBetting(false) }
  }

  const mins = Math.floor(timeLeft / 60000)
  const secs = Math.floor((timeLeft % 60000) / 1000)
  const totalSecs = market.rapid_config?.duration_minutes * 60
  const elapsed = totalSecs - (timeLeft / 1000)
  const progress = isEnded ? 100 : Math.min(100, (elapsed / totalSecs) * 100)
  const isUrgent = !isEnded && timeLeft < 60000
  const priceChange = livePrice && market.rapid_config?.price_at_creation
    ? ((livePrice.brl - market.rapid_config.price_at_creation) / market.rapid_config.price_at_creation) * 100
    : null

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isEnded ? 'border-border bg-card/50 opacity-70' : 'border-primary/20 bg-card hover:border-primary/40'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{market.title}</p>
            <p className="text-[10px] text-muted-foreground">{market.rapid_config?.asset_symbol} · {market.rapid_config?.duration_minutes} minutos</p>
          </div>
        </div>

        {/* Timer */}
        {!isEnded && (
          <div className={`text-right ${isUrgent ? 'text-red-400' : 'text-foreground'}`}>
            <p className={`text-2xl font-bold font-mono tabular-nums leading-none ${isUrgent ? 'animate-pulse' : ''}`}>
              {pad(mins)}:{pad(secs)}
            </p>
            <p className="text-[10px] text-muted-foreground">restantes</p>
          </div>
        )}
        {isEnded && <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">Encerrado</span>}
      </div>

      {/* Barra de progresso do tempo */}
      {!isEnded && (
        <div className="h-1 bg-muted">
          <div
            className={`h-full transition-all duration-500 ${isUrgent ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${100 - progress}%` }}
          />
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Preço atual */}
        {livePrice && (
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Preço inicial</p>
              <p className="text-sm font-mono font-bold text-muted-foreground">
                R$ {(market.rapid_config?.price_at_creation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Preço atual</p>
              <p className="text-sm font-mono font-bold text-foreground">
                R$ {(livePrice?.brl||0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {priceChange !== null && (
                <p className={`text-[10px] font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(3)}%
                </p>
              )}
            </div>
          </div>
        )}

        {/* Opções Sobe / Desce */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'yes' as const, label: market.opt_up_label || 'Sobe', odds: market.opt_up_odds, prob: market.opt_up_prob, icon: TrendingUp, color: 'border-green-500 bg-green-500/10', activeColor: 'border-green-400 bg-green-500/20', textColor: 'text-green-400' },
            { key: 'no' as const, label: market.opt_down_label || 'Desce', odds: market.opt_down_odds, prob: market.opt_down_prob, icon: TrendingDown, color: 'border-red-500/50 bg-red-500/10', activeColor: 'border-red-400 bg-red-500/20', textColor: 'text-red-400' },
          ].map(opt => {
            const Icon = opt.icon
            const isActive = selected === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => !isEnded && setSelected(isActive ? null : opt.key)}
                disabled={isEnded || timeLeft <= 0}
                className={`rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed ${
                  isActive ? opt.activeColor : 'border-border bg-background hover:' + opt.color
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${opt.textColor}`} />
                  <span className={`text-sm font-bold ${opt.textColor}`}>{opt.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{Number(opt.odds).toFixed(2)}x</p>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${opt.key === 'yes' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.round((opt.prob || 0.5) * 100)}%` }} />
                </div>
                <p className={`text-[10px] ${opt.textColor} mt-1`}>{Math.round((opt.prob || 0.5) * 100)}%</p>
              </button>
            )
          })}
        </div>

        {/* Input de aposta */}
        {selected && !isEnded && timeLeft > 0 && (
          <div className="space-y-3">
            {result ? (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {result}
              </div>
            ) : (
              <>
                {authed === false ? (
                  <button onClick={() => router.push('/login')}
                    className="w-full rounded-xl bg-primary text-primary-foreground text-sm font-semibold py-2.5 flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" /> Entrar para apostar
                  </button>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <input type="number" placeholder="0,00" value={amount}
                          onChange={e => setAmount(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleBet()}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <button onClick={handleBet} disabled={!amount || betting}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors">
                        {betting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Apostar
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {[10, 25, 50, 100].map(v => (
                        <button key={v} onClick={() => setAmount(String(v))}
                          className="flex-1 rounded-lg border border-border bg-background py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                          R${v}
                        </button>
                      ))}
                    </div>
                    {balance !== null && amount && (
                      <p className="text-xs text-muted-foreground text-right">
                        Saldo: {formatCurrency(balance)} · Ganho potencial: {formatCurrency(parseFloat(amount) * (selected === 'yes' ? market.opt_up_odds : market.opt_down_odds))}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
