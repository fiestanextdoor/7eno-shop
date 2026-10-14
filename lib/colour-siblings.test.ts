import type { ShopProduct } from './catalog'
import { buildColourSiblings, SWATCH_HEX } from './colour-siblings'
import { DROPS } from './drops'
import { productSlug } from './slug'

const [olympian, sport] = DROPS

function product(name: string, overrides: Partial<ShopProduct> = {}): ShopProduct {
  return {
    provider: 'printful',
    id: productSlug(name),
    name,
    slug: productSlug(name),
    thumbnailUrl: null,
    variants: [],
    colors: [],
    currency: 'EUR',
    drop: name.startsWith('Olympian') ? olympian : sport,
    status: 'live',
    purchasable: true,
    soldOut: false,
    ...overrides,
  }
}

const roseRed = product('OLYMPN Sport Oversized Hoodie Rose Red')
const pistachio = product('OLYMPN Sport Oversized Hoodie Pistachio', { soldOut: true })
const mocha = product('OLYMPN Sport Oversized Hoodie Mocha')
const dune = product('OLYMPN Sport Relaxed Hoodie Dune')
const obsidianRelaxed = product('OLYMPN Sport Relaxed Hoodie Obsidian')
const ocean = product('Olympian Tee Ocean Unisex')
const sand = product('Olympian Tee Sand Unisex')
const ALL = [ocean, mocha, dune, roseRed, sand, pistachio, obsidianRelaxed]

describe('buildColourSiblings', () => {
  it('lists the colours of one family in colourOrder, the current one marked', () => {
    expect(buildColourSiblings(ALL, mocha)).toEqual([
      { name: 'Rose Red', hex: '#621926', href: '/shop/olympn-sport-oversized-hoodie-rose-red', current: false, soldOut: false },
      { name: 'Pistachio', hex: '#9CAF92', href: '/shop/olympn-sport-oversized-hoodie-pistachio', current: false, soldOut: true },
      { name: 'Mocha', hex: '#9E7551', href: '/shop/olympn-sport-oversized-hoodie-mocha', current: true, soldOut: false },
    ])
  })

  it('keeps fits apart: the relaxed hoodies are their own family', () => {
    expect(buildColourSiblings(ALL, dune).map((s) => s.name)).toEqual(['Obsidian', 'Dune'])
  })

  it('handles the Olympian colourways with their own swatches', () => {
    expect(buildColourSiblings(ALL, sand).map((s) => [s.name, s.hex, s.current])).toEqual([
      ['Ocean', '#297d95', false],
      ['Sand', '#eddca2', true],
    ])
  })

  it('returns nothing for a family of one or a product without a known colour', () => {
    expect(buildColourSiblings([roseRed], roseRed)).toEqual([])
    const cap = product('OLYMPN Sport Cap')
    expect(buildColourSiblings([...ALL, cap], cap)).toEqual([])
  })

  it('never mixes drops: a same-family product from another drop is left out', () => {
    const archived = product('OLYMPN Sport Oversized Hoodie Olive', { drop: { ...olympian, colourOrder: sport.colourOrder } })
    expect(buildColourSiblings([...ALL, archived], mocha).map((s) => s.name)).toEqual(['Rose Red', 'Pistachio', 'Mocha'])
  })

  it('leaves out a family member without a known colour', () => {
    const plain = product('OLYMPN Sport Oversized Hoodie')
    expect(buildColourSiblings([...ALL, plain], mocha).map((s) => s.name)).toEqual(['Rose Red', 'Pistachio', 'Mocha'])
  })

  it('lists a product once even when the catalogue repeats it', () => {
    expect(buildColourSiblings([...ALL, mocha, roseRed], mocha).map((s) => s.name)).toEqual(['Rose Red', 'Pistachio', 'Mocha'])
  })

  it('has a swatch for every OLYMPN Sport colour', () => {
    for (const colour of sport.colourOrder) expect(SWATCH_HEX[colour]).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
