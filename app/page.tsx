import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import DropBlock from '@/components/ui/DropBlock/DropBlock'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { currentTimeMs, getNextDrop, isDropListed, listDropsNewestFirst, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { absoluteUrl } from '@/lib/seo'
import { toTiles } from '@/lib/tiles'
import styles from './page.module.css'

const HOME_DESCRIPTION =
  '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the Olympian and OLYMPN Sport editions, with free shipping over €75 and 14-day returns.'

export const metadata: Metadata = {
  // `absolute` overrides the layout template: the homepage carries the full
  // brand phrase itself rather than the template suffix twice.
  title: { absolute: '7ENO (Zeno) · Premium Streetwear by Abra Entertainment' },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
    url: absoluteUrl('/'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
  },
}

// The hero follows the drop clock: re-render at least every minute, and the
// countdown refreshes the page itself at zero.
export const revalidate = 60

/** Tiles per drop row. */
const ROW_SIZE = 4

export default async function HomePage() {
  const now = currentTimeMs()
  const preview = await isPreviewSession()
  const next = getNextDrop(now, { preview })

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, { preview })
  } catch (err) {
    console.error('[Home] getShopProducts failed:', err)
  }

  const rows = await Promise.all(
    listDropsNewestFirst()
      .filter((drop) => isDropListed(drop, now, { preview }))
      .map(async (drop) => ({
        view: toDropView(drop, now, { preview }),
        tiles: await toTiles(products.filter((p) => p.drop.id === drop.id).slice(0, ROW_SIZE), now),
      }))
  )

  return (
    <main className={styles.page}>
      {next && <DropBlock drop={toDropView(next, now, { preview })} now={now} as="h1" withIntro />}

      {rows.map(({ view, tiles }, rowIndex) => (
        <section key={view.id} className={styles.row} aria-labelledby={`row-${view.id}`}>
          <div className={styles.rowHead}>
            <p className={styles.rowLabel}>{view.editionLabel}</p>
            <h2 id={`row-${view.id}`} className={styles.rowTitle}>{view.title}</h2>
            <Link href={view.href} className={styles.rowLink}>View the collection</Link>
          </div>
          <ul className={styles.rowGrid}>
            {tiles.length > 0
              ? tiles.map((tile) => (
                  <li key={tile.slug}>
                    <ProductTile product={tile} density={4} eager={rowIndex === 0} />
                  </li>
                ))
              : view.hero.lineup.slice(0, ROW_SIZE).map((src, i) => (
                  <li key={src} className={styles.lineupItem}>
                    <Image
                      src={src}
                      alt={`${view.title} line-up, piece ${i + 1}`}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      loading={rowIndex === 0 ? 'eager' : 'lazy'}
                      className={styles.lineupImage}
                    />
                  </li>
                ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
