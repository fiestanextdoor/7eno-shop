// Shared color resolution — used on shop grid and product detail page.
// Printful's color_code field is unreliable (often returns #FFFFFF or #000000
// regardless of actual garment color), so name lookup is always preferred.

export const COLOR_HEX: Record<string, string> = {
  // Blacks & dark neutrals
  'black':              '#111111',  // Printful "Black" → 7ENO Ink dark
  'jet black':          '#111111',
  'solid black':        '#111111',
  'true black':         '#111111',
  'all black':          '#111111',
  'flat black':         '#111111',
  'deep black':         '#111111',
  'vintage black':      '#1A1A1A',
  'black heather':      '#2E2E2E',
  'dark heather':       '#3D3D3D',
  'charcoal':           '#3D3D3D',
  'charcoal grey':      '#3D3D3D',
  'charcoal gray':      '#3D3D3D',

  // 7ENO brand lights
  // "Ink" in Printful = white/paper garment with ink design printed on it
  'ink':                '#EDE8DD',  // Printful "Ink" variant → paper fabric
  'butter':             '#EDE8DC',  // warm vintage-white 7ENO butter shade
  'paper':              '#EDE8DD',
  'white':              '#EDE8DD',  // Printful "White" → show as 7ENO paper
  'vintage white':      '#EDE8DC',  // Printful "Vintage White" → butter
  'antique white':      '#F5EFE0',
  'natural':            '#F0EAD6',
  'ivory':              '#F5F0E0',
  'cream':              '#F2EBD9',
  'bone':               '#F6F3EC',
  'ash':                '#E8E4DC',
  'silver':             '#B0B0B0',

  // Greys
  'grey':               '#8A8A8A',
  'gray':               '#8A8A8A',
  'stone':              '#8A8275',
  'heather grey':       '#C0BEB8',
  'heather gray':       '#C0BEB8',
  'heather stone':      '#A89F95',
  'sport grey':         '#BEBEBE',
  'athletic heather':   '#AFAFAF',
  'light grey':         '#D4D4D0',
  'light gray':         '#D4D4D0',
  'slate':              '#6A737D',

  // Blues & navies
  'navy':               '#1B2A4A',
  'navy blue':          '#1B2A4A',
  'french navy':        '#0C1E35',
  'dark navy':          '#0A1628',
  'heather navy':       '#2E3D5A',
  'royal blue':         '#2756C5',
  'blue':               '#2563EB',
  'light blue':         '#93C5FD',
  'sky blue':           '#38BDF8',
  'indigo':             '#3730A3',
  'denim':              '#1560BD',
  'teal':               '#0F766E',

  // Greens
  'forest green':       '#1A4731',
  'military green':     '#4B5320',
  'olive':              '#6B7A35',
  'kelly green':        '#16A34A',
  'green':              '#16A34A',
  'sage':               '#9CAF88',
  'camo':               '#78866B',

  // Reds, pinks & brand accents
  'red':                '#B91C1C',
  'blood':              '#5C1A1B',
  'oxblood':            '#5C1A1B',
  'maroon':             '#7F1D1D',
  'burgundy':           '#6B1A1A',
  'wine':               '#722F37',
  'pink':               '#F472B6',
  'light pink':         '#FBCFE8',
  'mauve':              '#B08090',
  'rose':               '#F43F5E',
  'coral':              '#F97316',

  // Yellows, oranges, browns & 7ENO accents
  'yellow':             '#FACC15',
  'gold':               '#D97706',
  'coin':               '#C4A860',
  'carrot':             '#D4622A',
  'orange':             '#EA580C',
  'camel':              '#D4622A',  // Printful "Camel" → 7ENO Carrot
  'khaki':              '#C4A265',
  'sand':               '#C8A96E',
  'tan':                '#C8A878',
  'brown':              '#78350F',
  'caramel':            '#B87333',

  // Purples
  'purple':             '#7C3AED',
  'lavender':           '#C4B5FD',
  'violet':             '#8B5CF6',
}

// Printful color name → 7ENO brand display name.
// Used when the Printful name differs from how 7ENO labels the color.
const PRINTFUL_TO_BRAND_NAME: Record<string, string> = {
  'black': 'Ink',    // Printful "Black" fabric → 7ENO calls it "Ink"
  'ink':   'Paper',  // Printful "Ink" variant → garment is paper-colored
  'camel': 'Carrot', // Printful "Camel" → 7ENO calls it "Carrot"
}

// 7ENO brand color keywords in priority order.
// When Printful reports a generic near-white fabric color ("White"), read the product name
// and use the FIRST matching keyword to determine the actual garment color.
// "ink" is intentionally excluded — it now resolves to paper on its own.
const BRAND_COLOR_KEYS = [
  'butter', 'stone', 'blood', 'bone', 'carrot', 'coin',
]

// Brand color keywords for logo/design color resolution (separate from garment colors).
// Priority: accent colors first, ink (dark design) last.
const LOGO_COLOR_KEYS = ['blood', 'stone', 'carrot', 'coin', 'butter', 'bone', 'ink']
const LOGO_COLOR_HEX: Record<string, string> = {
  'blood':  '#5C1A1B',
  'stone':  '#8A8275',
  'carrot': '#D4622A',
  'coin':   '#C4A860',
  'butter': '#EDE8DC',
  'bone':   '#F6F3EC',
  'ink':    '#111111', // "ink" as logo/design = dark ink
}

