import Image from 'next/image'
import { cartItemKey } from '@/lib/cart-key'
import { formatEuro } from '@/lib/money'
import type { CartItem } from '@/types/cart'
import styles from './checkout.module.css'

export interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  discount: number
  appliedCode: string | null
  shippingCost: number
  freeShipping: boolean
  shippingNote: string
  grandTotal: number
}

/** Lines and totals; display only, /api/checkout recomputes everything. */
export default function OrderSummary({
  items,
  subtotal,
  discount,
  appliedCode,
  shippingCost,
  freeShipping,
  shippingNote,
  grandTotal,
}: OrderSummaryProps) {
  return (
    <>
      <ul className={styles.lines}>
        {items.map((item) => (
          <li key={cartItemKey(item.provider, item.variantId, item.bundleId, item.productId)} className={styles.line}>
            <div className={styles.lineThumb}>
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.productName} fill sizes="64px" className={styles.lineImage} />
              )}
            </div>
            <div className={styles.lineInfo}>
              <p className={styles.lineName}>{item.productName}</p>
              <p className={styles.lineVariant}>
                {item.variantName} &middot; qty {item.quantity}
              </p>
            </div>
            <p className={styles.linePrice}>{formatEuro((parseFloat(item.price) || 0) * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className={styles.totals}>
        <div className={styles.row}>
          <dt>Subtotal</dt>
          <dd>{formatEuro(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className={styles.row}>
            <dt>Discount ({appliedCode})</dt>
            <dd>-{formatEuro(discount)}</dd>
          </div>
        )}
        <div className={styles.row}>
          <dt>Shipping</dt>
          <dd>{freeShipping ? 'Free' : formatEuro(shippingCost)}</dd>
        </div>
        <div className={`${styles.row} ${styles.totalRow}`}>
          <dt>Total</dt>
          <dd>{formatEuro(grandTotal)}</dd>
        </div>
      </dl>
      <p className={styles.note}>{shippingNote}</p>
    </>
  )
}
