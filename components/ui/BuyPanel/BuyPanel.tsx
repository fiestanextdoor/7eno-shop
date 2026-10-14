'use client'

import Link from 'next/link'
import Accordion from '@/components/ui/Accordion/Accordion'
import Badge from '@/components/ui/Badge/Badge'
import Button from '@/components/ui/Button/Button'
import ColourSiblings from '@/components/ui/ColourSiblings/ColourSiblings'
import SizeGuideDialog from '@/components/ui/SizeGuideDialog/SizeGuideDialog'
import SizeSelector from '@/components/ui/SizeSelector/SizeSelector'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
import type { Purchase } from '@/hooks/usePurchase'
import type { ColourSibling } from '@/lib/colour-siblings'
import type { DropView } from '@/lib/drops'
import type { SizeGuide } from '@/lib/printful'
import type { InfoSection } from '@/lib/product-copy'
import styles from './BuyPanel.module.css'

export interface BuyPanelProduct {
  name: string
  slug: string
  /** False for a teaser before its release (spec section 4). */
  purchasable: boolean
  /** Every variant out of stock. */
  soldOut: boolean
  /** "1 November 2026 at 12:00 CET", shown on a teaser. */
  releaseLabel?: string
}

/** Element ids the sticky bar jumps to. */
export interface BuyPanelAnchors {
  sizes: string
  notify: string
}

export interface BuyPanelSizeGuide {
  category: string
  guide: SizeGuide
  sizeLabels?: Record<string, string>
}

export interface BuyPanelProps {
  product: BuyPanelProduct
  drop: DropView
  siblings: ColourSibling[]
  /**
   * From usePurchase, shared with StickyBuyBar. Its `imageFor(colour)` must be the
   * old ProductDetail `frontFor(colour)`: `frontOverride ?? colorImages[colour] ?? baseImageUrl`.
   */
  purchase: Purchase
  sizeGuide: BuyPanelSizeGuide | null
  modelNote?: string
  info: InfoSection[]
  anchors: BuyPanelAnchors
}

/** The buy column: sticky on desktop (ProductView), first after the gallery on mobile. */
export default function BuyPanel({ product, drop, siblings, purchase, sizeGuide, modelNote, info, anchors }: BuyPanelProps) {
  const guide = sizeGuide ? (
    <SizeGuideDialog
      category={sizeGuide.category}
      guide={sizeGuide.guide}
      modelNote={modelNote}
      sizeLabels={sizeGuide.sizeLabels}
    />
  ) : null
  const ctaLabel = purchase.added ? 'Added to cart' : purchase.needsSize ? 'Select a size' : 'Add to cart'

  return (
    <div className={styles.panel}>
      <Link href={drop.href} className={styles.edition}>
        {drop.editionLabel} · {drop.title}
      </Link>
      <h1 className={styles.name}>{product.name}</h1>

      <div className={styles.priceRow}>
        {purchase.price && (
          <p className={styles.price}>
            <span>{purchase.price}</span> <span className={styles.tax}>incl. tax</span>
          </p>
        )}
        {!product.purchasable && <Badge kind="coming" />}
        {product.purchasable && product.soldOut && <Badge kind="sold-out" />}
      </div>

      <ColourSiblings items={siblings} />

      {product.purchasable ? (
        <>
          {purchase.colours.length > 1 && (
            <SizeSelector
              label="Colour"
              sizes={purchase.colours}
              value={purchase.selectedColour}
              onChange={purchase.selectColour}
            />
          )}
          {purchase.sizes.length > 1 ? (
            <SizeSelector
              id={anchors.sizes}
              sizes={purchase.sizes}
              value={purchase.selectedSize}
              onChange={purchase.selectSize}
              aside={guide}
            />
          ) : (
            guide && <div className={styles.guideRow}>{guide}</div>
          )}
          {modelNote && <p className={styles.modelNote}>{modelNote}</p>}

          {purchase.selectionSoldOut ? (
            <div id={anchors.notify} tabIndex={-1} className={styles.notify}>
              <p className={styles.notifyText}>
                {purchase.sizes.length > 1 && !product.soldOut ? 'This size is sold out.' : 'Sold out.'}
              </p>
              <WaitlistForm
                productSlug={product.slug}
                label="Email me when it is back"
                doneMessage="You're on the list. We'll email you when it is back."
              />
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className={styles.cta}
              onClick={purchase.addToCart}
              disabled={purchase.needsSize}
            >
              {ctaLabel}
            </Button>
          )}
        </>
      ) : (
        <div className={styles.teaser}>
          {product.releaseLabel && <p className={styles.teaserDate}>Drops {product.releaseLabel}</p>}
          <WaitlistForm productSlug={product.slug} />
        </div>
      )}

      <Accordion
        items={info.map((section) => ({
          title: section.title,
          content: (
            <ul className={styles.infoList}>
              {section.lines.map((line, i) => (
                <li key={`${section.title}-${i}`}>{line}</li>
              ))}
            </ul>
          ),
        }))}
      />
    </div>
  )
}
