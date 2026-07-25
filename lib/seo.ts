/**
 * Shared SEO constants and structured-data builders.
 *
 * The brand is written "7ENO" but spoken "Zeno", so every public-facing
 * description, keyword set and schema.org node ties the two spellings together.
 * Without that, a search for "zeno" never reaches a page that only ever says
 * "7ENO".
 */

export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.7eno.shop').replace(/\/+$/, '')

export const BRAND = {
  name: '7ENO',
  /** Spoken/phonetic spellings people actually type into search. */
  alternateNames: ['Zeno', 'Zeno streetwear', 'Zeno shop', 'Zeno kleding', '7ENO streetwear'],
  parent: 'Abra Entertainment',
  email: 'info@7eno.shop',
  address: {
    street: 'Daalakkersweg 2',
    postalCode: '5641 JA',
    city: 'Eindhoven',
    country: 'NL',
  },
  /**
   * Public brand profiles. Google uses sameAs to connect the site to the
   * brand's other identities (knowledge panel). Add the real profile URLs
   * here — an empty list is simply omitted from the schema.
   */
  sameAs: [] as string[],
} as const

/** Keyword set reused across the site-wide and collection pages. */
export const BRAND_KEYWORDS = [
  '7ENO', 'Zeno', 'Zeno streetwear', 'Zeno shop', 'Zeno kleding', 'Zeno merk',
  '7eno shop', '7ENO streetwear', 'streetwear', 'streetwear Nederland',
  'Abra Entertainment', 'Olympian collection', 'OG collection', 'premium streetwear',
]

/** Absolute URL for a site-relative path (schema.org and OG need absolute). */
export function absoluteUrl(path = '/'): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Organization node: who the brand is, where it sits, how to reach it. Shared
 * by the site-wide graph and referenced by Product nodes as the seller/brand.
 */
export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: BRAND.name,
    alternateName: [...BRAND.alternateNames],
    url: BASE_URL,
    email: BRAND.email,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logos/beeldmerk-zwart.png'),
    },
    image: absoluteUrl('/logos/beeldmerk-zwart.png'),
    description:
      '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment.',
    parentOrganization: { '@type': 'Organization', name: BRAND.parent },
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.address.street,
      postalCode: BRAND.address.postalCode,
      addressLocality: BRAND.address.city,
      addressCountry: BRAND.address.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: BRAND.email,
      areaServed: 'NL',
      availableLanguage: ['nl', 'en'],
    },
    ...(BRAND.sameAs.length > 0 ? { sameAs: [...BRAND.sameAs] } : {}),
  }
}

/** WebSite node, including the sitelinks search box target. */
export function webSiteJsonLd() {
  return {
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: BRAND.name,
    alternateName: [...BRAND.alternateNames],
    url: BASE_URL,
    description:
      '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the OG and Olympian collections.',
    publisher: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'en',
  }
}

/** Breadcrumb trail; positions are 1-based per schema.org. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  }
}

/**
 * FAQPage node. Google can expand these straight into the search result, which
 * takes up more of the page and answers the question before the click — so the
 * answers here must match the visible text on the page exactly.
 */
export function faqJsonLd(entries: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.question,
      acceptedAnswer: { '@type': 'Answer', text: e.answer },
    })),
  }
}

/**
 * Return + shipping policy nodes. Google shows these directly in free product
 * listings, and a product without them is ranked below one that has them.
 * Values mirror the /returns page and lib/shipping.ts.
 */
export function merchantPolicyJsonLd(flatRate: number, countries: readonly string[]) {
  return {
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: [...countries],
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      // Matches the 14-day window documented on /returns.
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/ReturnShippingFees',
      merchantReturnLink: absoluteUrl('/returns'),
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: flatRate.toFixed(2),
        currency: 'EUR',
      },
      shippingDestination: countries.map((c) => ({
        '@type': 'DefinedRegion',
        addressCountry: c,
      })),
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        // Print-on-demand: the item is produced first, then shipped.
        handlingTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
      },
    },
  }
}
