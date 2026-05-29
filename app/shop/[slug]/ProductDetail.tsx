'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SyncVariant, PrintfulFile } from '@/types/printful'
import { useCartStore } from '@/store/cart'
import { resolveSwatchBackground, resolveHex, applyBrandOverride, resolveDisplayName, isNearWhite } from '@/lib/color-utils'
import styles from './detail.module.css'

const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

interface ProductDetailProps {
  productId: number
  productName: string
  variants: SyncVariant[]
  previewFile: PrintfulFile | null
  productThumbnail?: string | null
  bgRemovedUrl?: string | null
  colorImages?: Record<string, string>
  euSizeMap?: Record<string, string>
}

export default function ProductDetail({
  productId,
  productName,
  variants,
  previewFile,
  productThumbnail,
  bgRemovedUrl,
  colorImages = {},
  euSizeMap = {},
}: ProductDetailProps) {
  const isFootwear = Object.keys(euSizeMap).length > 0
  const displaySize = (v: { size: string; name: string }) =>
    euSizeMap[v.size] ?? (v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())
  const uniqueColors = Array.from(
    new Map(variants.filter((v) => v.color).map((v) => [v.color, v])).values()
  )
  const hasColors = uniqueColors.length > 1

  // Non-near-white hexes: prevent brand override from duplicating an existing swatch color
  const skipHexes = new Set(
    uniqueColors.map((v) => resolveHex(v.color, v.color_code ?? '')).filter((h) => !isNearWhite(h))
  )

  const getDisplayName = (v: { color: string; color_code: string | null | undefined }) => {
    const rawHex = resolveHex(v.color, v.color_code ?? '')
    const finalHex = applyBrandOverride(productName, rawHex, v.color, skipHexes)
    return resolveDisplayName(v.color, rawHex, finalHex, productName)
  }

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

  // Preselect a color when arriving via a swatch deep-link (/shop/{slug}?color=…)
  useEffect(() => {
    const colorParam = new URLSearchParams(window.location.search).get('color')
    if (!colorParam || !uniqueColors.some((v) => v.color === colorParam)) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedColor(colorParam)
    setCurrentImageUrl(colorImages[colorParam] ?? baseImageUrl)
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-select the only variant for one-size products (e.g. caps, accessories)
  useEffect(() => {
    if (uniqueSizes.length === 1 && isAvailable(uniqueSizes[0])) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedVariantId(uniqueSizes[0].id)
    }
  }, [selectedColor]) // eslint-disable-line react-hooks/exhaustive-deps

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
              <span className={styles.sizeCount}>
                {uniqueColors.find((v) => v.color === selectedColor)
                  ? getDisplayName(uniqueColors.find((v) => v.color === selectedColor)!)
                  : selectedColor}
              </span>
            </div>
            <div className={styles.colorSwatches}>
              {uniqueColors.map((v) => (
                <button
                  key={v.color}
                  className={[
                    styles.colorSwatch,
                    selectedColor === v.color ? styles.colorSwatchSelected : '',
                  ].join(' ')}
                  style={{ background: resolveSwatchBackground(v.color, v.color_code, v.color_code2, productName, skipHexes) }}
                  onClick={() => handleColorChange(v.color)}
                  title={getDisplayName(v)}
                  aria-pressed={selectedColor === v.color}
                  aria-label={getDisplayName(v)}
                />
              ))}
            </div>
          </>
        )}

        {/* Sizes */}
        {uniqueSizes.length > 1 && (
          <>
            <div className={styles.sizeLabelRow}>
              <span className={styles.sizeLabel}>Select size{isFootwear ? ' (EU)' : ''}</span>
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
                  {displaySize(v)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* CTA */}
        <button
          className={[styles.addBtn, added ? styles.added : ''].join(' ')}
          onClick={handleAddToCart}
          disabled={!selectedVariantId && uniqueSizes.length > 1}
        >
          {added
            ? '✓ Added to cart'
            : !selectedVariantId && uniqueSizes.length > 1
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
              <span className={styles.detailVal}>
              {uniqueColors.find((v) => v.color === (selectedColor || variants[0].color))
                ? getDisplayName(uniqueColors.find((v) => v.color === (selectedColor || variants[0].color))!)
                : (selectedColor || variants[0].color)}
            </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
