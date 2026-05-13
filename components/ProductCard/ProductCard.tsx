import Link from 'next/link'
import Image from 'next/image'
import type { SyncProduct } from '@/types/printful'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: SyncProduct
  index?: number
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const num = String(index + 1).padStart(2, '0')

  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>

      {/* Image */}
      <div className={styles.imageWrap}>
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className={styles.image}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
        <p className={styles.variants}>
          {product.variants} {product.variants === 1 ? 'variant' : 'variants'}
        </p>
      </div>
    </Link>
  )
}
