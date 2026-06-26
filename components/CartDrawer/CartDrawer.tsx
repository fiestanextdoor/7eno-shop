'use client'

import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { cartItemKey } from '@/lib/cart-key'
import { getBundle } from '@/lib/bundles'
import { resolveBundleDiscountCents } from '@/lib/bundle-discount'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import type { CartItem } from '@/types/cart'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const total = useCartStore((s) => s.total())

  // Client-side display of the bundle discount. The checkout API re-validates
  // this authoritatively; here it only keeps the shown total honest.
  const subtotalCents = Math.round(total * 100)
  const discountCents = resolveBundleDiscountCents(
    items.filter((i) => i.bundleId).map((i) => ({ bundleId: i.bundleId!, productId: i.productId, resolved: true })),
    subtotalCents,
    getBundle,
  )
  const currency = items[0]?.currency ?? 'EUR'
  const discountedTotal = (subtotalCents - discountCents) / 100

  // Group set items together; standalone items keep their order after the sets.
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

  const renderItem = (item: CartItem) => (
    <li key={cartItemKey(item.provider, item.variantId, item.bundleId, item.productId)} className={styles.item}>
      {item.imageUrl ? (
        <div className={styles.thumb}>
          <Image src={item.imageUrl} alt={item.productName} fill style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <div className={styles.thumbPlaceholder} />
      )}
      <div className={styles.itemInfo}>
        <div className={styles.itemName}>{item.productName}</div>
        <div className={styles.itemVariant}>{item.variantName}</div>
        <div className={styles.itemPrice}>
          {item.currency} {(parseFloat(item.price) * item.quantity).toFixed(2)}
        </div>
        <div className={styles.qtyRow}>
          <button className={styles.qtyBtn} onClick={() => updateQuantity(cartItemKey(item.provider, item.variantId, item.bundleId, item.productId), item.quantity - 1)}>−</button>
          <span className={styles.qty}>{item.quantity}</span>
          <button className={styles.qtyBtn} onClick={() => updateQuantity(cartItemKey(item.provider, item.variantId, item.bundleId, item.productId), item.quantity + 1)}>+</button>
        </div>
      </div>
      <button className={styles.removeBtn} onClick={() => removeItem(cartItemKey(item.provider, item.variantId, item.bundleId, item.productId))} aria-label="Remove item">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.2A.8.8 0 003.8 14h8.4a.8.8 0 00.8-.8L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </li>
  )

  return (
    <>
      <div
        className={isOpen ? styles.overlayVisible : styles.overlayHidden}
        onClick={closeCart}
        onKeyDown={(e) => e.key === 'Escape' && closeCart()}
        role="button"
        tabIndex={0}
        aria-label="Close cart"
      />
      <aside
        className={isOpen ? styles.drawerOpen : styles.drawerClosed}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Cart</h2>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Your cart is empty.</p>
        ) : (
          <>
            {/* data-lenis-prevent: let this list scroll natively instead of the
                global Lenis smooth-scroll hijacking the wheel to the page. */}
            <ul className={styles.items} data-lenis-prevent>
              {[...bundleGroups.entries()].map(([bundleId, group]) => (
                <li key={`group-${bundleId}`} className={styles.group}>
                  <span className={styles.groupTitle}>{group[0].bundleTitle ?? 'Set'}</span>
                  <ul className={styles.groupItems}>{group.map(renderItem)}</ul>
                </li>
              ))}
              {standalone.map(renderItem)}
            </ul>
            <div className={styles.footer}>
              {discountCents > 0 && (
                <div className={styles.discountRow}>
                  <span>Combi-deal discount</span>
                  <span>− {currency} {(discountCents / 100).toFixed(2)}</span>
                </div>
              )}
              <p className={styles.shippingNote}>
                {discountedTotal >= FREE_SHIPPING_THRESHOLD
                  ? '✓ Your order ships free.'
                  : `Free shipping on orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)} (add €${(FREE_SHIPPING_THRESHOLD - discountedTotal).toFixed(2)}).`}
              </p>
              <div className={styles.total}>
                <span>Total</span>
                <span>{currency} {discountedTotal.toFixed(2)}</span>
              </div>
              <a href="/checkout" className={styles.checkoutBtn} onClick={closeCart}>
                Checkout
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
