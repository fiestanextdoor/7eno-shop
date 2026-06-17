import { getProductCardImages } from '@/lib/product-images'
import { removeBackground } from '@/lib/remove-bg'

/**
 * The single card/cover image for a product: a local front override if one
 * exists (used as-is), otherwise the background-removed provider thumbnail,
 * falling back to the raw thumbnail. Reuses the same Supabase remove.bg cache as
 * /shop, so it adds no API calls for products already shown there.
 */
export async function resolveCardImage(args: {
  slug: string
  thumbnailUrl: string | null
}): Promise<string | null> {
  const local = getProductCardImages(args.slug).front
  if (local) return local
  if (args.thumbnailUrl) {
    const processed = await removeBackground(args.thumbnailUrl).catch(() => null)
    return processed ?? args.thumbnailUrl
  }
  return null
}
