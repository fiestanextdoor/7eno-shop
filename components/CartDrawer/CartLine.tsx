'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatEuro } from '@/lib/money'
import { productSlug } from '@/lib/slug'
import type { CartItem } from '@/types/cart'
import styles from './CartLine.module.css'

/** app/api/checkout/route.ts rejects a line above 100 pieces; the stepper stops there. */
export const MAX_LINE_QUANTITY = 100

/** "M" from "OLYMPN Sport Oversized Hoodie Mocha / M"; null when the name carries no size. */
export function sizeFromVariantName(variantName: string): string | null {
  const parts = variantName.split(' / ')
  if (parts.length < 2) return null
  return parts[parts.length - 1].trim() || null
}

export interface CartLineProps {
  item: CartItem
  onQuantity(quantity: number): void
  onRemove(): void
  /** A product link was followed: close the drawer. */
  onNavigate(): void
}

export default function CartLine({ item, onQuantity, onRemove, onNavigate }: CartLineProps) {
  // The slug comes from the product name, the same way the catalogue builds it.
  const href = `/shop/${productSlug(item.productName)}`
  const size = sizeFromVariantName(item.variantName)
  const lineTotal = (parseFloat(item.price) || 0) * item.quantity

  return (
    <li className={styles.line}>
      <Link href={href} className={styles.thumb} onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="72px" className={styles.thumbImage} />}
      </Link>
      <div className={styles.info}>
        <Link href={href} className={styles.name} onClick={onNavigate}>
          {item.productName}
        </Link>
        {size && <p className={styles.meta}>Size {size}</p>}
        <div className={styles.controls}>
          <div className={styles.stepper} role="group" aria-label={`Quantity of ${item.productName}`}>
            <button
              type="button"
              className={styles.step}
              aria-label="Decrease quantity"
              onClick={() => onQuantity(item.quantity - 1)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <span className={styles.qty} aria-live="polite">{item.quantity}</span>
            <button
              type="button"
              className={styles.step}
              aria-label="Increase quantity"
              disabled={item.quantity >= MAX_LINE_QUANTITY}
              onClick={() => onQuantity(item.quantity + 1)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h10M6 1v10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <button type="button" className={styles.remove} aria-label={`Remove ${item.productName}`} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
      <p className={styles.price}>{formatEuro(lineTotal)}</p>
    </li>
  )
}
