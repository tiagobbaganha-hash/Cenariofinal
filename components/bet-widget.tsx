'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { cn, formatCurrency } from '@/lib/utils'
import type { MarketOption } from '@/lib/types'
import { Lock, Zap, Loader2, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react'

interface BetWidgetProps {
  marketId: string
  marketSlug: string
  options: MarketOption[]
  isOpen: boolean
}

interface UserPosition {
  id: string
  option_id: string
  option_label: string
  option_key: string
  stake_amount: number
  potential_payout: number
  current_odds: number
  sell_value: number
  profit_loss: number
  profit_pct: number
}

export function BetWidget({ marketId, marketSlug, options, isOpen }: BetWidgetProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [authed, setAuthed] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(options?.[0]?.id ?? null)
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'comprar' | 'vender'>('comprar')
  const [positions, setPositions] = useState<UserPosition[]>([])
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [selling, setSelling] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setAuthed(!!data.user)
      if (data.user) {
        setUserId(data.user.id)
        try {
          const { data: profile } = await supabase.from('v_front_me').select('available_balance').single()
          setBalance((profile as any)?.available_balance ?? 0)
        } catch { setBalance(0) }
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (tab === 'vender' && authed && userId) {
      loadPositions()
    }
  }, [tab, authed, userId])

  // Recarregar posições quando volta para aba vender
  useEffect(() => {
    if (tab === 'vender' && userId) {
      const timer = setTimeout(() => loadPositions(), 500)
      return () => clearTimeout(timer)
    }
  }, [tab])

  async function loadPositions() {
    setLoadingPositions(true)
    try {
      const supabase = createClient()
      const { data: orders } = await supabase
        .from('orders')
        .select('id, option_id, stake_amount, potential_payout, status')
        .eq('market_id', marketId)
        .eq('user_id', userId!)
        .in('status', ['open', 'pending', 'matched'])
        .order('created_at', { ascending: false })

      if (orders && orders.length > 0) {
        const pos: UserPosition[] = orders.map((o: any) => {
          const opt = options.find(x => x.id === o.option_id)
          const currentOdds = Number(opt?.odds ?? 2)
          const stake = parseFloat(o.stake_amount)
          // Valor de venda = stake / currentOdds * (currentOdds - 1) + stake * 0.9
          // Simplificado: valor justo pela probabilidade atual menos 5% de spread
          const currentProb = Number(opt?.probability ?? 0.5)
          const sellValue = parseFloat((stake * currentProb * 0.95).toFixed(2))
          const profitLoss = sellValue - stake
          return {
            id: o.id,
            option_id: o.option_id,
            option_label: opt?.label ?? 'Opção',
            option_key: opt?.option_key ?? 'yes',
            stake_amount: stake,
            potential_payout: parseFloat(o.potential_payout ?? '0'),
            current_odds: currentOdds,
            sell_value: sellValue,
            profit_loss: profitLoss,
            profit_pct: (profitLoss / stake) * 100,
          }
        })
        setPositions(pos)
        if (pos.length > 0) setSelectedPosition(pos[0].id)
      } else {
        setPositions([])
      }
    } finally {
      setLoadingPositions(false)
    }
  }

  const chosen = useMemo(
    () => options.find((o) => o.id === selectedOption) ?? options[0],
    [options, selectedOption]
  )

  const stake = Number(amount) || 0
  const odds = Number(chosen?.odds ?? 0)
  const potentialReturn = stake * odds
  const profit = potentialReturn - stake

  async function handleBet() {
    if (!authed) { router.push('/login'); return }
    if (!chosen) return
    if (stake <= 0) {
      toast({ type: 'warning', title: 'Informe um valor', description: 'Valor deve ser maior que zero.' })
      return
    }
    if (stake > balance) {
      toast({ type: 'error', title: 'Saldo insuficiente', description: 'Faça um depósito para continuar.' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('rpc_place_bet', {
        p_option_id: chosen.id,
        p_stake: stake,
      })
      if (error) throw error
      toast({ type: 'success', title: 'Aposta confirmada!', description: `${formatCurrency(stake)} em "${chosen.label}"` })
      setAmount('')
      router.refresh()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro ao apostar', description: err?.message ?? 'Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSell() {
    if (!selectedPosition) return
    const pos = positions.find(p => p.id === selectedPosition)
    if (!pos) return

    setSelling(true)
    try {
      const supabase = createClient()
      // Chamar RPC de venda ou fazer via API
      const { error } = await supabase.rpc('rpc_sell_position', {
        p_order_id: pos.id,
        p_sell_value: pos.sell_value,
      })
      if (error) throw error
      toast({
        type: 'success',
        title: 'Posição vendida!',
        description: `${formatCurrency(pos.sell_value)} creditados na sua carteira.`
      })
      setPositions(prev => prev.filter(p => p.id !== selectedPosition))
      setSelectedPosition(null)
      setBalance(b => b + pos.sell_value)
      router.refresh()
    } catch (err: any) {
      toast({ type: 'error', title: 'Erro ao vender', description: err?.message ?? 'Tente novamente.' })
    } finally {
      setSelling(false)
    }
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 font-medium">Mercado fechado</p>
          <p className="text-sm text-muted-foreground">Este mercado não está mais aceitando apostas.</p>
        </CardContent>
      </Card>
    )
  }

  const selPos = positions.find(p => p.id === selectedPosition)

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        {/* Header com saldo */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Apostar</h3>
          {authed && (
            <span className="text-xs text-muted-foreground">
              Saldo: <span className="font-mono text-foreground">{formatCurrency(balance)}</span>
            </span>
          )}
        </div>

        {/* Tabs Comprar / Vender */}
        <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-1">
          {[
            { id: 'comprar', label: 'Comprar', icon: ShoppingCart },
            { id: 'vender', label: 'Vender', icon: TrendingDown },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all',
                tab === id
                  ? id === 'vender'
                    ? 'bg-destructive/20 text-destructive border border-destructive/30'
                    : 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ===== TAB: COMPRAR ===== */}
        {tab === 'comprar' && (
          <>
            {/* PASSO 1: Escolher opção */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. O que você está comprando?
              </label>
              <div className={cn(
                'grid gap-2',
                options.length === 2 ? 'grid-cols-2' :
                options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
              )}>
                {options.map((opt, i) => {
                  const active = selectedOption === opt.id
                  const isNo = opt.option_key === 'no' || opt.label.toLowerCase() === 'não'
                  const COLORS = [
                    { active: 'border-emerald-500 bg-emerald-500/15 text-emerald-400', bar: 'bg-emerald-500' },
                    { active: 'border-rose-500 bg-rose-500/15 text-rose-400',          bar: 'bg-rose-500'    },
                    { active: 'border-blue-500 bg-blue-500/15 text-blue-400',          bar: 'bg-blue-500'    },
                    { active: 'border-amber-500 bg-amber-500/15 text-amber-400',       bar: 'bg-amber-500'   },
                    { active: 'border-purple-500 bg-purple-500/15 text-purple-400',    bar: 'bg-purple-500'  },
                    { active: 'border-cyan-500 bg-cyan-500/15 text-cyan-400',          bar: 'bg-cyan-500'    },
                  ]
                  const c = isNo ? COLORS[1] : COLORS[i % COLORS.length]
                  return (
                    <button key={opt.id} type="button" onClick={() => setSelectedOption(opt.id)}
                      className={cn(
                        'relative rounded-xl border px-3 py-3 text-left transition-all',
                        active ? c.active : 'border-border bg-background hover:bg-accent/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className={cn('font-semibold text-sm leading-tight', active ? '' : 'text-foreground')}>
                          {opt.label}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground flex-shrink-0">
                          {Number(opt.odds ?? 0).toFixed(2)}x
                        </span>
                      </div>
                      {opt.probability != null && (
                        <>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-muted mb-1">
                            <div className={cn('h-full transition-all', active ? c.bar : 'bg-muted-foreground/40')}
                              style={{ width: `${Math.min(100, Number(opt.probability) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {(Number(opt.probability) * 100).toFixed(0)}% de chance
                          </span>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PASSO 2: Valor */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Quanto você quer apostar?
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input type="number" inputMode="decimal" min="0" step="0.01" value={amount}
                  onChange={(e) => setAmount(e.target.value)} placeholder="0,00"
                  className="pl-10 h-12 text-lg font-mono tabular-nums" />
              </div>
              <div className="flex gap-1.5">
                {[10, 25, 50, 100].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(String(v))}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                    R$ {v}
                  </button>
                ))}
              </div>
            </div>

            {/* PASSO 3: Resumo claro do que está comprando */}
            {stake > 0 && chosen && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">Resumo da compra</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posição em</span>
                  <span className="font-bold text-foreground">{chosen.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Você paga</span>
                  <span className="font-mono font-bold text-foreground">{formatCurrency(stake)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Se acertar, recebe</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(potentialReturn)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lucro potencial</span>
                  <span className="font-mono font-bold text-emerald-400">+{formatCurrency(profit)}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Odds</span>
                  <span className="font-mono font-semibold text-primary">{Number(chosen.odds).toFixed(2)}x</span>
                </div>
              </div>
            )}

            {/* CTA */}
            {authed === false ? (
              <Button size="lg" className="w-full gap-2" onClick={() => router.push('/login')}>
                <Lock className="h-4 w-4" /> Entrar para apostar
              </Button>
            ) : (
              <Button size="lg" className="w-full gap-2 text-base" onClick={handleBet}
                disabled={loading || stake <= 0 || !chosen}>
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
                  : <><Zap className="h-4 w-4" /> Comprar {chosen?.label || 'opção'}</>}
              </Button>
            )}
          </>
        )}

        {/* ===== TAB: VENDER ===== */}
        {tab === 'vender' && (
          <>
            {authed === false ? (
              <div className="rounded-xl border border-border bg-card/50 p-6 text-center space-y-3">
                <TrendingDown className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Faça login para ver suas posições</p>
                <Button size="sm" onClick={() => router.push('/login')}>Entrar</Button>
              </div>
            ) : loadingPositions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : positions.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/50 p-6 text-center space-y-2">
                <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
                <p className="text-sm font-medium text-foreground">Nenhuma posição aberta</p>
                <p className="text-xs text-muted-foreground">Você não tem apostas ativas neste mercado</p>
                <button onClick={() => setTab('comprar')} className="text-xs text-primary hover:underline mt-1">
                  Comprar uma posição →
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suas posições</p>
                  {positions.map(pos => {
                    const isNo = pos.option_key === 'no' || pos.option_label.toLowerCase() === 'não'
                    const isSelected = selectedPosition === pos.id
                    const gainClass = pos.profit_loss >= 0 ? 'text-primary' : 'text-destructive'
                    return (
                      <button
                        key={pos.id}
                        onClick={() => setSelectedPosition(pos.id)}
                        className={cn(
                          'w-full rounded-xl border p-4 text-left transition-all space-y-2',
                          isSelected
                            ? isNo ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:bg-accent/30'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn('text-sm font-semibold', isSelected && !isNo && 'text-primary', isSelected && isNo && 'text-destructive')}>
                            {pos.option_label}
                          </span>
                          <span className={cn('text-xs font-medium', gainClass)}>
                            {pos.profit_pct >= 0 ? '+' : ''}{pos.profit_pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Apostado: <span className="text-foreground font-mono">{formatCurrency(pos.stake_amount)}</span></span>
                          <span>Retorno máx: <span className="text-foreground font-mono">{formatCurrency(pos.potential_payout)}</span></span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2">
                          <span className="text-xs text-muted-foreground">Valor de venda agora</span>
                          <span className={cn('text-sm font-bold font-mono', gainClass)}>
                            {formatCurrency(pos.sell_value)}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {selPos && (
                  <div className="rounded-xl border border-border bg-background/50 p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Valor apostado</span>
                      <span className="font-mono">{formatCurrency(selPos.stake_amount)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Você receberá</span>
                      <span className="font-mono font-bold text-foreground">{formatCurrency(selPos.sell_value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">P&L</span>
                      <span className={cn('font-mono font-bold', selPos.profit_loss >= 0 ? 'text-primary' : 'text-destructive')}>
                        {selPos.profit_loss >= 0 ? '+' : ''}{formatCurrency(selPos.profit_loss)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <p className="text-[10px] text-muted-foreground/60">
                        Spread de 5% aplicado · valor baseado nas probabilidades atuais
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={handleSell}
                  disabled={selling || !selectedPosition}
                >
                  {selling
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Vendendo...</>
                    : <><TrendingDown className="h-4 w-4" /> Vender posição</>}
                </Button>
              </>
            )}
          </>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Aposte com responsabilidade. Resultados não são garantidos.
        </p>
      </CardContent>
    </Card>
  )
}
