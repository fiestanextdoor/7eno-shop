import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav/Nav'
import { getBundles, computeBundlePricing, lowestVariantPriceCents } from '@/lib/bundles'
import { getCatalogProduct } from '@/lib/catalog'
import styles from './deals.module.css'

export const metadata: Metadata = {
  title: 'Deals — 7ENO',
  description: 'Curated 7ENO sets at a combined price.',
}

export default async function DealsPage() {
  const bundles = getBundles()

  const cards = await Promise.all(
    bundles.map(async (bundle) => {
      try {
        const products = await Promise.all(
          bundle.products.map((p) => getCatalogProduct(p.provider, p.productId)),
        )
        const sumCents = products.reduce((sum, prod) => sum + lowestVariantPriceCents(prod.variants), 0)
        if (!Number.isFinite(sumCents)) return null
        const pricing = computeBundlePricing(sumCents, bundle.discountCents)
        const currency = products[0]?.currency ?? 'EUR'
        return { bundle, pricing, currency, productNames: products.map((p) => p.name) }
      } catch {
        return null
      }
    }),
  )

  const visible = cards.filter((c): c is NonNullable<typeof c> => c !== null)
  const symbol = (c: string) => (c === 'EUR' ? '€' : c === 'USD' ? '$' : c)

  return (
    <>
      <Nav />
      <main className={styles.page}>
        <header className={styles.header}>
          <p className={styles.headerLabel}>by Abra Entertainment</p>
          <h1 className={styles.title}>Deals</h1>
        </header>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No deals right now.</p>
            <p className={styles.emptySub}>Check back soon for curated sets.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map(({ bundle, pricing, currency, productNames }) => (
              <Link key={bundle.id} href={`/deals/${bundle.id}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {bundle.image ? (
                    <Image src={bundle.image} alt={bundle.title} fill className={styles.image} sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.info}>
                  <p className={styles.cardTitle}>{bundle.title}</p>
                  <p className={styles.cardProducts}>{productNames.join(' + ')}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.from}>From {symbol(currency)}{(pricing.sumCents / 100).toFixed(2)}</span>
                    <span className={styles.setPrice}>{symbol(currency)}{(pricing.setCents / 100).toFixed(2)}</span>
                  </div>
                  <span className={styles.save}>You save {symbol(currency)}{(pricing.discountCents / 100).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
