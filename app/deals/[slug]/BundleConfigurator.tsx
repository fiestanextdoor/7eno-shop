'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { NormalizedVariant, Provider } from '@/types/catalog'
import { useCartStore } from '@/store/cart'
import { resolveHex } from '@/lib/color-utils'
import { computeBundlePricing } from '@/lib/bundles'
import styles from './configurator.module.css'

export interface BundleProductData {
  provider: Provider
  productId: string
  name: string
  thumbnailUrl: string | null
  variants: NormalizedVariant[]
}

interface Props {
  bundleId: string
  bundleTitle: string
  description: string | null
  products: BundleProductData[]
  discountCents: number
}

const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

export default function BundleConfigurator({ bundleId, bundleTitle, description, products, discountCents }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  // Selected variant id per product index.
  const [selected, setSelected] = useState<(string | null)[]>(() => products.map(() => null))
  const [added, setAdded] = useState(false)

  // Auto-select products that have only one possible choice (e.g. one-size
  // accessories), so the CTA isn't blocked on a product with nothing to pick.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelected((prev) => {
      let changed = false
      const next = prev.map((sel, i) => {
        const product = products[i]
        const colors = Array.from(
          new Map(product.variants.filter((v) => v.color).map((v) => [v.color, v])).values(),
        )
        const hasColors = colors.length > 1
        const activeColor = product.variants.find((v) => v.id === sel)?.color ?? colors[0]?.color ?? ''
        const selectable = product.variants.filter(
          (v) => (hasColors ? v.color === activeColor : true) && !EXCLUDED_SIZES.has(v.size || v.name) && v.inStock !== false,
        )
        const selMatches = selectable.some((v) => v.id === sel)
        if (!selMatches && selectable.length === 1) {
          changed = true
          return selectable[0].id
        }
        return sel
      })
      return changed ? next : prev
    })
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [products])

  const currency = products[0]?.variants[0]?.currency ?? 'EUR'
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency

  const selectedVariants = products.map((p, i) => p.variants.find((v) => v.id === selected[i]) ?? null)
  const allChosen = selectedVariants.every((v) => v !== null)

  const sumCents = selectedVariants.reduce((sum, v, i) => {
    if (v) return sum + v.priceCents
    const fallback = products[i].variants.reduce((m, vv) => (vv.priceCents < m ? vv.priceCents : m), Infinity)
    return sum + (Number.isFinite(fallback) ? fallback : 0)
  }, 0)
  const pricing = computeBundlePricing(sumCents, discountCents)

  const setVariant = (productIndex: number, variantId: string) => {
    setSelected((prev) => prev.map((v, i) => (i === productIndex ? variantId : v)))
    setAdded(false)
  }

  const handleAddSet = () => {
    if (!allChosen) return
    selectedVariants.forEach((variant, i) => {
      if (!variant) return
      const product = products[i]
      addItem({
        provider: product.provider,
        variantId: variant.id,
        productId: product.productId,
        productName: product.name,
        variantName: variant.name,
        price: (variant.priceCents / 100).toFixed(2),
        currency: variant.currency,
        quantity: 1,
        imageUrl: variant.imageUrl ?? product.thumbnailUrl,
        bundleId,
        bundleTitle,
      })
    })
    setAdded(true)
    openCart()
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{bundleTitle}</h1>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.products}>
          {products.map((product, i) => {
            const colors = Array.from(
              new Map(product.variants.filter((v) => v.color).map((v) => [v.color, v])).values(),
            )
            const hasColors = colors.length > 1
            const chosen = selectedVariants[i]
            const activeColor = chosen?.color ?? colors[0]?.color ?? ''
            const sizes = Array.from(
              new Map(
                product.variants
                  .filter((v) => (hasColors ? v.color === activeColor : true))
                  .map((v) => [v.size || v.name, v]),
              ).values(),
            ).filter((v) => !EXCLUDED_SIZES.has(v.size || v.name))

            // Follow the active colour: prefer the chosen variant's image, else
            // the first image of the active colour, else the product thumbnail.
            const colorImage = product.variants.find((v) => v.color === activeColor && v.imageUrl)?.imageUrl
            const displayImage = chosen?.imageUrl ?? colorImage ?? product.thumbnailUrl

            return (
              <div key={product.productId} className={styles.product}>
                <div className={styles.thumb}>
                  {displayImage ? (
                    <Image src={displayImage} alt={`${product.name}${activeColor ? ` — ${activeColor}` : ''}`} fill className={styles.thumbImg} sizes="120px" unoptimized />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <p className={styles.productName}>{product.name}</p>

                  {hasColors && (
                    <div className={styles.swatches}>
                      {colors.map((v) => (
                        <button
                          key={v.color}
                          type="button"
                          className={[styles.swatch, activeColor === v.color ? styles.swatchActive : ''].join(' ')}
                          style={{ background: resolveHex(v.color, v.colorCode ?? '') }}
                          aria-label={v.color}
                          aria-pressed={activeColor === v.color}
                          onClick={() => {
                            const first = product.variants.find((cv) => cv.color === v.color && !EXCLUDED_SIZES.has(cv.size))
                            if (first) setVariant(i, first.id)
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className={styles.sizes}>
                    {sizes.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={[styles.sizeBtn, chosen?.id === v.id ? styles.sizeSelected : '', v.inStock === false ? styles.outOfStock : ''].join(' ')}
                        disabled={v.inStock === false}
                        aria-pressed={chosen?.id === v.id}
                        onClick={() => setVariant(i, v.id)}
                      >
                        {(v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Items separately</span>
            <span className={styles.strike}>{symbol}{(pricing.sumCents / 100).toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Set price</span>
            <span className={styles.setPrice}>{symbol}{(pricing.setCents / 100).toFixed(2)}</span>
          </div>
          <div className={styles.saveRow}>You save {symbol}{(pricing.discountCents / 100).toFixed(2)}</div>
        </div>

        <button className={[styles.addBtn, added ? styles.added : ''].join(' ')} onClick={handleAddSet} disabled={!allChosen}>
          {added ? '✓ Set added to cart' : allChosen ? 'Add set to cart' : 'Choose size & colour for each item'}
        </button>
      </div>
    </main>
  )
}
