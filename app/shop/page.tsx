import type { Metadata } from 'next'
import ProductCard from '@/components/ProductCard/ProductCard'
import ShopFilters from '@/components/ShopFilters/ShopFilters'
import { getCatalogProducts, getCatalogProduct, isInStock } from '@/lib/catalog'
import { getProductCardImages } from '@/lib/product-images'
import { getBundlesForProduct } from '@/lib/bundles'
import { productSlug } from '@/lib/slug'
import { removeBackground } from '@/lib/remove-bg'
import { resolveHex, applyBrandOverride, resolveDisplayName, isNearWhite, resolveLogoColor, brandSwatchOverride } from '@/lib/color-utils'
import { BASE_URL, BRAND_KEYWORDS, absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
import type { NormalizedProduct } from '@/types/catalog'
import styles from './shop.module.css'

/**
 * Per-filter titles and descriptions. A shop that serves one generic title for
 * every filter combination competes with itself; giving the collection views
 * their own copy is what lets "Olympian" or "men's streetwear" rank at all.
 */
function describeFilters(gender: string, line: string, category: string): { title: string; description: string } {
  const lineLabel = line === 'olympian' ? 'Olympian' : line === 'og' ? 'OG' : ''
  const genderLabel = gender === 'men' ? "Men's" : gender === 'women' ? "Women's" : ''
  const categoryLabel: Record<string, string> = {
    tees: 'Tees', shorts: 'Shorts', swimwear: 'Swimwear', accessories: 'Accessories',
  }
  const parts = [genderLabel, lineLabel, categoryLabel[category] ?? ''].filter(Boolean)

  if (parts.length === 0) {
    return {
      title: 'Shop all streetwear',
      description:
        'Browse the full 7ENO (Zeno) collection: OG and Olympian streetwear by Abra Entertainment. Free shipping over €75.',
    }
  }
  const label = parts.join(' ')
  return {
    title: `${label} streetwear`,
    description: `Shop ${label} pieces from 7ENO (Zeno), the official streetwear store by Abra Entertainment. Free shipping over €75.`,
  }
}

interface MetaProps {
  searchParams: Promise<{ gender?: string; line?: string; category?: string }>
}

export async function generateMetadata({ searchParams }: MetaProps): Promise<Metadata> {
  const { gender = '', line = '', category = '' } = await searchParams
  const { title, description } = describeFilters(gender, line, category)

  // Line views are real landing pages and get a self-canonical (they're in the
  // sitemap). Every other filter combination points back at /shop so the same
  // products don't compete as near-duplicate URLs.
  const isLineLanding = (line === 'olympian' || line === 'og') && !gender && !category
  const canonical = isLineLanding ? `/shop?line=${line}` : '/shop'

  return {
    title,
    description,
    keywords: BRAND_KEYWORDS,
    alternates: { canonical },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description, url: absoluteUrl(canonical), type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · 7ENO (Zeno)`, description },
  }
}

// ── Keyword-based classification ──────────────────────────────────────────────
// Products are filtered from keywords in their name, so a product added in
// Printful shows up under the right filters automatically (no code change),
// provided its name contains the relevant words (e.g. "Tee", "Shorts", "Men",
// "Sport", "Cap").

interface Classification {
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

function classify(name: string): Classification {
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

function inGender(gender: string, c: Classification): boolean {
  // Unisex and genderless accessories show under both; women-only is excluded
  // from men and vice versa.
  if (gender === 'men') return c.isUnisex || !c.isWomen
  if (gender === 'women') return c.isUnisex || !c.isMen
  return true
}

function inLine(line: string, c: Classification): boolean {
  if (line === 'olympian') return c.isOlympian
  if (line === 'og') return !c.isOlympian
  return true
}

function inCategory(category: string, c: Classification): boolean {
  switch (category) {
    case 'tees': return c.isTee
    case 'shorts': return c.isShorts
    case 'swimwear': return c.isSwim || c.isTowel
    case 'accessories': return c.isAccessory
    default: return true
  }
}

// Default display order when no line filter is active
const SORT_PRIORITY: Record<string, number> = {
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

// "Save €X" label for a product that belongs to one or more combi-deals (uses
// the largest discount among matching sets). Null when the product is in none.
function dealLabelFor(productId: string, slug: string, currency: string | undefined): string | null {
  const matched = getBundlesForProduct({ productId, slug })
  if (matched.length === 0) return null
  const best = Math.max(...matched.map((b) => b.discountCents))
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : (currency ?? '')
  return `Save ${symbol}${(best / 100).toFixed(2)}`
}

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

  let allProducts: NormalizedProduct[] = []
  try {
    allProducts = await getCatalogProducts()
  } catch (err) {
    console.error('[Catalog] getCatalogProducts failed:', err)
  }

  // Filter by keyword classification (gender → line → category).
  const effectiveLine = NO_LINE_CATEGORIES.has(category) ? '' : line
  const products = allProducts.filter((p) => {
    const c = classify(p.name)
    if (gender && !inGender(gender, c)) return false
    if (effectiveLine && !inLine(effectiveLine, c)) return false
    if (category && !inCategory(category, c)) return false
    return true
  })

  // Sort: normal clothing → sportswear → swimwear → accessories. The Life4HSP
  // collab has no fixed id in SORT_PRIORITY, so pin it to the head of the
  // sportswear block (just before priority 10) so it always sits next to the
  // other sport shirts, under every filter and with none.
  const LIFE4HSP_SORT = 9.5
  const sortPriority = (p: NormalizedProduct) =>
    /life4hsp/i.test(p.name) ? LIFE4HSP_SORT : (SORT_PRIORITY[p.id] ?? 99)
  products.sort((a, b) => sortPriority(a) - sortPriority(b))

  // Remove.bg + color swatches in parallel for all filtered products
  const [bgRemovedUrls, productInfoMap] = await Promise.all([
    Promise.all(
      products.map((p) =>
        p.thumbnailUrl ? removeBackground(p.thumbnailUrl) : Promise.resolve(null)
      )
    ),
    Promise.all(
      products.map((p) =>
        getCatalogProduct(p.provider, p.id)
          .then(async (detail) => {
            const variants = detail.variants
            // Collect definitively-colored hexes (non-near-white) — used to prevent
            // brand override from duplicating a color already shown by another swatch.
            const skipHexes = new Set<string>()
            for (const v of variants) {
              if (!v.color) continue
              const h = resolveHex(v.color, v.colorCode ?? '')
              if (!isNearWhite(h)) skipHexes.add(h)
            }

            const seen = new Set<string>()
            const raw: { color: string; hex: string; hex2?: string; imageUrl?: string | null; displayName: string }[] = []
            for (const v of variants) {
              if (v.color && !seen.has(v.color)) {
                seen.add(v.color)
                const rawHex = resolveHex(v.color, v.colorCode ?? '')
                const displayName = resolveDisplayName(v.color, rawHex, applyBrandOverride(p.name, rawHex, v.color, skipHexes), p.name)
                // Brand colourway override (e.g. swimwear) wins over data-derived colours.
                const override = brandSwatchOverride(p.name)
                const hex = override ? override.hex : applyBrandOverride(p.name, rawHex, v.color, skipHexes)
                const hex2 = override ? override.hex2 : (resolveLogoColor(p.name, hex) !== hex ? resolveLogoColor(p.name, hex) : undefined)
                raw.push({ color: v.color, hex, hex2, imageUrl: v.imageUrl, displayName })
              }
            }
            // Deduplicate by resolved hex — prevents duplicate paper swatches when multiple
            // color names map to the same final color (e.g. "Blood" + "White" → paper)
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
            return { id: p.id, swatches, priceCents: detail.priceCents, currency: detail.currency, inStock: isInStock(detail) }
          })
          // On a detail-fetch error, keep the product visible (don't hide on missing data).
          .catch(() => ({ id: p.id, swatches: [], priceCents: undefined, currency: undefined as string | undefined, inStock: true }))
      )
    ).then((entries) => Object.fromEntries(entries.map((e) => [e.id, e]))),
  ])

  // Auto-disable out-of-stock products: drop any with no in-stock variant.
  // bgRemovedUrls is parallel to `products`, so zip before filtering to stay aligned.
  const visibleCards = products
    .map((p, i) => ({ product: p, bgUrl: bgRemovedUrls[i] }))
    .filter(({ product }) => productInfoMap[product.id]?.inStock !== false)

  const genderFilters = [
    { label: 'All',   href: buildHref({ line, category }),                   active: !gender },
    { label: 'Men',   href: buildHref({ gender: 'men',   line, category }),  active: gender === 'men' },
    { label: 'Women', href: buildHref({ gender: 'women', line, category }),  active: gender === 'women' },
  ]

  const lineFilters = [
    { label: 'All lines', href: buildHref({ gender, category }),                      active: !line || NO_LINE_CATEGORIES.has(category) },
    { label: 'OG',        href: buildHref({ gender, line: 'og', category }),           active: line === 'og' && !NO_LINE_CATEGORIES.has(category) },
    { label: 'Olympian',  href: buildHref({ gender, line: 'olympian', category }),     active: line === 'olympian' && !NO_LINE_CATEGORIES.has(category) },
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
  const lineLabels: Record<string, string> = { og: 'OG', olympian: 'Olympian' }
  if (line && lineLabels[line] && !NO_LINE_CATEGORIES.has(category)) titleParts.push(lineLabels[line])
  const categoryLabels: Record<string, string> = { tees: 'Tees', shorts: 'Shorts', swimwear: 'Swimwear', accessories: 'Accessories' }
  if (category && categoryLabels[category]) titleParts.push(categoryLabels[category])
  const pageTitle = titleParts.length > 0 ? titleParts.join(' ') : 'The OG Collection'

  // CollectionPage + ItemList: tells search engines this is a product listing
  // and which products it holds, so the listing can surface as a rich result
  // instead of a plain blue link.
  const { description: collectionDescription } = describeFilters(gender, effectiveLine, category)
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${pageTitle} — 7ENO (Zeno)`,
    description: collectionDescription,
    url: absoluteUrl('/shop'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: visibleCards.length,
      itemListElement: visibleCards.slice(0, 50).map(({ product: p }, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: absoluteUrl(`/shop/${productSlug(p.name)}`),
      })),
    },
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: pageTitle, path: '/shop' },
  ])

  return (
    <main className={`${styles.page} oly-theme`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.headerLabel}>by Abra Entertainment</p>
            <h1 className={styles.title}>{pageTitle}</h1>
          </div>
        </div>

<ShopFilters
          groups={[
            { label: 'Gender', items: genderFilters },
            { label: 'Line', items: lineFilters },
            { label: 'Category', items: categoryFilters },
          ]}
          featured={{ label: 'Deals', href: '/deals' }}
          resultCount={visibleCards.length}
        />
      </header>

      {visibleCards.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No products yet.</p>
          <p className={styles.emptySub}>The collection is being assembled. Check back soon.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visibleCards.map(({ product: p, bgUrl }, i) => {
            const slug = productSlug(p.name)
            // A local front photo replaces the provider thumbnail as the card
            // image (the men's tees whose only Printful mockup is the back, and
            // the multi-colour women's tee); the back becomes the hover image.
            const cardImages = getProductCardImages(slug)
            const cardImage = cardImages.front ?? bgUrl
            const cardHover = cardImages.hover ?? null
            return (
              <ProductCard key={`${p.provider}:${p.id}`} product={p} index={i} imageUrl={cardImage} hoverImageUrl={cardHover} colorSwatches={productInfoMap[p.id]?.swatches} priceCents={productInfoMap[p.id]?.priceCents} currency={productInfoMap[p.id]?.currency} dealLabel={dealLabelFor(p.id, slug, productInfoMap[p.id]?.currency ?? p.currency)} />
            )
          })}
        </div>
      )}
    </main>
  )
}
