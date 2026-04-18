import './globals.css'
import type { Metadata } from 'next'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'CenarioX',
  description: 'Mercados e leaderboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-dvh">
          <Header />
          <main className="mx-auto w-full max-w-5xl px-4 py-6">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-sm text-neutral-400">
            <div className="mt-10 border-t border-neutral-800 pt-6">
              CenarioX • Conectado ao Supabase
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
