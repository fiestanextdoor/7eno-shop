import { isUnreleasedProductName, UNRELEASED_NAME_PREFIXES } from './unreleased'

describe('isUnreleasedProductName', () => {
  it('only lists the OLYMPN Sport prefix (with trailing space)', () => {
    expect(UNRELEASED_NAME_PREFIXES).toEqual(['OLYMPN Sport '])
  })

  it.each([
    'OLYMPN Sport Oversized Hoodie Rose Red',
    'olympn sport oversized hoodie rose red',
    'OLYMPN SPORT Track Pants Black',
    '  OLYMPN Sport Oversized Hoodie Mocha',
    'OLYMPN  Sport Oversized Hoodie Pistachio',
    'OLYMPN\u00a0Sport Oversized Hoodie Dune',
  ])('treats "%s" as unreleased', (name) => {
    expect(isUnreleasedProductName(name)).toBe(true)
  })

  it.each([
    'Ink/Butter Sport Tee Unisex',
    'Butter/Stone Sport Shorts Unisex',
    'X Life4HSP Sport Tee',
    'Olympian Hoodie Teal',
    'OLYMPN Sportswear Tee',
    'OLYMPN Sport',
    '',
  ])('keeps "%s" visible', (name) => {
    expect(isUnreleasedProductName(name)).toBe(false)
  })
})
