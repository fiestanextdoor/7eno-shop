/**
 * Google Merchant Center product feed (RSS 2.0 + the `g:` namespace).
 *
 * Merchant Center is how products enter free Shopping listings, so the feed is
 * built at variant level: Google wants one item per buyable size/colour, tied
 * together by `item_group_id`. Apparel additionally requires gender, age group,
 * colour and size — without those the whole item is rejected.
 *
 * Pure functions only (no fetching), so the mapping is unit-testable.
 */

import type { Classification } from './product-classify'

export interface FeedItem {
  id: string
  itemGroupId: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks: string[]
  availability: 'in_stock' | 'out_of_stock'
  price: string
  brand: string
  condition: 'new'
  mpn: string
  googleProductCategory: string
  productType: string
  /** Apparel only: Google rejects gender/age on non-wearables. */
  gender?: 'male' | 'female' | 'unisex'
  ageGroup?: 'adult'
  color: string
  size: string
  shipping: { country: string; price: string }[]
}

/**
 * Google's product taxonomy, as text paths (accepted alongside numeric ids).
 * The catalogue mixes apparel with phone cases, desk mats and posters, and a
 * phone case filed under "Clothing Accessories" performs badly and risks a
 * Merchant Center disapproval — so non-apparel is mapped by name first.
 */
export function googleCategoryFor(c: Classification, productName = ''): string {
  const n = productName.toLowerCase()
  if (/phone|case/.test(n)) {
    return 'Electronics > Electronics Accessories > Mobile Phone Accessories > Mobile Phone Cases'
  }
  if (/backpack|tote|bag/.test(n)) return 'Luggage & Bags > Backpacks'
  if (/mouse pad|desk mat/.test(n)) return 'Office Supplies > Desk Pads & Blotters'
  if (/poster/.test(n)) return 'Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork'
  if (/sticker/.test(n)) return 'Office Supplies > General Office Supplies > Labels, Indexes & Stamps'
  if (/loafer|sandal|shoe|sneaker/.test(n)) return 'Apparel & Accessories > Shoes'
  if (/cap|hat|beanie/.test(n)) return 'Apparel & Accessories > Clothing Accessories > Hats'
  if (/sock/.test(n)) return 'Apparel & Accessories > Clothing > Underwear & Socks > Socks'
  if (c.isTee) return 'Apparel & Accessories > Clothing > Shirts & Tops'
  if (c.isSwim) return 'Apparel & Accessories > Clothing > Swimwear'
  if (c.isShorts) return 'Apparel & Accessories > Clothing > Shorts'
  if (c.isTowel) return 'Home & Garden > Linens & Bedding > Towels'
  if (c.isAccessory) return 'Apparel & Accessories > Clothing Accessories'
  return 'Apparel & Accessories'
}

/**
 * Whether the item is worn. Only these carry gender/age_group in the feed;
 * a mouse pad has no gender and Google flags one that claims to.
 */
export function isWearable(c: Classification, productName = ''): boolean {
  const n = productName.toLowerCase()
  if (/phone|case|mouse pad|desk mat|poster|sticker|mug|towel/.test(n)) return false
  if (/backpack|tote|bag/.test(n)) return false
  return c.isClothing || /cap|hat|beanie|sock|loafer|sandal|shoe|sneaker/.test(n)
}

/** Our own breadcrumb-style taxonomy; shown in Merchant Center reporting. */
export function productTypeFor(c: Classification): string {
  const collection = c.isOlympian ? 'Olympian' : 'OG'
  const kind = c.isTee ? 'Tees'
    : c.isShorts ? 'Shorts'
    : c.isSwim ? 'Swimwear'
    : c.isAccessory || c.isTowel ? 'Accessories'
    : 'Apparel'
  return `7ENO > ${collection} > ${kind}`
}

export function genderFor(c: Classification): FeedItem['gender'] {
  if (c.isUnisex) return 'unisex'
  if (c.isWomen) return 'female'
  if (c.isMen) return 'male'
  return 'unisex'
}

/** Merchant Center caps titles at 150 characters. */
export function buildTitle(productName: string, color: string, size: string): string {
  const parts = [productName, [color, size].filter(Boolean).join(', ')].filter(Boolean)
  const title = parts.join(' — ')
  return title.length <= 150 ? title : `${title.slice(0, 147)}...`
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

/**
 * Escape text for XML. Product names really do contain "&" (e.g. "Pro & Pro
 * Max"), which would otherwise produce a feed Google refuses to parse.
 */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch])
}

function tag(name: string, value: string): string {
  return `      <${name}>${escapeXml(value)}</${name}>`
}

function itemXml(item: FeedItem): string {
  const lines = [
    '    <item>',
    tag('g:id', item.id),
    tag('g:item_group_id', item.itemGroupId),
    tag('title', item.title),
    tag('description', item.description),
    tag('link', item.link),
    tag('g:image_link', item.imageLink),
    ...item.additionalImageLinks.map((url) => tag('g:additional_image_link', url)),
    tag('g:availability', item.availability),
    tag('g:price', item.price),
    tag('g:brand', item.brand),
    tag('g:condition', item.condition),
    // Own-brand print-on-demand: no manufacturer GTIN exists, so brand + our own
    // MPN is the identifier pair Google expects.
    tag('g:mpn', item.mpn),
    tag('g:google_product_category', item.googleProductCategory),
    tag('g:product_type', item.productType),
    ...(item.gender ? [tag('g:gender', item.gender)] : []),
    ...(item.ageGroup ? [tag('g:age_group', item.ageGroup)] : []),
    ...(item.color ? [tag('g:color', item.color)] : []),
    ...(item.size ? [tag('g:size', item.size)] : []),
    ...item.shipping.map(
      (s) =>
        `      <g:shipping>\n        <g:country>${escapeXml(s.country)}</g:country>\n` +
        `        <g:price>${escapeXml(s.price)}</g:price>\n      </g:shipping>`,
    ),
    '    </item>',
  ]
  return lines.join('\n')
}

/** Serialise items into an RSS 2.0 document Merchant Center can fetch. */
export function renderFeedXml(
  items: FeedItem[],
  meta: { title: string; link: string; description: string },
): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${escapeXml(meta.title)}</title>`,
    `    <link>${escapeXml(meta.link)}</link>`,
    `    <description>${escapeXml(meta.description)}</description>`,
    ...items.map(itemXml),
    '  </channel>',
    '</rss>',
  ].join('\n')
}
