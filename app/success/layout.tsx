import type { Metadata } from 'next'

// Order confirmation: unique per order and never a search result. See
// app/checkout/layout.tsx for why `noindex` is set alongside robots.txt.
export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false, nocache: true },
}

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children
}
