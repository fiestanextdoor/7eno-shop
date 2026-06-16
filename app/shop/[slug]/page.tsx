import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getEuSizeMapForProduct, getCatalogProductId, getProductMaterials, getSizeGuide, getProduct as getPrintfulProduct } from '@/lib/printful'
import { getCatalogProducts, getCatalogProduct, findBySlug } from '@/lib/catalog'
import { variantFrontImage, variantBackImage } from '@/lib/printful-normalize'
import { getProductImageOverride } from '@/lib/product-images'
import { getBundlesForProduct } from '@/lib/bundles'
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
  return { title: match ? `${match.name} — 7ENO` : '7ENO' }
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

  // Combi-deals this product is part of (matched by live id or slug).
  const deals = getBundlesForProduct({ productId: match.id, slug }).map((b) => ({
    id: b.id,
    title: b.title,
    discountCents: b.discountCents,
  }))

  return (
    <main className={styles.page}>
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
      />
    </main>
  )
}
