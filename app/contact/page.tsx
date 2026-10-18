import type { Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl, BASE_URL, BRAND, breadcrumbJsonLd } from '@/lib/seo'
import styles from '@/components/ui/TextPage/TextPage.module.css'

const DESCRIPTION =
  'Questions about an order, a size or a return? Contact 7ENO (Zeno) by Abra Entertainment, Eindhoven. One inbox, answered by a person.'

export const metadata: Metadata = {
  title: 'Contact',
  description: DESCRIPTION,
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact 7ENO (Zeno)',
    description: DESCRIPTION,
    url: absoluteUrl('/contact'),
    type: 'website',
  },
  twitter: { card: 'summary', title: 'Contact 7ENO (Zeno)', description: DESCRIPTION },
}

export default function ContactPage() {
  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact' },
  ])

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact 7ENO (Zeno)',
    description: DESCRIPTION,
    url: absoluteUrl('/contact'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: { '@id': `${BASE_URL}/#organization` },
  }

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className={styles.inner}>
        <header className={styles.hero} data-reveal="hero">
          <p className={styles.eyebrow}>Get in touch</p>
          <h1 className={styles.title}>Contact</h1>
          <p className={styles.lead}>
            Orders, sizes, returns, collaborations: everything lands in one inbox and a person
            answers, usually within one working day.
          </p>
          <div className={styles.ctaRow}>
            <a href={`mailto:${BRAND.email}`} className={styles.cta}>Email {BRAND.email}</a>
            <Link href="/faq" className={styles.ctaGhost}>Read the FAQ first</Link>
          </div>
        </header>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>About an order</h2>
          <p className={styles.body}>
            Mention your order number (it is in the confirmation email) so we can look it up
            straight away. Every piece is made after you order it, so production takes two to five
            working days before the parcel is handed over to the carrier.
          </p>
          <p className={styles.body}>
            Want to send something back? The{' '}
            <Link href="/returns" className={styles.link}>returns page</Link> explains the 14-day
            window and how to start a return.
          </p>
        </section>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Details</h2>
          <div className={styles.facts}>
            <div className={styles.fact}>
              <span className={styles.factKey}>Email</span>
              <span className={styles.factVal}>
                <a href={`mailto:${BRAND.email}`} className={styles.link}>{BRAND.email}</a>
              </span>
            </div>
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
          </div>
        </section>

        <section className={styles.section} data-reveal="up">
          <h2 className={styles.h2}>Keep reading</h2>
          <div className={styles.related}>
            <Link href="/faq" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>FAQ</span>
              <span className={styles.relatedNote}>Delivery times, returns and payment methods.</span>
            </Link>
            <Link href="/size-guide" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Size guide</span>
              <span className={styles.relatedNote}>How the pieces fit and how to measure yourself.</span>
            </Link>
            <Link href="/about" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>About</span>
              <span className={styles.relatedNote}>Who is behind 7ENO and how the editions work.</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
