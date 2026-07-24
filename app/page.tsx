import Hero from '@/components/Hero/Hero'
import ProductCarousel, { type CarouselItem } from '@/components/ProductCarousel/ProductCarousel'
import BundleCover from '@/components/BundleCover/BundleCover'
import { getCatalogProducts, getCatalogProduct, isInStock } from '@/lib/catalog'
import { getBundles, computeBundlePricing, lowestVariantPriceCents } from '@/lib/bundles'
import { resolveCardImage } from '@/lib/card-image'
import { getProductImageOverride } from '@/lib/product-images'
import { removeBackground } from '@/lib/remove-bg'
import { resolveHex } from '@/lib/color-utils'
import { absoluteUrl } from '@/lib/seo'
import { productSlug } from '@/lib/slug'
import type { NormalizedProduct } from '@/types/catalog'
import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

const HOME_DESCRIPTION =
  '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the OG and Olympian collections — free shipping over €75, 14-day returns.'

export const metadata: Metadata = {
  // `absolute` overrides the layout template: the homepage carries the full
  // brand phrase itself rather than "… · 7ENO (Zeno)" twice.
  title: { absolute: '7ENO (Zeno) · Premium Streetwear by Abra Entertainment' },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
    url: absoluteUrl('/'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
  },
}

// Line blocks laid out 50 / 25 / 25: a wide "Nieuwe Drop" tile, then 7ENO Daily
// and 7ENO Sport. Drop background photos at these paths to fill the tiles; until
// then each falls back to its logo/title on a solid brand colour (page.module.css).
// The Olympian tile reuses one of the Olympian '26 lookbook photos as its
// backdrop (swap the path for any of the four, or a dedicated /categories shot).
const CATEGORIES: { num: string; name: string; href: string; image: string; logo?: string; caption?: string }[] = [
  { num: '01', name: 'Olympian', href: '/shop', image: '/olympian/olympian-teal-model.jpg', logo: '/logos/olympian.png', caption: 'Coming soon' },
  { num: '02', name: '7ENO Daily', href: '/shop?line=daily', image: '/categories/daily.jpg', logo: '/logos/7eno-daily.png' },
  { num: '03', name: '7ENO Sport', href: '/shop?line=sport', image: '/categories/sport.jpg', logo: '/logos/7eno-sport.png' },
]

// Olympian '26 lookbook cards, shown directly under the hero. Each card shows
// its model photo and links to the matching knitted-tee colourway in the shop
// (also featured in the carousel below). `slug` is that product's shop slug: at
// render time the card's link resolves to /shop/<slug> and its flat product shot
// is pulled from the built carousel items, so the card cross-fades from the
// model photo to the same background-removed product image on hover. If a slug
// isn't in the catalogue the card falls back to /shop with just the model photo
// (page.module.css keeps the colourway tint as the backdrop).
const OLYMPIAN_PRODUCTS: {
  key: string; name: string; slug: string; model: string; tint: string
}[] = [
  { key: 'rosa',  name: 'Olympian Tee · Rosa',  slug: 'olympian-knitted-tee-flamingo-unisex', model: '/olympian/olympian-rosa-model.jpg',  tint: 'olyRosa' },
  { key: 'teal',  name: 'Olympian Tee · Teal',  slug: 'olympian-knitted-tee-ocean-unisex',    model: '/olympian/olympian-teal-model.jpg',  tint: 'olyTeal' },
  { key: 'wheat', name: 'Olympian Tee · Wheat', slug: 'olympian-knitted-tee-sand-unisex',     model: '/olympian/olympian-wheat-model.jpg', tint: 'olyWheat' },
  { key: 'clay',  name: 'Olympian Tee · Clay',  slug: 'olympian-knitted-tee-coconut-unisex',  model: '/olympian/olympian-clay-model.jpg',  tint: 'olyClay' },
]

// Newest products lead the carousel. Only Printify exposes a creation date at
// list level, so date-less products (Printful) sort last in a stable order.
const MAX_CAROUSEL_ITEMS = 16

function createdMs(p: NormalizedProduct): number {
  if (!p.createdAt) return 0
  const ms = Date.parse(p.createdAt.replace(' ', 'T'))
  return Number.isNaN(ms) ? 0 : ms
}

