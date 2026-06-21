import { PROMO_CODE, PROMO_PERCENT_OFF, normalizePromoCode, isValidPromoCode } from './promo'

describe('promo code helpers', () => {
  it('exposes the configured code and percentage', () => {
    expect(PROMO_CODE).toBe('MAARDANWEL')
    expect(PROMO_PERCENT_OFF).toBe(7)
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(normalizePromoCode('  maardanwel ')).toBe('MAARDANWEL')
    expect(normalizePromoCode('MaArDaNwEl')).toBe('MAARDANWEL')
  })

  it('accepts the code regardless of case or padding', () => {
    expect(isValidPromoCode('MAARDANWEL')).toBe(true)
    expect(isValidPromoCode(' maardanwel ')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isValidPromoCode('')).toBe(false)
    expect(isValidPromoCode('MAARNIET')).toBe(false)
    expect(isValidPromoCode('MAARDANWEL2')).toBe(false)
  })
})
