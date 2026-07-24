import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getEuSizeMapForProduct, getCatalogProductId, getProductMaterials, getSizeGuide, getProduct as getPrintfulProduct } from '@/lib/printful'
import { getCatalogProducts, getCatalogProduct, findBySlug } from '@/lib/catalog'
import { variantFrontImage, variantBackImage } from '@/lib/printful-normalize'
import { getProductImageOverride } from '@/lib/product-images'
import { getBundlesForProduct } from '@/lib/bundles'
import { olympianColorway, OLYMPIAN_COLORWAYS } from '@/lib/color-utils'
import { productSlug } from '@/lib/slug'
import { removeBackground } from '@/lib/remove-bg'
import ProductDetail from './ProductDetail'
import styles from './detail.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const products = await getCatalogProducts()
    return products.map((p) => ({ slug: productSlug(p.name) }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const products = await getCatalogProducts().catch(() => [])
  const match = findBySlug(products, slug)
  if (!match) return { title: '7ENO' }
  const collection = /olympian/i.test(match.name) ? 'Olympian' : 'OG'
  const description = `${match.name} — ${collection} collection. Official 7ENO (Zeno) streetwear by Abra Entertainment.`
  return {
    title: `${match.name} — 7ENO`,
    description,
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title: `${match.name} — 7ENO`,
      description,
      type: 'website',
      ...(match.thumbnailUrl ? { images: [match.thumbnailUrl] } : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  let products: Awaited<ReturnType<typeof getCatalogProducts>> = []
  try {
    products = await getCatalogProducts()
  } catch {
    products = []
  }

  // Back-compat: old numeric-id Printful URLs (/shop/433351254) redirect to slug.
  if (/^\d+$/.test(slug)) {
    const byId = products.find((p) => p.provider === 'printful' && p.id === slug)
    if (byId) permanentRedirect(`/shop/${productSlug(byId.name)}`)
    notFound()
  }

  const match = findBySlug(products, slug)
  if (!match) notFound()

  let detail
  try {
    detail = await getCatalogProduct(match.provider, match.id)
  } catch {
    notFound()
  }

  const variants = detail!.variants
  const productThumbnail = detail!.thumbnailUrl

  // Background-removed base image (shared by both providers).
  const bgRemovedBase = productThumbnail
    ? await removeBackground(productThumbnail).catch(() => null)
    : null

  // Per-colour front images, background-removed (result cached in storage).
  const rawColorImages: Record<string, string> = {}
  for (const v of variants) {
    if (!v.color || rawColorImages[v.color] || !v.imageUrl) continue
    rawColorImages[v.color] = v.imageUrl
  }
  const colorImages: Record<string, string> = {}
  await Promise.all(
    Object.entries(rawColorImages).map(async ([color, url]) => {
      const processed = await removeBackground(url).catch(() => null)
      colorImages[color] = processed ?? url
    })
  )

  // ── Printful-only enrichment (basis Printify: skip EU sizes / size guide / materials) ──
  let euSizeMap: Record<string, string> = {}
  let materials: string[] = []
  let sizeGuide = null
  const colorBackImages: Record<string, string> = {}

  if (match.provider === 'printful') {
    const detailPf = await getPrintfulProduct(match.id)
    const syncVariants = detailPf.sync_variants
    euSizeMap = await getEuSizeMapForProduct(syncVariants)
    const catalogProductId = syncVariants[0]?.variant_id
      ? await getCatalogProductId(syncVariants[0].variant_id)
      : null
    const isFootwear = Object.keys(euSizeMap).length > 0
    const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])
    const offeredSizes = [...new Set(syncVariants.map((v) => v.size).filter(Boolean))].filter(
      (s) => !EXCLUDED_SIZES.has(s)
    )
    const [mats, guide] = await Promise.all([
      catalogProductId ? getProductMaterials(catalogProductId) : Promise.resolve([]),
      catalogProductId && !isFootwear ? getSizeGuide(catalogProductId, offeredSizes) : Promise.resolve(null),
    ])
    materials = mats
    sizeGuide = guide

    // Back-view mockups: only genuine back-angle product mockups, and only when
    // they differ from the front mockup (some products ship a back mockup as
    // their sole image, which is then already used as the front).
    const rawBack: Record<string, string> = {}
    for (const variant of syncVariants) {
      if (!variant.color || rawBack[variant.color]) continue
      const back = variantBackImage(variant)
      if (back && back !== variantFrontImage(variant)) rawBack[variant.color] = back
    }
    await Promise.all(
      Object.entries(rawBack).map(async ([color, url]) => {
        const processed = await removeBackground(url).catch(() => null)
        colorBackImages[color] = processed ?? url
      })
    )
  }

  // Local image overrides (used as-is, no remove.bg): front/back replacements
  // for products whose provider mockups are incomplete, plus lifestyle photos.
  const imageOverride = getProductImageOverride(slug)
  const extraImages = imageOverride?.galleryImages ?? []

  // Per-colour local photos win over the provider mockups (used as-is, no
  // remove.bg). Used for multi-colour tees where Printful lacks a back mockup.
  if (imageOverride?.colorFrontImages) Object.assign(colorImages, imageOverride.colorFrontImages)
  if (imageOverride?.colorBackImages) Object.assign(colorBackImages, imageOverride.colorBackImages)

  // Charity collaboration: only the Life4HSP product carries the donation banner
  // (its name contains "Life4HSP", e.g. "7ENO X Life4HSP Sport Tee").
  const isLife4Hsp = /life4hsp/i.test(detail!.name)

  // Combi-deals this product is part of (matched by live id or slug).
  const deals = getBundlesForProduct({ productId: match.id, slug }).map((b) => ({
    id: b.id,
    title: b.title,
    discountCents: b.discountCents,
  }))

  // Olympian colourways are separate products (the name carries the colourway,
  // e.g. "Olympian Tee Ocean Unisex"). Collect the siblings of this product's
  // family so the detail page can offer colour swatches that link between them,
  // mirroring the in-product colour switcher the OG products get from variants.
  const currentColorway = olympianColorway(detail!.name)
  const colorwayPattern = new RegExp(OLYMPIAN_COLORWAYS.map((c) => c.key).join('|'), 'g')
  const familyKey = (name: string) =>
    name.toLowerCase().replace(colorwayPattern, '').replace(/\s+/g, ' ').trim()
  const colorwaySiblings = currentColorway
    ? products
        .filter((p) => olympianColorway(p.name) && familyKey(p.name) === familyKey(detail!.name))
        .map((p) => {
          const cw = olympianColorway(p.name)!
          return {
            name: cw.name,
            hex: cw.hex,
            slug: productSlug(p.name),
            current: p.id === match.id,
            order: OLYMPIAN_COLORWAYS.findIndex((c) => c.key === cw.key),
          }
        })
        .sort((a, b) => a.order - b.order)
        .map(({ name, hex, slug: s, current }) => ({ name, hex, slug: s, current }))
    : []

  // Product structured data: lets search engines show rich results (price,
  // availability) and ties the product to the 7ENO/"Zeno" brand.
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.7eno.shop').replace(/\/+$/, '')
  const priceCents = variants.map((v) => v.priceCents).filter((c) => c > 0)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: detail!.name,
    ...(productThumbnail ? { image: productThumbnail } : {}),
    url: `${baseUrl}/shop/${slug}`,
    brand: { '@type': 'Brand', name: '7ENO', alternateName: 'Zeno' },
    ...(priceCents.length > 0
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: detail!.currency || 'EUR',
            lowPrice: (Math.min(...priceCents) / 100).toFixed(2),
            highPrice: (Math.max(...priceCents) / 100).toFixed(2),
            availability: variants.some((v) => v.inStock !== false)
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  }

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetail
        provider={match.provider}
        productId={match.id}
        productName={detail!.name}
        variants={variants}
        baseImageUrl={bgRemovedBase}
        colorImages={colorImages}
        colorBackImages={colorBackImages}
        frontOverride={imageOverride?.frontImage ?? null}
        backOverride={imageOverride?.backImage ?? null}
        euSizeMap={euSizeMap}
        materials={materials}
        sizeGuide={sizeGuide}
        extraImages={extraImages}
        deals={deals}
        charityPartner={isLife4Hsp}
        colorwaySiblings={colorwaySiblings}
      />
    </main>
  )
}
