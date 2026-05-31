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

// Printful color names that are generic fabric defaults (not intentional brand colors).
// Only these trigger the brand override when near-white.
const PRINTFUL_GENERIC_COLORS = new Set(['white'])

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

// 7ENO brand colour vocabulary used in product names. The detail page labels a
// variant's colour with the nearest of these (e.g. "Butter", "Blood", "Ink",
// "Stone") instead of Printful's fabric name like "Vintage White".
const BRAND_PALETTE: Array<{ name: string; hex: string }> = [
  { name: 'Ink',    hex: '#111111' },
  { name: 'Blood',  hex: '#5C1A1B' },
  { name: 'Stone',  hex: '#8A8275' },
  { name: 'Butter', hex: '#EDE8DC' },
  { name: 'Carrot', hex: '#D4622A' },
  { name: 'Coin',   hex: '#C4A860' },
]

/** Nearest 7ENO brand colour name for a resolved hex (by RGB distance). */
export function brandColorName(hex: string): string {
  const c = hex.startsWith('#') && hex.length >= 7 ? hex : '#888888'
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  let best = BRAND_PALETTE[0]
  let bestDist = Infinity
  for (const p of BRAND_PALETTE) {
    const pr = parseInt(p.hex.slice(1, 3), 16)
    const pg = parseInt(p.hex.slice(3, 5), 16)
    const pb = parseInt(p.hex.slice(5, 7), 16)
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best.name
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

// When Printful returns a generic near-white fabric color, read the FIRST 7ENO brand
// keyword from the product name and use that color instead.
// colorName: the raw Printful color_name — intentional near-whites (ink, bone, etc.)
// are left unchanged; only generic defaults like "White" trigger the override.
// skipHexes: hexes already shown by other swatches on this product.
// When the override target is already covered, return rawHex (paper) instead.
export function applyBrandOverride(
  productName: string,
  resolvedHex: string,
  colorName = '',
  skipHexes?: Set<string>
): string {
  const key = colorName.toLowerCase().trim()
  const nameLower = productName.toLowerCase()

  // Ink Sport Tee: these products come in multiple genuine garment colors (black, blood,
  // stone, paper). Never override any variant — each color is an intentional garment color.
  // Specifically: near-white variants ARE the paper shirt (not a generic placeholder).
  if (nameLower.includes('ink') && nameLower.includes('sport') && nameLower.includes('tee')) {
    return resolvedHex
  }

  if (!isNearWhite(resolvedHex)) return resolvedHex
  // If the color name is a known intentional near-white, don't override
  if (key && COLOR_HEX[key] && !PRINTFUL_GENERIC_COLORS.has(key)) return resolvedHex
  for (const bk of BRAND_COLOR_KEYS) {
    if (nameLower.includes(bk) && COLOR_HEX[bk]) {
      const target = COLOR_HEX[bk]
      if (skipHexes?.has(target)) return resolvedHex
      return target
    }
  }
  return resolvedHex
}

// Returns the human-readable display name for a swatch.
export function resolveDisplayName(
  printfulColorName: string,
  originalHex: string,
  finalHex: string,
  productName: string
): string {
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

// Returns a CSS background value for a color swatch.
// Always shows a diagonal two-tone split: garment color + logo/design color.
export function resolveSwatchBackground(
  colorName: string,
  colorCode: string,
  colorCode2: string | null | undefined,
  productName = '',
  skipHexes?: Set<string>
): string {
  const rawHex = resolveHex(colorName, colorCode)
  const hex1 = applyBrandOverride(productName, rawHex, colorName, skipHexes)

  // Determine the second color for the diagonal swatch.
  // hex1 (garment) is ALWAYS top-left; the second color goes bottom-right.
  let hex2: string | null = null

  // Physical two-tone garment (color_code2)
  if (colorCode2 && colorCode2.startsWith('#') && colorCode2 !== '#000000' && colorCode2 !== '#FFFFFF') {
    if (colorCode2 !== hex1) hex2 = colorCode2
  }

  // Compound Printful color name (e.g. "Butter Stone", "Ink/Blood").
  // Always pick the part that differs from hex1 (garment) as the second color.
  if (!hex2) {
    const parts = colorName.toLowerCase().split(/[^a-z]+/).filter(Boolean)
    if (parts.length >= 2) {
      const ha = COLOR_HEX[parts[0]]
      const hb = COLOR_HEX[parts[1]]
      if (ha && hb && ha !== hb) {
        hex2 = ha !== hex1 ? ha : hb
      }
    }
  }

  // Logo/design color as second half
  if (!hex2 && productName) {
    const logoHex = resolveLogoColor(productName, hex1)
    if (logoHex !== hex1) hex2 = logoHex
  }

  return hex2 ? `linear-gradient(135deg, ${hex1} 50%, ${hex2} 50%)` : hex1
}
