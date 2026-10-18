import type { BadgeKind } from '@/components/ui/Badge/Badge'
import type { ShopProduct } from '@/lib/catalog'
import type { DropId } from '@/lib/drops'
import { categoryOf, type Category } from '@/lib/product-category'
import { resolveCardImage } from '@/lib/card-image'
import { buildColourSiblings } from '@/lib/colour-siblings'
import { NEW_IN_MS, formatDropDate } from '@/lib/drops'
import { formatPrice } from '@/lib/money'
import type { NormalizedVariant, Provider } from '@/types/catalog'

/** A colour of the same product family, for the quick-add swatches. */
export interface QuickAddColour {
  name: string
  hex: string
  slug: string
  current: boolean
  soldOut: boolean
}

/** What the quick-add dialog needs to put a tile in the cart without opening its page. */
export interface QuickAddData {
  provider: Provider
  productId: string
  variants: NormalizedVariant[]
  soldOut: boolean
  colours: QuickAddColour[]
}

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
  /** For client-side filtering and sorting (lib/shop-query, ShopBrowser). */
  dropId: DropId
  category: Category | null
  priceCents: number | null
  /** Present when the piece can be bought straight from the tile (live drop, variants known). */
  quick?: QuickAddData | null
}

/** At most one badge: Coming soon before Sold out before New in. */
export function tileBadges(p: Pick<ShopProduct, 'status' | 'soldOut' | 'drop'>, now: number): BadgeKind[] {
  if (p.status === 'upcoming') return ['coming']
  if (p.soldOut) return ['sold-out']
  return now - Date.parse(p.drop.window.startsAt) < NEW_IN_MS ? ['new'] : []
}

/** Lives in lib/money.ts so client components can format prices without the server image helpers. */
export { formatPrice }

export function toQuickAdd(p: ShopProduct, all: readonly ShopProduct[]): QuickAddData | null {
  if (!p.purchasable || p.variants.length === 0) return null
  return {
    provider: p.provider,
    productId: p.id,
    variants: p.variants,
    soldOut: p.soldOut,
    colours: buildColourSiblings(all, p).map((s) => ({
      name: s.name, hex: s.hex, slug: s.href.replace(/^\/shop\//, ''), current: s.current, soldOut: s.soldOut,
    })),
  }
}

export function toTile(p: ShopProduct, image: string | null, now: number, all: readonly ShopProduct[] = [p]): TileProduct {
  return {
    slug: p.slug,
    href: `/shop/${p.slug}`,
    name: p.name,
    image,
    imageAlt: p.name,
    price: formatPrice(p.priceCents, p.currency),
    badges: tileBadges(p, now),
    note: p.status === 'upcoming' ? `Drops ${formatDropDate(p.drop.window.startsAt)}` : null,
    dropId: p.drop.id,
    category: categoryOf(p.name),
    priceCents: typeof p.priceCents === 'number' && p.priceCents > 0 ? p.priceCents : null,
    quick: toQuickAdd(p, all),
  }
}

/** Tiles with the same background-removed card image as before (Supabase cache, no extra remove.bg calls). */
export async function toTiles(products: ShopProduct[], now: number, all: readonly ShopProduct[] = products): Promise<TileProduct[]> {
  const images = await Promise.all(
    products.map((p) =>
      resolveCardImage({ slug: p.slug, thumbnailUrl: p.thumbnailUrl }).catch(() => p.thumbnailUrl)
    )
  )
  return products.map((p, i) => toTile(p, images[i], now, all))
}
