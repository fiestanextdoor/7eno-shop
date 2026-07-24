import type { Metadata, Viewport } from 'next'
import { Space_Mono, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import CartProvider from '@/components/CartProvider/CartProvider'
import SmoothScroll from '@/components/SmoothScroll/SmoothScroll'
import PageTransition from '@/components/PageTransition/PageTransition'
import { BASE_URL, BRAND_KEYWORDS, organizationJsonLd, webSiteJsonLd } from '@/lib/seo'
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

const SITE_DESCRIPTION =
  '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the OG and Olympian collections, with free shipping over €75.'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    // Every page sets its own short title; the template keeps the brand (and
    // the "Zeno" spelling) in every SERP entry without repeating it by hand.
    default: '7ENO (Zeno) · Premium Streetwear Store',
    template: '%s · 7ENO (Zeno)',
  },
  // "Zeno" is how the brand name is pronounced; spelling it out in the visible
  // description ties the search query "zeno" to the store.
  description: SITE_DESCRIPTION,
  keywords: BRAND_KEYWORDS,
  // Machine-readable site/app name. Keep this identical to the OAuth consent
  // screen app name ("7ENO") so Google's app verification sees a matching name.
  applicationName: '7ENO',
  alternates: { canonical: '/' },
  authors: [{ name: 'Abra Entertainment' }],
  creator: 'Abra Entertainment',
  publisher: '7ENO',
  category: 'shopping',
  // Let Google show full-size image previews and untruncated snippets. Without
  // max-image-preview:large, product photos are shown as thumbnails (or not at
  // all) in Search and Discover — the single highest-impact robots directive
  // for a webshop.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    siteName: '7ENO',
    title: '7ENO (Zeno) · Premium Streetwear Store',
    description: SITE_DESCRIPTION,
    url: BASE_URL,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7ENO (Zeno) · Premium Streetwear Store',
    description: SITE_DESCRIPTION,
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
        {/* Product photos are served from the print providers' CDNs; warming the
            connections early shaves a round trip off the largest image (LCP). */}
        <link rel="preconnect" href="https://files.cdn.printful.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://files.cdn.printful.com" />
        <link rel="dns-prefetch" href="https://images-api.printify.com" />
        {/* Site-wide entity graph: who the brand is and what the site is. The
            "Zeno" spellings let search engines link the spoken brand name to the
            store (people hear "Zeno", not "7ENO").
            suppressHydrationWarning: some browser extensions inject a `src`/rewrite this
            <script> before React hydrates, which otherwise throws a hydration-mismatch
            warning. The server-rendered JSON-LD (what crawlers read) is unaffected. */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [webSiteJsonLd(), organizationJsonLd()],
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
