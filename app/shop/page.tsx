import type { Metadata } from 'next'
import { Suspense } from 'react'
import ShopBrowser from '@/components/ui/ShopBrowser/ShopBrowser'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { DROPS, currentTimeMs, getDropStatus, isDropListed } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { applyShopQuery, describeShopQuery, parseShopQuery, type FilterDrop, type RawSearchParams } from '@/lib/shop-query'
import { toTiles } from '@/lib/tiles'
import { BASE_URL, BRAND_KEYWORDS, absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
import styles from './shop.module.css'

interface Props {
  searchParams: Promise<RawSearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { title, description } = describeShopQuery(parseShopQuery(await searchParams))
  return {
    title,
    description,
    keywords: BRAND_KEYWORDS,
    // Every filter combination is the same listing; collections have their own
    // landing pages under /collections, so the shop has one canonical.
    alternates: { canonical: '/shop' },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description, url: absoluteUrl('/shop'), type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · 7ENO (Zeno)`, description },
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const query = parseShopQuery(await searchParams)
  const now = currentTimeMs()
  const preview = await isPreviewSession()

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, { preview })
  } catch (err) {
    console.error('[Catalog] getShopProducts failed:', err)
  }

  // The JSON-LD lists what this URL shows; the browser gets every tile and
  // filters in place (ShopBrowser), so a chip never waits on Printful.
  const visible = applyShopQuery(products, query)
  const tiles = await toTiles(products, now)
  const { title, description } = describeShopQuery(query)
  const drops: FilterDrop[] = DROPS.filter((d) => isDropListed(d, now, { preview })).map((d) => ({
    id: d.id, slug: d.slug, title: d.title, edition: d.edition, status: getDropStatus(d, now, { preview }),
  }))

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${title} · 7ENO (Zeno)`,
    description,
    url: absoluteUrl('/shop'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: visible.length,
      itemListElement: visible.slice(0, 50).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: absoluteUrl(`/shop/${p.slug}`),
      })),
    },
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
  ])

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <Suspense fallback={null}>
        <ShopBrowser tiles={tiles} drops={drops} />
      </Suspense>
    </main>
  )
}
