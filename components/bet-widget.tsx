'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { cn, formatCurrency } from '@/lib/utils'
import type { MarketOption } from '@/lib/types'
import { Lock, Zap, Loader2, TrendingUp } from 'lucide-react'

interface BetWidgetProps {
  marketId: string
  marketSlug: string
  options: MarketOption[]
  isOpen: boolean
}

export function BetWidget({ marketId, marketSlug, options, isOpen }: BetWidgetProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [authed, setAuthed] = useState<boolean | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(options?.[0]?.id ?? null)
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setAuthed(!!data.user)
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('v_front_me')
            .select('balance_available')
            .single()
          setBalance((profile as any)?.balance_available ?? 0)
        } catch {
          setBalance(0)
        }
      }
    }
    load()
  }, [])

  const chosen = useMemo(
    () => options.find((o) => o.id === selectedOption) ?? options[0],
    [options, selectedOption]
  )

  const stake = Number(amount) || 0
  const odds = Number(chosen?.odds ?? 0)
  const potentialReturn = stake * odds
  const profit = potentialReturn - stake

  async function handleBet() {
    if (!authed) {
      router.push('/login')
      return
    }
    if (!chosen) return
    if (stake <= 0) {
      toast({ type: 'warning', title: 'Informe um valor', description: 'O valor da aposta deve ser maior que zero.' })
      return
    }
    if (stake > balance) {
      toast({
        type: 'error',
        title: 'Saldo insuficiente',
        description: 'Faça um depósito para continuar.',
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('place_bet', {
        p_market_id: marketId,
        p_option_id: chosen.id,
        p_stake: stake,
      })
      if (error) throw error

      toast({
        type: 'success',
        title: 'Aposta confirmada!',
        description: `${formatCurrency(stake)} em "${chosen.label}"`,
      })
      setAmount('')
      router.refresh()
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Erro ao apostar',
        description: err?.message ?? 'Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 font-medium">Mercado fechado</p>
          <p className="text-sm text-muted-foreground">
            Este mercado não está mais aceitando apostas.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Apostar</h3>
          {authed && (
            <span className="text-xs text-muted-foreground">
              Saldo: <span className="font-mono text-foreground">{formatCurrency(balance)}</span>
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Escolha
          </label>
          <div className={cn('grid gap-2', options.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
            {options.map((opt) => {
              const active = selectedOption === opt.id
              const isYes = opt.option_key === 'yes' || opt.label.toLowerCase() === 'sim'
              const isNo = opt.option_key === 'no' || opt.label.toLowerCase() === 'não'
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={cn(
                    'relative rounded-lg border px-4 py-3 text-left transition-all',
                    active
                      ? isNo
                        ? 'border-destructive bg-destructive/10'
                        : 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'font-medium',
                      active && isNo && 'text-destructive',
                      active && !isNo && 'text-primary',
                    )}>
                      {opt.label}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-muted-foreground">
                      {Number(opt.odds ?? 0).toFixed(2)}x
                    </span>
                  </div>
                  {opt.probability != null && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full transition-all',
                          isNo ? 'bg-destructive' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(100, Number(opt.probability) * 100)}%` }}
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Valor da aposta
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="pl-10 h-12 text-lg font-mono tabular-nums"
            />
          </div>
          <div className="flex gap-2">
            {[10, 50, 100, 500].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                R$ {v}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {stake > 0 && chosen && (
          <div className="rounded-lg border border-border bg-background/50 p-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Retorno potencial</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatCurrency(potentialReturn)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Lucro</span>
              <span className="font-mono tabular-nums text-success">
                +{formatCurrency(profit)}
              </span>
            </div>
          </div>
        )}

        {/* CTA */}
        {authed === false ? (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => router.push('/login')}
          >
            <Lock className="h-4 w-4" />
            Entrar para apostar
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleBet}
            disabled={loading || stake <= 0 || !chosen}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Confirmar aposta
              </>
            )}
          </Button>
        )}

        <p className="text-center text-[10px] text-muted-foreground">
          Aposte com responsabilidade. Resultados não são garantidos.
        </p>
      </CardContent>
    </Card>
  )
}
