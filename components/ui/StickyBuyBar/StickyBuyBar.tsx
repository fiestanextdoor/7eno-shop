'use client'

import Button from '@/components/ui/Button/Button'
import type { BuyPanelAnchors } from '@/components/ui/BuyPanel/BuyPanel'
import type { Purchase } from '@/hooks/usePurchase'
import styles from './StickyBuyBar.module.css'

export interface StickyBuyBarProps {
  name: string
  purchase: Purchase
  anchors: BuyPanelAnchors
}

/** Scroll the anchor into view and focus `selector` inside it, else the anchor. */
function reveal(id: string, selector: string) {
  const root = document.getElementById(id)
  if (!root) return
  root.scrollIntoView?.({ block: 'center' })
  ;(root.querySelector<HTMLElement>(selector) ?? root).focus()
}

/**
 * Mobile "Add to cart" bar. Sticky at the bottom of the product block, so it
 * stops above the footer instead of covering it; hidden from 1024px, where
 * the buy panel itself is sticky.
 */
export default function StickyBuyBar({ name, purchase, anchors }: StickyBuyBarProps) {
  let label = purchase.added ? 'Added to cart' : 'Add to cart'
  let onClick: () => void = purchase.addToCart
  if (purchase.selectionSoldOut) {
    label = 'Notify me'
    onClick = () => reveal(anchors.notify, 'input[type="email"]')
  } else if (purchase.needsSize) {
    label = 'Select a size'
    onClick = () => reveal(anchors.sizes, '[role="radio"][tabindex="0"]')
  }

  return (
    <div className={styles.bar} data-sticky-buy="">
      <div className={styles.summary}>
        <p className={styles.name}>{name}</p>
        {purchase.price && <p className={styles.price}>{purchase.price}</p>}
      </div>
      <Button variant="primary" onClick={onClick}>
        {label}
      </Button>
    </div>
  )
}
