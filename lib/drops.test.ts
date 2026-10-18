import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  DROPS, colourLabel, colourRank, familyKey, formatDropDate, formatDropDay, formatEdition, getDrop,
  getDropBySlug, getDropStatus, getNextDrop, isDropListed, isPurchasable, isVisibleInShop,
  fitNoteFor, listDropsNewestFirst, matchDrop, toDropView, type Drop,
} from './drops'

const olympian = getDrop('olympian') as Drop
const sport = getDrop('olympn-sport') as Drop
const at = (iso: string) => Date.parse(iso)
const pf = (name: string, id = '1') => ({ provider: 'printful' as const, id, name })
const publicFile = (src: string) => existsSync(path.join(process.cwd(), 'public', src))

const BEFORE_SPORT = at('2026-10-14T10:00:00Z')
const AFTER_SPORT = at('2026-11-02T10:00:00Z')

describe('fitNoteFor', () => {
  const withNotes: Drop = {
    ...sport,
    fitNotes: [
      { match: 'Relaxed', note: 'Sam is 1,86 m and wears M.' },
      { match: 'Oversized Hoodie', note: 'Sam is 1,86 m and wears L.' },
      { note: 'Model wears M.' },
    ],
  }

  it('picks the first note whose words appear in the product name', () => {
    expect(fitNoteFor(withNotes, 'OLYMPN Sport Relaxed Hoodie Dune')).toBe('Sam is 1,86 m and wears M.')
    expect(fitNoteFor(withNotes, 'OLYMPN Sport Oversized Hoodie Mocha')).toBe('Sam is 1,86 m and wears L.')
  })

  it('falls back to a note without match, and matches whole words only', () => {
    expect(fitNoteFor(withNotes, 'OLYMPN Sport Windbreaker')).toBe('Model wears M.')
    expect(fitNoteFor({ ...withNotes, fitNotes: [{ match: 'Tee', note: 'x' }] }, 'Olympian Teeth')).toBeUndefined()
  })

  it('is undefined for a drop without notes', () => {
    expect(fitNoteFor(olympian, 'Olympian Tee Ocean Unisex')).toBeUndefined()
  })
})

describe('drop config', () => {
  it('matches spec section 4 for both editions', () => {
    expect(olympian).toMatchObject({
      edition: 1, title: 'Olympian', slug: 'olympian',
      window: { startsAt: '2026-06-19T19:00:00+02:00', endsAt: null },
      match: { namePrefixes: ['Olympian '] },
      teaser: false, tone: 'light',
    })
    expect(sport).toMatchObject({
      edition: 2, title: 'OLYMPN Sport', slug: 'olympn-sport',
      window: { startsAt: '2026-11-01T12:00:00+01:00', endsAt: null },
      match: { namePrefixes: ['OLYMPN Sport '] },
      teaser: true, waitlist: true, tone: 'dark',
    })
  })

  it('ships all eight OLYMPN Sport mockups as local webp files', () => {
    expect(sport.hero.lineup).toHaveLength(8)
    for (const src of sport.hero.lineup) {
      expect(src).toMatch(/^\/drops\/olympn-sport\/[a-z-]+\.webp$/)
      expect(publicFile(src)).toBe(true)
    }
  })

  it('points the OLYMPN Sport hero at the model photo and the ad, with a poster', () => {
    const assets = [sport.hero.image, sport.hero.video, sport.hero.poster]
    expect(assets).toEqual(['/brand/model-dune.webp', '/brand/ad-dune.mp4', '/brand/ad-dune-poster.jpg'])
    for (const src of assets) expect(publicFile(src as string)).toBe(true)
  })

  it('points every Olympian hero asset at a file that exists', () => {
    const assets = [olympian.hero.image, olympian.hero.poster, olympian.hero.video, ...olympian.hero.lineup]
    for (const src of assets) {
      expect(typeof src).toBe('string')
      expect(publicFile(src as string)).toBe(true)
    }
  })

  it('never lets one name prefix swallow another, so no product sits in two drops', () => {
    for (const a of DROPS) {
      for (const b of DROPS) {
        if (a === b) continue
        for (const pa of a.match.namePrefixes) {
          for (const pb of b.match.namePrefixes) {
            expect(pa.toLowerCase().startsWith(pb.toLowerCase())).toBe(false)
          }
        }
      }
    }
  })

  it('has unique ids, slugs and editions', () => {
    for (const key of ['id', 'slug', 'edition'] as const) {
      expect(new Set(DROPS.map((d) => d[key])).size).toBe(DROPS.length)
    }
  })

  it('looks drops up by id and slug', () => {
    expect(getDropBySlug('olympn-sport')).toBe(sport)
    expect(getDropBySlug('og')).toBeNull()
    expect(getDrop('nope')).toBeNull()
  })
})

