import type { Metadata } from 'next'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard/ProductCard'
import { getProducts, getProduct } from '@/lib/printful'
import { removeBackground } from '@/lib/remove-bg'
import { resolveHex, applyBrandOverride, resolveDisplayName, isNearWhite, resolveLogoColor } from '@/lib/color-utils'
import type { SyncProduct } from '@/types/printful'
import styles from './shop.module.css'

export const metadata: Metadata = {
  title: 'Shop — 7ENO',
  description: 'Browse the full 7ENO collection.',
}

// ── Custom product catalogue (filter by Printful ID) ──────────────────────────

const SHARED_ACCESSORY_IDS = [
  433354226, 433351639, 433351026, // Headwear
  433344612,                        // Towel
  433353836, 433353269, 433352871, 433352744, 433352490, // Other (phone cases etc.)
]

const WOMEN_ONLY_IDS = [
  433351254, // Loafers (women's footwear)
]

const ACCESSORY_IDS = [...SHARED_ACCESSORY_IDS, ...WOMEN_ONLY_IDS]

const GENDER_IDS: Record<string, number[]> = {
  men: [
    433344927, 433344876, 433344735, 432343313, // Tee Men
    433345077,                                   // Swim Shorts
    433345518, 433345476, 433345296,             // Sport Tee
    433351405, 433351139, 433350977, 433350867,  // Sport Shorts
    ...SHARED_ACCESSORY_IDS,
  ],
  women: [
    433345279, 433345190, 433345163, // Tee Women
    433351920,                        // Bikini
    433345077,                        // Swim Shorts
    433345518, 433345476, 433345296,  // Sport Tee
    433351405, 433351139, 433350977, 433350867, // Sport Shorts
    ...ACCESSORY_IDS,
  ],
}

const LINE_IDS: Record<string, number[]> = {
  // Daily = normal clothing only (no sport, no accessories)
  daily: [
    433345279, 433345190, 433345163, // Tee Women
    433344927, 433344876, 433344735, 432343313, // Tee Men
    433351920,                        // Bikini
    433345077,                        // Swim Shorts
  ],
  // Sport = sport clothing only (no accessories)
  sport: [
    433345518, 433345476, 433345296, // Sport Tee Unisex
    433351405, 433351139, 433350977, 433350867, // Sport Shorts Unisex
  ],
}

const CATEGORY_IDS: Record<string, number[]> = {
  tees:        [433345279, 433345190, 433345163, 433344927, 433344876, 433344735, 432343313, 433345518, 433345476, 433345296],
  shorts:      [433351405, 433351139, 433350977, 433350867],
  swimwear:    [433351920, 433345077],
  accessories: [...ACCESSORY_IDS],
}

// Default display order when no line filter is active
const SORT_PRIORITY: Record<number, number> = {
  // 1. Normal clothing — Women
  433345279: 0, 433345190: 1, 433345163: 2,
  // 1. Normal clothing — Men
  433344927: 3, 433344876: 4, 433344735: 5, 432343313: 6,
  // 2. Sportswear
  433345518: 10, 433345476: 11, 433345296: 12,
  433351405: 13, 433351139: 14, 433350977: 15, 433350867: 16,
  // 3. Swimwear
  433351920: 20, 433345077: 21,
  // 4. Accessories
  433354226: 30, 433351639: 31, 433351026: 32,
  433351254: 33,
  433344612: 34, // Towel
  433353836: 40, 433353269: 41, 433352871: 42, 433352744: 43, 433352490: 44,
}

const NO_LINE_CATEGORIES = new Set(['swimwear', 'accessories'])

function buildHref(params: { gender?: string; line?: string; category?: string }) {
  const parts: string[] = []
  if (params.gender)   parts.push(`gender=${params.gender}`)
  if (params.line)     parts.push(`line=${params.line}`)
  if (params.category) parts.push(`category=${params.category}`)
  return `/shop${parts.length ? `?${parts.join('&')}` : ''}`
}

interface Props {
  searchParams: Promise<{ gender?: string; line?: string; category?: string }>
}