/**
 * Ensure a product has its variants/colours for the carousel's quick-add. Printify
 * list products already carry them; Printful list products do not, so we fetch the
 * detail for those (cached by the same ISR window as the rest of the page).
 */
async function withVariants(p: NormalizedProduct): Promise<NormalizedProduct> {
  if (p.variants.length > 0) return p
  try {
    return await getCatalogProduct(p.provider, p.id)
  } catch {
    return p
  }
}

/**
 * Per-colour swatch + image data for a carousel card. Only multi-colour products
 * get their own background-removed colour photo (so clicking a swatch swaps the
 * image); single-colour products reuse the card image. Local per-colour overrides
 * win over provider mockups, matching the product detail page.
 */
async function buildCarouselColors(slug: string, product: NormalizedProduct, fallbackImage: string | null) {
  const multiColour = product.colors.length > 1
  const override = getProductImageOverride(slug)
  return Promise.all(
    product.colors.map(async (c) => {
      let image = fallbackImage
      if (multiColour) {
        const local = override?.colorFrontImages?.[c.color]
        if (local) image = local
        else if (c.imageUrl) image = (await removeBackground(c.imageUrl).catch(() => null)) ?? c.imageUrl
      }
      return {
        color: c.color,
        hex: c.hex || resolveHex(c.color, ''),
        displayName: c.displayName,
        image,
      }
    })
  )
}

