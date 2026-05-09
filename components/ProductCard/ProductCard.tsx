import Link from 'next/link'
import Image from 'next/image'
import type { SyncProduct } from '@/types/printful'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: SyncProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/shop/${product.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className={styles.placeholder} />
        )}
        <div className={styles.overlay}>
          <span className={styles.overlayText}>View Product</span>
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{product.name}</div>
      </div>
    </Link>
  )
}
