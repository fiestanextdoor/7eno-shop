import type { Metadata } from 'next'

// Checkout is a transactional page: it must never appear in search results.
// robots.txt already disallows crawling, but a disallowed URL can still be
// indexed when something links to it — `noindex` is what actually keeps it out.
// The page itself is a client component, so the directive lives in this layout.
export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false, nocache: true },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
