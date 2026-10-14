import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { findBySlug, getShopProducts, isRetiredProductSlug, type ShopProduct } from '@/lib/catalog'
import { buildColourSiblings } from '@/lib/colour-siblings'
import { currentTimeMs, formatDropDate, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { categoryLabel, productInfoSections } from '@/lib/product-copy'
import { loadProductMedia } from '@/lib/product-page'
import { BASE_URL, BRAND_KEYWORDS, absoluteUrl, breadcrumbJsonLd, merchantPolicyJsonLd } from '@/lib/seo'
import { ALLOWED_COUNTRIES, FLAT_SHIPPING_RATE } from '@/lib/shipping'
import ProductView from './ProductView'
import styles from './product.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

// Teaser to live flips on the drop clock: re-render at least every minute.
export const revalidate = 60

export async function generateStaticParams() {
  try {
    const products = await getShopProducts()
    return products.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const products = await getShopProducts(currentTimeMs(), { preview: await isPreviewSession() }).catch(
    () => [] as ShopProduct[]
  )
  const match = findBySlug(products, slug)
  if (!match) return { title: 'Product not found' }
  const collection = match.drop.title
  const description = `Buy the ${match.name} from the 7ENO (Zeno) ${collection} collection. Official streetwear by Abra Entertainment, with free shipping over €75 and 14-day returns.`
  return {
    title: match.name,
    // A teaser is not for sale yet: keep it out of the index until the release (spec section 4).
    ...(match.status === 'upcoming'
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    description,
    keywords: [match.name, `${match.name} 7ENO`, `${match.name} Zeno`, ...BRAND_KEYWORDS],
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title: `${match.name} · 7ENO (Zeno)`,
      description,
      type: 'website',
      url: absoluteUrl(`/shop/${slug}`),
      ...(match.thumbnailUrl ? { images: [{ url: match.thumbnailUrl, alt: match.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${match.name} · 7ENO (Zeno)`,
      description,
      ...(match.thumbnailUrl ? { images: [match.thumbnailUrl] } : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const now = currentTimeMs()
  const preview = await isPreviewSession()

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, { preview })
  } catch {
    products = []
  }

  // Back-compat: old numeric-id Printful URLs (/shop/433351254) redirect to the slug.
  if (/^\d+$/.test(slug)) {
    const byId = products.find((p) => p.provider === 'printful' && p.id === slug)
    if (byId) permanentRedirect(`/shop/${byId.slug}`)
    notFound()
  }

  const match = findBySlug(products, slug)
  if (!match) {
    // A retired product (OG, Printify) keeps its old URL working as a 308 to
    // the shop (spec section 3), so old links and search results still land.
    if (await isRetiredProductSlug(slug)) permanentRedirect('/shop')
    notFound()
  }

  const media = await loadProductMedia(match)
  const drop = toDropView(match.drop, now, { preview })
  const teaser = match.status === 'upcoming'

  // Product structured data: price, availability, return and shipping terms,
  // tied to the 7ENO/"Zeno" brand. No Offer for a teaser (spec section 4).
  const priceCents = media.variants.map((v) => v.priceCents).filter((c) => c > 0)
  const inStock = media.variants.some((v) => v.inStock !== false)
  const sizes = [...new Set(media.variants.map((v) => v.size).filter(Boolean))]
  const colorNames = [...new Set(media.variants.map((v) => v.color).filter(Boolean))]
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/shop/${slug}`)}#product`,
    name: match.name,
    description: `${match.name} from the 7ENO (Zeno) ${match.drop.title} collection, by Abra Entertainment.`,
    ...(media.schemaImages.length > 0 ? { image: media.schemaImages } : {}),
    url: absoluteUrl(`/shop/${slug}`),
    sku: `${match.provider}-${match.id}`,
    brand: { '@type': 'Brand', name: '7ENO', alternateName: 'Zeno' },
    ...(colorNames.length > 0 ? { color: colorNames.join(', ') } : {}),
    ...(sizes.length > 0 ? { size: sizes } : {}),
    ...(media.materials.length > 0 ? { material: media.materials.join(', ') } : {}),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    ...(match.purchasable && priceCents.length > 0
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: media.currency,
            lowPrice: (Math.min(...priceCents) / 100).toFixed(2),
            highPrice: (Math.max(...priceCents) / 100).toFixed(2),
            offerCount: media.variants.length,
            url: absoluteUrl(`/shop/${slug}`),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': `${BASE_URL}/#organization` },
            ...merchantPolicyJsonLd(FLAT_SHIPPING_RATE, ALLOWED_COUNTRIES),
          },
        }
      : {}),
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: match.drop.title, path: `/collections/${match.drop.slug}` },
    { name: match.name, path: `/shop/${slug}` },
  ])

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <ProductView
        product={{
          provider: match.provider,
          id: match.id,
          name: match.name,
          slug: match.slug,
          purchasable: match.purchasable,
          soldOut: match.soldOut,
          releaseLabel: teaser ? formatDropDate(match.drop.window.startsAt) : undefined,
        }}
        drop={drop}
        variants={media.variants}
        galleries={media.galleries}
        siblings={buildColourSiblings(products, match)}
        euSizeMap={media.euSizeMap}
        sizeGuide={
          media.sizeGuide && media.sizeGuide.sizes.length > 0
            ? { category: categoryLabel(match.name), guide: media.sizeGuide }
            : null
        }
        modelNote={match.drop.modelNote}
        info={productInfoSections({
          productName: match.name,
          materials: media.materials,
          modelNote: match.drop.modelNote,
          dropTitle: match.drop.title,
          editionLabel: drop.editionLabel,
        })}
      />
    </main>
  )
}
