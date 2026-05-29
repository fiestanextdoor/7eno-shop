import type {
  SyncProduct,
  SyncVariant,
  PrintfulProductDetail,
  PrintfulListResponse,
  PrintfulDetailResponse,
  PrintfulShippingRate,
} from '@/types/printful'

const PRINTFUL_BASE = 'https://api.printful.com'

export function buildPrintfulHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

function getApiKey(): string {
  const key = process.env.PRINTFUL_API_KEY
  if (!key) throw new Error('PRINTFUL_API_KEY is not set')
  return key
}

function buildHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = buildPrintfulHeaders(apiKey)
  const storeId = process.env.PRINTFUL_STORE_ID
  if (storeId) headers['X-PF-Store-Id'] = storeId
  return headers
}

export async function getStores(): Promise<{ id: number; name: string; type: string }[]> {
  const res = await fetch(`${PRINTFUL_BASE}/stores`, {
    headers: buildPrintfulHeaders(getApiKey()),
    next: { revalidate: 3600 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.result ?? []
}

export async function getProducts(): Promise<SyncProduct[]> {
  const limit = 100
  const all: SyncProduct[] = []
  let offset = 0

  while (true) {
    const res = await fetch(
      `${PRINTFUL_BASE}/store/products?limit=${limit}&offset=${offset}`,
      { headers: buildHeaders(getApiKey()), next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`Printful error: ${res.status}`)
    const data: PrintfulListResponse<SyncProduct> = await res.json()
    all.push(...data.result)
    if (all.length >= data.paging.total) break
    offset += limit
  }

  return all
}

export async function getProduct(id: string): Promise<PrintfulProductDetail> {
  const res = await fetch(`${PRINTFUL_BASE}/store/products/${id}`, {
    headers: buildHeaders(getApiKey()),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Printful error: ${res.status}`)
  const data: PrintfulDetailResponse<PrintfulProductDetail> = await res.json()
  return data.result
}

/** Resolve the Printful catalog product id behind a sync variant's catalog variant id. */
export async function getCatalogProductId(catalogVariantId: number): Promise<number | null> {
  try {
    const res = await fetch(`${PRINTFUL_BASE}/products/variant/${catalogVariantId}`, {
      headers: buildHeaders(getApiKey()),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result?.product?.id ?? null
  } catch {
    return null
  }
}

/**
 * Maps a footwear product's US sizes to EU sizes using Printful's official size
 * guide (the "Europe" column), e.g. { "9": "42.5", "7": "40" }. Returns {} for
 * non-footwear or on error so callers fall back to the raw size.
 */
export async function getEuSizeMap(catalogProductId: number): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${PRINTFUL_BASE}/products/${catalogProductId}/sizes`, {
      headers: buildHeaders(getApiKey()),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return {}
    const data = await res.json()
    const tables: Array<{
      measurements?: Array<{ type_label?: string; values?: Array<{ size: string | number; value: string | number }> }>
    }> = data.result?.size_tables ?? []
    const map: Record<string, string> = {}
    for (const table of tables) {
      for (const measurement of table.measurements ?? []) {
        if (measurement.type_label === 'Europe') {
          for (const v of measurement.values ?? []) map[String(v.size)] = String(v.value)
        }
      }
    }
    return map
  } catch {
    return {}
  }
}

/**
 * Resolves a set of store product ids to a lookup keyed by sync variant id,
 * carrying the authoritative variant (price, catalog variant_id, currency) and
 * its product name. Shared by the checkout and shipping-rates routes so prices
 * and shipping are always derived server-side, never trusted from the client.
 */
export async function buildVariantLookup(
  productIds: number[]
): Promise<Map<number, { productName: string; variant: SyncVariant }>> {
  const unique = [...new Set(productIds)]
  const details = await Promise.all(unique.map((id) => getProduct(String(id))))
  const lookup = new Map<number, { productName: string; variant: SyncVariant }>()
  for (const detail of details) {
    for (const variant of detail.sync_variants) {
      lookup.set(variant.id, { productName: detail.sync_product.name, variant })
    }
  }
  return lookup
}

export interface PrintfulOrderRecipient {
  name: string
  email: string
  address1: string
  city: string
  state_code: string
  country_code: string
  zip: string
}

export interface PrintfulOrderItem {
  sync_variant_id: number
  quantity: number
}

export interface ShippingRateRecipient {
  address1: string
  city: string
  country_code: string
  zip: string
  state_code?: string
}

export interface ShippingRateItem {
  // Shipping rates require the catalog variant_id, NOT the sync_variant_id used
  // for order creation.
  variant_id: number
  quantity: number
}

export async function getShippingRates(
  recipient: ShippingRateRecipient,
  items: ShippingRateItem[],
  currency = 'EUR'
): Promise<PrintfulShippingRate[]> {
  const res = await fetch(`${PRINTFUL_BASE}/shipping/rates`, {
    method: 'POST',
    headers: buildHeaders(getApiKey()),
    body: JSON.stringify({ recipient, items, currency }),
  })
  const data = await res.json()
  if (!res.ok) {
    const reason = typeof data?.result === 'string' ? data.result : `status ${res.status}`
    throw new Error(`Printful shipping rates failed: ${reason}`)
  }
  return Array.isArray(data.result) ? data.result : []
}

/**
 * Whether paid orders should be auto-submitted to Printful for fulfillment
 * (skipping the manual draft/confirm step). Off by default so orders stay as
 * deletable drafts during testing. Requires a payment method or Printful Wallet
 * balance configured in Printful billing, otherwise the confirmed order cannot
 * be charged. Enable with PRINTFUL_AUTO_CONFIRM=true.
 */
export function isAutoConfirmEnabled(): boolean {
  return process.env.PRINTFUL_AUTO_CONFIRM === 'true'
}

export async function createOrder(
  recipient: PrintfulOrderRecipient,
  items: PrintfulOrderItem[],
  shippingMethodId?: string
): Promise<{ id: number }> {
  // confirm=1 submits the order straight to fulfillment; without it Printful
  // keeps the order as a draft awaiting manual confirmation in the dashboard.
  const url = `${PRINTFUL_BASE}/orders${isAutoConfirmEnabled() ? '?confirm=1' : ''}`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildPrintfulHeaders(getApiKey()),
    body: JSON.stringify({
      recipient,
      items,
      ...(shippingMethodId ? { shipping: shippingMethodId } : {}),
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printful order failed: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.result
}