describe('getDropStatus', () => {
  it.each([
    ['2026-11-01T10:59:59.999Z', 'upcoming'],
    ['2026-11-01T11:00:00.000Z', 'live'],
    ['2026-11-01T12:00:00+01:00', 'live'],
    ['2031-01-01T00:00:00Z', 'live'],
  ])('OLYMPN Sport at %s is %s (12:00 Amsterdam is 11:00 UTC in November)', (iso, status) => {
    expect(getDropStatus(sport, at(iso))).toBe(status)
  })

  it.each([
    ['2026-06-19T16:59:59.999Z', 'upcoming'],
    ['2026-06-19T17:00:00.000Z', 'live'],
  ])('Olympian at %s is %s (19:00 CEST is 17:00 UTC)', (iso, status) => {
    expect(getDropStatus(olympian, at(iso))).toBe(status)
  })

  it('closes a drop exactly at its end date', () => {
    const closing: Drop = { ...sport, window: { startsAt: sport.window.startsAt, endsAt: '2026-12-01T00:00:00+01:00' } }
    expect(getDropStatus(closing, at('2026-11-30T22:59:59.999Z'))).toBe('live')
    expect(getDropStatus(closing, at('2026-11-30T23:00:00.000Z'))).toBe('closed')
  })

  it('treats an upcoming drop as live in preview, but never reopens a closed one', () => {
    expect(getDropStatus(sport, BEFORE_SPORT, { preview: true })).toBe('live')
    const closed: Drop = { ...sport, window: { startsAt: '2026-01-01T00:00:00+01:00', endsAt: '2026-02-01T00:00:00+01:00' } }
    expect(getDropStatus(closed, BEFORE_SPORT, { preview: true })).toBe('closed')
  })
})

describe('matchDrop', () => {
  it.each([
    ['OLYMPN Sport Oversized Hoodie Rose Red', 'olympn-sport'],
    ['olympn sport relaxed hoodie dune', 'olympn-sport'],
    ['  OLYMPN Sport Relaxed Hoodie Olive', 'olympn-sport'],
    ['OLYMPN Sport Oversized Hoodie Mocha', 'olympn-sport'],
    ['OLYMPN  Sport Oversized Hoodie Pistachio', 'olympn-sport'],
    ['Olympian Tee Sand Unisex', 'olympian'],
    ['OLYMPIAN KNITTED TEE OCEAN UNISEX', 'olympian'],
  ])('puts "%s" in %s', (name, id) => {
    expect(matchDrop(pf(name))?.id).toBe(id)
  })

  it.each([
    'Ink/Butter Sport Tee Unisex',
    'X Life4HSP Sport Tee',
    'OLYMPN Sportswear Tee',
    'OLYMPN Sport',
    'Olympian',
    'Olympians Tee',
    '7ENO Ink/Blood Tee Men',
    '',
  ])('leaves "%s" out of every drop', (name) => {
    expect(matchDrop(pf(name))).toBeNull()
  })

  it('never matches a Printify product, whatever its name', () => {
    expect(matchDrop({ provider: 'printify', id: 'abc', name: 'Olympian Tee Sand Unisex' })).toBeNull()
  })

  it('lets an exact sync id win over the name', () => {
    const drops: Drop[] = [olympian, { ...sport, match: { printfulSyncIds: ['424242'], namePrefixes: ['OLYMPN Sport '] } }]
    expect(matchDrop(pf('Olympian Tee Sand Unisex', '424242'), drops)?.id).toBe('olympn-sport')
    expect(matchDrop(pf('Renamed Hoodie', '424242'), drops)?.id).toBe('olympn-sport')
  })
})

