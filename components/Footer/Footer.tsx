import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import styles from './Footer.module.css'

const LINKS = {
  shop: [
    { label: 'Men', href: '/shop?gender=men' },
    { label: 'Women', href: '/shop?gender=women' },
    { label: '7ENO Daily', href: '/shop?line=daily' },
    { label: '7ENO Sport', href: '/shop?line=sport' },
  ],
  account: [
    { label: 'Sign in', href: '/account/login' },
    { label: 'Register', href: '/account/register' },
{ label: 'Profile', href: '/account/profile' },
    { label: 'Contact', href: 'mailto:info@7eno.shop' },
  ],
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Top: wordmark centered */}
      <div className={styles.top}>
        <Link href="/" aria-label="7ENO home">
          <LogoWordmark variant="butter" height={36} align="center" />
        </Link>
        <p className={styles.tagline}>Divine Authority · MMXXVI</p>
      </div>

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
        <span className={styles.copy}>© 2026 7ENO. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/terms" className={styles.copy} style={{ textDecoration: 'none' }}>
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" className={styles.copy} style={{ textDecoration: 'none' }}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
