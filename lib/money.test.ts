import { formatEuro, formatPrice } from './money'

describe('formatPrice', () => {
  it('formats cents with the currency symbol, or the code', () => {
    expect(formatPrice(6495, 'EUR')).toBe('€64.95')
    expect(formatPrice(6495, 'SEK')).toBe('SEK 64.95')
  })

  it('shows no price instead of a wrong one', () => {
    expect(formatPrice(undefined, 'EUR')).toBeNull()
    expect(formatPrice(0, 'EUR')).toBeNull()
    expect(formatPrice(Number.NaN, 'EUR')).toBeNull()
  })
})

describe('formatEuro', () => {
  it('formats euro amounts, zero included', () => {
    expect(formatEuro(4.95)).toBe('€4.95')
    expect(formatEuro(75 - 45.1)).toBe('€29.90')
    expect(formatEuro(0)).toBe('€0.00')
    expect(formatEuro(Number.NaN)).toBe('€0.00')
  })
})
