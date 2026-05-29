import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getProduct, getProducts, getEuSizeMapForProduct } from '@/lib/printful'
import { productSlug } from '@/lib/slug'
import { removeBackground } from '@/lib/remove-bg'
import ProductDetail from './ProductDetail'
import styles from './detail.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const products = await getProducts()
    return products.map((p) => ({ slug: productSlug(p.name) }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const products = await getProducts().catch(() => [])
  const match = products.find((p) => productSlug(p.name) === slug)
  return { title: match ? `${match.name} — 7ENO` : '7ENO' }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  let products: Awaited<ReturnType<typeof getProducts>> = []
  try {
    products = await getProducts()
  } catch {
    products = []
  }

  // Back-compat: old numeric-id URLs (/shop/433351254) redirect to the slug URL.
  if (/^\d+$/.test(slug)) {
    const byId = products.find((p) => String(p.id) === slug)
    if (byId) permanentRedirect(`/shop/${productSlug(byId.name)}`)
    notFound()
  }

  const match = products.find((p) => productSlug(p.name) === slug)
  if (!match) notFound()

  let detail
  try {
    detail = await getProduct(String(match.id))
  } catch {
    notFound()
  }

  const { sync_product, sync_variants } = detail!

  const allFiles = sync_variants.flatMap((v) => v.files ?? [])
  const previewFile =
    allFiles.find((f) => f.type === 'preview' && f.preview_url) ??
    allFiles.find((f) => f.preview_url) ??
    allFiles.find((f) => f.type !== 'default') ??
    allFiles[0] ??
    null

  const productThumbnail = sync_product.thumbnail_url ?? null

  // Footwear ships with US sizes from Printful; convert to EU for display.
  const euSizeMap = await getEuSizeMapForProduct(sync_variants)

  const bgRemovedUrl = productThumbnail
    ? await removeBackground(productThumbnail).catch(() => null)
    : null

  // Build color → best preview image map (first variant per color wins)
  const rawColorImages: Record<string, string> = {}
  for (const variant of sync_variants) {
    if (!variant.color || rawColorImages[variant.color]) continue
    const files = variant.files ?? []
    const file =
      files.find((f) => f.type === 'preview' && f.preview_url) ??
      files.find((f) => f.preview_url) ??
      files.find((f) => f.type !== 'default') ??
      files[0] ??
      null
    const url = file?.preview_url ?? file?.url ?? null
    if (url) rawColorImages[variant.color] = url
  }

  // Remove backgrounds (result cached in Supabase Storage) so non-default colours
  // on the product page — and the mini-cart thumbnail — don't show a background.
  const colorImages: Record<string, string> = {}
  await Promise.all(
    Object.entries(rawColorImages).map(async ([color, url]) => {
      const processed = await removeBackground(url).catch(() => null)
      colorImages[color] = processed ?? url
    })
  )

  return (
    <main className={styles.page}>
      <ProductDetail
        productId={sync_product.id}
        productName={sync_product.name}
        variants={sync_variants}
        previewFile={previewFile}
        productThumbnail={productThumbnail}
        bgRemovedUrl={bgRemovedUrl}
        colorImages={colorImages}
        euSizeMap={euSizeMap}
      />
    </main>
  )
}
