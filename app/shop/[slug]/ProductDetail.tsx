'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { NormalizedVariant, Provider } from '@/types/catalog'
import type { SizeGuide } from '@/lib/printful'
import { useCartStore } from '@/store/cart'
import DonationBanner from '@/components/DonationBanner/DonationBanner'
import { resolveSwatchBackground, resolveHex, applyBrandOverride, brandColorName, isNearWhite } from '@/lib/color-utils'
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_RATE } from '@/lib/shipping'
import styles from './detail.module.css'

const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

// Standard care for 7ENO's printed apparel. Printful exposes no care field, so
// this is the recommended care for DTF / all-over prints; the fabric specifics
// come from Printful's product description (see `materials`).
const CARE_INSTRUCTIONS = [
  'Machine wash cold, inside out, gentle cycle',
  'Use mild detergent, do not bleach',
  'Tumble dry low or hang to dry',
  'Do not iron directly on the print',
  'Do not dry clean',
]

interface ProductDetailProps {
  provider: Provider
  productId: string
  productName: string
  variants: NormalizedVariant[]
  baseImageUrl?: string | null
  colorImages?: Record<string, string>
  colorBackImages?: Record<string, string>
  /**
   * Remaining provider mockups per colour (flat, on-model, folded, detail
   * crops), shown in the gallery after the front/back. Kept per colour so
   * switching colour swaps the whole gallery, not just the main photo.
   */
  colorGalleryImages?: Record<string, string[]>
  /** Local front image that replaces the provider mockup for every colour. */
  frontOverride?: string | null
  /** Local back image used when the provider has no genuine back mockup. */
  backOverride?: string | null
  euSizeMap?: Record<string, string>
  materials?: string[]
  sizeGuide?: SizeGuide | null
  extraImages?: string[]
  deals?: { id: string; title: string; discountCents: number }[]
  /** When true (the Life4HSP collaboration product), show the donation banner. */
  charityPartner?: boolean
  /**
   * Olympian colourway family: each colourway is its own product, so these
   * swatches link between the sibling product pages (incl. the current one).
   */
  colorwaySiblings?: { name: string; hex: string; slug: string; current: boolean }[]
}

