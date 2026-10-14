import { legacyShopRedirect } from './legacy-redirects'

const go = (path: string) => {
  const target = legacyShopRedirect(new URL(path, 'https://www.7eno.shop'))
  return target ? `${target.pathname}${target.search}` : null
}

describe('legacyShopRedirect', () => {
  it.each([
    ['/shop?line=og', '/shop'],
    ['/shop?line=OG', '/shop'],
    ['/shop?line=', '/shop'],
    ['/shop?line=og&category=tees&utm_source=ig', '/shop?category=tees&utm_source=ig'],
    ['/shop?utm_source=ig&line=og', '/shop?utm_source=ig'],
    ['/shop?line=Olympian&utm_source=ig', '/collections/olympian?utm_source=ig'],
  ])('%s goes to %s', (from, to) => {
    expect(go(from)).toBe(to)
  })

  it.each(['/shop', '/shop?category=tees', '/shop/olympian-tee-sand-unisex?line=og', '/collections/olympian?line=og'])(
    'leaves %s alone',
    (path) => {
      expect(go(path)).toBeNull()
    }
  )

  it('never produces a URL that redirects again', () => {
    for (const from of ['/shop?line=og', '/shop?line=og&line=og&sort=price-asc', '/shop?line=olympian']) {
      const target = legacyShopRedirect(new URL(from, 'https://www.7eno.shop'))
      expect(target).not.toBeNull()
      expect(legacyShopRedirect(target as URL)).toBeNull()
    }
  })
})
