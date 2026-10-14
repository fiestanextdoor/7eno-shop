/**
 * Product kind from the name (spec section 4): drives the shop categories and
 * the Merchant Center taxonomy. Collections come from lib/drops.ts, never from
 * keywords here.
 */

/**
 * Sizes the storefront hides (see ProductDetail / QuickAddCard). The Merchant
 * Center feed skips them too: advertising a size a shopper can't then pick on
 * the product page is both a bad landing and a Merchant Center policy risk.
 */
export const HIDDEN_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

export interface Classification {
  isTee: boolean
  isKnit: boolean
  isHoodie: boolean
  isBag: boolean
}

export function classify(name: string): Classification {
  const n = name.toLowerCase()
  const isKnit = /\bknit(ted)?\b/.test(n)
  const isHoodie = /\bhood(ie|y)\b/.test(n)
  const isBag = /\b(backpack|bag|tote)\b/.test(n)
  // A knitted tee is a knit, not a tee: each piece sits in exactly one category.
  const isTee = !isKnit && !isHoodie && /\b(tee|t-shirt|shirt)\b/.test(n)
  return { isTee, isKnit, isHoodie, isBag }
}