export default function ProductDetail({
  provider,
  productId,
  productName,
  variants,
  baseImageUrl = null,
  colorImages = {},
  colorBackImages = {},
  colorGalleryImages = {},
  frontOverride = null,
  backOverride = null,
  euSizeMap = {},
  materials = [],
  sizeGuide = null,
  extraImages = [],
  deals = [],
  charityPartner = false,
  colorwaySiblings = [],
}: ProductDetailProps) {
  const isFootwear = Object.keys(euSizeMap).length > 0
  const currency = variants[0]?.currency ?? 'EUR'
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency
  const fmt = (cents: number) => `${currencySymbol}${(cents / 100).toFixed(2)}`
  const displaySize = (v: { size: string; name: string }) =>
    euSizeMap[v.size] ?? (v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())
  const uniqueColors = Array.from(
    new Map(variants.filter((v) => v.color).map((v) => [v.color, v])).values()
  )
  const hasColors = uniqueColors.length > 1

  // Non-near-white hexes: prevent brand override from duplicating an existing swatch color
  const skipHexes = new Set(
    uniqueColors.map((v) => resolveHex(v.color, v.colorCode ?? '')).filter((h) => !isNearWhite(h))
  )

  // 7ENO brand colour name (Butter/Blood/Ink/Stone/…) for a variant colour,
  // instead of the provider's fabric name like "Vintage White".
  const brandNameFor = (color: string) => {
    const v = uniqueColors.find((c) => c.color === color)
    if (!v) return color
    const finalHex = applyBrandOverride(productName, resolveHex(v.color, v.colorCode ?? ''), v.color, skipHexes)
    return brandColorName(finalHex)
  }

  const defaultColor = uniqueColors[0]?.color ?? ''

  const frontFor = (color: string) => frontOverride ?? colorImages[color] ?? baseImageUrl
  const backFor = (color: string) => backOverride ?? colorBackImages[color] ?? null

  const [selectedColor, setSelectedColor] = useState<string>(defaultColor)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(frontFor(defaultColor))
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const frontImageUrl = frontFor(selectedColor)
  const backImageUrl = backFor(selectedColor)
  // Front/back mockup first, then the colour's remaining provider mockups
  // (flat, on-model, detail crops), then any local lifestyle photos. Deduped so
  // a mockup that already serves as the front/back isn't repeated.
  const gallery = [
    ...new Set(
      [
        frontImageUrl,
        backImageUrl,
        ...(colorGalleryImages[selectedColor] ?? []),
        ...extraImages,
      ].filter((u): u is string => Boolean(u)),
    ),
  ]

  const colorVariants = hasColors && selectedColor
    ? variants.filter((v) => v.color === selectedColor)
    : variants

  const allOutOfStock = colorVariants.every((v) => v.inStock === false)
  const isAvailable = (v: NormalizedVariant) => (allOutOfStock ? true : v.inStock !== false)

  const uniqueSizes = Array.from(
    new Map(colorVariants.map((v) => [v.size || v.name, v])).values()
  ).filter((v) => !EXCLUDED_SIZES.has(v.size))

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setSelectedVariantId(null)
    setActiveImageUrl(frontFor(color))
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return
    addItem({
      provider,
      variantId: selectedVariant.id,
      productId,
      productName,
      variantName: selectedVariant.name,
      price: (selectedVariant.priceCents / 100).toFixed(2),
      currency: selectedVariant.currency,
      quantity: 1,
      imageUrl: frontImageUrl,
    })
    setAdded(true)
  }

  // Preselect a color when arriving via a swatch deep-link (/shop/{slug}?color=…)
  useEffect(() => {
    const colorParam = new URLSearchParams(window.location.search).get('color')
    if (!colorParam || !uniqueColors.some((v) => v.color === colorParam)) return
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedColor(colorParam)
    setActiveImageUrl(frontFor(colorParam))
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

  // Olympian products carry their colour in the product name (one product per
  // colourway), so that name wins over the variant-derived colour label.
  const currentColorway = colorwaySiblings.find((s) => s.current)
  const colorLabel = currentColorway?.name ?? brandNameFor(selectedColor || variants[0]?.color || '')

  // Collection line, mirroring the shop's OG/Olympian split (classify() in
  // app/shop/page.tsx): anything named "Olympian" is the Olympian capsule, the
  // rest is the original ("OG") range.
  const collection = /olympian/i.test(productName) ? 'Olympian' : 'OG'

  return (
    <div className={styles.inner}>

      {/* ── Left: image ── */}
      <div className={styles.imagePanel}>
        {activeImageUrl ? (
          <Image
            src={activeImageUrl}
            alt={productName}
            fill
            className={styles.mainImg}
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
          />
        ) : (
          <div className={styles.imgPlaceholder} />
        )}

        {gallery.length > 1 && (
          <div className={styles.thumbs}>
            {gallery.map((url, i) => {
              const label =
                url === frontImageUrl ? 'Front view'
                : url === backImageUrl ? 'Back view'
                : `View ${i + 1}`
              return (
              <button
                key={url}
                type="button"
                className={[styles.thumb, activeImageUrl === url ? styles.thumbActive : ''].join(' ')}
                onClick={() => setActiveImageUrl(url)}
                aria-label={label}
                aria-pressed={activeImageUrl === url}
              >
                <Image src={url} alt="" fill className={styles.thumbImg} sizes="80px" />
              </button>
              )
            })}
          </div>
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
        <p className={styles.label}>{collection} Collection</p>
        <h1 className={styles.name}>{productName}</h1>
        <div className={styles.divider} />

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={styles.price}>
            {selectedVariant
              ? fmt(selectedVariant.priceCents)
              : variants[0]
              ? fmt(variants[0].priceCents)
              : '—'}
          </span>
          <span className={styles.priceNote}>incl. tax</span>
        </div>

        {/* Charity: the Life4HSP collaboration product donates 100% of the product */}
        {charityPartner && <DonationBanner variant="inline" scope="product" />}

        {/* Combi-deal: this product is part of one or more sets */}
        {deals.length > 0 && (
          <div className={styles.dealBanner}>
            {deals.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className={styles.dealLink}>
                Combine &amp; save {currencySymbol}{(d.discountCents / 100).toFixed(2)} with the {d.title}
                <span aria-hidden="true"> →</span>
              </Link>
            ))}
          </div>
        )}

        {/* Colors */}
        {hasColors && (
          <>
            <div className={styles.sizeLabelRow}>
              <span className={styles.sizeLabel}>Color</span>
              <span className={styles.sizeCount}>{colorLabel}</span>
            </div>
            <div className={styles.colorSwatches}>
              {uniqueColors.map((v) => (
                <button
                  key={v.color}
                  className={[
                    styles.colorSwatch,
                    selectedColor === v.color ? styles.colorSwatchSelected : '',
                  ].join(' ')}
                  style={{ background: resolveSwatchBackground(v.color, v.colorCode, null, productName, skipHexes) }}
                  onClick={() => handleColorChange(v.color)}
                  title={brandNameFor(v.color)}
                  aria-pressed={selectedColor === v.color}
                  aria-label={brandNameFor(v.color)}
                />
              ))}
            </div>
          </>
        )}

        {/* Olympian colourways: sibling products, rendered as the same colour
            swatch row; picking one navigates to that colourway's product page. */}
        {!hasColors && colorwaySiblings.length > 1 && (
          <>
            <div className={styles.sizeLabelRow}>
              <span className={styles.sizeLabel}>Color</span>
              <span className={styles.sizeCount}>{colorLabel}</span>
            </div>
            <div className={styles.colorSwatches}>
              {colorwaySiblings.map((s) =>
                s.current ? (
                  <span
                    key={s.slug}
                    className={`${styles.colorSwatch} ${styles.colorSwatchSelected}`}
                    style={{ background: s.hex }}
                    title={s.name}
                    aria-label={`${s.name} (selected)`}
                    aria-current="page"
                  />
                ) : (
                  <Link
                    key={s.slug}
                    href={`/shop/${s.slug}`}
                    className={styles.colorSwatch}
                    style={{ background: s.hex }}
                    title={s.name}
                    aria-label={s.name}
                  />
                )
              )}
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

        {/* Size guide (apparel) */}
        {sizeGuide && sizeGuide.sizes.length > 0 && (
          <details className={styles.disclosure}>
            <summary className={styles.disclosureSummary}>
              <span>Size guide</span>
              <span className={styles.disclosureIcon} aria-hidden="true">+</span>
            </summary>
            <div className={styles.sizeTableWrap}>
              <table className={styles.sizeTable}>
                <thead>
                  <tr>
                    <th scope="col"></th>
                    {sizeGuide.sizes.map((s) => (
                      <th key={s} scope="col">{euSizeMap[s] ?? s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.rows.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {sizeGuide.sizes.map((s) => (
                        <td key={s}>{row.values[s] || '–'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={styles.sizeTableNote}>Body measurements in {sizeGuide.unit}.</p>
          </details>
        )}

        {/* Care & material */}
        <details className={styles.disclosure}>
          <summary className={styles.disclosureSummary}>
            <span>Care &amp; material</span>
            <span className={styles.disclosureIcon} aria-hidden="true">+</span>
          </summary>
          <ul className={styles.careList}>
            {CARE_INSTRUCTIONS.map((c) => (
              <li key={c} className={styles.careItem}>{c}</li>
            ))}
          </ul>
          {materials.length > 0 && (
            <>
              <p className={styles.careSubLabel}>Material</p>
              <ul className={styles.careList}>
                {materials.map((m) => (
                  <li key={m} className={styles.careItem}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </details>

        {/* Details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Brand</span>
            <span className={styles.detailVal}>7ENO by Abra Entertainment</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Collection</span>
            <span className={`${styles.detailVal} ${styles.detailValAccent}`}>{collection}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Delivery</span>
            <span className={styles.detailVal}>5–10 business days</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailKey}>Shipping</span>
            <span className={styles.detailVal}>
              €{FLAT_SHIPPING_RATE.toFixed(2)} · free over €{FREE_SHIPPING_THRESHOLD.toFixed(0)}
            </span>
          </div>
          {variants[0]?.color && (
            <div className={styles.detailRow}>
              <span className={styles.detailKey}>Color</span>
              <span className={styles.detailVal}>{colorLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
