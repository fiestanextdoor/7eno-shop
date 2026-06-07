import { cartItemKey } from './cart-key'

describe('cartItemKey', () => {
  it('combines provider and variant id', () => {
    expect(cartItemKey('printify', '100')).toBe('printify:100')
    expect(cartItemKey('printful', '9001')).toBe('printful:9001')
  })
  it('disambiguates equal variant ids across providers', () => {
    expect(cartItemKey('printful', '5')).not.toBe(cartItemKey('printify', '5'))
  })
  it('keeps standalone keys unchanged when no bundleId is given', () => {
    expect(cartItemKey('printful', '9001')).toBe('printful:9001')
  })
  it('appends bundleId so set items do not merge with standalone items', () => {
    expect(cartItemKey('printful', '9001', 'beach-set')).toBe('printful:9001#beach-set')
    expect(cartItemKey('printful', '9001', 'beach-set')).not.toBe(cartItemKey('printful', '9001'))
  })
  it('includes productId in a set key so two set items never merge', () => {
    expect(cartItemKey('printful', '9', 'beach-set', 'prodA')).toBe('printful:9#beach-set:prodA')
    expect(cartItemKey('printful', '9', 'beach-set', 'prodA')).not.toBe(
      cartItemKey('printful', '9', 'beach-set', 'prodB'),
    )
  })
})
