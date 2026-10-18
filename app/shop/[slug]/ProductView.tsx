'use client'

import { useId } from 'react'
import BuyPanel, { type BuyPanelProduct } from '@/components/ui/BuyPanel/BuyPanel'
import Gallery from '@/components/ui/Gallery/Gallery'
import StickyBuyBar from '@/components/ui/StickyBuyBar/StickyBuyBar'
import { usePurchase } from '@/hooks/usePurchase'
import type { ColourSibling } from '@/lib/colour-siblings'
import type { DropView } from '@/lib/drops'
import type { SizeGuide } from '@/lib/printful'
import type { InfoSection } from '@/lib/product-copy'
import { galleryFor, type GalleryImage } from '@/lib/product-gallery'
import type { NormalizedVariant, Provider } from '@/types/catalog'
import styles from './product.module.css'

export interface ProductViewProduct extends BuyPanelProduct {
  provider: Provider
  id: string
}

export interface ProductViewProps {
  product: ProductViewProduct
  drop: DropView
  variants: NormalizedVariant[]
  galleries: Record<string, GalleryImage[]>
  siblings: ColourSibling[]
  euSizeMap: Record<string, string>
  sizeGuide: { category: string; guide: SizeGuide } | null
  modelNote?: string
  info: InfoSection[]
}

/**
 * The product page body: one buy state for the gallery, the buy panel and
 * the mobile sticky bar. The bar is the last child of this block, so its
 * sticky positioning ends where the block ends, above the footer.
 */
export default function ProductView({
  product,
  drop,
  variants,
  galleries,
  siblings,
  euSizeMap,
  sizeGuide,
  modelNote,
  info,
}: ProductViewProps) {
  const anchors = { sizes: useId(), notify: useId() }
  const purchase = usePurchase({
    provider: product.provider,
    productId: product.id,
    productName: product.name,
    variants,
    soldOut: product.soldOut,
    euSizeMap,
    imageFor: (colour) => galleryFor(galleries, colour)[0]?.src ?? null,
  })
  const images = galleryFor(galleries, purchase.selectedColour)

  return (
    <div className={styles.view} data-pdp="">
      <div className={styles.layout}>
        <div className={styles.media}>
          <Gallery key={purchase.selectedColour} images={images} label={product.name} />
        </div>
        <div className={styles.buy} data-reveal="hero">
          <BuyPanel
            product={product}
            drop={drop}
            siblings={siblings}
            purchase={purchase}
            sizeGuide={sizeGuide ? { ...sizeGuide, sizeLabels: euSizeMap } : null}
            modelNote={modelNote}
            info={info}
            anchors={anchors}
          />
        </div>
      </div>
      {product.purchasable && <StickyBuyBar name={product.name} purchase={purchase} anchors={anchors} />}
    </div>
  )
}
