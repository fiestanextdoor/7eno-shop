'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type SyntheticEvent } from 'react'
import Button from '@/components/ui/Button/Button'
import SizeSelector from '@/components/ui/SizeSelector/SizeSelector'
import { useScrollLock } from '@/hooks/useFocusTrap'
import { usePurchase } from '@/hooks/usePurchase'
import type { QuickAddData, TileProduct } from '@/lib/tiles'
import { useCartStore } from '@/store/cart'
import styles from './QuickAddDialog.module.css'

export interface QuickAddDialogProps {
  /** The tile being added, or null when closed. */
  tile: TileProduct | null
  /** The tiles on the page: a colour swatch switches to its sibling when it is among them. */
  tiles: TileProduct[]
  onClose(): void
  onSwitch(tile: TileProduct): void
}

/**
 * Quick add from a tile: a native <dialog> with the piece, its colours, its
 * sizes and one "Add to cart" button; after adding it shows a confirmation
 * with "View cart" and "Continue shopping". The buy state is the product
 * page's own hook (usePurchase), keyed on the tile so a colour switch starts
 * clean.
 */
export default function QuickAddDialog({ tile, tiles, onClose, onSwitch }: QuickAddDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const open = tile !== null
  useScrollLock(open)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.hasAttribute('open')) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.hasAttribute('open')) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    onClose()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    onClose()
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Add to cart"
      onCancel={onCancel}
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
      onClose={onClose}
    >
      {tile && tile.quick && (
        <QuickAddBody key={tile.slug} tile={tile} quick={tile.quick} tiles={tiles} onClose={onClose} onSwitch={onSwitch} />
      )}
    </dialog>
  )
}

interface BodyProps {
  tile: TileProduct
  quick: QuickAddData
  tiles: TileProduct[]
  onClose(): void
  onSwitch(tile: TileProduct): void
}

function QuickAddBody({ tile, quick, tiles, onClose, onSwitch }: BodyProps) {
  const titleId = useId()
  const sizesId = useId()
  const openCart = useCartStore((s) => s.openCart)
  const [done, setDone] = useState<string | null>(null)
  const purchase = usePurchase({
    provider: quick.provider,
    productId: quick.productId,
    productName: tile.name,
    variants: quick.variants,
    soldOut: quick.soldOut,
    imageFor: () => tile.image,
  })
  const chosenLabel = purchase.sizes.find((s) => s.value === purchase.selectedSize)?.label ?? null

  function add() {
    if (purchase.needsSize || purchase.selectionSoldOut) return
    purchase.addToCart()
    setDone(chosenLabel)
  }

  function viewCart() {
    onClose()
    openCart()
  }

  const closeButton = (
    <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    </button>
  )

  if (done !== null) {
    return (
      <div className={styles.inner} data-state="added">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Added to cart</p>
          {closeButton}
        </div>
        <div className={styles.summary}>
          {tile.image && (
            <div className={styles.thumb}>
              <Image src={tile.image} alt="" fill sizes="96px" className={styles.thumbImage} />
            </div>
          )}
          <div>
            <h2 id={titleId} className={styles.name}>{tile.name}</h2>
            <p className={styles.meta}>
              {done && <span>Size {done}</span>}
              {purchase.price && <span>{purchase.price}</span>}
            </p>
          </div>
        </div>
        <div className={styles.buttons}>
          <Button variant="primary" size="lg" onClick={viewCart}>View cart</Button>
          <Button variant="ghost" size="lg" onClick={onClose}>Continue shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.inner}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>Quick add</p>
        {closeButton}
      </div>
      <div className={styles.summary}>
        {tile.image && (
          <div className={styles.thumb}>
            <Image src={tile.image} alt="" fill sizes="96px" className={styles.thumbImage} />
          </div>
        )}
        <div>
          <h2 id={titleId} className={styles.name}>{tile.name}</h2>
          {purchase.price && <p className={styles.meta}>{purchase.price}</p>}
          <Link href={tile.href} className={styles.detailLink}>View details</Link>
        </div>
      </div>

      {quick.colours.length > 1 && (
        <div className={styles.colours}>
          <p className={styles.label}>
            <span>Colour</span>
            <span className={styles.value}>{quick.colours.find((c) => c.current)?.name}</span>
          </p>
          <ul className={styles.swatches}>
            {quick.colours.map((colour) => {
              const sibling = tiles.find((t) => t.slug === colour.slug)
              const name = colour.soldOut ? `${colour.name}, sold out` : colour.name
              if (colour.current) {
                return (
                  <li key={colour.slug}>
                    <span className={styles.swatch} style={{ background: colour.hex }} data-current="true" role="img" aria-label={`${name}, selected`} />
                  </li>
                )
              }
              return (
                <li key={colour.slug}>
                  {sibling && sibling.quick ? (
                    <button type="button" className={styles.swatch} style={{ background: colour.hex }} onClick={() => onSwitch(sibling)} aria-label={name} />
                  ) : (
                    <Link href={`/shop/${colour.slug}`} className={styles.swatch} style={{ background: colour.hex }} aria-label={name} />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {purchase.sizes.length > 1 && (
        <SizeSelector id={sizesId} sizes={purchase.sizes} value={purchase.selectedSize} onChange={purchase.selectSize} />
      )}

      {purchase.selectionSoldOut ? (
        <Link href={tile.href} className={styles.soldOut}>Sold out: get notified on the product page</Link>
      ) : (
        <Button variant="primary" size="lg" onClick={add} disabled={purchase.needsSize} className={styles.add}>
          {purchase.needsSize ? 'Select a size' : 'Add to cart'}
        </Button>
      )}
    </div>
  )
}
