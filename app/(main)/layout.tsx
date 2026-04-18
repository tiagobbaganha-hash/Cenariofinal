import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mercados',
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
