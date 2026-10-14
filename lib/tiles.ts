import type { BadgeKind } from '@/components/ui/Badge/Badge'
import type { ShopProduct } from '@/lib/catalog'
import { resolveCardImage } from '@/lib/card-image'
import { NEW_IN_MS, formatDropDate } from '@/lib/drops'
import { formatPrice } from '@/lib/money'

/** Everything a product tile shows, resolved on the server. */
export interface TileProduct {
  slug: string
  href: string
  name: string
  image: string | null
  imageAlt: string
  price: string | null
  badges: BadgeKind[]
  /** "Drops 1 November 2026 at 12:00 CET" on a teaser tile. */
  note: string | null
}

/** At most one badge: Coming soon before Sold out before New in. */
export function tileBadges(p: Pick<ShopProduct, 'status' | 'soldOut' | 'drop'>, now: number): BadgeKind[] {
  if (p.status === 'upcoming') return ['coming']
  if (p.soldOut) return ['sold-out']
  return now - Date.parse(p.drop.window.startsAt) < NEW_IN_MS ? ['new'] : []
}

/** Lives in lib/money.ts so client components can format prices without the server image helpers. */
export { formatPrice }

export function toTile(p: ShopProduct, image: string | null, now: number): TileProduct {
  return {
    slug: p.slug,
    href: `/shop/${p.slug}`,
    name: p.name,
    image,
    imageAlt: p.name,
    price: formatPrice(p.priceCents, p.currency),
    badges: tileBadges(p, now),
    note: p.status === 'upcoming' ? `Drops ${formatDropDate(p.drop.window.startsAt)}` : null,
  }
}

/** Tiles with the same background-removed card image as before (Supabase cache, no extra remove.bg calls). */
export async function toTiles(products: ShopProduct[], now: number): Promise<TileProduct[]> {
  const images = await Promise.all(
    products.map((p) =>
      resolveCardImage({ slug: p.slug, thumbnailUrl: p.thumbnailUrl }).catch(() => p.thumbnailUrl)
    )
  )
  return products.map((p, i) => toTile(p, images[i], now))
}
