import type { ShopProduct } from '@/lib/catalog'
import { OLYMPIAN_COLORWAYS } from '@/lib/color-utils'
import { colourLabel, colourRank, familyKey } from '@/lib/drops'

/** One colour of a product family; each colour is its own product (spec section 5). */
export interface ColourSibling {
  name: string
  hex: string
  href: string
  current: boolean
  soldOut: boolean
}

/** Swatch colours by lowercase colour name: the hoodie palette (spec section 2) and the Olympian colourways. */
export const SWATCH_HEX: Readonly<Record<string, string>> = {
  'rose red': '#621926',
  pistachio: '#9CAF92',
  mocha: '#9E7551',
  obsidian: '#0E0B0B',
  dune: '#C3B99C',
  olive: '#3C3D2E',
  maritime: '#071429',
  ...Object.fromEntries(OLYMPIAN_COLORWAYS.map((c) => [c.key, c.hex])),
}

/** --c-stone: a neutral swatch for a colour that is named but not in the palette yet. */
const FALLBACK_HEX = '#C4C4B5'

/**
 * The colours of `current`'s product family within its drop, in the drop's
 * colourOrder. Sold-out colours stay in the list: their page offers the waitlist.
 */
export function buildColourSiblings(products: readonly ShopProduct[], current: ShopProduct): ColourSibling[] {
  if (colourLabel(current.drop, current.name) === null) return []
  const family = familyKey(current.drop, current.name)
  const members = products.filter(
    (p) =>
      p.drop.id === current.drop.id &&
      familyKey(p.drop, p.name) === family &&
      colourLabel(p.drop, p.name) !== null
  )
  if (members.length < 2) return []
  return [...members]
    .sort((a, b) => colourRank(a.drop, a.name) - colourRank(b.drop, b.name))
    .map((p) => {
      const name = colourLabel(p.drop, p.name) as string
      return {
        name,
        hex: SWATCH_HEX[name.toLowerCase()] ?? FALLBACK_HEX,
        href: `/shop/${p.slug}`,
        current: p.provider === current.provider && p.id === current.id,
        soldOut: p.soldOut,
      }
    })
}
