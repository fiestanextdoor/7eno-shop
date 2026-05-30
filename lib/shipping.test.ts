import {
  validateShippingAddress,
  computeShippingCents,
  FREE_SHIPPING_THRESHOLD_CENTS,
  FLAT_SHIPPING_RATE_CENTS,
} from './shipping'

describe('computeShippingCents', () => {
  it('charges the flat rate below the free-shipping threshold', () => {
    expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(FLAT_SHIPPING_RATE_CENTS)
    expect(computeShippingCents(2000)).toBe(FLAT_SHIPPING_RATE_CENTS)
  })

  it('is free exactly at the threshold', () => {
    expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0)
  })

  it('is free above the threshold', () => {
    expect(computeShippingCents(FREE_SHIPPING_THRESHOLD_CENTS + 5000)).toBe(0)
  })

  it('falls back to the flat rate for an empty or invalid subtotal', () => {
    expect(computeShippingCents(0)).toBe(FLAT_SHIPPING_RATE_CENTS)
    expect(computeShippingCents(-100)).toBe(FLAT_SHIPPING_RATE_CENTS)
    expect(computeShippingCents(NaN)).toBe(FLAT_SHIPPING_RATE_CENTS)
  })
})

describe('validateShippingAddress', () => {
  const valid = {
    name: 'Jan Jansen',
    line1: 'Damrak 1',
    city: 'Amsterdam',
    postalCode: '1012LG',
    country: 'NL',
  }

  it('accepts a complete address with an allowed country', () => {
    const result = validateShippingAddress(valid)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.address.country).toBe('NL')
      expect(result.address.name).toBe('Jan Jansen')
    }
  })

  it('trims string fields', () => {
    const result = validateShippingAddress({ ...valid, name: '  Jan  ', city: ' Amsterdam ' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.address.name).toBe('Jan')
      expect(result.address.city).toBe('Amsterdam')
    }
  })

  it('rejects a country outside the allowed list', () => {
    const result = validateShippingAddress({ ...valid, country: 'US' })
    expect(result.ok).toBe(false)
  })

  it('rejects when a required field is missing', () => {
    const result = validateShippingAddress({ ...valid, postalCode: '' })
    expect(result.ok).toBe(false)
  })

  it('rejects non-object input', () => {
    expect(validateShippingAddress(null).ok).toBe(false)
    expect(validateShippingAddress('nope').ok).toBe(false)
  })

  it('omits line2 when not provided but keeps it when present', () => {
    const without = validateShippingAddress(valid)
    const withLine2 = validateShippingAddress({ ...valid, line2: 'Apt 4' })
    if (without.ok) expect(without.address.line2).toBeUndefined()
    if (withLine2.ok) expect(withLine2.address.line2).toBe('Apt 4')
  })
})
