import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Space_Mono } from 'next/font/google'
import CartProvider from '@/components/CartProvider/CartProvider'
import SmoothScroll from '@/components/SmoothScroll/SmoothScroll'
import PageTransition from '@/components/PageTransition/PageTransition'
import '@/styles/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '7ENO — Divine Authority',
  description: 'Premium streetwear inspired by divine authority.',
}

export const viewport: Viewport = {
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" className={`${cormorant.variable} ${spaceMono.variable}`}>
      <body>
        <CartProvider>
          <SmoothScroll />
          <PageTransition />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
