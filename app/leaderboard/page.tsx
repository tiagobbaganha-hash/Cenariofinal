import { supabase } from '@/lib/supabase'
import type { LeaderRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const { data, error } = await supabase
    .from('v_front_leaderboard_v1')
    .select('*')
    .order('total_stake', { ascending: false })
    .limit(50)

  const rows = (data ?? []) as unknown as LeaderRow[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Top apostadores (view <span className="font-mono">v_front_leaderboard_v1</span>)
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
          Erro ao carregar leaderboard: {error.message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900/40 text-neutral-300">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Total apostado</th>
              <th className="px-4 py-3">Apostas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((r, i) => (
              <tr key={r.user_id} className="hover:bg-neutral-900/20">
                <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                <td className="px-4 py-3">{r.name ?? 'Usuário'}</td>
                <td className="px-4 py-3">R$ {Number(r.total_stake ?? 0).toFixed(2)}</td>
                <td className="px-4 py-3">{r.total_bets ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
