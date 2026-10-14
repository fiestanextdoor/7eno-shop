/** One product photo for the gallery. */
export interface GalleryImage {
  src: string
  alt: string
}

export interface GallerySource {
  productName: string
  /** Front mockup (background removed) or a local override. */
  front: string | null
  /** Genuine back mockup (background removed) or a local override. */
  back: string | null
  /** Other provider mockups (flat, on-model, detail crops), shown as-is. */
  mockups: string[]
  /** Local lifestyle photos from lib/product-images.ts, shown as-is. */
  extras: string[]
}

/** Front, back, then the other mockups and the local photos; every URL once. */
export function buildGallery({ productName, front, back, mockups, extras }: GallerySource): GalleryImage[] {
  const seen = new Set<string>()
  const out: GalleryImage[] = []
  const add = (src: string | null, alt: string) => {
    if (!src || seen.has(src)) return
    seen.add(src)
    out.push({ src, alt })
  }
  add(front, `${productName}, front`)
  add(back, `${productName}, back`)
  for (const src of [...mockups, ...extras]) add(src, `${productName}, view ${out.length + 1}`)
  return out
}

/** The gallery of a colour; a product without colours uses the '' key. */
export function galleryFor(galleries: Record<string, GalleryImage[]>, colour: string): GalleryImage[] {
  return galleries[colour] ?? galleries[''] ?? Object.values(galleries)[0] ?? []
}
