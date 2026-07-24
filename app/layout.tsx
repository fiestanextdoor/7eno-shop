import type { Metadata, Viewport } from 'next'
import { Space_Mono, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import CartProvider from '@/components/CartProvider/CartProvider'
import SmoothScroll from '@/components/SmoothScroll/SmoothScroll'
import PageTransition from '@/components/PageTransition/PageTransition'
import '@/styles/globals.css'

// Cormorant Garamond is the site-wide typeface for headings and body: a soft,
// high-contrast renaissance serif that gives the "Divine Authority" brand an
// ethereal, scriptural feel. Wired to --font-sans in globals.css. Space Mono
// stays for the small uppercase label accents (a distinct, functional element).
// Both are self-hosted by next/font at build time, so no external font CDN is
// hit (keeps the `font-src 'self'` CSP intact).
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.7eno.shop'),
  title: '7ENO · Divine Authority',
  // "Zeno" is how the brand name is pronounced; spelling it out in the visible
  // description ties the search query "zeno" to the store.
  description: '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the OG and Olympian collections.',
  keywords: ['7ENO', 'Zeno', 'Zeno streetwear', 'Zeno shop', 'Zeno kleding', '7eno shop', 'streetwear', 'Abra Entertainment', 'Olympian collection'],
  // Machine-readable site/app name. Keep this identical to the OAuth consent
  // screen app name ("7ENO") so Google's app verification sees a matching name.
  applicationName: '7ENO',
  openGraph: {
    siteName: '7ENO',
    title: '7ENO',
    description: '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment.',
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
    <html lang="en" className={`${cormorant.variable} ${spaceMono.variable}`}>
      <head>
        {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />}
        {/* Explicit site name for crawlers (matches the OAuth consent screen app name "7ENO").
            suppressHydrationWarning: some browser extensions inject a `src`/rewrite this
            <script> before React hydrates, which otherwise throws a hydration-mismatch
            warning. The server-rendered JSON-LD (what crawlers read) is unaffected. */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  name: '7ENO',
                  // "Zeno" spellings let search engines link the spoken brand
                  // name to the store (people hear "Zeno", not "7ENO").
                  alternateName: ['Zeno', 'Zeno streetwear', 'Zeno shop', '7ENO streetwear store'],
                  url: 'https://www.7eno.shop',
                  description: '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment.',
                },
                {
                  '@type': 'Organization',
                  name: '7ENO',
                  alternateName: ['Zeno', 'Zeno by Abra Entertainment'],
                  url: 'https://www.7eno.shop',
                  logo: 'https://www.7eno.shop/logos/beeldmerk-zwart.png',
                  parentOrganization: { '@type': 'Organization', name: 'Abra Entertainment' },
                },
              ],
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
