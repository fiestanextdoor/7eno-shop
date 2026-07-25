import type { Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl, BASE_URL, BRAND, breadcrumbJsonLd } from '@/lib/seo'
import styles from '../landing.module.css'

const DESCRIPTION =
  '7ENO is pronounced "Zeno". The streetwear label by Abra Entertainment from Eindhoven, made to order in two collections: OG and Olympian.'

export const metadata: Metadata = {
  title: 'About 7ENO — pronounced "Zeno"',
  description: DESCRIPTION,
  keywords: [
    'Zeno', 'Zeno merk', 'Zeno streetwear', 'Zeno kleding', '7ENO uitspraak',
    'how to pronounce 7ENO', 'what is 7ENO', 'Abra Entertainment', '7ENO Eindhoven',
    'Zeno Eindhoven', 'Nederlands streetwear merk',
  ],
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About 7ENO (Zeno) · Streetwear by Abra Entertainment',
    description: DESCRIPTION,
    url: absoluteUrl('/about'),
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'About 7ENO (Zeno)', description: DESCRIPTION },
}

export default function AboutPage() {
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ])

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About 7ENO (Zeno)',
    description: DESCRIPTION,
    url: absoluteUrl('/about'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    // Points at the Organization node in the site-wide graph so search engines
    // treat this page as the brand's own description of itself.
    mainEntity: { '@id': `${BASE_URL}/#organization` },
  }

  return (
    <main className={`${styles.page} oly-theme`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className={styles.inner}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>The brand</p>
          <h1 className={styles.title}>7ENO is said &ldquo;Zeno&rdquo;</h1>
          <p className={styles.lead}>
            The 7 replaces the Z, so the name reads as a shape and sounds like a word. Most people
            hear it before they ever see it written, which is exactly why this page exists: if you
            searched for Zeno and landed here, you found the right shop.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/shop" className={styles.cta}>Browse the shop</Link>
            <Link href="/olympian" className={styles.ctaGhost}>See Olympian &rsquo;26</Link>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.h2}>Who is behind it</h2>
          <p className={styles.body}>
            7ENO is the clothing label of {BRAND.parent}, based in Eindhoven. It started from the
            same place the music and events side did: wanting something to wear that belonged to
            the project rather than being bought in and rebranded.
          </p>
          <p className={styles.body}>
            It is a small operation, run directly. Orders, questions and returns all land in the
            same inbox at{' '}
            <a href={`mailto:${BRAND.email}`} className={styles.link}>{BRAND.email}</a>, and a
            person answers them.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Two collections, two moods</h2>
          <p className={styles.body}>
            <strong>OG</strong> is the original range and the darker one: ink, blood red and butter,
            with the 7ENO beeldmerk used as a mark rather than a slogan. It covers tees, sport tees
            and shorts, caps and accessories.
          </p>
          <p className={styles.body}>
            <strong>Olympian &rsquo;26</strong> is the newer capsule and the warmer one, built
            around four dusty colourways and a rounded early-2000s wordmark. Read more on the{' '}
            <Link href="/olympian" className={styles.link}>Olympian collection page</Link>, or shop{' '}
            <Link href="/shop?line=og" className={styles.link}>OG</Link> directly.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Nothing is made before you order it</h2>
          <p className={styles.body}>
            Every piece is produced on demand and shipped from within the EU. That is a deliberate
            choice: no warehouse full of sizes that never sell, no seasonal clear-out, and no
            guessing which colourway to over-order.
          </p>
          <p className={styles.body}>
            The honest trade-off is time. Your order is made after you place it, so production
            takes two to five working days before the parcel is handed over — instead of shipping
            the same afternoon from a shelf.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>A tee that gives something back</h2>
          <p className={styles.body}>
            One piece in the range is a collaboration:{' '}
            <Link href="/shop/x-life4hsp-sport-tee" className={styles.link}>the 7ENO × Life4HSP sport tee</Link>,
            made together with the Life4HSP foundation. It carries both marks and is the one
            product in the shop that exists for a reason beyond the clothing.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Where to find us</h2>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factKey}>Company</span>
              <span className={styles.factVal}>7ENO by {BRAND.parent}</span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Based in</span>
              <span className={styles.factVal}>
                {BRAND.address.street}<br />
                {BRAND.address.postalCode} {BRAND.address.city}
              </span>
            </div>
            <div className={styles.fact}>
              <span className={styles.factKey}>Contact</span>
              <span className={styles.factVal}>
                <a href={`mailto:${BRAND.email}`} className={styles.link}>{BRAND.email}</a>
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.h2}>Keep reading</h2>
          <div className={styles.related}>
            <Link href="/olympian" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Olympian &rsquo;26</span>
              <span className={styles.relatedNote}>The four-colourway capsule and where it came from.</span>
            </Link>
            <Link href="/size-guide" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Size guide</span>
              <span className={styles.relatedNote}>How the tees fit and how to measure yourself.</span>
            </Link>
            <Link href="/faq" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>FAQ</span>
              <span className={styles.relatedNote}>Delivery times, returns and payment methods.</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
