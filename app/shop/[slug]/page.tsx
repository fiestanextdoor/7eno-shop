import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getProduct, getProducts, getCatalogProductId, getEuSizeMap } from '@/lib/printful'
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
  const sizeValues = sync_variants.map((v) => v.size).filter(Boolean)
  const isFootwear = sizeValues.length > 0 && sizeValues.every((s) => /^\d+(\.5)?$/.test(s))
  let euSizeMap: Record<string, string> = {}
  if (isFootwear && sync_variants[0]?.variant_id) {
    const catalogProductId = await getCatalogProductId(sync_variants[0].variant_id)
    if (catalogProductId) euSizeMap = await getEuSizeMap(catalogProductId)
  }

  const bgRemovedUrl = productThumbnail
    ? await removeBackground(productThumbnail).catch(() => null)
    : null

  // Build color → best preview image map (first variant per color wins)
  const colorImages: Record<string, string> = {}
  for (const variant of sync_variants) {
    if (!variant.color || colorImages[variant.color]) continue
    const files = variant.files ?? []
    const file =
      files.find((f) => f.type === 'preview' && f.preview_url) ??
      files.find((f) => f.preview_url) ??
      files.find((f) => f.type !== 'default') ??
      files[0] ??
      null
    const url = file?.preview_url ?? file?.url ?? null
    if (url) colorImages[variant.color] = url
  }

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
