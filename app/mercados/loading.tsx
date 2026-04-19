import { Skeleton } from '@/components/ui/skeleton'

export default function MercadosLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
