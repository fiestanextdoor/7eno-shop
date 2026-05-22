import Link from 'next/link'
import Image from 'next/image'
import type { SyncProduct } from '@/types/printful'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: SyncProduct
  index?: number
  imageUrl?: string | null
  colorCount?: number
}

export default function ProductCard({ product, index = 0, imageUrl, colorCount }: ProductCardProps) {
  const num = String(index + 1).padStart(2, '0')
  const src = imageUrl ?? product.thumbnail_url

  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>

      {/* Image */}
      <div className={styles.imageWrap}>
        {src ? (
          <Image
            src={src}
            alt={product.name}
            fill
            className={styles.image}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={!!imageUrl}
          />
        ) : (
          <div className={styles.placeholder} />
        )}

        {/* Top-left index */}
        <span className={styles.index}>{num}</span>

        {/* Hover CTA */}
        <div className={styles.hoverBar}>
          <span className={styles.hoverLabel}>View Product</span>
          <span className={styles.hoverArrow}>→</span>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.name}>{product.name}</p>
        {colorCount !== undefined && colorCount > 0 && (
          <p className={styles.variants}>
            {colorCount} {colorCount === 1 ? 'variant' : 'variants'}
          </p>
        )}
      </div>
    </Link>
  )
}
