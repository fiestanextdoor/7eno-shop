import { classify, HIDDEN_SIZES } from './product-classify'

describe('classify', () => {
  it.each([
    ['Olympian Tee Sand Unisex', { isTee: true, isKnit: false, isHoodie: false, isBag: false }],
    ['Olympian Knitted Tee Ocean Unisex', { isTee: false, isKnit: true, isHoodie: false, isBag: false }],
    ['OLYMPN Sport Oversized Hoodie Rose Red', { isTee: false, isKnit: false, isHoodie: true, isBag: false }],
    ['OLYMPN Sport Relaxed Hoodie Dune', { isTee: false, isKnit: false, isHoodie: true, isBag: false }],
    ['Olympian Ocean Backpack 20 L', { isTee: false, isKnit: false, isHoodie: false, isBag: true }],
  ])('classifies %s', (name, expected) => {
    expect(classify(name)).toEqual(expected)
  })

  it('puts every v2 piece in exactly one kind', () => {
    const names = [
      'Olympian Tee Coconut Unisex', 'Olympian Knitted Tee Flamingo Unisex', 'Olympian Sand Backpack 20 L',
      'OLYMPN Sport Oversized Hoodie Pistachio', 'OLYMPN Sport Relaxed Hoodie Maritime',
    ]
    for (const name of names) {
      expect(Object.values(classify(name)).filter(Boolean)).toHaveLength(1)
    }
  })
})

describe('HIDDEN_SIZES', () => {
  it('hides the sizes the storefront hides', () => {
    expect(HIDDEN_SIZES.has('4XL')).toBe(true)
    expect(HIDDEN_SIZES.has('XL')).toBe(false)
  })
})
