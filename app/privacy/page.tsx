import type { Metadata } from 'next'
import Nav from '@/components/Nav/Nav'
import styles from './privacy.module.css'

export const metadata: Metadata = {
  title: 'Privacy Policy — 7ENO',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.meta}>Last updated: May 2026</p>

          <section className={styles.section}>
            <h2 className={styles.heading}>1. Who we are</h2>
            <p>7ENO is a Dutch streetwear brand. Our webshop can be reached at 7eno.shop. For questions regarding this privacy policy, contact us at <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a>.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>2. What data we collect</h2>
            <p>When you place an order, we collect the following personal data:</p>
            <ul className={styles.list}>
              <li>Name and email address</li>
              <li>Shipping address</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>
            <p>We do not store payment card details ourselves. All payment processing is handled by Stripe, Inc.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>3. Why we collect your data</h2>
            <p>We use your data solely to:</p>
            <ul className={styles.list}>
              <li>Process and fulfil your order</li>
              <li>Send order confirmation and shipping updates</li>
              <li>Handle customer service requests</li>
            </ul>
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>4. Third-party services</h2>
            <p>To fulfil orders, we share your shipping address with <strong>Printful</strong>, our print-on-demand production partner. Printful processes this data solely to produce and ship your order. Payments are handled by <strong>Stripe</strong>. Both parties operate under their own privacy policies and comply with applicable data protection law.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>5. Data retention</h2>
            <p>We retain your order data for as long as required by Dutch tax law (7 years). You may request deletion of your account data at any time by contacting us.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>6. Your rights</h2>
            <p>Under the GDPR you have the right to:</p>
            <ul className={styles.list}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
            </ul>
            <p>To exercise any of these rights, email <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a>.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>7. Cookies</h2>
            <p>We use only functional cookies required for the shopping cart to work. No tracking or advertising cookies are placed without your consent.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>8. Contact</h2>
            <p>7ENO<br />Daalakkersweg 2, 5641 JA Eindhoven<br />KvK: 42081073<br /><a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a></p>
          </section>
        </div>
      </main>
    </>
  )
}
