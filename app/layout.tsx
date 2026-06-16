import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  // Google Search Console ownership verification (needed for Google OAuth app
  // verification). Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the token from
  // the Search Console "HTML tag" method; omitted when unset.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
}

export const viewport: Viewport = {
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  return (
    <html lang="en" className={`${cormorant.variable} ${spaceMono.variable}`}>
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />}
      </head>
      <body>
        <CartProvider>
          <SmoothScroll />
          <PageTransition />
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
