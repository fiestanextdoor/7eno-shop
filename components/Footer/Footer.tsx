import Link from 'next/link'
import styles from './Footer.module.css'

const LINKS = {
  // The line filter is og | olympian; the old daily/sport values no longer
  // match anything and silently fell through to "show everything".
  shop: [
    { label: 'Men', href: '/shop?gender=men' },
    { label: 'Women', href: '/shop?gender=women' },
    { label: 'OG collection', href: '/shop?line=og' },
    { label: "Olympian '26", href: '/olympian' },
  ],
  account: [
    { label: 'Sign in', href: '/account/login' },
    { label: 'Register', href: '/account/register' },
{ label: 'Profile', href: '/account/profile' },
    { label: 'Contact', href: 'mailto:info@7eno.shop' },
  ],
}

// Bottom bar: the content pages sit alongside the legal ones so every page is
// reachable from anywhere on the site (crawlers follow these too).
const BOTTOM_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Size guide', href: '/size-guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Deals', href: '/deals' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Returns', href: '/returns' },
  { label: 'Privacy Policy', href: '/privacy' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Links grid */}
      <div className={styles.grid}>
        <div className={styles.col}>
          <p className={styles.colTitle}>Shop</p>
          <ul className={styles.list}>
            {LINKS.shop.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.link}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Account</p>
          <ul className={styles.list}>
            {LINKS.account.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={styles.link}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Location</p>
          <div className={styles.mapWrap}>
            <iframe
              title="7ENO locatie"
              src="https://maps.google.com/maps?q=Daalakkersweg+2%2C+5641+JA+Eindhoven&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
            />
            <span className={styles.mapPin} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  fill="var(--oxblood)"
                  stroke="var(--butter)"
                  strokeWidth="1.2"
                />
                <circle cx="12" cy="9" r="2.4" fill="var(--butter)" />
              </svg>
            </span>
          </div>
          <p className={styles.addressLine}>Daalakkersweg 2</p>
          <p className={styles.addressLine}>5641 JA Eindhoven</p>
          <a
            href="https://maps.app.goo.gl/QkembiXXXTGs2VkP8"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsLink}
          >
            Open in Google Maps →
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <span className={styles.copy}>© 2026 7ENO · KvK 42081073 · All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {BOTTOM_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.copy} style={{ textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
