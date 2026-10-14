import {
  buildTitle, escapeXml, googleCategoryFor, isWearable, productTypeFor, renderFeedXml, type FeedItem,
} from './merchant-feed'
import { classify } from './product-classify'

const baseItem: FeedItem = {
  id: 'printful-1',
  itemGroupId: 'printful-100',
  title: 'Olympian Tee Ocean Unisex - Ocean, M',
  description: 'A tee.',
  link: 'https://www.7eno.shop/shop/olympian-tee-ocean-unisex',
  imageLink: 'https://files.cdn.printful.com/a.png',
  additionalImageLinks: ['https://files.cdn.printful.com/b.png'],
  availability: 'in_stock',
  price: '25.95 EUR',
  brand: '7ENO',
  condition: 'new',
  mpn: 'printful-100-1',
  googleProductCategory: 'Apparel & Accessories > Clothing > Shirts & Tops',
  productType: '7ENO > Olympian > Tees',
  gender: 'unisex',
  ageGroup: 'adult',
  color: 'Ocean',
  size: 'M',
  shipping: [{ country: 'NL', price: '4.95 EUR' }],
}

describe('escapeXml', () => {
  it('escapes the characters that break an XML feed', () => {
    expect(escapeXml('Pro & Pro Max <14> "x" \'y\'')).toBe(
      'Pro &amp; Pro Max &lt;14&gt; &quot;x&quot; &apos;y&apos;',
    )
  })
})

describe('buildTitle', () => {
  it('joins product, colour and size', () => {
    expect(buildTitle('Olympian Tee', 'Ocean', 'M')).toBe('Olympian Tee - Ocean, M')
  })
  it('omits empty colour/size instead of leaving separators', () => {
    expect(buildTitle('Blood Vintage Cap', '', '')).toBe('Blood Vintage Cap')
    expect(buildTitle('Olympian Tee', 'Ocean', '')).toBe('Olympian Tee - Ocean')
  })
  it('truncates past the 150-character Merchant Center limit', () => {
    const title = buildTitle('x'.repeat(200), 'Ocean', 'M')
    expect(title.length).toBe(150)
    expect(title.endsWith('...')).toBe(true)
  })
})

describe('category and type mapping', () => {
  it.each([
    ['Olympian Tee Sand Unisex', 'Olympian', 'Apparel & Accessories > Clothing > Shirts & Tops', '7ENO > Olympian > Tees'],
    ['Olympian Knitted Tee Ocean Unisex', 'Olympian', 'Apparel & Accessories > Clothing > Shirts & Tops', '7ENO > Olympian > Knits'],
    ['OLYMPN Sport Oversized Hoodie Rose Red', 'OLYMPN Sport', 'Apparel & Accessories > Clothing > Shirts & Tops', '7ENO > OLYMPN Sport > Hoodies'],
    ['Olympian Ocean Backpack 20 L', 'Olympian', 'Luggage & Bags > Backpacks', '7ENO > Olympian > Bags'],
  ])('maps %s', (name, collection, category, type) => {
    const c = classify(name)
    expect(googleCategoryFor(c)).toBe(category)
    expect(productTypeFor(c, collection)).toBe(type)
  })
})

describe('isWearable', () => {
  it('is true for hoodies, tees and knits', () => {
    for (const n of ['OLYMPN Sport Relaxed Hoodie Dune', 'Olympian Tee Sand Unisex', 'Olympian Knitted Tee Ocean Unisex']) {
      expect(isWearable(classify(n))).toBe(true)
    }
  })
  it('is false for a backpack, which has no gender', () => {
    expect(isWearable(classify('Olympian Ocean Backpack 20 L'))).toBe(false)
  })
})

describe('non-apparel items omit gender and age_group', () => {
  it('leaves both tags out entirely', () => {
    const nonApparel: FeedItem = { ...baseItem }
    delete nonApparel.gender
    delete nonApparel.ageGroup
    const xml = renderFeedXml([nonApparel], { title: 't', link: 'l', description: 'd' })
    expect(xml).not.toContain('<g:gender>')
    expect(xml).not.toContain('<g:age_group>')
    expect(xml).toContain('<g:id>')
  })
})

describe('renderFeedXml', () => {
  const xml = renderFeedXml([baseItem], {
    title: '7ENO',
    link: 'https://www.7eno.shop',
    description: 'Feed',
  })

  it('declares the RSS + g namespace Merchant Center expects', () => {
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"')
  })

  it('emits every attribute apparel items require', () => {
    for (const t of ['g:id', 'g:item_group_id', 'title', 'link', 'g:image_link', 'g:availability',
      'g:price', 'g:brand', 'g:condition', 'g:google_product_category', 'g:gender',
      'g:age_group', 'g:color', 'g:size']) {
      expect(xml).toContain(`<${t}>`)
    }
  })

  it('escapes the category ampersand rather than emitting raw &', () => {
    expect(xml).toContain('Apparel &amp; Accessories')
    // No unescaped ampersand anywhere in the document.
    expect(xml.match(/&(?!amp;|lt;|gt;|quot;|apos;)/)).toBeNull()
  })

  it('nests shipping as country + price', () => {
    expect(xml).toContain('<g:country>NL</g:country>')
    expect(xml).toContain('<g:price>4.95 EUR</g:price>')
  })

  it('renders an empty but valid document when there are no items', () => {
    const empty = renderFeedXml([], { title: 't', link: 'l', description: 'd' })
    expect(empty).toContain('</rss>')
    expect(empty).not.toContain('<item>')
  })
})
