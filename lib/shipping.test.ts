import { validateShippingAddress } from './shipping'

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
