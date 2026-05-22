import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/printful'
import { removeBackground } from '@/lib/remove-bg'
import ProductDetail from './ProductDetail'
import styles from './detail.module.css'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  try {
    const products = await getProducts()
    return products.map((p) => ({ id: String(p.id) }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const { sync_product } = await getProduct(id)
    return { title: `${sync_product.name} — 7ENO` }
  } catch {
    return { title: '7ENO' }
  }
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params
  let detail
  try {
    detail = await getProduct(id)
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
      />
    </main>
  )
}