export default async function ShopPage({ searchParams }: Props) {
  const { gender = '', line = '', category = '' } = await searchParams

  let allProducts: SyncProduct[] = []
  try {
    allProducts = await getProducts()
  } catch (err) {
    console.error('[Printful] getProducts failed:', err)
  }

  let products = [...allProducts]

  // 1. Gender filter
  if (gender && GENDER_IDS[gender]) {
    const ids = new Set(GENDER_IDS[gender])
    products = products.filter((p) => ids.has(p.id))
  }

  // 2. Line filter — skip for categories that have no daily/sport split
  const effectiveLine = NO_LINE_CATEGORIES.has(category) ? '' : line
  if (effectiveLine && LINE_IDS[effectiveLine]) {
    const ids = new Set(LINE_IDS[effectiveLine])
    products = products.filter((p) => ids.has(p.id))
  }

  // 3. Category filter
  if (category && CATEGORY_IDS[category]) {
    const ids = new Set(CATEGORY_IDS[category])
    products = products.filter((p) => ids.has(p.id))
  }

  // 4. Sort: normal clothing → sportswear → swimwear → accessories
  products.sort((a, b) =>
    (SORT_PRIORITY[a.id] ?? 99) - (SORT_PRIORITY[b.id] ?? 99)
  )

  // Remove.bg + color swatches in parallel for all filtered products
  const [bgRemovedUrls, productInfoMap] = await Promise.all([
    Promise.all(
      products.map((p) =>
        p.thumbnail_url ? removeBackground(p.thumbnail_url) : Promise.resolve(null)
      )
    ),
    Promise.all(
      products.map((p) =>
        getProduct(String(p.id))
          .then(async ({ sync_variants }) => {
            // Collect definitively-colored hexes (non-near-white) — used to prevent
            // brand override from duplicating a color already shown by another swatch.
            const skipHexes = new Set<string>()
            for (const v of sync_variants) {
              if (!v.color) continue
              const h = resolveHex(v.color, v.color_code ?? '')
              if (!isNearWhite(h)) skipHexes.add(h)
            }

            const seen = new Set<string>()
            const raw: { color: string; hex: string; hex2?: string; imageUrl?: string | null; displayName: string }[] = []
            for (const v of sync_variants) {
              if (v.color && !seen.has(v.color)) {
                seen.add(v.color)
                const rawHex = resolveHex(v.color, v.color_code ?? '')
                const hex = applyBrandOverride(p.name, rawHex, v.color, skipHexes)
                const displayName = resolveDisplayName(v.color, rawHex, hex, p.name)
                const naturalHex2 = v.color_code2 ? resolveHex('', v.color_code2) : null
                const logoHex = resolveLogoColor(p.name, hex)
                const hex2 = (naturalHex2 && naturalHex2 !== hex) ? naturalHex2 : (logoHex !== hex ? logoHex : undefined)
                const previewFile =
                  v.files?.find((f) => f.type === 'preview') ??
                  v.files?.find((f) => f.type === 'default') ??
                  v.files?.[0] ??
                  null
                const swatchImageUrl = previewFile?.preview_url ?? previewFile?.url ?? null
                raw.push({ color: v.color, hex, hex2, imageUrl: swatchImageUrl, displayName })
              }
            }
            // Deduplicate by resolved hex — prevents duplicate paper swatches when multiple
            // Printful color names map to the same final color (e.g. "Blood" + "White" → paper)
            const seenHex = new Set<string>()
            const deduped = raw.filter((s) => {
              if (seenHex.has(s.hex)) return false
              seenHex.add(s.hex)
              return true
            })

            // Remove background from swatch images (skip index 0 — same as default card photo)
            const swatches = await Promise.all(
              deduped.map(async (s, i) => {
                if (i === 0 || !s.imageUrl) return s
                const processed = await removeBackground(s.imageUrl)
                return { ...s, imageUrl: processed ?? s.imageUrl }
              })
            )
            const firstVariant = sync_variants[0]
            return { id: p.id, swatches, price: firstVariant?.retail_price, currency: firstVariant?.currency }
          })
          .catch(() => ({ id: p.id, swatches: [], price: undefined, currency: undefined }))
      )
    ).then((entries) => Object.fromEntries(entries.map((e) => [e.id, e]))),
  ])

  const genderFilters = [
    { label: 'All',   href: buildHref({ line, category }),                   active: !gender },
    { label: 'Men',   href: buildHref({ gender: 'men',   line, category }),  active: gender === 'men' },
    { label: 'Women', href: buildHref({ gender: 'women', line, category }),  active: gender === 'women' },
  ]

  const lineFilters = [
    { label: 'All lines', href: buildHref({ gender, category }),                   active: !line || NO_LINE_CATEGORIES.has(category) },
    { label: 'Daily',     href: buildHref({ gender, line: 'daily', category }),    active: line === 'daily' && !NO_LINE_CATEGORIES.has(category) },
    { label: 'Sport',     href: buildHref({ gender, line: 'sport', category }),    active: line === 'sport' && !NO_LINE_CATEGORIES.has(category) },
  ]

  const categoryFilters = [
    { label: 'All',         href: buildHref({ gender, line }),                                           active: !category },
    { label: 'Tees',        href: buildHref({ gender, line, category: 'tees' }),                         active: category === 'tees' },
    { label: 'Shorts',      href: buildHref({ gender, line, category: 'shorts' }),                       active: category === 'shorts' },
    { label: 'Swimwear',    href: buildHref({ gender, category: 'swimwear' }),                           active: category === 'swimwear' },
    { label: 'Accessories', href: buildHref({ gender, category: 'accessories' }),                        active: category === 'accessories' },
  ]

  const titleParts: string[] = []
  if (gender === 'men') titleParts.push('Men')
  else if (gender === 'women') titleParts.push('Women')
  const lineLabels: Record<string, string> = { daily: 'Daily', sport: 'Sport' }
  if (line && lineLabels[line] && !NO_LINE_CATEGORIES.has(category)) titleParts.push(lineLabels[line])
  const categoryLabels: Record<string, string> = { tees: 'Tees', shorts: 'Shorts', swimwear: 'Swimwear', accessories: 'Accessories' }
  if (category && categoryLabels[category]) titleParts.push(categoryLabels[category])
  const pageTitle = titleParts.length > 0 ? titleParts.join(' ') : 'The Collection'

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.headerLabel}>by Abra Entertainment</p>
            <h1 className={styles.title}>{pageTitle}</h1>
          </div>
        </div>

<div className={styles.filterBar} role="navigation" aria-label="Filters">
          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>Gender</span>
            <div className={styles.filterLinks}>
              {genderFilters.map((f) => (
                <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>Line</span>
            <div className={styles.filterLinks}>
              {lineFilters.map((f) => (
                <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterGroupLabel}>Category</span>
            <div className={styles.filterLinks}>
              {categoryFilters.map((f) => (
                <Link key={f.label} href={f.href} className={f.active ? `${styles.filter} ${styles.filterActive}` : styles.filter}>
                  {f.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No products yet.</p>
          <p className={styles.emptySub}>The collection is being assembled. Check back soon.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} imageUrl={bgRemovedUrls[i]} colorSwatches={productInfoMap[p.id]?.swatches} price={productInfoMap[p.id]?.price} currency={productInfoMap[p.id]?.currency} />
          ))}
        </div>
      )}
    </main>
  )
}
