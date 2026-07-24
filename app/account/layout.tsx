import type { Metadata } from 'next'

// Everything under /account is personal (sign in, register, orders, profile),
// so the whole subtree is kept out of the index. See app/checkout/layout.tsx
// for why this sits next to the robots.txt disallow.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
