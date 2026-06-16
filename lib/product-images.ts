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
  /**
   * Replaces the provider mockup as the main (front) image. Use when Printful
   * only generated a back-angle mockup, so the provider's "front" is actually
   * the back of the shirt.
   */
  frontImage?: string
  /** The back view, shown directly after the front image. */
  backImage?: string
  /**
   * Per-colour front photos for multi-colour products, keyed by the exact
   * variant colour name (e.g. "Black"). Overrides the provider mockup per colour.
   */
  colorFrontImages?: Record<string, string>
  /** Per-colour back photos, keyed by the exact variant colour name. */
  colorBackImages?: Record<string, string>
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

  // Daily men's tees: Printful only generated one mockup angle per shirt, so we
  // supply our own front + back photos (2000x2000, transparent background) from
  // /public/products/<slug>/. `frontImage` replaces the provider mockup as the
  // main image; `backImage` is shown directly after it.
  'butter-blood-tee-men': {
    frontImage: '/products/butter-blood-tee-men/front.png',
    backImage: '/products/butter-blood-tee-men/back.png',
  },
  'ink-blood-tee-men': {
    frontImage: '/products/ink-blood-tee-men/front.png',
    backImage: '/products/ink-blood-tee-men/back.png',
  },
  'butter-stone-tee-men': {
    frontImage: '/products/butter-stone-tee-men/front.png',
    backImage: '/products/butter-stone-tee-men/back.png',
  },
  'ink-butter-tee-men': {
    frontImage: '/products/ink-butter-tee-men/front.png',
    backImage: '/products/ink-butter-tee-men/back.png',
  },

  // Ink/Butter Tee Women: three colours, each with its own front + back photo.
  'ink-butter-tee-women': {
    colorFrontImages: {
      Black: '/products/ink-butter-tee-women/black-front.png',
      Maroon: '/products/ink-butter-tee-women/maroon-front.png',
      Mauve: '/products/ink-butter-tee-women/mauve-front.png',
    },
    colorBackImages: {
      Black: '/products/ink-butter-tee-women/black-back.png',
      Maroon: '/products/ink-butter-tee-women/maroon-back.png',
      Mauve: '/products/ink-butter-tee-women/mauve-back.png',
    },
  },

  // Stone/Blood Tee Women: single colour (Heather Stone), own front + back.
  'stone-blood-tee-women': {
    frontImage: '/products/stone-blood-tee-women/front.png',
    backImage: '/products/stone-blood-tee-women/back.png',
  },

  // Butter/Stone Tee Women: single colour (Natural), own front + back.
  'butter-stone-tee-women': {
    frontImage: '/products/butter-stone-tee-women/front.png',
    backImage: '/products/butter-stone-tee-women/back.png',
  },
}

export function getProductImageOverride(slug: string): ProductImageOverride | null {
  return OVERRIDES[slug] ?? null
}
