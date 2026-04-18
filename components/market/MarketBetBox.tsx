'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FrontMarket, MarketOption } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/useToast'
import { Loader2, TrendingUp } from 'lucide-react'

type RpcResult = {
  ok: boolean
  order_id?: string
  market_id?: string
  odds?: number
  side?: string
  stake?: number
  balance_before?: number
  balance_after?: number
  error?: string
}

export function MarketBetBox({ market }: { market: FrontMarket }) {
  const toast = useToast()
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [stake, setStake] = useState<string>('10')
  const [optionId, setOptionId] = useState<string>(market.options?.[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [potentialReturn, setPotentialReturn] = useState<number>(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionUserId(data.session?.user?.id ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setSessionUserId(sess?.user?.id ?? null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const selectedOption: MarketOption | undefined = useMemo(
    () => market.options?.find((o) => o.id === optionId),
    [market.options, optionId]
  )

  useEffect(() => {
    if (selectedOption && stake) {
      const stakeNum = Number(stake)
      if (Number.isFinite(stakeNum) && stakeNum > 0) {
        setPotentialReturn(stakeNum * (selectedOption.odds || 1))
      }
    }
  }, [selectedOption, stake])

  const placeBet = async () => {
    setLoading(true)

    try {
      if (!sessionUserId) {
        toast.warning('Autenticação', 'Faça login para apostar')
        return
      }

      if (!optionId) {
        toast.error('Erro', 'Selecione uma opção')
        return
      }

      const stakeNum = Number(stake)
      if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
        toast.error('Erro', 'Digite um valor válido')
        return
      }

      const { data, error } = await supabase.rpc('place_order', {
        p_market_option_id: optionId,
        p_stake: stakeNum,
      })

      if (error) throw error

      const result = (data as unknown as RpcResult) ?? { ok: true }
      if (!result.ok) throw new Error(result.error ?? 'Falha ao apostar')

      toast.success(
        'Aposta confirmada!',
        `Retorno potencial: R$ ${potentialReturn.toFixed(2)}`
      )

      setStake('10')
    } catch (err: any) {
      toast.error('Erro', err?.message ?? 'Não foi possível processar sua aposta')
    } finally {
      setLoading(false)
    }
  }

  const isMarketOpen = market.status === 'open'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Faça sua Aposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMarketOpen && (
          <Alert variant="warning">
            <AlertDescription>
              Este mercado não está aceitan do novas apostas no momento.
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">Selecione uma opção</label>
          <select
            value={optionId}
            onChange={(e) => setOptionId(e.target.value)}
            disabled={!isMarketOpen}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {market.options?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} • odds {o.odds}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Valor da aposta (R$)</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            disabled={!isMarketOpen}
            min="1"
            step="0.01"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          />
        </div>

        {selectedOption && stake && (
          <div className="rounded-lg border border-border bg-accent/5 p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retorno potencial:</span>
              <span className="font-semibold text-success">R$ {potentialReturn.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Odds: {selectedOption.odds}</span>
              <span>Lucro: R$ {(potentialReturn - Number(stake)).toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={placeBet}
          disabled={loading || !isMarketOpen || !sessionUserId}
          className="w-full"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {!sessionUserId ? 'Faça login para apostar' : loading ? 'Processando...' : 'Confirmar aposta'}
        </Button>
      </CardContent>
    </Card>
  )
}
