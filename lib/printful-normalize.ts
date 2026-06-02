import type { SyncProduct, SyncVariant, PrintfulProductDetail } from '@/types/printful'
import type { NormalizedProduct, NormalizedVariant, NormalizedColor } from '@/types/catalog'

function priceToCents(retail: string): number {
  return Math.round((parseFloat(retail) || 0) * 100)
}

function bestVariantImage(variant: SyncVariant): string | null {
  const files = variant.files ?? []
  const file =
    files.find((f) => f.type === 'preview' && f.preview_url) ??
    files.find((f) => f.preview_url) ??
    files.find((f) => f.type !== 'default') ??
    files[0] ??
    null
  return file?.preview_url ?? file?.url ?? null
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
      imageUrl: bestVariantImage(v),
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
