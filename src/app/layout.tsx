import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Empório Tesser — Compras',
  description: 'Conferência de notas de compra, custo e CMV (MVP de estudo)',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f2eb' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
