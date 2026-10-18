import type { FilterGroup } from '@/lib/filter-types'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type DropId, type DropStatus } from '@/lib/drops'
import { CATEGORIES, matchesCategory, type Category } from '@/lib/product-category'
import type { TileProduct } from '@/lib/tiles'

export type RawSearchParams = Record<string, string | string[] | undefined>

export { CATEGORIES, matchesCategory, type Category }

export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
] as const
export type SortKey = (typeof SORTS)[number]['value']

export interface ShopQuery {
  collection: DropId | null
  category: Category | null
  sort: SortKey
}

export interface SortOption {
  value: SortKey
  label: string
  href: string
}

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return (raw ?? '').trim().toLowerCase()
}

/** Only the v2 parameters; ?gender and ?line are ignored (spec section 3). */
export function parseShopQuery(params: RawSearchParams): ShopQuery {
  const collection = first(params.collection)
  const category = first(params.category)
  const sort = first(params.sort)
  return {
    collection: DROPS.find((d) => d.id === collection)?.id ?? null,
    category: CATEGORIES.find((c) => c.value === category)?.value ?? null,
    sort: SORTS.find((s) => s.value === sort)?.value ?? 'featured',
  }
}

function priceOf(p: ShopProduct): number | null {
  return typeof p.priceCents === 'number' && p.priceCents > 0 ? p.priceCents : null
}

/** Featured keeps the catalogue order; price sorts put an unknown price last. */
function sortByQuery<T>(list: T[], query: ShopQuery, price: (item: T) => number | null): T[] {
  if (query.sort === 'featured') return list
  const direction = query.sort === 'price-asc' ? 1 : -1
  return [...list].sort((a, b) => {
    const pa = price(a)
    const pb = price(b)
    if (pa === null && pb === null) return 0
    if (pa === null) return 1
    if (pb === null) return -1
    return (pa - pb) * direction
  })
}

export function applyShopQuery(products: ShopProduct[], query: ShopQuery): ShopProduct[] {
  const filtered = products.filter(
    (p) =>
      (query.collection === null || p.drop.id === query.collection) &&
      (query.category === null || matchesCategory(p.name, query.category))
  )
  return sortByQuery(filtered, query, priceOf)
}

/** The same filter and sort on resolved tiles, so the shop can filter in the browser without a round trip. */
export function applyTileQuery(tiles: TileProduct[], query: ShopQuery): TileProduct[] {
  const filtered = tiles.filter(
    (t) =>
      (query.collection === null || t.dropId === query.collection) &&
      (query.category === null || t.category === query.category)
  )
  return sortByQuery(filtered, query, (t) => t.priceCents)
}

/** What the filter chips need to know about a drop; serialisable, so the server can hand it to the client. */
export interface FilterDrop {
  id: DropId
  slug: string
  title: string
  edition: number
  status?: DropStatus
}

export function shopHref(query: ShopQuery): string {
  const params = new URLSearchParams()
  if (query.collection) params.set('collection', query.collection)
  if (query.category) params.set('category', query.category)
  if (query.sort !== 'featured') params.set('sort', query.sort)
  const search = params.toString()
  return search ? `/shop?${search}` : '/shop'
}

/** Chips for the FilterBar, in the URL-state shape from lib/filter-types.ts. */
export function buildFilterGroups(query: ShopQuery, drops: readonly FilterDrop[] = DROPS): FilterGroup[] {
  const newestFirst = [...drops].sort((a, b) => b.edition - a.edition)
  return [
    {
      label: 'Collection',
      items: [
        { label: 'All', href: shopHref({ ...query, collection: null }), active: query.collection === null },
        ...newestFirst.map((d) => ({
          label: d.title,
          href: shopHref({ ...query, collection: d.id }),
          active: query.collection === d.id,
        })),
      ],
    },
    {
      label: 'Category',
      items: [
        { label: 'All', href: shopHref({ ...query, category: null }), active: query.category === null },
        ...CATEGORIES.map((c) => ({
          label: c.label,
          href: shopHref({ ...query, category: c.value }),
          active: query.category === c.value,
        })),
      ],
    },
  ]
}

export function buildSortOptions(query: ShopQuery): SortOption[] {
  return SORTS.map((s) => ({ value: s.value, label: s.label, href: shopHref({ ...query, sort: s.value }) }))
}

export function describeShopQuery(query: ShopQuery): { title: string; description: string } {
  const collection = DROPS.find((d) => d.id === query.collection)?.title
  const category = CATEGORIES.find((c) => c.value === query.category)?.label
  if (!collection && !category) {
    return {
      title: 'Shop all',
      description:
        'Shop every live 7ENO (Zeno) edition, Olympian and OLYMPN Sport, by Abra Entertainment. Free shipping over €75.',
    }
  }
  const label = [collection, category].filter(Boolean).join(' ')
  return {
    title: label,
    description: `Shop ${label} from 7ENO (Zeno), the official streetwear store by Abra Entertainment. Free shipping over €75.`,
  }
}
