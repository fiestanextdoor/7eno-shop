'use client'

import { useState, useEffect } from 'react'
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
  productThumbnail?: string | null
}

export default function ProductDetail({
  productId,
  productName,
  variants,
  previewFile,
  productThumbnail,
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
  }

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2200)
    return () => clearTimeout(t)
  }, [added])

  // Gebruik preview_url van het bestand, dan thumbnail van het product als fallback
  const imageUrl =
    previewFile?.preview_url ??
    previewFile?.url ??
    productThumbnail ??
    null

  // Manual stores tracken geen voorraad — als alle varianten in_stock: false zijn,
  // behandel ze als beschikbaar (anders zijn alle maten disabled)
  const allOutOfStock = variants.every((v) => v.in_stock === false)
  const isAvailable = (v: SyncVariant) => allOutOfStock ? true : v.in_stock !== false

  const uniqueSizes = Array.from(
    new Map(variants.map((v) => [v.size || v.name, v])).values()
  )

  const currency = variants[0]?.currency ?? 'EUR'
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency

  return (
    <div className={styles.inner}>

      {/* ── Left: image ── */}
      <div className={styles.imagePanel}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className={styles.mainImg}
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
          />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}
      </div>

      {/* ── Right: info ── */}
      <div className={styles.infoPanel}>

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/shop" className={styles.backLink}>
            ← Shop
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{productName}</span>
        </div>

        {/* Name */}
        <p className={styles.label}>7ENO Collection</p>
        <h1 className={styles.name}>{productName}</h1>
        <div className={styles.divider} />

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={styles.price}>
            {selectedVariant
              ? `${currencySymbol}${selectedVariant.retail_price}`
              : `${currencySymbol}${variants[0]?.retail_price ?? '—'}`}
          </span>
          <span className={styles.priceNote}>incl. btw</span>
        </div>

        {/* Sizes */}
        {uniqueSizes.length > 1 && (
          <>
            <div className={styles.sizeLabelRow}>
              <span className={styles.sizeLabel}>Selecteer maat</span>
              <span className={styles.sizeCount}>{uniqueSizes.length} maten</span>
            </div>
            <div className={styles.sizes}>
              {uniqueSizes.map((v) => (
                <button
                  key={v.id}
                  className={[
                    styles.sizeBtn,
                    selectedVariantId === v.id ? styles.selected : '',
                    !isAvailable(v) ? styles.outOfStock : '',
                  ].join(' ')}
                  onClick={() => isAvailable(v) && setSelectedVariantId(v.id)}
                  aria-pressed={selectedVariantId === v.id}
                  disabled={!isAvailable(v)}
                >
                  {v.size || v.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <button
          className={[styles.addBtn, added ? styles.added : ''].join(' ')}
          onClick={handleAddToCart}
          disabled={!selectedVariantId}
        >
          {added
            ? '✓ Toegevoegd aan winkelwagen'
            : !selectedVariantId
            ? 'Kies een maat'
            : 'Toevoegen aan winkelwagen'}
        </button>

        <p className={styles.addHint}>Gratis verzending · Print on demand via Printful</p>

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Merk</span>
            <span className={styles.detailVal}>7ENO Clothing</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Collectie</span>
            <span className={styles.detailVal}>SS 2026</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Levering</span>
            <span className={styles.detailVal}>5–10 werkdagen</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Productie</span>
            <span className={styles.detailVal}>Print on demand</span>
          </div>
          {variants[0]?.color && (
            <div className={styles.detailRow}>
              <span className={styles.detailKey}>Kleur</span>
              <span className={styles.detailVal}>{variants[0].color}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
