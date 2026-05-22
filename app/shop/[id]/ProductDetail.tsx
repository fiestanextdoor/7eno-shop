'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SyncVariant, PrintfulFile } from '@/types/printful'
import { useCartStore } from '@/store/cart'
import styles from './detail.module.css'

// 7ENO brand color name → hex (used as fallback when Printful color_code is empty)
const BRAND_COLORS: Record<string, string> = {
  ink:    '#111111',
  blood:  '#5C1A1B',
  butter: '#F0E8C0',
  stone:  '#8A8275',
  bone:   '#F6F3EC',
  carrot: '#D4622A',
  coin:   '#C4A860',
  clear:  '#E8E4DC',
  white:  '#FFFFFF',
  black:  '#111111',
}

function resolveSwatchBackground(colorCode: string, colorName: string): string {
  const codes = (colorCode || '').trim().split(/\s+/).filter(Boolean)
  if (codes.length >= 2) return `linear-gradient(135deg, ${codes[0]} 50%, ${codes[1]} 50%)`
  if (codes.length === 1) return codes[0]

  // Fallback: parse color name keywords (e.g. "Ink/Blood" → two colors)
  const parts = colorName.toLowerCase().split(/[^a-z]+/).filter(Boolean)
  const resolved = parts.map((p) => BRAND_COLORS[p]).filter(Boolean)
  if (resolved.length >= 2) return `linear-gradient(135deg, ${resolved[0]} 50%, ${resolved[1]} 50%)`
  if (resolved.length === 1) return resolved[0]
  return '#cccccc'
}

const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

interface ProductDetailProps {
  productId: number
  productName: string
  variants: SyncVariant[]
  previewFile: PrintfulFile | null
  productThumbnail?: string | null
  bgRemovedUrl?: string | null
  colorImages?: Record<string, string>
}

export default function ProductDetail({
  productId,
  productName,
  variants,
  previewFile,
  productThumbnail,
  bgRemovedUrl,
  colorImages = {},
}: ProductDetailProps) {
  const uniqueColors = Array.from(
    new Map(variants.filter((v) => v.color).map((v) => [v.color, v])).values()
  )
  const hasColors = uniqueColors.length > 1

  const defaultColor = uniqueColors[0]?.color ?? ''
  const baseImageUrl =
    bgRemovedUrl ??
    previewFile?.preview_url ??
    previewFile?.url ??
    productThumbnail ??
    null

  const [selectedColor, setSelectedColor] = useState<string>(defaultColor)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(baseImageUrl)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const colorVariants = hasColors && selectedColor
    ? variants.filter((v) => v.color === selectedColor)
    : variants

  const allOutOfStock = colorVariants.every((v) => v.in_stock === false)
  const isAvailable = (v: SyncVariant) => allOutOfStock ? true : v.in_stock !== false

  const uniqueSizes = Array.from(
    new Map(colorVariants.map((v) => [v.size || v.name, v])).values()
  ).filter((v) => !EXCLUDED_SIZES.has(v.size))

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setSelectedVariantId(null)
    setCurrentImageUrl(colorImages[color] ?? baseImageUrl)
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return
    addItem({
      variantId: selectedVariant.id,
      productId,
      productName,
      variantName: selectedVariant.name,
      price: selectedVariant.retail_price,
      currency: selectedVariant.currency,
      quantity: 1,
      imageUrl: currentImageUrl,
    })
    setAdded(true)
  }

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2200)
    return () => clearTimeout(t)
  }, [added])

  const currency = variants[0]?.currency ?? 'EUR'
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency

  return (
    <div className={styles.inner}>

      {/* ── Left: image ── */}
      <div className={styles.imagePanel}>
        {currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt={productName}
            fill
            className={styles.mainImg}
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
            unoptimized
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
          <span className={styles.priceNote}>incl. tax</span>
        </div>

        {/* Colors */}
        {hasColors && (
          <>
            <div className={styles.sizeLabelRow}>
              <span className={styles.sizeLabel}>Color</span>
              <span className={styles.sizeCount}>{selectedColor}</span>
            </div>
            <div className={styles.colorSwatches}>
              {uniqueColors.map((v) => (
                <button
                  key={v.color}
                  className={[
                    styles.colorSwatch,
                    selectedColor === v.color ? styles.colorSwatchSelected : '',
                  ].join(' ')}
                  style={{ background: resolveSwatchBackground(v.color_code, v.color) }}
                  onClick={() => handleColorChange(v.color)}
                  title={v.color}
                  aria-pressed={selectedColor === v.color}
                  aria-label={v.color}
                />
              ))}
            </div>
          </>
        )}

        {/* Sizes */}
        {uniqueSizes.length > 1 && (
          <>
            <div className={styles.sizeLabelRow}>
              <span className={styles.sizeLabel}>Select size</span>
              <span className={styles.sizeCount}>{uniqueSizes.length} sizes</span>
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
                  {(v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())}
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
            ? '✓ Added to cart'
            : !selectedVariantId
            ? 'Select a size'
            : 'Add to cart'}
        </button>

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Brand</span>
            <span className={styles.detailVal}>7ENO by Abra Entertainment</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Collection</span>
            <span className={`${styles.detailVal} ${styles.detailValAccent}`}>SS 2026</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Delivery</span>
            <span className={styles.detailVal}>5–10 business days</span>
          </div>
          {variants[0]?.color && (
            <div className={styles.detailRow}>
              <span className={styles.detailKey}>Color</span>
              <span className={styles.detailVal}>{selectedColor || variants[0].color}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
