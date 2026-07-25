import type { Metadata } from 'next'
import Link from 'next/link'
import { getCatalogProducts } from '@/lib/catalog'
import {
  getProduct as getPrintfulProduct, getCatalogProductId, getSizeGuide, type SizeGuide,
} from '@/lib/printful'
import { HIDDEN_SIZES } from '@/lib/product-classify'
import { productSlug } from '@/lib/slug'
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
import styles from '../landing.module.css'

const DESCRIPTION =
  'Size guide for 7ENO (Zeno) streetwear: body measurements in centimetres for the tees, how to measure yourself, and how each fit runs.'

export const metadata: Metadata = {
  title: 'Size guide — find your fit',
  description: DESCRIPTION,
  keywords: [
    'size guide', 'maattabel', 'maattabel t-shirt', 'welke maat t-shirt', 'unisex tee size',
    '7ENO maten', 'Zeno maten', 'streetwear sizing', 'oversized tee maat',
  ],
  alternates: { canonical: '/size-guide' },
  openGraph: {
    title: 'Size guide · 7ENO (Zeno)',
    description: DESCRIPTION,
    url: absoluteUrl('/size-guide'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Size guide · 7ENO (Zeno)', description: DESCRIPTION },
}

// Size tables come from Printful's catalogue; they change rarely, so a daily
// window is plenty and keeps this page cheap to serve.
export const revalidate = 86400

const MEASURE_STEPS = [
  {
    title: 'Chest',
    body: 'Measure around the fullest part of your chest, keeping the tape flat and level under your arms. Breathe normally — do not pull it tight.',
  },
  {
    title: 'Length',
    body: 'Measure from the highest point of your shoulder straight down to where you want the garment to end.',
  },
  {
    title: 'Compare, then decide',
    body: 'Match your chest measurement to the table below. If you land between two sizes, take the larger one for a relaxed fit or the smaller one for a closer one.',
  },
]

/** A product whose size table represents a whole group in the shop. */
interface GuideTarget {
  label: string
  /** Matched case-insensitively against the product name. */
  match: (name: string) => boolean
}

const TARGETS: GuideTarget[] = [
  {
    label: 'Olympian ringer tee',
    match: (n) => n.includes('olympian') && n.includes('tee') && !n.includes('knitted'),
  },
  {
    label: 'Olympian knitted tee',
    match: (n) => n.includes('olympian') && n.includes('knitted'),
  },
  {
    label: 'OG tee',
    match: (n) => !n.includes('olympian') && n.includes('tee') && !n.includes('sport'),
  },
  {
    label: 'Sport tee',
    match: (n) => n.includes('sport') && n.includes('tee'),
  },
]

interface ResolvedGuide {
  label: string
  slug: string
  productName: string
  guide: SizeGuide
}

/** Pull the real Printful size table for one representative product. */
async function guideFor(
  target: GuideTarget,
  products: Awaited<ReturnType<typeof getCatalogProducts>>,
): Promise<ResolvedGuide | null> {
  const product = products.find((p) => p.provider === 'printful' && target.match(p.name.toLowerCase()))
  if (!product) return null
  try {
    const detail = await getPrintfulProduct(product.id)
    const variants = detail.sync_variants
    const firstVariantId = variants[0]?.variant_id
    if (!firstVariantId) return null
    const catalogProductId = await getCatalogProductId(firstVariantId)
    if (!catalogProductId) return null
    const offeredSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))].filter(
      (s) => !HIDDEN_SIZES.has(s),
    )
    const guide = await getSizeGuide(catalogProductId, offeredSizes)
    if (!guide || guide.sizes.length === 0 || guide.rows.length === 0) return null
    return { label: target.label, slug: productSlug(product.name), productName: product.name, guide }
  } catch {
    // A provider hiccup shouldn't take the page down; the measuring guide and
    // fit notes below are useful on their own.
    return null
  }
}

export default async function SizeGuidePage() {
  let products: Awaited<ReturnType<typeof getCatalogProducts>> = []
  try {
    products = await getCatalogProducts()
  } catch {
    // fall through — page renders without the tables
  }

  const resolved = (await Promise.all(TARGETS.map((t) => guideFor(t, products)))).filter(
    (g): g is ResolvedGuide => g !== null,
  )

  // Two products can share one catalogue blank (and so one identical table);
  // showing it twice would just pad the page.
  const seen = new Set<string>()
  const guides = resolved.filter((g) => {
    const key = JSON.stringify(g.guide)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Size guide', path: '/size-guide' },
  ])

  return (
    <main className={`${styles.page} oly-theme`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>Sizing</p>
          <h1 className={styles.title}>Find your fit</h1>
          <p className={styles.lead}>
            Every piece is made to order, so getting the size right the first time saves everyone a
            return. These are body measurements in centimetres — the size that matches your body,
            not the flat width of the garment.
          </p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.h2}>How to measure yourself</h2>
          <p className={styles.body}>
            You need a soft tape measure and, ideally, someone to help. Measure over the underwear
            or thin layer you would normally wear underneath.
          </p>
          <ol className={styles.steps}>
            {MEASURE_STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
                <div className={styles.stepBody}>
                  <span className={styles.stepTitle}>{s.title}</span>
                  {s.body}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {guides.length > 0 ? (
          guides.map((g) => (
            <section key={g.label} className={styles.section}>
              <h2 className={styles.h2}>{g.label}</h2>
              <p className={styles.body}>
                Measurements as published by the manufacturer, in {g.guide.unit}. Example product:{' '}
                <Link href={`/shop/${g.slug}`} className={styles.link}>{g.productName}</Link>.
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <caption>{g.label} — body measurements ({g.guide.unit})</caption>
                  <thead>
                    <tr>
                      <th scope="col">Measurement</th>
                      {g.guide.sizes.map((s) => (
                        <th key={s} scope="col">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.guide.rows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row">{row.label}</th>
                        {g.guide.sizes.map((s) => (
                          <td key={s}>{row.values[s] ?? '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        ) : (
          <section className={styles.section}>
            <h2 className={styles.h2}>Size tables</h2>
            <p className={styles.body}>
              The measurement tables are shown on each product page, under &ldquo;Size guide&rdquo;,
              because they differ per garment. Open any product in the{' '}
              <Link href="/shop" className={styles.link}>shop</Link> to see the table for that
              specific piece.
            </p>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.h2}>How the fits run</h2>
          <p className={styles.body}>
            The Olympian ringer tee is a heavyweight, garment-dyed blank with a boxy body — it sits
            wide rather than long. If you want the relaxed look it is drawn for, stay at your
            normal size; size up only if you want it clearly oversized.
          </p>
          <p className={styles.body}>
            The knitted tee is the heavier of the two and has less give, so if you are between
            sizes there, take the larger one. Sport tees run closer to the body by design.
          </p>
          <p className={styles.body}>
            Unisex sizing is cut to the men&rsquo;s measurements. If you usually wear a women&rsquo;s
            size and want a fitted look, taking one size down is normally the safer choice.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Still not sure?</h2>
          <p className={styles.body}>
            Order the size you think is right — you have{' '}
            <Link href="/returns" className={styles.link}>14 days to return</Link> it if it is not.
            Or just ask: mail{' '}
            <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a> with your
            chest measurement and which piece you are looking at, and you will get a straight answer.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/shop" className={styles.cta}>Shop all pieces</Link>
            <Link href="/faq" className={styles.ctaGhost}>Read the FAQ</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
