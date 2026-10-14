import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import type { TileProduct } from '@/lib/tiles'
import styles from './ProductTile.module.css'

export interface ProductTileProps {
  product: TileProduct
  /** Tiles per row on desktop: drives the `sizes` hint and spacing. */
  density: 1 | 2 | 4
  /** First row: load eagerly so the largest image is not lazy (LCP). */
  eager?: boolean
  /** h2 when the tiles sit directly under the page h1 (shop, collections). */
  headingLevel?: 'h2' | 'h3'
}

export default function ProductTile({ product, density, eager = false, headingLevel = 'h3' }: ProductTileProps) {
  const Heading = headingLevel
  const sizes = `(min-width: 768px) ${Math.round(100 / density)}vw, 100vw`
  return (
    <article className={styles.tile} data-density={density}>
      <Link href={product.href} className={styles.link}>
        <div className={styles.media}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes={sizes}
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
    </article>
  )
}
