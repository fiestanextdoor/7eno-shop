import type { NextConfig } from 'next'

// Report-only first: violations log to the browser console without breaking
// anything. Switch the header key to 'Content-Security-Policy' once it has
// run clean in production for a while.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  'frame-src https://maps.google.com https://www.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Add `; preload` only after registering at hstspreload.org, it is hard to undo.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'files.cdn.printful.com' },
      { protocol: 'https', hostname: '**.printful.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      // Live Instagram feed (lib/instagram) when INSTAGRAM_ACCESS_TOKEN is set.
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
  // The collection OG image reads its font and logos from disk at request time
  // when a slug was not prerendered; make sure they ship with that function.
  outputFileTracingIncludes: {
    '/collections/**': ['./app/_fonts/**/*', './public/brand/*.png'],
  },
  // Retired v1 routes (spec section 3). The request query is passed through
  // to the destination, so UTM tags survive and the canonical absorbs them.
  // `/shop?line=og` is handled in proxy.ts (lib/legacy-redirects.ts): a
  // has-redirect to /shop itself would keep matching its own query.
  async redirects() {
    return [
      { source: '/olympian', destination: '/collections/olympian', permanent: true },
      { source: '/deals', destination: '/shop', permanent: true },
      { source: '/deals/:slug', destination: '/shop', permanent: true },
      { source: '/coming-soon', destination: '/', permanent: true },
      {
        source: '/shop',
        has: [{ type: 'query', key: 'line', value: 'olympian' }],
        destination: '/collections/olympian',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