// Explicit brand swatch colours for products whose provider data doesn't encode
// the 7ENO colourway in the product name or variant colour (e.g. swimwear, which
// comes through as plain "Black" / "White drawstring"). Keyed by a lowercased
// substring of the product name. hex = top-left, hex2 = bottom-right.
const BRAND_SWATCH_OVERRIDES: Array<{ match: string; hex: string; hex2: string }> = [
  { match: 'bikini',      hex: '#5C1A1B', hex2: '#EDE8DC' }, // Blood → Butter
  { match: 'swim shorts', hex: '#5C1A1B', hex2: '#EDE8DC' }, // Blood → Butter
]

/**
 * Olympian '26 colourways. Each colourway is published as its own Printful
 * product (the name carries the colourway word, e.g. "Olympian Tee Ocean
 * Unisex"), so colours can't come from variant data — they map from the name
 * to the brand palette instead. Array order is the display order for swatches.
 */
export const OLYMPIAN_COLORWAYS: Array<{ key: string; name: string; hex: string }> = [
  { key: 'coconut',  name: 'Coconut',  hex: '#b57446' },
  { key: 'ocean',    name: 'Ocean',    hex: '#297d95' },
  { key: 'sand',     name: 'Sand',     hex: '#eddca2' },
  { key: 'flamingo', name: 'Flamingo', hex: '#eda5b2' },
]

/** The Olympian colourway named in an Olympian product name, or null. */
export function olympianColorway(productName: string): { key: string; name: string; hex: string } | null {
  const n = productName.toLowerCase()
  if (!n.includes('olympian')) return null
  return OLYMPIAN_COLORWAYS.find((c) => n.includes(c.key)) ?? null
}

/**
 * Forced two-tone swatch colours for a product, or null when no override applies.
 * Lets us present brand colourways the provider data can't express on its own.
 */
export function brandSwatchOverride(productName: string): { hex: string; hex2: string } | null {
  // Olympian colourways are solid brand colours (hex2 = hex → solid chip).
  const oly = olympianColorway(productName)
  if (oly) return { hex: oly.hex, hex2: oly.hex }

  const n = productName.toLowerCase()
  for (const o of BRAND_SWATCH_OVERRIDES) {
    if (n.includes(o.match)) return { hex: o.hex, hex2: o.hex2 }
  }
  return null
}

export function resolveHex(colorName: string, colorCode: string): string {
  const key = colorName.toLowerCase().trim()
  if (key && COLOR_HEX[key]) return COLOR_HEX[key]
  if (colorCode && colorCode.startsWith('#') && colorCode !== '#FFFFFF') {
    // Treat #000000 as ink-dark — Printful uses it for confirmed-black fabrics
    if (colorCode === '#000000') return '#111111'
    return colorCode
  }
  return '#888888'
}

// Returns true when hex is very light (r, g, b all > 200).
export function isNearWhite(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r > 200 && g > 200 && b > 200
}

// Returns true when hex is very dark — black, navy, dark charcoal, etc. (max channel < 80).
function isVeryDark(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return Math.max(r, g, b) < 80
}

// Returns the human-readable display name for a swatch.
export function resolveDisplayName(
  printfulColorName: string,
  originalHex: string,
  finalHex: string,
  productName: string
): string {
  // Olympian products: the colourway in the product name IS the colour.
  const oly = olympianColorway(productName)
  if (oly) return oly.name

  // Direct Printful → brand name remapping takes priority
  const key = printfulColorName.toLowerCase().trim()
  if (PRINTFUL_TO_BRAND_NAME[key]) return PRINTFUL_TO_BRAND_NAME[key]
  if (finalHex === originalHex) return printfulColorName
  const nameLower = productName.toLowerCase()
  for (const bk of BRAND_COLOR_KEYS) {
    if (nameLower.includes(bk) && COLOR_HEX[bk] === finalHex) {
      return bk.charAt(0).toUpperCase() + bk.slice(1)
    }
  }
  return printfulColorName
}

// Returns the logo/design color to pair with a garment color in a two-tone swatch.
// Parses brand color keywords from the product name and returns the one that
// differs from the garmentHex. Falls back to paper for dark garments, ink for light.
export function resolveLogoColor(productName: string, garmentHex: string): string {
  const nameLower = productName.toLowerCase()
  for (const key of LOGO_COLOR_KEYS) {
    if (!nameLower.includes(key)) continue
    const hex = LOGO_COLOR_HEX[key]
    if (hex && hex !== garmentHex) return hex
  }
  // Default: dark garment → paper logo, light/mid garment → ink logo
  if (isVeryDark(garmentHex) || (!isNearWhite(garmentHex) && garmentHex !== '#888888')) {
    return COLOR_HEX['paper'] ?? '#EDE8DD'
  }
  return COLOR_HEX['black'] ?? '#111111'
}
