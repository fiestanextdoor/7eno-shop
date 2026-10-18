import type { ShopProduct } from './catalog'
import { DROPS, NEW_IN_MS } from './drops'
import { resolveCardImage } from './card-image'
import { formatPrice, tileBadges, toTiles } from './tiles'

jest.mock('./card-image', () => ({ resolveCardImage: jest.fn() }))

const [olympian, sport] = DROPS
const SPORT_START = Date.parse(sport.window.startsAt)

function product(overrides: Partial<ShopProduct>): ShopProduct {
  return {
    provider: 'printful', id: '1', name: 'OLYMPN Sport Oversized Hoodie Mocha', slug: 'olympn-sport-oversized-hoodie-mocha',
    thumbnailUrl: 'https://files.cdn.printful.com/mocha.png', variants: [], colors: [], currency: 'EUR', priceCents: 6495,
    drop: sport, status: 'live', purchasable: true, soldOut: false,
    ...overrides,
  }
}

describe('tileBadges', () => {
  it('marks a teaser as coming soon, whatever its stock', () => {
    expect(tileBadges(product({ status: 'upcoming', soldOut: true }), SPORT_START - 1)).toEqual(['coming'])
  })
  it('marks a sold-out live product', () => {
    expect(tileBadges(product({ soldOut: true }), SPORT_START + 1000)).toEqual(['sold-out'])
  })
  it('calls a live drop new for its first 30 days only', () => {
    expect(tileBadges(product({}), SPORT_START)).toEqual(['new'])
    expect(tileBadges(product({}), SPORT_START + NEW_IN_MS - 1)).toEqual(['new'])
    expect(tileBadges(product({}), SPORT_START + NEW_IN_MS)).toEqual([])
  })
  it('calls a previewed drop new before its release', () => {
    expect(tileBadges(product({ status: 'live' }), SPORT_START - 60_000)).toEqual(['new'])
  })
  it('does not call Olympian new months after its release', () => {
    expect(tileBadges(product({ drop: olympian }), SPORT_START)).toEqual([])
  })
})

describe('formatPrice', () => {
  it('formats cents with the currency symbol', () => {
    expect(formatPrice(6495, 'EUR')).toBe('€64.95')
    expect(formatPrice(6495, 'SEK')).toBe('SEK 64.95')
  })
  it('shows no price instead of a wrong one', () => {
    expect(formatPrice(undefined, 'EUR')).toBeNull()
    expect(formatPrice(0, 'EUR')).toBeNull()
  })
})

describe('toTiles', () => {
  it('builds tiles with the card image, falling back to the thumbnail when the cut-out fails', async () => {
    jest.mocked(resolveCardImage)
      .mockResolvedValueOnce('https://example.supabase.co/storage/mocha.png')
      .mockRejectedValueOnce(new Error('remove.bg down'))
    const teaser = product({ status: 'upcoming', purchasable: false })
    const dune = product({ id: '2', name: 'OLYMPN Sport Relaxed Hoodie Dune', slug: 'olympn-sport-relaxed-hoodie-dune', thumbnailUrl: 'https://files.cdn.printful.com/dune.png', status: 'upcoming', purchasable: false })
    const tiles = await toTiles([teaser, dune], SPORT_START - 1)
    expect(tiles[0]).toEqual({
      slug: 'olympn-sport-oversized-hoodie-mocha',
      href: '/shop/olympn-sport-oversized-hoodie-mocha',
      name: 'OLYMPN Sport Oversized Hoodie Mocha',
      image: 'https://example.supabase.co/storage/mocha.png',
      imageAlt: 'OLYMPN Sport Oversized Hoodie Mocha',
      price: '€64.95',
      badges: ['coming'],
      note: 'Drops 1 November 2026 at 12:00 CET',
      dropId: 'olympn-sport',
      category: 'hoodies',
      priceCents: 6495,
      quick: null,
    })
    expect(tiles[1].image).toBe('https://files.cdn.printful.com/dune.png')
  })
})
