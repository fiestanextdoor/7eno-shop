import { CARE_INSTRUCTIONS, categoryLabel, fitFromName, productInfoSections } from './product-copy'

describe('productInfoSections', () => {
  it('builds Details, Fit and Shipping and returns', () => {
    const sections = productInfoSections({
      productName: 'OLYMPN Sport Oversized Hoodie Dune',
      materials: ['100% cotton'],
      modelNote: 'Model is 1,85 m and wears L',
      dropTitle: 'OLYMPN Sport',
      editionLabel: 'Edition 02',
    })
    expect(sections.map((s) => s.title)).toEqual(['Details', 'Fit', 'Shipping and returns'])
    expect(sections[0].lines).toEqual([
      'OLYMPN Sport, Edition 02. Made to order by 7ENO, Abra Entertainment.',
      '100% cotton',
      ...CARE_INSTRUCTIONS,
    ])
    expect(sections[1].lines).toEqual([
      'Oversized fit: roomy through the body and sleeves.',
      'Model is 1,85 m and wears L',
      'Body measurements per size are in the size guide.',
    ])
    expect(sections[2].lines).toEqual([
      'Flat €4.95 shipping, free on orders over €75.',
      'Made to order: delivered in 5 to 10 business days.',
      'Returns within 14 days, see the returns policy.',
    ])
  })

  it('makes no fit claim the name does not make', () => {
    const [, fit] = productInfoSections({
      productName: 'Olympian Tee Sand Unisex',
      materials: [],
      dropTitle: 'Olympian',
      editionLabel: 'Edition 01',
    })
    expect(fit.lines).toEqual(['Body measurements per size are in the size guide.'])
    expect(fitFromName('OLYMPN Sport Relaxed Hoodie Dune')).toBe('Relaxed fit: an easy, slightly loose cut.')
  })
})

describe('categoryLabel', () => {
  it('names the shop category, with a neutral fallback', () => {
    expect(categoryLabel('OLYMPN Sport Oversized Hoodie Dune')).toBe('Hoodies')
    expect(categoryLabel('Olympian Knitted Tee Sand')).toBe('Knits')
    expect(categoryLabel('Olympian Tee Ocean Unisex')).toBe('Tees')
    expect(categoryLabel('Olympian Backpack Ocean')).toBe('Bags')
    expect(categoryLabel('Olympian Cap')).toBe('Product')
  })
})
