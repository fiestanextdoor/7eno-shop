import { PROMO_CODES, normalizePromoCode, isValidPromoCode, findPromoCode } from './promo'

describe('promo code helpers', () => {
  it('exposes the configured codes', () => {
    expect(findPromoCode('MAARDANWEL')).toEqual({
      code: 'MAARDANWEL',
      percentOff: 7,
      freeShipping: false,
    })
    expect(findPromoCode('7ENO-ZGSEA')).toEqual({
      code: '7ENO-ZGSEA',
      percentOff: 15,
      freeShipping: true,
    })
  })

  it('keeps every configured code unique and uppercase', () => {
    const codes = PROMO_CODES.map((p) => p.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(code).toBe(code.toUpperCase())
  })

  it('normalizes case and surrounding whitespace', () => {
    expect(normalizePromoCode('  maardanwel ')).toBe('MAARDANWEL')
    expect(normalizePromoCode('MaArDaNwEl')).toBe('MAARDANWEL')
  })

  it('accepts a code regardless of case or padding', () => {
    expect(isValidPromoCode('MAARDANWEL')).toBe(true)
    expect(isValidPromoCode(' maardanwel ')).toBe(true)
    expect(isValidPromoCode(' 7eno-zgsea ')).toBe(true)
  })

  // Een handmatig overgetypte code mist het streepje net zo vaak als niet.
  it('matches with or without the separator', () => {
    for (const typed of ['7ENO-ZGSEA', '7ENOZGSEA', '7eno zgsea', ' 7Eno-ZgSeA ']) {
      expect(findPromoCode(typed)?.code).toBe('7ENO-ZGSEA')
    }
  })

  it('still rejects a blank or separator-only input', () => {
    for (const blank of ['', '   ', '-', ' - - ']) {
      expect(findPromoCode(blank)).toBeNull()
    }
  })

  it('rejects anything else', () => {
    expect(isValidPromoCode('')).toBe(false)
    expect(isValidPromoCode('MAARNIET')).toBe(false)
    expect(isValidPromoCode('MAARDANWEL2')).toBe(false)
    expect(findPromoCode('NOPE')).toBeNull()
  })

  // Alleen een code die het expliciet aanzet mag verzendkosten kwijtschelden;
  // anders zou de bestaande 7%-code stilzwijgend duurder worden voor de shop.
  it('does not grant free shipping unless the code says so', () => {
    expect(findPromoCode('MAARDANWEL')?.freeShipping).toBe(false)
  })
})
