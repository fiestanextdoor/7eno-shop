// ── Keyword-based classification ──────────────────────────────────────────────
// Products are classified from keywords in their name, so a product added in
// Printful lands in the right filters automatically (no code change), provided
// its name contains the relevant words (e.g. "Tee", "Shorts", "Men", "Sport",
// "Cap"). Shared by the shop filters and the Google Merchant Center feed, so
// both describe a product the same way.

/**
 * Sizes the storefront hides (see ProductDetail / QuickAddCard). The Merchant
 * Center feed skips them too: advertising a size a shopper can't then pick on
 * the product page is both a bad landing and a Merchant Center policy risk.
 */
export const HIDDEN_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

export interface Classification {
  isWomen: boolean
  isMen: boolean
  isUnisex: boolean
  isTee: boolean
  isShorts: boolean
  isSwim: boolean
  isTowel: boolean
  isAccessory: boolean
  isClothing: boolean
  isSport: boolean
  isOlympian: boolean
}

const ACCESSORY_KEYWORDS = [
  'cap', 'beanie', 'hat', 'backpack', 'bag', 'tote', 'towel', 'phone', 'case',
  'mug', 'mouse', 'desk mat', 'loafer', 'sock', 'sticker', 'poster', 'sandal',
]

// Products whose name doesn't encode gender (e.g. Printify swimwear comes through
// as "7ENO Bikini" / "7ENO Swim Shorts"). Force the gender so the Men/Women filter
// behaves: a bikini is women-only, swim shorts are men-only. Matched on a lowercased
// substring of the product name.
const GENDER_OVERRIDES: Array<{ match: string; gender: 'men' | 'women' | 'unisex' }> = [
  { match: 'bikini', gender: 'women' },
  { match: 'swim shorts', gender: 'men' },
]

/**
 * Display order inside the Olympian collection.
 *
 * The grid is four columns wide on desktop and the collection has exactly four
 * colourways, so ordering type-major (knitted tees, then tees, then backpacks)
 * and colour-minor puts one product type on each row and one colourway in each
 * column — the pieces line up vertically by colour.
 *
 * Anything that matches neither list sorts to the end of its group rather than
 * jumping to the front, so a newly published Olympian piece never breaks the
 * grid before it is given a place here.
 */
const OLYMPIAN_COLOUR_ORDER = ['ocean', 'coconut', 'sand', 'flamingo']

export function olympianSortRank(name: string): number {
  const n = name.toLowerCase()
  // "Knitted Tee" also contains "tee", so the knitted check has to come first.
  const type = n.includes('knitted') ? 0 : n.includes('backpack') ? 2 : 1
  const colour = OLYMPIAN_COLOUR_ORDER.findIndex((c) => n.includes(c))
  return type * 10 + (colour === -1 ? OLYMPIAN_COLOUR_ORDER.length : colour)
}

export function classify(name: string): Classification {
  const n = name.toLowerCase()
  const genderOverride = GENDER_OVERRIDES.find((o) => n.includes(o.match))?.gender
  const isWomen = genderOverride ? genderOverride === 'women' : n.includes('women')
  const isMen = genderOverride ? genderOverride === 'men' : (n.includes('men') && !n.includes('women'))
  const isUnisex = genderOverride ? genderOverride === 'unisex' : n.includes('unisex')
  // The Life4HSP charity collab is a sport tee: pin it to the tees category and
  // the sport line (and the sportswear sort block below) regardless of how the
  // provider names it, so it always sits next to the other sport shirts.
  const isTee = n.includes('tee') || n.includes('shirt') || n.includes('life4hsp')
  const isSwim = n.includes('swim') || n.includes('bikini')
  const isShorts = n.includes('shorts') && !isSwim
  // A beach towel belongs in swimwear too, but is not "clothing" — keep it out
  // of isClothing so it doesn't leak into the Daily/Sport line filters.
  const isTowel = n.includes('towel')
  const isAccessory = ACCESSORY_KEYWORDS.some((k) => n.includes(k))
  const isClothing = isTee || isShorts || isSwim
  const isSport = n.includes('sport') || n.includes('life4hsp')
  // Collection split: anything named "Olympian" is the Olympian capsule; the
  // rest is the original ("OG") 7ENO range.
  const isOlympian = n.includes('olympian')
  return { isWomen, isMen, isUnisex, isTee, isShorts, isSwim, isTowel, isAccessory, isClothing, isSport, isOlympian }
}
