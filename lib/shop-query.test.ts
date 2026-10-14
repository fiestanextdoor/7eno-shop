import type { ShopProduct } from './catalog'
import { DROPS, type Drop } from './drops'
import {
  applyShopQuery, buildFilterGroups, buildSortOptions, describeShopQuery, parseShopQuery, shopHref, type ShopQuery,
} from './shop-query'

const [olympian, sport] = DROPS

function product(slug: string, name: string, drop: Drop, priceCents?: number): ShopProduct {
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    priceCents, drop, status: 'live', purchasable: true, soldOut: false,
  }
}

// Catalogue order as getShopProducts returns it.
const LIST = [
  product('hoodie', 'OLYMPN Sport Oversized Hoodie Mocha', sport, 6495),
  product('knit', 'Olympian Knitted Tee Ocean Unisex', olympian, 5495),
  product('tee', 'Olympian Tee Sand Unisex', olympian, 3495),
  product('bag', 'Olympian Ocean Backpack 20 L', olympian),
]
const ALL: ShopQuery = { collection: null, category: null, sort: 'featured' }
const slugs = (list: ShopProduct[]) => list.map((p) => p.slug)

describe('parseShopQuery', () => {
  it('reads the v2 parameters', () => {
    expect(parseShopQuery({ collection: 'olympn-sport', category: 'hoodies', sort: 'price-asc' })).toEqual({
      collection: 'olympn-sport', category: 'hoodies', sort: 'price-asc',
    })
  })

  it('ignores unknown values and the retired gender and line filters', () => {
    expect(parseShopQuery({ collection: 'og', category: 'shorts', sort: 'cheapest', gender: 'men', line: 'olympian' })).toEqual(ALL)
  })

  it('takes the first of repeated parameters, case-insensitively, and survives empty arrays', () => {
    expect(parseShopQuery({ collection: ['Olympian', 'olympn-sport'], category: [] })).toEqual({ ...ALL, collection: 'olympian' })
  })
})

describe('applyShopQuery', () => {
  it('keeps the catalogue order for featured', () => {
    expect(slugs(applyShopQuery(LIST, ALL))).toEqual(['hoodie', 'knit', 'tee', 'bag'])
  })

  it('filters by collection', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, collection: 'olympn-sport' }))).toEqual(['hoodie'])
  })

  it('keeps knitted tees out of tees and in knits', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'tees' }))).toEqual(['tee'])
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'knits' }))).toEqual(['knit'])
  })

  it('filters hoodies and bags', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'hoodies' }))).toEqual(['hoodie'])
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'bags' }))).toEqual(['bag'])
  })

  it('sorts by price both ways, with an unknown price always last', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, sort: 'price-asc' }))).toEqual(['tee', 'knit', 'hoodie', 'bag'])
    expect(slugs(applyShopQuery(LIST, { ...ALL, sort: 'price-desc' }))).toEqual(['hoodie', 'knit', 'tee', 'bag'])
  })
})

describe('links', () => {
  it('builds clean shop URLs in a fixed order', () => {
    expect(shopHref(ALL)).toBe('/shop')
    expect(shopHref({ collection: 'olympian', category: 'tees', sort: 'price-desc' })).toBe(
      '/shop?collection=olympian&category=tees&sort=price-desc'
    )
  })

  it('builds filter chips that keep the other choices', () => {
    const [collection, category] = buildFilterGroups({ ...ALL, category: 'hoodies', sort: 'price-asc' })
    expect(collection.label).toBe('Collection')
    expect(collection.items.map((i) => i.label)).toEqual(['All', 'OLYMPN Sport', 'Olympian'])
    expect(collection.items[1].href).toBe('/shop?collection=olympn-sport&category=hoodies&sort=price-asc')
    expect(collection.items[0].active).toBe(true)
    expect(category.items.find((i) => i.active)?.label).toBe('Hoodies')
    expect(category.items[0].href).toBe('/shop?sort=price-asc')
  })

  it('offers only the drops it is given as collection chips', () => {
    expect(buildFilterGroups(ALL, [olympian])[0].items.map((i) => i.label)).toEqual(['All', 'Olympian'])
  })

  it('links every sort option, keeping the filters', () => {
    expect(buildSortOptions({ ...ALL, collection: 'olympian' }).map((o) => o.href)).toEqual([
      '/shop?collection=olympian',
      '/shop?collection=olympian&sort=price-asc',
      '/shop?collection=olympian&sort=price-desc',
    ])
  })
})

describe('describeShopQuery', () => {
  it('titles the listing after the filters', () => {
    expect(describeShopQuery(ALL).title).toBe('Shop all')
    expect(describeShopQuery({ ...ALL, collection: 'olympn-sport', category: 'hoodies' }).title).toBe('OLYMPN Sport Hoodies')
    expect(describeShopQuery({ ...ALL, category: 'knits' }).title).toBe('Knits')
  })
})
