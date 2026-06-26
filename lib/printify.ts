import type { NormalizedProduct, NormalizedVariant, NormalizedColor } from '@/types/catalog'
import { resolveHex } from '@/lib/color-utils'

const PRINTIFY_BASE = 'https://api.printify.com/v1'

// ── Raw Printify API types (subset we consume) ────────────────────────────────
export interface PrintifyOptionValue {
  id: number
  title: string
  colors?: string[]
}
export interface PrintifyOption {
  name: string
  type: string // 'color' | 'size' | other
  values: PrintifyOptionValue[]
}
export interface PrintifyVariant {
  id: number
  sku: string
  price: number // cents
  cost: number
  title: string
  is_enabled: boolean
  is_default: boolean
  is_available: boolean
  options: number[] // value ids referencing PrintifyOption.values
}
export interface PrintifyImage {
  src: string
  variant_ids: number[]
  position: string
  is_default: boolean
}
export interface PrintifyProduct {
  id: string
  title: string
  description: string | null
  tags: string[]
  visible: boolean
  // True while a publish is still pending/in progress; such products are not yet live.
  is_locked?: boolean
  // Printify sets a real `id` here once publishing to the store has succeeded. A
  // concept/draft keeps `external.id === ''` (or `external` is absent entirely),
  // even when `visible` is true.
  external?: { id: string; handle: string } | null
  blueprint_id: number
  print_provider_id: number
  options: PrintifyOption[]
  variants: PrintifyVariant[]
  images: PrintifyImage[]
}
export interface PrintifyListResponse {
  current_page: number
  last_page: number
  total: number
  per_page: number
  data: PrintifyProduct[]
}

function shopCurrency(): string {
  return process.env.PRINTIFY_CURRENCY || 'EUR'
}

/** Index option value ids → { title, type, hex } so a variant's option ids resolve to color/size. */
function indexOptionValues(product: PrintifyProduct): Map<number, { title: string; type: string; hex: string }> {
  const map = new Map<number, { title: string; type: string; hex: string }>()
  for (const option of product.options) {
    for (const value of option.values) {
      const hex = value.colors?.[0] ?? ''
      map.set(value.id, { title: value.title, type: option.type, hex })
    }
  }
  return map
}

/** Best image URL for a variant: the first image whose variant_ids include it, else the default. */
function pickVariantImage(product: PrintifyProduct, variantId: number): string | null {
  const match = product.images.find((img) => img.variant_ids.includes(variantId))
  if (match) return match.src
  const def = product.images.find((img) => img.is_default) ?? product.images[0]
  return def?.src ?? null
}

/** Map one raw Printify product to the normalized model. Disabled variants are dropped. */
export function mapPrintifyProduct(raw: PrintifyProduct): NormalizedProduct {
  const currency = shopCurrency()
  const optionIndex = indexOptionValues(raw)

  const variants: NormalizedVariant[] = raw.variants
    .filter((v) => v.is_enabled)
    .map((v) => {
      let color = ''
      let size = ''
      let colorCode = ''
      for (const optId of v.options) {
        const meta = optionIndex.get(optId)
        if (!meta) continue
        if (meta.type === 'color') {
          color = meta.title
          colorCode = meta.hex || resolveHex(meta.title, '')
        } else if (meta.type === 'size') {
          size = meta.title
        }
      }
      return {
        provider: 'printify' as const,
        productId: raw.id,
        id: String(v.id),
        name: v.title,
        size,
        color,
        colorCode,
        priceCents: v.price,
        currency,
        inStock: v.is_available,
        imageUrl: pickVariantImage(raw, v.id),
      }
    })

  // Deduped color list (first enabled variant per color wins).
  const colors: NormalizedColor[] = []
  const seen = new Set<string>()
  for (const v of variants) {
    if (!v.color || seen.has(v.color)) continue
    seen.add(v.color)
    colors.push({
      color: v.color,
      hex: v.colorCode || resolveHex(v.color, ''),
      imageUrl: v.imageUrl,
      displayName: v.color,
    })
  }

  const defaultVariant = raw.variants.find((v) => v.is_default && v.is_enabled)
  const defaultImage = raw.images.find((i) => i.is_default) ?? raw.images[0]

  return {
    provider: 'printify',
    id: raw.id,
    name: raw.title,
    thumbnailUrl: defaultImage?.src ?? null,
    variants,
    colors,
    priceCents: defaultVariant?.price ?? variants[0]?.priceCents,
    currency,
  }
}

/** Split a single display name into Printify's required first/last name fields. */
export function splitName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { first_name: '-', last_name: '-' }
  if (parts.length === 1) return { first_name: parts[0], last_name: '-' }
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') }
}

export interface PrintifyOrderLine {
  productId: string
  variantId: string
  quantity: number
}

/** Map cart lines to Printify product-based order line items (variant id is numeric). */
export function buildPrintifyOrderItems(
  lines: PrintifyOrderLine[]
): { product_id: string; variant_id: number; quantity: number }[] {
  return lines.map((l) => ({
    product_id: l.productId,
    variant_id: Number(l.variantId),
    quantity: l.quantity,
  }))
}

// ── API calls ─────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.PRINTIFY_API_KEY
  if (!key) throw new Error('PRINTIFY_API_KEY is not set')
  return key
}

