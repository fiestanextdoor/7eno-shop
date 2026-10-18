import { ANNOUNCEMENTS, MAIN_NAV, isActivePath } from './nav'

describe('MAIN_NAV', () => {
  it('lists the five v2 destinations in order', () => {
    expect(MAIN_NAV).toEqual([
      { label: 'Shop', href: '/shop' },
      { label: 'Olympian', href: '/collections/olympian' },
      { label: 'OLYMPN Sport', href: '/collections/olympn-sport' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ])
  })
})

describe('ANNOUNCEMENTS', () => {
  it('names the free-shipping threshold from the shipping rules', () => {
    expect(ANNOUNCEMENTS[0]).toBe('Free shipping on orders over €75')
  })
})

describe('isActivePath', () => {
  it.each([
    ['/shop', '/shop', true],
    ['/shop', '/shop/olympian-tee-sand-unisex', true],
    ['/shop', '/shopping', false],
    ['/collections/olympian', '/collections/olympian', true],
    ['/collections/olympian', '/collections/olympn-sport', false],
    ['/', '/', true],
    ['/', '/shop', false],
  ])('%s is active on %s: %s', (href, path, expected) => {
    expect(isActivePath(href, path)).toBe(expected)
  })
})
