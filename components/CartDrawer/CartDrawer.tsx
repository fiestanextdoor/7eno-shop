'use client'

import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button/Button'
import Drawer from '@/components/ui/Drawer/Drawer'
import { useCartTotals } from '@/hooks/useCartTotals'
import { cartItemKey } from '@/lib/cart-key'
import { formatEuro } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import CartLine from './CartLine'
import styles from './CartDrawer.module.css'

/** Top of the drawer: how far the order is from free shipping (threshold in lib/shipping). */
function FreeShippingProgress({ total }: { total: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const percent = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))
  const unlocked = remaining === 0
  return (
    <div className={styles.progress} data-unlocked={unlocked ? 'true' : 'false'}>
      <p className={styles.progressText} aria-live="polite">
        {unlocked ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7.5l3.2 3L12 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
            </svg>
            Free shipping unlocked.
          </>
        ) : (
          <>
            <strong className={styles.amount}>{formatEuro(remaining)}</strong> away from free shipping.
          </>
        )}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span className={styles.fill} style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
    </div>
  )
}

/** The cart: a right-hand Drawer (focus trap, Esc) over the store; logic unchanged. */
export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  // Display only: the checkout API recomputes the bundle discount and totals.
  const { bundleDiscountCents, discountedTotal } = useCartTotals()

  // Set items grouped together; standalone items after the sets.
  const bundleGroups = new Map<string, CartItem[]>()
  const standalone: CartItem[] = []
  for (const item of items) {
    if (item.bundleId) {
      const group = bundleGroups.get(item.bundleId) ?? []
      group.push(item)
      bundleGroups.set(item.bundleId, group)
    } else {
      standalone.push(item)
    }
  }

  const renderLine = (item: CartItem) => {
    const key = cartItemKey(item.provider, item.variantId, item.bundleId, item.productId)
    return (
      <CartLine
        key={key}
        item={item}
        onQuantity={(quantity) => updateQuantity(key, quantity)}
        onRemove={() => removeItem(key)}
        onNavigate={closeCart}
      />
    )
  }

  const footer =
    items.length > 0 ? (
      <div className={styles.footer}>
        {bundleDiscountCents > 0 && (
          <p className={styles.row}>
            <span>Combi-deal discount</span>
            <span className={styles.amount}>-{formatEuro(bundleDiscountCents / 100)}</span>
          </p>
        )}
        <p className={styles.row}>
          <span>Subtotal</span>
          <span className={styles.amount}>{formatEuro(discountedTotal)}</span>
        </p>
        <p className={styles.note}>Taxes included. Shipping is calculated at checkout.</p>
        <a href="/checkout" className={`${buttonClasses('primary', 'lg')} ${styles.checkout}`} onClick={closeCart}>
          Checkout
        </a>
      </div>
    ) : undefined

  return (
    <Drawer open={isOpen} onClose={closeCart} side="right" title="Cart" closeLabel="Close cart" footer={footer}>
      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Your cart is empty.</p>
          <Link href="/shop" className={buttonClasses('ghost')} onClick={closeCart}>
            Shop the drops
          </Link>
        </div>
      ) : (
        <>
          <FreeShippingProgress total={discountedTotal} />
          <ul className={styles.lines}>
          {[...bundleGroups.entries()].map(([bundleId, group]) => (
            <li key={`group-${bundleId}`} className={styles.group}>
              <span className={styles.groupTitle}>{group[0].bundleTitle ?? 'Set'}</span>
              <ul className={styles.lines}>{group.map(renderLine)}</ul>
            </li>
          ))}
          {standalone.map(renderLine)}
          </ul>
        </>
      )}
    </Drawer>
  )
}
