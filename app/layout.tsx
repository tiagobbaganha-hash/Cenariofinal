// CenarioX Root Layout
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/lib/context/ToastContext'
import { Toaster } from '@/components/ui/toaster'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CenarioX — Mercados Preditivos',
    template: '%s · CenarioX',
  },
  description:
    'A plataforma brasileira de mercados preditivos. Aposte em eventos reais, negocie previsões e compita com outros traders.',
  keywords: ['mercados preditivos', 'apostas', 'previsões', 'CenarioX', 'trading', 'Brasil'],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'CenarioX',
    title: 'CenarioX — Mercados Preditivos',
    description: 'A plataforma brasileira de mercados preditivos.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans antialiased">
        <ToastProvider>
          <SiteHeader />
          <main className="min-h-[calc(100dvh-8rem)]">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
