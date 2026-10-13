/** @jest-environment node */
import { NextRequest } from 'next/server'
import type { NormalizedProduct } from '@/types/catalog'
import { POST } from './route'

const mockCreateSession = jest.fn()
const mockGetPrintfulProduct = jest.fn()

// Every external module is mocked: the route must never reach Stripe,
// Printful, Printify or Supabase from a unit test. Relative paths, because
// SWC rewrites '@/' in imports but not in jest.mock strings.
jest.mock('../../../lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: (...args: unknown[]) => mockCreateSession(...args) } },
    coupons: { create: jest.fn() },
  },
}))
jest.mock('../../../lib/printful', () => ({
  getProduct: (...args: unknown[]) => mockGetPrintfulProduct(...args),
}))
jest.mock('../../../lib/printful-normalize', () => ({
  normalizePrintfulDetail: (detail: unknown) => detail,
}))
jest.mock('../../../lib/printify', () => ({ buildVariantLookup: jest.fn(async () => new Map()) }))
jest.mock('../../../lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}))

function product(id: string, name: string): NormalizedProduct {
  return {
    provider: 'printful',
    id,
    name,
    thumbnailUrl: null,
    colors: [],
    currency: 'EUR',
    variants: [
      {
        provider: 'printful', productId: id, id: `v${id}`, name: 'M', size: 'M',
        color: 'Black', colorCode: '#111111', priceCents: 4500, currency: 'EUR',
        inStock: true, imageUrl: null,
      },
    ],
  }
}

const CATALOG: Record<string, NormalizedProduct> = {
  '1': product('1', 'Olympian Hoodie Teal'),
  '2': product('2', 'OLYMPN Sport Oversized Hoodie Rose Red'),
  '3': product('3', 'olympn sport track pants black'),
  '4': product('4', 'Ink/Butter Sport Tee Unisex'),
}

function line(productId: string) {
  return {
    provider: 'printful', productId, variantId: `v${productId}`,
    // The client-side name is deliberately harmless: the guard must use the
    // server-resolved product name, not what the browser sends.
    productName: 'Anything', variantName: 'M', price: '1.00', currency: 'EUR',
    quantity: 1, imageUrl: null,
  }
}

function checkoutRequest(productIds: string[]) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      items: productIds.map(line),
      address: { name: 'Test Klant', line1: 'Coolsingel 1', city: 'Rotterdam', postalCode: '3011AA', country: 'NL' },
    }),
  })
}

beforeEach(() => {
  mockCreateSession.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
  mockGetPrintfulProduct.mockReset().mockImplementation(async (id: string) => CATALOG[id])
})

describe('POST /api/checkout unreleased guard', () => {
  it('refuses an OLYMPN Sport line with 409 and never creates a Stripe session', async () => {
    const res = await POST(checkoutRequest(['2']))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'One or more products are not available yet' })
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('matches the prefix case-insensitively', async () => {
    const res = await POST(checkoutRequest(['3']))
    expect(res.status).toBe(409)
  })

  it('refuses a mixed cart when any line is unreleased', async () => {
    const res = await POST(checkoutRequest(['1', '2']))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('still sells released products, including OG sport tees', async () => {
    const res = await POST(checkoutRequest(['1', '4']))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/s/1' })
    expect(mockCreateSession).toHaveBeenCalledTimes(1)
  })
})
