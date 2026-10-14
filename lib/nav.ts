import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'

export interface NavItem {
  label: string
  href: string
  /** mailto or another site: rendered as a plain anchor, not a route link. */
  external?: boolean
}

/** Header and mobile menu (spec section 3). */
export const MAIN_NAV: NavItem[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'Olympian', href: '/collections/olympian' },
  { label: 'OLYMPN Sport', href: '/collections/olympn-sport' },
  { label: 'Archive', href: '/archive' },
  { label: 'About', href: '/about' },
]

export const HELP_NAV: NavItem[] = [
  { label: 'Size guide', href: '/size-guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Returns', href: '/returns' },
  { label: 'Contact', href: 'mailto:info@7eno.shop', external: true },
]

export const LEGAL_NAV: NavItem[] = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
]

/** Announcement bar USPs. Facts only: the threshold comes from lib/shipping. */
export const ANNOUNCEMENTS: string[] = [
  `Free shipping on orders over €${FREE_SHIPPING_THRESHOLD}`,
  '14-day returns',
  'Made to order in numbered editions',
]

/** True when `path` is `href` itself or a page below it. */
export function isActivePath(href: string, path: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}
