'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { NormalizedProduct, NormalizedColor } from '@/types/catalog'
import { productSlug } from '@/lib/slug'
import styles from './ProductCard.module.css'

interface ProductCardProps {
  product: NormalizedProduct
  index?: number
  imageUrl?: string | null
  colorSwatches?: NormalizedColor[]
  priceCents?: number
  currency?: string
}

function formatPrice(cents: number | undefined, currency: string | undefined): string | null {
  if (cents == null) return null
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : (currency ?? '')
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export default function ProductCard({ product, index = 0, imageUrl, colorSwatches, priceCents, currency }: ProductCardProps) {
  const router = useRouter()
  const [hoverSrc, setHoverSrc] = useState<string | null>(null)
  const num = String(index + 1).padStart(2, '0')
  const baseSrc = imageUrl ?? product.thumbnailUrl
  const slug = productSlug(product.name)
  const priceLabel = formatPrice(priceCents ?? product.priceCents, currency ?? product.currency)

  // Clicking a swatch opens the product with that colour preselected, instead
  // of just following the card link to the default colour.
  const openColor = (e: React.MouseEvent, color: string) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/shop/${slug}?color=${encodeURIComponent(color)}`)
  }

  return (
    <Link href={`/shop/${slug}`} className={styles.card}>

      {/* Image */}
      <div className={styles.imageWrap}>
        {baseSrc ? (
          <Image
            src={baseSrc}
            alt={product.name}
            fill
            className={styles.image}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={!!imageUrl}
          />
        ) : (
          <div className={styles.placeholder} />
        )}

        {/* Swatch hover overlay */}
        {hoverSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hoverSrc}
            alt=""
            aria-hidden="true"
            className={styles.hoverOverlay}
          />
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
        <div className={styles.nameWrap}>
          <p className={styles.name}>{product.name}</p>
          {priceLabel && <p className={styles.price}>{priceLabel}</p>}
        </div>
        {colorSwatches && colorSwatches.length > 0 && (
          <div className={styles.swatches}>
            {colorSwatches.map((s, i) => (
              <span
                key={s.color}
                className={styles.swatch}
                style={{
                  background: s.hex2
                    ? `linear-gradient(135deg, ${s.hex} 50%, ${s.hex2} 50%)`
                    : s.hex,
                }}
                title={s.displayName ?? s.color}
                role="button"
                aria-label={`View ${product.name} in ${s.displayName ?? s.color}`}
                onClick={(e) => openColor(e, s.color)}
                onMouseEnter={() => i > 0 && s.imageUrl ? setHoverSrc(s.imageUrl) : undefined}
                onMouseLeave={() => setHoverSrc(null)}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
