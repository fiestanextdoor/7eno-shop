/** @jest-environment node */
import { NextRequest } from 'next/server'
import type { NormalizedProduct } from '@/types/catalog'
import { matchDrop } from '@/lib/drops'
import { POST } from './route'

const mockCreateSession = jest.fn()
const mockGetPrintfulProduct = jest.fn()
const mockPrintifyLookup = jest.fn()

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
jest.mock('../../../lib/printify', () => ({
  buildVariantLookup: (...args: unknown[]) => mockPrintifyLookup(...args),
}))
jest.mock('../../../lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}))

// matchDrop runs for real, but through a spy so a test can see its input and
// swap in a drop list with a Printful sync id.
jest.mock('../../../lib/drops', () => {
  const actual = jest.requireActual('../../../lib/drops')
  return { ...actual, matchDrop: jest.fn(actual.matchDrop) }
})
const actualDrops = jest.requireActual<typeof import('../../../lib/drops')>('../../../lib/drops')
const mockedMatchDrop = jest.mocked(matchDrop)

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
        color: 'White', colorCode: '#ffffff', priceCents: 4500, currency: 'EUR',
        inStock: true, imageUrl: null,
      },
    ],
  }
}

const CATALOG: Record<string, NormalizedProduct> = {
  '1': product('1', 'Olympian Tee Sand Unisex'),
  '2': product('2', 'OLYMPN Sport Oversized Hoodie Rose Red'),
  '3': product('3', 'olympn sport relaxed hoodie dune'),
  '4': product('4', 'Ink/Butter Sport Tee Unisex'),
  // Printful sometimes sends a non-breaking space inside the name.
  '5': product('5', 'OLYMPN\u00a0Sport Relaxed Hoodie Olive'),
}

function line(productId: string, provider: 'printful' | 'printify' = 'printful') {
  return {
    provider, productId, variantId: `v${productId}`,
    // The client-side name is deliberately harmless: the guard must use the
    // server-resolved product name, not what the browser sends.
    productName: 'Anything', variantName: 'M', price: '1.00', currency: 'EUR',
    quantity: 1, imageUrl: null,
  }
}

function checkoutRequest(lines: ReturnType<typeof line>[], cookie?: string) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({
      items: lines,
      address: { name: 'Test Klant', line1: 'Coolsingel 1', city: 'Rotterdam', postalCode: '3011AA', country: 'NL' },
    }),
  })
}

const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')
const SPORT_RELEASE = Date.parse('2026-11-01T11:00:00Z')
const ORIGINAL_ENV = { ...process.env }
const REFUSED = { error: 'One or more products are not available' }

beforeEach(() => {
  mockCreateSession.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
  mockGetPrintfulProduct.mockReset().mockImplementation(async (id: string) => CATALOG[id])
  mockPrintifyLookup.mockReset().mockResolvedValue(new Map())
  mockedMatchDrop.mockReset().mockImplementation(actualDrops.matchDrop)
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE_SPORT)
  process.env = { ...ORIGINAL_ENV, SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'preview' }
})

afterEach(() => {
  jest.restoreAllMocks()
  process.env = { ...ORIGINAL_ENV }
})

describe('POST /api/checkout purchasability guard', () => {
  it('sells a product of a live drop', async () => {
    const res = await POST(checkoutRequest([line('1')]))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/s/1' })
    expect(mockCreateSession).toHaveBeenCalledTimes(1)
  })

  it('refuses a teaser product before the release with 409 and no Stripe session', async () => {
    const res = await POST(checkoutRequest([line('2')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(await res.json()).toEqual(REFUSED)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('matches the drop prefix case-insensitively', async () => {
    const res = await POST(checkoutRequest([line('3')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('matches the drop prefix across a non-breaking space', async () => {
    const res = await POST(checkoutRequest([line('5')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('refuses a retired OG product', async () => {
    const res = await POST(checkoutRequest([line('4')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('refuses a mixed cart when any line is not for sale', async () => {
    const res = await POST(checkoutRequest([line('1'), line('2')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('refuses a Printify line, whatever its name', async () => {
    mockPrintifyLookup.mockResolvedValue(
      new Map([['vpi1', { productName: 'Olympian Tee Sand Unisex', variant: { ...CATALOG['1'].variants[0], provider: 'printify', id: 'vpi1' } }]])
    )
    const res = await POST(checkoutRequest([line('pi1', 'printify')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('matches on the server-resolved product id, not the id the request claims', async () => {
    // Olympian (live) owns sync id 1 by id, so a body that says productId '1'
    // must not lend that drop to a variant of the OLYMPN Sport teaser (product 2).
    const drops = actualDrops.DROPS.map((d) =>
      d.id === 'olympian' ? { ...d, match: { ...d.match, printfulSyncIds: ['1'] } } : d
    )
    mockedMatchDrop.mockImplementation((p) => actualDrops.matchDrop(p, drops))
    const teaserVariantUnderLiveId = { ...line('1'), variantId: 'v2' }
    // The second line only makes the server fetch product 2, so v2 resolves.
    const liveVariantUnderTeaserId = { ...line('2'), variantId: 'v1' }
    const res = await POST(checkoutRequest([teaserVariantUnderLiveId, liveVariantUnderTeaserId]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(await res.json()).toEqual(REFUSED)
    expect(mockCreateSession).not.toHaveBeenCalled()
    expect(mockedMatchDrop).toHaveBeenCalledTimes(1)
    expect(mockedMatchDrop).toHaveBeenCalledWith({
      id: '2', provider: 'printful', name: 'OLYMPN Sport Oversized Hoodie Rose Red',
    })
  })

  it('flips on the exact release millisecond (12:00 Amsterdam, 11:00 UTC)', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(SPORT_RELEASE - 1)
    expect((await POST(checkoutRequest([line('2')]))).status).toBe(409)
    jest.spyOn(Date, 'now').mockReturnValue(SPORT_RELEASE)
    expect((await POST(checkoutRequest([line('2')]))).status).toBe(200)
  })

  it('sells an upcoming drop with the preview cookie', async () => {
    const res = await POST(checkoutRequest([line('2')], 'drop_preview=k3y'))
    expect(res.status).toBe(200)
  })

  it('ignores a hand-made preview cookie', async () => {
    const res = await POST(checkoutRequest([line('2')], 'drop_preview=1'))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('ignores the preview cookie on Vercel production', async () => {
    process.env.VERCEL_ENV = 'production'
    const res = await POST(checkoutRequest([line('2')], 'drop_preview=k3y'))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })
})
