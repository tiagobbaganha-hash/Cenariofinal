import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
        <TrendingUp className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-6xl font-black text-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Página não encontrada</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">
        A página que você procura não existe ou foi movida.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" /> Início
          </Button>
        </Link>
        <Link href="/mercados">
          <Button className="gap-2">
            <Search className="h-4 w-4" /> Ver Mercados
          </Button>
        </Link>
      </div>
    </div>
  )
}
