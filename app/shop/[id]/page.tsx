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

  const previewFile =
    sync_variants[0]?.files?.find((f) => f.type === 'preview') ??
    sync_variants[0]?.files?.[0] ??
    null

  return (
    <main className={styles.page}>
      <ProductDetail
        productId={sync_product.id}
        productName={sync_product.name}
        variants={sync_variants}
        previewFile={previewFile}
      />
    </main>
  )
}
