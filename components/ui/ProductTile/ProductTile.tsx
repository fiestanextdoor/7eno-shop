import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import { buttonClasses } from '@/components/ui/Button/Button'
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
      {onQuickAdd && product.quick && (
        <div className={styles.actions}>
          <button
            type="button"
            className={`${buttonClasses('ghost')} ${styles.quick}`}
            onClick={onQuickAdd}
            aria-haspopup="dialog"
            aria-label={`Add ${product.name} to cart`}
          >
            {product.quick.soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      )}
    </article>
  )
}