export default async function HomePage() {
  let products: NormalizedProduct[] = []
  try {
    products = await getCatalogProducts()
  } catch (err) {
    console.error('[Catalog] getCatalogProducts failed:', err)
  }

  const latest = [...products].sort((a, b) => createdMs(b) - createdMs(a)).slice(0, MAX_CAROUSEL_ITEMS)

  // Build the carousel cards: the (background-removed) card image plus the
  // variants/colours the quick-add control needs. Image resolution reuses the
  // same Supabase cache as /shop, so it adds no extra remove.bg calls.
  // Out-of-stock products (no available variant) are dropped from the carousel.
  const built = await Promise.all(
    latest.map(async (p): Promise<CarouselItem | null> => {
      const slug = productSlug(p.name)
      const [image, detailed] = await Promise.all([
        resolveCardImage({ slug, thumbnailUrl: p.thumbnailUrl }),
        withVariants(p),
      ])
      if (!isInStock(detailed)) return null
      const colors = await buildCarouselColors(slug, detailed, image)
      return {
        slug,
        name: p.name,
        image,
        provider: p.provider,
        productId: p.id,
        currency: detailed.currency,
        colors,
        variants: detailed.variants.map((v) => ({
          id: v.id,
          color: v.color,
          size: v.size,
          name: v.name,
          priceCents: v.priceCents,
          inStock: v.inStock,
        })),
      }
    })
  )
  const carouselItems: CarouselItem[] = built.filter((i): i is CarouselItem => i !== null)

  // The Olympian band reuses the carousel's product data so each lookbook card
  // can cross-fade from its model photo to the exact product shot on hover, show
  // the real catalogue name, and link straight to that product's page.
  const productBySlug = new Map(carouselItems.map((i) => [i.slug, i]))

  // Featured deals for the homepage band: the same bundle pricing + composite
  // cover as /deals, capped to a few sets that tease through to the full page.
  // Each set that fails to resolve (e.g. a delisted product) is dropped.
  const FEATURED_DEALS = 3
  const dealCards = (
    await Promise.all(
      getBundles()
        .slice(0, FEATURED_DEALS)
        .map(async (bundle) => {
          try {
            const detailed = await Promise.all(
              bundle.products.map((p) => getCatalogProduct(p.provider, p.productId)),
            )
            const sumCents = detailed.reduce((s, prod) => s + lowestVariantPriceCents(prod.variants), 0)
            if (!Number.isFinite(sumCents)) return null
            const pricing = computeBundlePricing(sumCents, bundle.discountCents)
            const images = await Promise.all(
              bundle.products.map((ref, i) =>
                resolveCardImage({ slug: ref.slug, thumbnailUrl: detailed[i].thumbnailUrl }),
              ),
            )
            return {
              id: bundle.id,
              title: bundle.title,
              pricing,
              currency: detailed[0]?.currency ?? 'EUR',
              names: detailed.map((p) => p.name),
              images,
            }
          } catch {
            return null
          }
        }),
    )
  ).filter((c): c is NonNullable<typeof c> => c !== null)

  const dealSymbol = (c: string) => (c === 'EUR' ? '€' : c === 'USD' ? '$' : c)
  const price = (cents: number, currency: string) => `${dealSymbol(currency)}${(cents / 100).toFixed(2)}`

  return (
    <main className="oly-theme">
      <Hero />

      <section className={styles.olympianBand} aria-label="Olympian '26">
        {OLYMPIAN_PRODUCTS.map((p) => {
          const item = productBySlug.get(p.slug)
          const href = item ? `/shop/${p.slug}` : '/shop'
          // Prefer the real catalogue name; fall back to the hand-written label
          // if the product isn't currently in stock/catalogue.
          const name = item?.name ?? p.name
          return (
            <article key={p.key} className={styles.olyCard}>
              <Link
                href={href}
                className={`${styles.olyCardImage} ${styles[p.tint]}${item ? '' : ` ${styles.olyNoFlip}`}`}
                aria-label={name}
              >
                <span className={styles.olyMediaModel} style={{ backgroundImage: `url(${p.model})` }} aria-hidden />
                {item && (
                  <span className={styles.olyMediaProduct} style={{ backgroundImage: `url(${item.image})` }} aria-hidden />
                )}
              </Link>
              <div className={styles.olyCardInfo}>
                <Link href={href} className={styles.olyCardName}>{name}</Link>
              </div>
            </article>
          )
        })}
      </section>

      <section className={styles.categoryStrip}>
        <div className={styles.categoryStripInner}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.num} href={cat.href} className={styles.categoryCard}>
              <span
                className={styles.categoryMedia}
                style={{ backgroundImage: `url(${cat.image})` }}
                aria-hidden
              />
              <span className={styles.categoryNum}>{cat.num}</span>
              <span className={styles.categoryBody}>
                {cat.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cat.logo} alt={cat.name} className={styles.categoryLogo} />
                ) : (
                  <span className={styles.categoryTitle}>{cat.name}</span>
                )}
                {cat.caption && <span className={styles.categoryCaption}>{cat.caption}</span>}
              </span>
              <span className={styles.categoryArrow}>Shop →</span>
            </Link>
          ))}
        </div>
      </section>

      {carouselItems.length > 0 && (
        <section className={styles.carouselSection}>
          <ProductCarousel items={carouselItems} />
        </section>
      )}

      <section className={styles.dealsBand}>
        <div className={styles.dealsInner}>
          <div className={styles.dealsContent}>
            <p className={styles.dealsLabel}>Curated sets · by Abra Entertainment</p>
            <h2 className={styles.dealsTitle}>Deals</h2>
            <p className={styles.dealsSub}>
              Premium 7ENO pieces bundled at a combined price. Limited sets, while they last.
            </p>
            <Link href="/deals" className={styles.dealsCta}>
              <span>Shop deals</span>
              <span className={styles.dealsCtaArrow} aria-hidden>→</span>
            </Link>
          </div>

          {dealCards.length > 0 && (
            <ul className={styles.dealsSets}>
              {dealCards.map((d) => (
                <li key={d.id} className={styles.dealSet}>
                  <Link href={`/deals/${d.id}`} className={styles.dealSetLink}>
                    <div className={styles.dealSetCover}>
                      <BundleCover images={d.images} names={d.names} background="var(--bone)" />
                      <span className={styles.dealSetSave}>
                        Save {price(d.pricing.discountCents, d.currency)}
                      </span>
                    </div>
                    <div className={styles.dealSetInfo}>
                      <span className={styles.dealSetTitle}>{d.title}</span>
                      <span className={styles.dealSetPrice}>
                        <s className={styles.dealSetFrom}>{price(d.pricing.sumCents, d.currency)}</s>
                        <span className={styles.dealSetNow}>{price(d.pricing.setCents, d.currency)}</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
