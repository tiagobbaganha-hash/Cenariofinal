import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Header } from '@/components/Header'
import { ToastProvider } from '@/lib/context/ToastContext'
import { Toaster } from '@/components/ui/toaster'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'CenarioX',
    template: '%s | CenarioX',
  },
  description: 'Plataforma de mercados preditivos. Aposte em eventos reais com dinheiro virtual ou real.',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans">
        <ToastProvider>
          <div className="min-h-dvh">
            <Header />
            <main className="mx-auto w-full max-w-5xl px-4 py-6">
              {children}
            </main>
            <footer className="mx-auto w-full max-w-5xl px-4 pb-10 text-sm text-muted-foreground">
              <div className="mt-10 border-t border-border pt-6">
                CenarioX - Mercados Preditivos
              </div>
            </footer>
          </div>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
