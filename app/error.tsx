'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
      </p>
      {error.message && (
        <p className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-400 font-mono max-w-md">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" /> Início
          </Button>
        </Link>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    </div>
  )
}
