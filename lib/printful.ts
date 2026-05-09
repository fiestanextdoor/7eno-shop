import type {
  SyncProduct,
  PrintfulProductDetail,
  PrintfulListResponse,
  PrintfulDetailResponse,
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

export async function getProducts(): Promise<SyncProduct[]> {
  const res = await fetch(`${PRINTFUL_BASE}/store/products`, {
    headers: buildPrintfulHeaders(getApiKey()),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Printful error: ${res.status}`)
  const data: PrintfulListResponse<SyncProduct> = await res.json()
  return data.result
}

export async function getProduct(id: string): Promise<PrintfulProductDetail> {
  const res = await fetch(`${PRINTFUL_BASE}/store/products/${id}`, {
    headers: buildPrintfulHeaders(getApiKey()),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Printful error: ${res.status}`)
  const data: PrintfulDetailResponse<PrintfulProductDetail> = await res.json()
  return data.result
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

export async function createOrder(
  recipient: PrintfulOrderRecipient,
  items: PrintfulOrderItem[]
): Promise<void> {
  const res = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: buildPrintfulHeaders(getApiKey()),
    body: JSON.stringify({ recipient, items }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printful order failed: ${res.status} ${err}`)
  }
}
