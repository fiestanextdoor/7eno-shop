import type { Metadata } from 'next'
import Nav from '@/components/Nav/Nav'
import styles from './terms.module.css'

export const metadata: Metadata = {
  title: 'Terms & Conditions — 7ENO',
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Terms &amp; Conditions</h1>
          <p className={styles.meta}>Last updated: May 2026</p>

          <section className={styles.section}>
            <h2 className={styles.heading}>1. General</h2>
            <p>These terms and conditions apply to all orders placed via 7eno.shop, operated by 7ENO. By placing an order you agree to these terms.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>2. Products</h2>
            <p>All products are produced on demand via Printful (print-on-demand). Product images are representative; slight colour variations may occur due to screen settings and print processes. We reserve the right to discontinue products at any time.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>3. Prices</h2>
            <p>All prices shown are inclusive of VAT. Shipping costs are shown separately and added at checkout before payment. We reserve the right to change prices at any time; the price valid at the moment of ordering applies.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>4. Payment</h2>
            <p>Payments are processed securely by Stripe. Accepted payment methods are shown at checkout. Your order is confirmed only after successful payment. We do not store any payment card details.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>5. Order confirmation</h2>
            <p>After placing an order you will receive an email confirmation. If you do not receive this within 30 minutes, please check your spam folder or contact us at <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a>.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>6. Delivery</h2>
            <p>Orders are produced and shipped by Printful. Estimated delivery times are 5–10 business days for standard shipping within the EU. Delivery times are indicative and not guaranteed. 7ENO is not liable for delays caused by carriers or customs.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>7. Right of withdrawal (cooling-off period)</h2>
            <p>As a consumer, you have the right to withdraw from your purchase within 14 days of receiving your order, without giving any reason. To exercise this right, contact us at <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a> before the 14-day period expires.</p>
            <p>The right of withdrawal does not apply to custom-made or personalised products. Standard print-on-demand items without personalisation do qualify.</p>
            <p>Return shipping costs are at the customer's expense unless the product is defective or incorrect.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>8. Returns &amp; refunds</h2>
            <p>Once your return is received and inspected, we will process a full refund of the purchase price including original outbound shipping costs within 14 days. Refunds are issued via the original payment method.</p>
            <p>Items must be returned unused, unwashed, and in their original condition. We reserve the right to refuse returns that do not meet these conditions.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>9. Defective or incorrect products</h2>
            <p>If you receive a defective or incorrect product, contact us within 30 days at <a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a> with photos of the issue. We will arrange a replacement or refund at no additional cost.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>10. Liability</h2>
            <p>7ENO's liability is limited to the amount paid for the order in question. We are not liable for indirect damages, loss of profit, or consequential loss.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>11. Disputes</h2>
            <p>Dutch law applies to all agreements. Disputes will be submitted to the competent court in the Netherlands. As an EU consumer you may also use the European ODR platform for online dispute resolution: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className={styles.link}>ec.europa.eu/consumers/odr</a>.</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>12. Contact</h2>
            <p>7ENO<br />Daalakkersweg 2, 5641 JA Eindhoven<br />KvK: 42081073<br /><a href="mailto:info@7eno.shop" className={styles.link}>info@7eno.shop</a></p>
          </section>
        </div>
      </main>
    </>
  )
}
