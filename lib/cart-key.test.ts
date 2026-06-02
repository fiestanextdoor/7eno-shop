import { cartItemKey } from './cart-key'

describe('cartItemKey', () => {
  it('combines provider and variant id', () => {
    expect(cartItemKey('printify', '100')).toBe('printify:100')
    expect(cartItemKey('printful', '9001')).toBe('printful:9001')
  })
  it('disambiguates equal variant ids across providers', () => {
    expect(cartItemKey('printful', '5')).not.toBe(cartItemKey('printify', '5'))
  })
})
