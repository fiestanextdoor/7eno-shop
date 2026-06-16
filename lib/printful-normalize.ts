import type { SyncProduct, SyncVariant, PrintfulProductDetail, PrintfulFile } from '@/types/printful'
import type { NormalizedProduct, NormalizedVariant, NormalizedColor } from '@/types/catalog'

function priceToCents(retail: string): number {
  return Math.round((parseFloat(retail) || 0) * 100)
}

// Printful sync-variant files are either the seller's generated product mockups
// (the photos to SHOW) or the raw print/placement files (the artwork to PRINT).
// Only these types are real mockups; everything else (`front_dtf`, `back_dtf`,
// `default`, `shoe_left`, `embroidery_*`, `label_*`, …) is print artwork on a
// transparent background and must never be shown as a product photo.
const MOCKUP_FILE_TYPES = new Set(['preview', 'mockup'])

function mockupFiles(variant: SyncVariant): PrintfulFile[] {
  return (variant.files ?? []).filter((f) => MOCKUP_FILE_TYPES.has(f.type) && !!f.preview_url)
}

// Printful encodes the camera angle in the mockup filename, e.g.
// `mens-box-tee-vintage-black-back-….jpg`. The word boundary keeps "backpack"
// (a front mockup) from being mistaken for a back view.
function isBackMockup(file: PrintfulFile): boolean {
  return /(^|[-_ ])back([-_. ]|$)/i.test(file.filename ?? '')
}

/**
 * The front product mockup for a variant: a "front" (or non-back) mockup if one
 * exists, otherwise the first available mockup (some products ship only a back
 * mockup, which still beats showing raw print artwork). Never returns a print
 * file. null when the variant has no generated mockup at all.
 */
export function variantFrontImage(variant: SyncVariant): string | null {
  const mocks = mockupFiles(variant)
  const front = mocks.find((f) => !isBackMockup(f)) ?? mocks[0]
  return front?.preview_url ?? null
}

/**
 * The back product mockup for a variant, when Printful generated a genuine
 * back-angle mockup. Returns null otherwise (we do not fake a back view from
 * the raw print files, which is what previously produced the wrong images).
 */
export function variantBackImage(variant: SyncVariant): string | null {
  const back = mockupFiles(variant).find(isBackMockup)
  return back?.preview_url ?? null
}

/** List-level product (no variants) → normalized shell used for cards/grids. */
export function normalizePrintfulProduct(p: SyncProduct): NormalizedProduct {
  return {
    provider: 'printful',
    id: String(p.id),
    name: p.name,
    thumbnailUrl: p.thumbnail_url ?? null,
    variants: [],
    colors: [],
    currency: 'EUR',
  }
}

/** Full product detail → normalized product with variants and colors. */
export function normalizePrintfulDetail(detail: PrintfulProductDetail): NormalizedProduct {
  const { sync_product, sync_variants } = detail
  const variants: NormalizedVariant[] = sync_variants
    .filter((v) => !v.is_ignored)
    .map((v) => ({
      provider: 'printful' as const,
      productId: String(sync_product.id),
      id: String(v.id),
      name: v.name,
      size: v.size ?? '',
      color: v.color ?? '',
      colorCode: v.color_code ?? '',
      priceCents: priceToCents(v.retail_price),
      currency: v.currency || 'EUR',
      inStock: v.in_stock !== false,
      imageUrl: variantFrontImage(v),
    }))

  const colors: NormalizedColor[] = []
  const seen = new Set<string>()
  for (const v of variants) {
    if (!v.color || seen.has(v.color)) continue
    seen.add(v.color)
    colors.push({ color: v.color, hex: v.colorCode, imageUrl: v.imageUrl, displayName: v.color })
  }

  return {
    provider: 'printful',
    id: String(sync_product.id),
    name: sync_product.name,
    thumbnailUrl: sync_product.thumbnail_url ?? null,
    variants,
    colors,
    priceCents: variants[0]?.priceCents,
    currency: variants[0]?.currency ?? 'EUR',
  }
}
