import { brandSwatchOverride, resolveSwatchBackground } from './color-utils'

describe('brandSwatchOverride', () => {
  it('forces Blood (top-left) over Butter (bottom-right) for the bikini', () => {
    expect(brandSwatchOverride('7ENO Bikini')).toEqual({ hex: '#5C1A1B', hex2: '#EDE8DC' })
  })
  it('forces Blood over Butter for the swim shorts', () => {
    expect(brandSwatchOverride('7ENO Swim Shorts')).toEqual({ hex: '#5C1A1B', hex2: '#EDE8DC' })
  })
  it('returns null for products without an override', () => {
    expect(brandSwatchOverride('Ink Sport Tee')).toBeNull()
  })
})

describe('resolveSwatchBackground with override', () => {
  it('renders the blood→butter gradient for swimwear regardless of variant colour', () => {
    // Bikini variant is plain "Black" in the data; override must still win.
    expect(resolveSwatchBackground('Black', '#000000', null, '7ENO Bikini')).toBe(
      'linear-gradient(135deg, #5C1A1B 50%, #EDE8DC 50%)'
    )
  })
})
