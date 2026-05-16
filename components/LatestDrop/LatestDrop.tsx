'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import type { SyncVariant } from '@/types/printful'
import styles from './LatestDrop.module.css'

interface Props {
  productId: number
  productName: string
  imageUrl: string | null
  variants: SyncVariant[]
}

export default function LatestDrop({ productId, productName, imageUrl, variants }: Props) {
  // Use all variants — don't filter on in_stock as the field may not be reliable
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))]

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  const selectedVariant = variants.find((v) => v.size === selectedSize) ?? variants[0]
  const price = selectedVariant?.retail_price
  const currency = selectedVariant?.currency ?? 'EUR'

  const formattedPrice = price && parseFloat(price) > 0
    ? `${currency === 'EUR' ? '€' : '$'}${parseFloat(price).toFixed(2)}`
    : null

  const handleAdd = () => {
    if (!selectedVariant) return
    addItem({
      variantId: selectedVariant.id,
      productId,
      productName,
      variantName: selectedVariant.name,
      price: selectedVariant.retail_price,
      currency: selectedVariant.currency,
      quantity,
      imageUrl,
    })
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className={styles.wrap}>
      {/* Image */}
      <div className={styles.imageWrap}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={productName} className={styles.image} />
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.label}>Latest Drop</p>
        <h2 className={styles.title}>{productName}</h2>
        {formattedPrice && <p className={styles.price}>{formattedPrice}</p>}

        {/* Sizes */}
        {sizes.length > 0 && (
          <div className={styles.sizeGroup}>
            <p className={styles.sizeLabel}>Maat</p>
            <div className={styles.sizes}>
              {sizes.map((size) => (
                <button
                  key={size}
                  className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className={styles.qtyGroup}>
          <p className={styles.sizeLabel}>Aantal</p>
          <div className={styles.qty}>
            <button
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Minder"
            >
              −
            </button>
            <span className={styles.qtyNum}>{quantity}</span>
            <button
              className={styles.qtyBtn}
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Meer"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to cart */}
        <button
          className={`${styles.addBtn} ${added ? styles.addBtnDone : ''}`}
          onClick={handleAdd}
        >
          {added ? 'Toegevoegd ✓' : 'Voeg toe aan winkelwagen'}
        </button>
      </div>
    </div>
  )
}
