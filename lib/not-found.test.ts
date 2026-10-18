import { DROPS, getDrop, type Drop } from './drops'
import { notFoundLinks } from './not-found'

const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')
const AFTER_SPORT = Date.parse('2026-11-02T10:00:00Z')
const SHOP_AND_ARCHIVE = [
  { label: 'Shop', href: '/shop' },
  { label: 'Archive', href: '/archive' },
]

describe('notFoundLinks', () => {
  it('links every listed edition, newest first, then the shop and the archive', () => {
    expect(notFoundLinks(BEFORE_SPORT)).toEqual([
      { label: 'OLYMPN Sport', href: '/collections/olympn-sport' },
      { label: 'Olympian', href: '/collections/olympian' },
      ...SHOP_AND_ARCHIVE,
    ])
    expect(notFoundLinks(AFTER_SPORT)).toEqual(notFoundLinks(BEFORE_SPORT))
  })

  it('still offers the shop and the archive when no edition is listed', () => {
    expect(notFoundLinks(BEFORE_SPORT, [])).toEqual(SHOP_AND_ARCHIVE)
  })

  it('does not leak an upcoming edition without a teaser', () => {
    const hidden: Drop = {
      ...(getDrop('olympn-sport') as Drop),
      teaser: false,
      window: { startsAt: '2030-01-01T12:00:00+01:00', endsAt: null },
    }
    expect(notFoundLinks(BEFORE_SPORT, [DROPS[0], hidden])).toEqual([
      { label: 'Olympian', href: '/collections/olympian' },
      ...SHOP_AND_ARCHIVE,
    ])
  })
})
