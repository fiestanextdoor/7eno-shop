import type { Metadata, Viewport } from 'next'
import { Oswald, Archivo, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import CartProvider from '@/components/CartProvider/CartProvider'
import SmoothScroll from '@/components/SmoothScroll/SmoothScroll'
import PageTransition from '@/components/PageTransition/PageTransition'
import '@/styles/globals.css'

// Display face for headings/product names: a bold condensed grotesque that
// echoes the angular, condensed 7ENO wordmark. Variable font, so weight is
// omitted to load the full range.
const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// Body face: a clean, highly readable grotesque that pairs with Oswald for
// long-form copy, form fields and product descriptions.
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '7ENO · Divine Authority',
  description: '7ENO is the official online streetwear store.',
  // Machine-readable site/app name. Keep this identical to the OAuth consent
  // screen app name ("7ENO") so Google's app verification sees a matching name.
  applicationName: '7ENO',
  openGraph: {
    siteName: '7ENO',
    title: '7ENO',
    description: '7ENO is the official online streetwear store.',
    url: 'https://www.7eno.shop',
    type: 'website',
  },
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
    <html lang="en" className={`${oswald.variable} ${archivo.variable} ${spaceMono.variable}`}>
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />}
        {/* Explicit site name for crawlers (matches the OAuth consent screen app name "7ENO"). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '7ENO',
              alternateName: '7ENO streetwear store',
              url: 'https://www.7eno.shop',
              description: '7ENO is the official online streetwear store.',
            }),
          }}
        />
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
