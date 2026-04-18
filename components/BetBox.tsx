'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FrontMarket, MarketOption } from '@/lib/types'

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

export function BetBox({ market }: { market: FrontMarket }) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [stake, setStake] = useState<string>('10')
  const [optionId, setOptionId] = useState<string>(market.options?.[0]?.id ?? '')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

  const placeBet = async () => {
    setMsg(null)
    setLoading(true)

    try {
      if (!sessionUserId) throw new Error('Faça login para apostar.')
      if (!optionId) throw new Error('Selecione uma opção.')

      const stakeNum = Number(stake)
      if (!Number.isFinite(stakeNum) || stakeNum <= 0) throw new Error('Valor inválido.')

      // Chama sua RPC: rpc_place_bet_as_v2(p_user_id, p_option_id, p_stake)
      const { data, error } = await supabase.rpc('rpc_place_bet_as_v2', {
        p_user_id: sessionUserId,
        p_option_id: optionId,
        p_stake: stakeNum,
      })

      if (error) throw error

      const result = (data as unknown as RpcResult) ?? { ok: true }
      if (!result.ok) throw new Error(result.error ?? 'Falha ao apostar')

      setMsg(
        `Aposta criada! order_id=${result.order_id} • saldo ${result.balance_before} → ${result.balance_after}`
      )
    } catch (e: any) {
      setMsg(e?.message ?? 'Erro')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
      <div className="text-sm text-neutral-300">Apostar</div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <div className="text-xs text-neutral-500">Opção</div>
          <select
            value={optionId}
            onChange={(e) => setOptionId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
          >
            {market.options?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} • odds {o.odds}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="text-xs text-neutral-500">Valor (stake)</div>
          <input
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
          />
        </label>

        {selectedOption ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-300">
            Probabilidade: {selectedOption.probability ?? '—'}
          </div>
        ) : null}

        {msg ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 px-3 py-2 text-sm text-neutral-200">
            {msg}
          </div>
        ) : null}

        <button
          disabled={loading}
          onClick={placeBet}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {loading ? 'Processando…' : sessionUserId ? 'Confirmar aposta' : 'Faça login para apostar'}
        </button>

        <div className="text-xs text-neutral-500">
          Segurança: no seu banco, garanta que a RPC valide <span className="font-mono">p_user_id = auth.uid()</span>.
        </div>
      </div>
    </div>
  )
}
