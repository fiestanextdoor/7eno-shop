/**
 * Google Merchant Center product feed (RSS 2.0 + the `g:` namespace).
 *
 * Merchant Center is how products enter free Shopping listings, so the feed is
 * built at variant level: Google wants one item per buyable size/colour, tied
 * together by `item_group_id`. Apparel additionally requires gender, age group,
 * colour and size; without those the whole item is rejected.
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
 * Every v2 piece is a hoodie, a tee, a knitted tee or a backpack.
 */
export function googleCategoryFor(c: Classification): string {
  if (c.isBag) return 'Luggage & Bags > Backpacks'
  if (c.isHoodie || c.isKnit || c.isTee) return 'Apparel & Accessories > Clothing > Shirts & Tops'
  return 'Apparel & Accessories'
}

/** Whether the item is worn. Only these carry gender and age group in the feed. */
export function isWearable(c: Classification): boolean {
  return !c.isBag
}

/** Our own breadcrumb taxonomy, e.g. "7ENO > OLYMPN Sport > Hoodies", shown in Merchant Center reporting. */
export function productTypeFor(c: Classification, collection: string): string {
  const kind = c.isHoodie ? 'Hoodies' : c.isKnit ? 'Knits' : c.isTee ? 'Tees' : c.isBag ? 'Bags' : 'Apparel'
  return `7ENO > ${collection} > ${kind}`
}

/** Merchant Center caps titles at 150 characters. */
export function buildTitle(productName: string, color: string, size: string): string {
  const parts = [productName, [color, size].filter(Boolean).join(', ')].filter(Boolean)
  const title = parts.join(' - ')
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
