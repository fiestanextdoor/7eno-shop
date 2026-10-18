import { DROPS, isDropListed, listDropsNewestFirst, type Drop } from './drops'

export interface NotFoundLink {
  label: string
  href: string
}

/**
 * Where a lost visitor can go: every listed edition (newest first), then the
 * shop and the archive, which always exist. No status words: the root 404 is
 * rendered at build time, so "Coming soon" would outlive the release.
 */
export function notFoundLinks(now: number, drops: readonly Drop[] = DROPS): NotFoundLink[] {
  const editions = listDropsNewestFirst(drops)
    .filter((drop) => isDropListed(drop, now))
    .map((drop) => ({ label: drop.title, href: `/collections/${drop.slug}` }))
  return [...editions, { label: 'Shop', href: '/shop' }, { label: 'Archive', href: '/archive' }]
}
