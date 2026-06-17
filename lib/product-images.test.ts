import { getProductCardImages, getProductImageOverride } from './product-images'

describe('getProductCardImages', () => {
  it('returns no images for an unknown slug', () => {
    expect(getProductCardImages('does-not-exist')).toEqual({})
  })

  it('uses the explicit front/back override for the men tees', () => {
    expect(getProductCardImages('ink-blood-tee-men')).toEqual({
      front: '/products/ink-blood-tee-men/front.png',
      hover: '/products/ink-blood-tee-men/back.png',
    })
  })

  it('falls back to the first per-colour pair for the multi-colour women tee', () => {
    // Regression: this product only has colorFront/BackImages, so the /shop card
    // previously had no hover (back) image and never flipped on hover.
    const { front, hover } = getProductCardImages('ink-butter-tee-women')
    expect(front).toBe('/products/ink-butter-tee-women/black-front.png')
    expect(hover).toBe('/products/ink-butter-tee-women/black-back.png')
  })

  it('uses hoverImage when set (swim towel lifestyle photo)', () => {
    expect(getProductCardImages('swim-towel').hover).toBe('/products/swim-towel/towel-1.png')
  })

  it('still exposes the raw override via getProductImageOverride', () => {
    expect(getProductImageOverride('ink-butter-tee-women')?.colorFrontImages?.Maroon).toContain(
      'maroon-front.png'
    )
  })
})
