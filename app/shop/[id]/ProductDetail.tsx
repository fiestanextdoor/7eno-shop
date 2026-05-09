'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SyncVariant, PrintfulFile } from '@/types/printful'
import { useCartStore } from '@/store/cart'
import styles from './detail.module.css'

interface ProductDetailProps {
  productId: number
  productName: string
  variants: SyncVariant[]
  previewFile: PrintfulFile | null
}

export default function ProductDetail({
  productId,
  productName,
  variants,
  previewFile,
}: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    variants.length === 1 ? variants[0].id : null
  )
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const handleAddToCart = () => {
    if (!selectedVariant) return
    const imageUrl = previewFile?.preview_url ?? previewFile?.url ?? null
    addItem({
      variantId: selectedVariant.id,
      productId,
      productName,
      variantName: selectedVariant.name,
      price: selectedVariant.retail_price,
      currency: selectedVariant.currency,
      quantity: 1,
      imageUrl,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const imageUrl = previewFile?.preview_url ?? previewFile?.url ?? null

  return (
    <div className={styles.inner}>
      <div>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            width={600}
            height={600}
            className={styles.mainImg}
            priority
          />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
      </div>

      <div className={styles.info}>
        <p className={styles.breadcrumb}>
          <Link href="/shop">Shop</Link> / {productName}
        </p>

        <h1 className={styles.name}>{productName}</h1>

        {selectedVariant && (
          <p className={styles.price}>€{selectedVariant.retail_price}</p>
        )}

        {variants.length > 1 && (
          <div>
            <p className={styles.sizeLabel}>Select Size</p>
            <div className={styles.sizes}>
              {variants.map((v) => (
                <button
                  key={v.id}
                  className={`${styles.sizeBtn} ${selectedVariantId === v.id ? styles.selected : ''}`}
                  onClick={() => setSelectedVariantId(v.id)}
                  aria-pressed={selectedVariantId === v.id}
                >
                  {v.size || v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className={`${styles.addBtn} ${added ? styles.added : ''}`}
          onClick={handleAddToCart}
          disabled={!selectedVariantId}
          aria-label={added ? 'Added to cart' : 'Add to cart'}
        >
          {added ? 'Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
