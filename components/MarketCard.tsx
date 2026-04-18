import Link from 'next/link'
import type { FrontMarket } from '@/lib/types'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function MarketCard({ m }: { m: FrontMarket }) {
  return (
    <Link
      href={`/market/${m.id}`}
      className="block rounded-2xl border border-neutral-800 bg-neutral-950 p-5 no-underline hover:bg-neutral-900/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-400">{m.category ?? 'Geral'}</div>
          <div className="mt-1 text-lg font-semibold">{m.title}</div>
          {m.description ? (
            <div className="mt-2 line-clamp-2 text-sm text-neutral-300">{m.description}</div>
          ) : null}
        </div>
        {m.featured ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
            Destaque
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-neutral-300 sm:grid-cols-3">
        <div>
          <div className="text-xs text-neutral-500">Status</div>
          <div className="capitalize">{m.status_text}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Fecha em</div>
          <div>{fmtDate(m.closes_at)}</div>
        </div>
        <div className="hidden sm:block">
          <div className="text-xs text-neutral-500">Opções</div>
          <div>{m.options_count ?? m.options?.length ?? 0}</div>
        </div>
      </div>
    </Link>
  )
}
