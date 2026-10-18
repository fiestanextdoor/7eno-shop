import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import type { TileProduct } from '@/lib/tiles'
import styles from './ProductTile.module.css'

export interface ProductTileProps {
  product: TileProduct
  /** First row: load eagerly so the largest image is not lazy (LCP). */
  eager?: boolean
  /** h2 when the tiles sit directly under the page h1 (shop, collections). */
  headingLevel?: 'h2' | 'h3'
  /** Given, and the tile carries quick-add data: an "Add to cart" button opens the quick-add dialog. */
  onQuickAdd?(): void
}

/** Four per row from 768px, two below: the only grid the shop renders. */
const SIZES = '(min-width: 768px) 25vw, 50vw'

export default function ProductTile({ product, eager = false, headingLevel = 'h3', onQuickAdd }: ProductTileProps) {
  const Heading = headingLevel
  return (
    <article className={styles.tile}>
      <Link href={product.href} className={styles.link}>
        <div className={styles.media}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes={SIZES}
              loading={eager ? 'eager' : 'lazy'}
              className={styles.image}
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
          {product.badges.length > 0 && (
            <div className={styles.badges}>
              {product.badges.map((kind) => (
                <Badge key={kind} kind={kind} />
              ))}
            </div>
          )}
        </div>
        <div className={styles.info}>
          <Heading className={styles.name}>{product.name}</Heading>
          {product.price && <p className={styles.price}>{product.price}</p>}
          {product.note && <p className={styles.note}>{product.note}</p>}
        </div>
      </Link>
      {onQuickAdd && product.quick && !product.quick.soldOut && (
        <button
          type="button"
          className={styles.quick}
          onClick={onQuickAdd}
          aria-haspopup="dialog"
          aria-label={`Add ${product.name} to cart`}
          title="Add to cart"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M12 10v8M8 14h8" />
          </svg>
        </button>
      )}
    </article>
  )
}