function getShopId(): string {
  const id = process.env.PRINTIFY_SHOP_ID
  if (!id) throw new Error('PRINTIFY_SHOP_ID is not set')
  return id
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Whether a product is published and live in the shop. It must be visible, not
 * locked (a locked product has a publish still pending), and carry a non-empty
 * `external.id`, which Printify only sets once publishing to the store has
 * succeeded. A concept/draft is still `visible` but keeps `external.id === ''`,
 * so visibility alone is not enough to tell published from concept.
 */
export function isPublished(raw: PrintifyProduct): boolean {
  if (raw.visible === false) return false
  if (raw.is_locked === true) return false
  return typeof raw.external?.id === 'string' && raw.external.id.length > 0
}

/** All published products in the shop, mapped to the normalized model. */
export async function getProducts(): Promise<NormalizedProduct[]> {
  const shopId = getShopId()
  const out: NormalizedProduct[] = []
  let page = 1
  while (true) {
    const res = await fetch(
      `${PRINTIFY_BASE}/shops/${shopId}/products.json?page=${page}&limit=50`,
      { headers: headers(), next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`Printify products error: ${res.status}`)
    const data: PrintifyListResponse = await res.json()
    for (const raw of data.data) {
      if (!isPublished(raw)) continue
      out.push(mapPrintifyProduct(raw))
    }
    if (data.current_page >= data.last_page || data.data.length === 0) break
    page += 1
  }
  return out
}

/** One product by id, mapped to the normalized model. */
export async function getProduct(id: string): Promise<NormalizedProduct> {
  const shopId = getShopId()
  const res = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/products/${id}.json`, {
    headers: headers(),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Printify product error: ${res.status}`)
  const raw: PrintifyProduct = await res.json()
  return mapPrintifyProduct(raw)
}

/**
 * Authoritative variant lookup for checkout, keyed by normalized variant id.
 * Prices are resolved server-side from Printify, never trusted from the client.
 */
export async function buildVariantLookup(
  productIds: string[]
): Promise<Map<string, { productName: string; variant: NormalizedVariant }>> {
  const unique = [...new Set(productIds)]
  const products = await Promise.all(unique.map((id) => getProduct(id)))
  const lookup = new Map<string, { productName: string; variant: NormalizedVariant }>()
  for (const product of products) {
    for (const variant of product.variants) {
      lookup.set(variant.id, { productName: product.name, variant })
    }
  }
  return lookup
}

// ── Publishing ──────────────────────────────────────────────────────────────
// This store is a custom/API integration, so clicking "Publish" in Printify only
// locks the product and fires a `product:publish:started` webhook; the product
// stays locked (and invisible to `isPublished`) until we acknowledge it here.

/**
 * Acknowledge a successful publish. Printify then unlocks the product and stores
 * the external `id`/`handle`, which is what flips `isPublished` to true. `id` must
 * be non-empty; `handle` is the public product URL shown in the Printify dashboard.
 */
export async function publishingSucceeded(
  productId: string,
  external: { id: string; handle: string }
): Promise<void> {
  const shopId = getShopId()
  const res = await fetch(
    `${PRINTIFY_BASE}/shops/${shopId}/products/${productId}/publishing_succeeded.json`,
    { method: 'POST', headers: headers(), body: JSON.stringify({ external }) }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify publishing_succeeded failed: ${res.status} ${err}`)
  }
}

/**
 * Acknowledge a failed publish so Printify unlocks the product instead of leaving
 * it stuck in a locked, half-published state.
 */
export async function publishingFailed(productId: string, reason: string): Promise<void> {
  const shopId = getShopId()
  const res = await fetch(
    `${PRINTIFY_BASE}/shops/${shopId}/products/${productId}/publishing_failed.json`,
    { method: 'POST', headers: headers(), body: JSON.stringify({ reason }) }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify publishing_failed failed: ${res.status} ${err}`)
  }
}

export interface PrintifyOrderRecipient {
  name: string
  email: string
  phone: string
  address1: string
  address2?: string
  city: string
  region?: string
  country_code: string
  zip: string
}

/** Whether paid Printify orders should be auto-sent to production. Off by default. */
export function isAutoConfirmEnabled(): boolean {
  return process.env.PRINTIFY_AUTO_CONFIRM === 'true'
}

/** Submit a draft order to production. */
export async function sendToProduction(orderId: string): Promise<void> {
  const shopId = getShopId()
  const res = await fetch(
    `${PRINTIFY_BASE}/shops/${shopId}/orders/${orderId}/send_to_production.json`,
    { method: 'POST', headers: headers() }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify send_to_production failed: ${res.status} ${err}`)
  }
}

/**
 * Create a Printify order. `externalId` is set to the Stripe session id so the
 * status webhook can match it back to our order row. When auto-confirm is on the
 * order is also sent to production.
 */
export async function createOrder(
  recipient: PrintifyOrderRecipient,
  lines: PrintifyOrderLine[],
  externalId: string
): Promise<{ id: string }> {
  const shopId = getShopId()
  const name = splitName(recipient.name)
  const body = {
    external_id: externalId,
    label: externalId,
    line_items: buildPrintifyOrderItems(lines),
    address_to: {
      first_name: name.first_name,
      last_name: name.last_name,
      email: recipient.email,
      phone: recipient.phone || '0000000000',
      country: recipient.country_code,
      region: recipient.region ?? '',
      address1: recipient.address1,
      address2: recipient.address2 ?? '',
      city: recipient.city,
      zip: recipient.zip,
    },
    send_shipping_notification: false,
  }
  const res = await fetch(`${PRINTIFY_BASE}/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify order failed: ${res.status} ${err}`)
  }
  const data = await res.json()
  const orderId = String(data.id)
  if (isAutoConfirmEnabled()) await sendToProduction(orderId)
  return { id: orderId }
}
