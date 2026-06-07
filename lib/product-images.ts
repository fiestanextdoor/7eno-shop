/**
 * Local image overrides for specific products.
 *
 * Some products look better with our own lifestyle photos than with the
 * provider's auto-generated mockups. These images live in `/public` and are
 * used as-is: they deliberately bypass the remove.bg pipeline, so any
 * background in the photo is kept.
 *
 * Keyed by the product's URL slug (see `lib/slug.ts`).
 */
export interface ProductImageOverride {
  /** Shown as the hover image on the /shop product card. */
  hoverImage?: string
  /** Extra images appended to the gallery on the single-product page. */
  galleryImages?: string[]
}

const OVERRIDES: Record<string, ProductImageOverride> = {
  'swim-towel': {
    hoverImage: '/products/swim-towel/towel-1.png',
    galleryImages: [
      '/products/swim-towel/towel-1.png',
      '/products/swim-towel/towel-2.png',
    ],
  },
}

export function getProductImageOverride(slug: string): ProductImageOverride | null {
  return OVERRIDES[slug] ?? null
}
