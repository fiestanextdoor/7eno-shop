'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import type { CarouselItem, CarouselVariant } from './ProductCarousel'
import styles from './QuickAddCard.module.css'

// Mirror the size filter used on the product detail page so the carousel never
// offers sizes the rest of the shop hides.
const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

// Same money formatting as ProductCard / the product page, so the carousel
// price reads identically to the rest of the shop (e.g. "€29.95").
function formatPrice(cents: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency || ''
  return `${symbol}${(cents / 100).toFixed(2)}`
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface QuickAddCardProps {
  item: CarouselItem
}

/**
 * A carousel product card with an inline quick-add control: colour swatches pick
 * the variant family, a "+" button bottom-right reveals the available sizes on
 * hover/tap, and clicking a size adds it to the cart and opens the drawer.
 */
export default function QuickAddCard({ item }: QuickAddCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const colors = item.colors.filter((c) => c.color)
  const hasColors = colors.length > 1
  const [activeColor, setActiveColor] = useState<string>(colors[0]?.color ?? '')
  const [open, setOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  // Variants for the active colour (or all, when the product has no colours).
  const colorVariants = hasColors
    ? item.variants.filter((v) => v.color === activeColor)
    : item.variants

  const allOutOfStock = colorVariants.length > 0 && colorVariants.every((v) => v.inStock === false)
  const isAvailable = (v: CarouselVariant) => (allOutOfStock ? true : v.inStock !== false)

  // Unique, in-stock sizes for the active colour, excluding the hidden sizes.
  const sizes = Array.from(new Map(colorVariants.map((v) => [v.size || v.name, v])).values())
    .filter((v) => !EXCLUDED_SIZES.has(v.size) && isAvailable(v))

  const canQuickAdd = sizes.length > 0
  const label = (v: CarouselVariant) => (v.size || v.name || 'One size')

  // Lowest in-stock price for the active colour. Only prefix "from" when sizes
  // actually carry different prices, so single-price products read clean.
  const pricePool = sizes.length ? sizes : colorVariants
  const prices = pricePool.map((v) => v.priceCents).filter((c) => c > 0)
  const minPrice = prices.length ? Math.min(...prices) : null
  const priceLabel =
    minPrice != null
      ? `${Math.max(...prices) > minPrice ? 'from ' : ''}${formatPrice(minPrice, item.currency)}`
      : null

  // The shown photo follows the selected colour (falls back to the card image).
  const activeColorObj = colors.find((c) => c.color === activeColor)
  const displayImage = activeColorObj?.image ?? item.image

  function handleAdd(variant: CarouselVariant) {
    addItem({
      provider: item.provider,
      variantId: variant.id,
      productId: item.productId,
      productName: item.name,
      variantName: variant.name,
      price: (variant.priceCents / 100).toFixed(2),
      currency: item.currency,
      quantity: 1,
      imageUrl: displayImage,
    })
    setOpen(false)
    setJustAdded(true)
    openCart()
  }

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <Link href={`/shop/${item.slug}`} className={styles.imageLink} aria-label={item.name}>
          {displayImage ? (
            <Image
              key={displayImage}
              src={displayImage}
              alt={activeColorObj ? `${item.name} — ${activeColorObj.displayName || activeColorObj.color}` : item.name}
              fill
              className={styles.image}
              sizes="(max-width: 640px) 55vw, 240px"
            />
          ) : (
            <span className={styles.placeholder} />
          )}
        </Link>

        {hasColors && (
          <div className={styles.swatches} aria-label="Available colours">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                className={`${styles.swatch} ${activeColor === c.color ? styles.swatchActive : ''}`}
                style={{ backgroundColor: c.hex || '#ccc' }}
                aria-label={c.displayName || c.color}
                aria-pressed={activeColor === c.color}
                title={c.displayName || c.color}
                onClick={() => {
                  setActiveColor(c.color)
                  setJustAdded(false)
                }}
              />
            ))}
          </div>
        )}

        {canQuickAdd && (
          <div
            className={`${styles.addArea} ${open ? styles.addAreaOpen : ''}`}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setOpen(false) }}
          >
            {/* data-lenis-prevent: let the size menu scroll natively instead of the
                global Lenis smooth-scroll hijacking the wheel to the page. */}
            <div className={styles.sizePopover} role="menu" aria-label={`Choose a size for ${item.name}`} data-lenis-prevent>
              {sizes.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="menuitem"
                  className={styles.sizeChip}
                  onClick={() => handleAdd(v)}
                >
                  {label(v)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.addBtn}
              aria-label={`Quick add ${item.name}`}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') setOpen(true) }}
            >
              {justAdded ? <CheckIcon /> : <PlusIcon />}
            </button>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.meta}>
          <Link href={`/shop/${item.slug}`} className={styles.name}>
            {item.name}
          </Link>
          {priceLabel && <span className={styles.price}>{priceLabel}</span>}
        </div>
      </div>
    </div>
  )
}
