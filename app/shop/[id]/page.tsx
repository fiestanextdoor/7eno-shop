import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/printful'
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

  // Zoek de beste afbeelding: prefereer een bestand met preview_url (product mockup).
  // 'default' type bestanden zijn het design artwork, niet de product foto.
  // Fallback: thumbnail van het product zelf.
  const allFiles = sync_variants.flatMap((v) => v.files ?? [])
  const previewFile =
    allFiles.find((f) => f.type === 'preview' && f.preview_url) ??
    allFiles.find((f) => f.preview_url) ??
    allFiles.find((f) => f.type !== 'default') ??
    allFiles[0] ??
    null

  const productThumbnail = sync_product.thumbnail_url ?? null

  return (
    <main className={styles.page}>
      <ProductDetail
        productId={sync_product.id}
        productName={sync_product.name}
        variants={sync_variants}
        previewFile={previewFile}
        productThumbnail={productThumbnail}
      />
    </main>
  )
}
