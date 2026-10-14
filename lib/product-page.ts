import { getCatalogProduct, type ShopProduct } from '@/lib/catalog'
import {
  getCatalogProductId,
  getEuSizeMapForProduct,
  getProduct as getPrintfulProduct,
  getProductMaterials,
  getSizeGuide,
  type SizeGuide,
} from '@/lib/printful'
import { variantBackImage, variantFrontImage, variantMockupImages } from '@/lib/printful-normalize'
import { HIDDEN_SIZES } from '@/lib/product-classify'
import { buildGallery, type GalleryImage } from '@/lib/product-gallery'
import { getProductImageOverride } from '@/lib/product-images'
import { removeBackground } from '@/lib/remove-bg'
import type { NormalizedProduct, NormalizedVariant } from '@/types/catalog'

/** Everything the product page shows beyond the catalogue row. */
export interface ProductMedia {
  variants: NormalizedVariant[]
  currency: string
  /** Gallery per variant colour; '' for a product without colours. */
  galleries: Record<string, GalleryImage[]>
  euSizeMap: Record<string, string>
  materials: string[]
  sizeGuide: SizeGuide | null
  /** Up to eight distinct photos for the Product JSON-LD. */
  schemaImages: string[]
}

interface PrintfulExtras {
  euSizeMap: Record<string, string>
  materials: string[]
  sizeGuide: SizeGuide | null
  /** Genuine back-angle mockups per colour, background removed. */
  backs: Record<string, string>
  /** The remaining mockups per colour, shown as-is. */
  mockups: Record<string, string[]>
}

const NO_EXTRAS: PrintfulExtras = { euSizeMap: {}, materials: [], sizeGuide: null, backs: {}, mockups: {} }

/** remove.bg cut-out (cached in Supabase storage), else the original URL. */
async function cutOut(url: string): Promise<string> {
  return (await removeBackground(url).catch(() => null)) ?? url
}

/** getShopProducts already loads variants; fetch them again only when that failed. */
async function withVariants(match: ShopProduct): Promise<NormalizedProduct> {
  if (match.variants.length > 0) return match
  try {
    return await getCatalogProduct(match.provider, match.id)
  } catch (err) {
    console.error(`[PDP] variants for ${match.slug} failed:`, err)
    return match
  }
}

/** Size guide, materials, EU sizes and extra mockups. Optional: the page renders without them. */
async function printfulExtras(productId: string): Promise<PrintfulExtras> {
  try {
    const { sync_variants: syncVariants } = await getPrintfulProduct(productId)
    const euSizeMap = await getEuSizeMapForProduct(syncVariants)
    const catalogProductId = syncVariants[0]?.variant_id
      ? await getCatalogProductId(syncVariants[0].variant_id)
      : null
    const isFootwear = Object.keys(euSizeMap).length > 0
    const offeredSizes = [...new Set(syncVariants.map((v) => v.size).filter(Boolean))].filter(
      (s) => !HIDDEN_SIZES.has(s)
    )
    const [materials, sizeGuide] = await Promise.all([
      catalogProductId ? getProductMaterials(catalogProductId) : Promise.resolve([]),
      catalogProductId && !isFootwear ? getSizeGuide(catalogProductId, offeredSizes) : Promise.resolve(null),
    ])

    const rawBacks: Record<string, string> = {}
    const mockups: Record<string, string[]> = {}
    for (const variant of syncVariants) {
      if (!variant.color) continue
      const front = variantFrontImage(variant)
      const back = variantBackImage(variant)
      // Only a genuine back mockup that differs from the front (some products
      // ship a back mockup as their only image, which is already the front).
      if (!rawBacks[variant.color] && back && back !== front) rawBacks[variant.color] = back
      // Photographed scenes (flat, on-model, detail crops): used as-is, a
      // cut-out would ruin them and spend remove.bg credits.
      if (!mockups[variant.color]) {
        const rest = variantMockupImages(variant).filter((u) => u !== front && u !== back)
        if (rest.length > 0) mockups[variant.color] = rest
      }
    }
    const backs: Record<string, string> = {}
    await Promise.all(
      Object.entries(rawBacks).map(async ([colour, url]) => {
        backs[colour] = await cutOut(url)
      })
    )
    return { euSizeMap, materials, sizeGuide, backs, mockups }
  } catch (err) {
    console.error(`[PDP] Printful details for ${productId} failed:`, err)
    return NO_EXTRAS
  }
}

/**
 * Images and Printful details for one product page. Front and back mockups
 * are cut out by remove.bg; other mockups and the local photos from
 * lib/product-images.ts are used as-is, and a local override always wins.
 */
export async function loadProductMedia(match: ShopProduct): Promise<ProductMedia> {
  const product = await withVariants(match)
  const override = getProductImageOverride(match.slug)
  const extras = override?.galleryImages ?? []
  const base = product.thumbnailUrl ? await cutOut(product.thumbnailUrl) : null

  const rawFronts: Record<string, string> = {}
  for (const v of product.variants) {
    if (v.color && !rawFronts[v.color] && v.imageUrl) rawFronts[v.color] = v.imageUrl
  }
  const fronts: Record<string, string> = {}
  await Promise.all(
    Object.entries(rawFronts).map(async ([colour, url]) => {
      fronts[colour] = await cutOut(url)
    })
  )
  Object.assign(fronts, override?.colorFrontImages ?? {})

  const pf = match.provider === 'printful' ? await printfulExtras(match.id) : NO_EXTRAS
  const backs: Record<string, string> = { ...pf.backs, ...(override?.colorBackImages ?? {}) }

  const colours = [...new Set(product.variants.map((v) => v.color).filter(Boolean))]
  const galleries: Record<string, GalleryImage[]> = {}
  for (const colour of colours.length > 0 ? colours : ['']) {
    galleries[colour] = buildGallery({
      productName: product.name,
      front: override?.frontImage ?? fronts[colour] ?? base,
      back: override?.backImage ?? backs[colour] ?? null,
      mockups: pf.mockups[colour] ?? [],
      extras,
    })
  }

  const schemaImages = [
    ...new Set(
      [product.thumbnailUrl, ...Object.values(fronts), ...Object.values(pf.mockups).flat(), ...extras].filter(
        (u): u is string => typeof u === 'string' && u.length > 0
      )
    ),
  ].slice(0, 8)

  return {
    variants: product.variants,
    currency: product.currency || 'EUR',
    galleries,
    euSizeMap: pf.euSizeMap,
    materials: pf.materials,
    sizeGuide: pf.sizeGuide,
    schemaImages,
  }
}
