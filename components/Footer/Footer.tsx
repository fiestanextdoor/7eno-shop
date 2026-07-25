import Link from 'next/link'
import styles from './Footer.module.css'

interface FooterLink {
  label: string
  href: string
  /** mailto/external: rendered as a plain anchor rather than a route link. */
  external?: boolean
}

// The account pages (sign in, register, profile) used to sit here. They are
// personal, carry noindex, and are already one click away from the account
// button in the header — so the column now holds the pages a visitor actually
// wants before buying. The line filter is og | olympian; the old daily/sport
// values matched nothing and silently fell through to "show everything".
const LINKS: Record<'shop' | 'help', FooterLink[]> = {
  shop: [
    { label: 'Men', href: '/shop?gender=men' },
    { label: 'Women', href: '/shop?gender=women' },
    { label: 'OG collection', href: '/shop?line=og' },
    { label: "Olympian '26", href: '/olympian' },
    { label: 'Deals', href: '/deals' },
  ],
  help: [
    { label: 'Size guide', href: '/size-guide' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Returns & refunds', href: '/returns' },
    { label: 'Contact', href: 'mailto:info@7eno.shop', external: true },
  ],
}

// Bottom bar: the brand story and the legal pages, reachable from every page.
const BOTTOM_LINKS: FooterLink[] = [
  { label: 'About 7ENO', href: '/about' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
]

function FooterLinkItem({ link, className }: { link: FooterLink; className: string }) {
  if (link.external) {
    return <a href={link.href} className={className}>{link.label}</a>
  }
  return <Link href={link.href} className={className}>{link.label}</Link>
}

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
                <FooterLinkItem link={l} className={styles.link} />
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.col}>
          <p className={styles.colTitle}>Help</p>
          <ul className={styles.list}>
            {LINKS.help.map((l) => (
              <li key={l.href}>
                <FooterLinkItem link={l} className={styles.link} />
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