describe('purchasability and visibility', () => {
  it('only sells a live drop', () => {
    expect(isPurchasable(null, AFTER_SPORT)).toBe(false)
    expect(isPurchasable(sport, BEFORE_SPORT)).toBe(false)
    expect(isPurchasable(sport, at('2026-11-01T11:00:00Z'))).toBe(true)
    expect(isPurchasable(olympian, BEFORE_SPORT)).toBe(true)
    expect(isPurchasable(sport, BEFORE_SPORT, { preview: true })).toBe(true)
  })

  it('shows a teaser drop before release but keeps a non-teaser drop hidden', () => {
    const quiet: Drop = { ...olympian, window: { startsAt: '2027-03-01T12:00:00+01:00', endsAt: null } }
    expect(isVisibleInShop(sport, BEFORE_SPORT)).toBe(true)
    expect(isVisibleInShop(quiet, BEFORE_SPORT)).toBe(false)
    expect(isDropListed(quiet, BEFORE_SPORT)).toBe(false)
    expect(isDropListed(sport, BEFORE_SPORT)).toBe(true)
  })
})

describe('colour and family', () => {
  it('ranks colours by colourOrder and unknown colours last', () => {
    expect(colourRank(sport, 'OLYMPN Sport Oversized Hoodie Rose Red')).toBe(0)
    expect(colourRank(sport, 'OLYMPN Sport Relaxed Hoodie Maritime')).toBe(6)
    expect(colourRank(sport, 'OLYMPN Sport Relaxed Hoodie Teal')).toBe(sport.colourOrder.length)
  })

  it('labels the colour from the name, not from the Printful garment colour', () => {
    expect(colourLabel(sport, 'OLYMPN Sport Oversized Hoodie Rose Red')).toBe('Rose Red')
    expect(colourLabel(olympian, 'Olympian Tee Sand Unisex')).toBe('Sand')
    expect(colourLabel(sport, 'OLYMPN Sport Relaxed Hoodie Teal')).toBeNull()
  })

  it('strips the colour to find the product family', () => {
    expect(familyKey(sport, 'OLYMPN Sport Oversized Hoodie Rose Red')).toBe('olympn sport oversized hoodie')
    expect(familyKey(olympian, 'Olympian Ocean Backpack 20 L')).toBe('olympian backpack 20 l')
  })
})

describe('labels and views', () => {
  it('formats editions and dates in Amsterdam time, whatever the machine zone', () => {
    expect(formatEdition(2)).toBe('Edition 02')
    expect(formatDropDate(sport.window.startsAt)).toBe('1 November 2026 at 12:00 CET')
    expect(formatDropDate(olympian.window.startsAt)).toBe('19 June 2026 at 19:00 CEST')
    expect(formatDropDay(sport.window.startsAt)).toBe('1 November 2026')
  })

  it('builds a view with status and labels', () => {
    expect(toDropView(sport, BEFORE_SPORT)).toMatchObject({
      id: 'olympn-sport',
      editionLabel: 'Edition 02',
      href: '/collections/olympn-sport',
      status: 'upcoming',
      startsAtLabel: '1 November 2026 at 12:00 CET',
      startsOnLabel: '1 November 2026',
      tone: 'dark',
    })
  })

  it('lists editions newest first', () => {
    expect(listDropsNewestFirst().map((d) => d.id)).toEqual(['olympn-sport', 'olympian'])
  })

  it('picks the next drop: the soonest upcoming one, else the newest live one', () => {
    expect(getNextDrop(BEFORE_SPORT)?.id).toBe('olympn-sport')
    expect(getNextDrop(AFTER_SPORT)?.id).toBe('olympn-sport')
    expect(getNextDrop(at('2026-01-01T00:00:00Z'), {}, [olympian])).toBeNull()
    expect(getNextDrop(at('2026-07-01T00:00:00Z'), {}, [olympian])?.id).toBe('olympian')
  })
})
