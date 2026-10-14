import { buildGallery, galleryFor } from './product-gallery'

describe('buildGallery', () => {
  it('leads with front and back, then the mockups and the local photos, each once', () => {
    expect(
      buildGallery({
        productName: 'OLYMPN Sport Oversized Hoodie Mocha',
        front: 'https://cdn.test/front.png',
        back: 'https://cdn.test/back.png',
        mockups: ['https://cdn.test/model.jpg', 'https://cdn.test/front.png'],
        extras: ['/products/x/lifestyle.png'],
      })
    ).toEqual([
      { src: 'https://cdn.test/front.png', alt: 'OLYMPN Sport Oversized Hoodie Mocha, front' },
      { src: 'https://cdn.test/back.png', alt: 'OLYMPN Sport Oversized Hoodie Mocha, back' },
      { src: 'https://cdn.test/model.jpg', alt: 'OLYMPN Sport Oversized Hoodie Mocha, view 3' },
      { src: '/products/x/lifestyle.png', alt: 'OLYMPN Sport Oversized Hoodie Mocha, view 4' },
    ])
  })

  it('skips a missing front or back', () => {
    expect(buildGallery({ productName: 'Bag', front: null, back: null, mockups: ['/a.png'], extras: [] })).toEqual([
      { src: '/a.png', alt: 'Bag, view 1' },
    ])
  })
})

describe('galleryFor', () => {
  const a = [{ src: '/a.png', alt: 'a' }]
  const b = [{ src: '/b.png', alt: 'b' }]

  it('picks the colour, then the colourless gallery, then the first one', () => {
    expect(galleryFor({ Black: a, Maroon: b }, 'Maroon')).toBe(b)
    expect(galleryFor({ '': a }, 'Black')).toBe(a)
    expect(galleryFor({ Black: a }, 'Unknown')).toBe(a)
    expect(galleryFor({}, '')).toEqual([])
  })
})
