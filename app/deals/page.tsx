import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav/Nav'
import BundleCover from '@/components/BundleCover/BundleCover'
import { getBundles, computeBundlePricing, lowestVariantPriceCents } from '@/lib/bundles'
import { getCatalogProduct } from '@/lib/catalog'
import { resolveCardImage } from '@/lib/card-image'
import { absoluteUrl } from '@/lib/seo'
import styles from './deals.module.css'

const DEALS_DESCRIPTION =
  'Curated 7ENO (Zeno) sets at a combined price: matching streetwear pieces bundled with a discount. Free shipping over €75.'

export const metadata: Metadata = {
  title: 'Deals — bundled streetwear sets',
  description: DEALS_DESCRIPTION,
  alternates: { canonical: '/deals' },
  openGraph: {
    title: 'Deals · 7ENO (Zeno)',
    description: DEALS_DESCRIPTION,
    url: absoluteUrl('/deals'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Deals · 7ENO (Zeno)', description: DEALS_DESCRIPTION },
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
        const productNames = products.map((p) => p.name)
        // Composite cover: one background-removed photo per product in the set.
        const coverImages = await Promise.all(
          bundle.products.map((ref, i) =>
            resolveCardImage({ slug: ref.slug, thumbnailUrl: products[i].thumbnailUrl }),
          ),
        )
        return { bundle, pricing, currency, productNames, coverImages }
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
            {visible.map(({ bundle, pricing, currency, productNames, coverImages }) => (
              <Link key={bundle.id} href={`/deals/${bundle.id}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {bundle.image ? (
                    <Image src={bundle.image} alt={bundle.title} fill className={styles.image} sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
                  ) : (
                    <BundleCover images={coverImages} names={productNames} />
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
