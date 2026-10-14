import type { NormalizedProduct } from '@/types/catalog'

export type DropStatus = 'upcoming' | 'live' | 'closed'
export type DropId = 'olympian' | 'olympn-sport'

export interface Drop {
  id: DropId
  /** 1, 2: shown as "Edition 02". */
  edition: number
  /** "OLYMPN Sport" */
  title: string
  /** URL segment under /collections. */
  slug: string
  /** ISO 8601 with an explicit offset, so the moment is the same in every time zone. */
  window: { startsAt: string; endsAt: string | null }
  match: {
    /** Exact Printful sync-product ids; they win over the name. Filled after "Add to store". */
    printfulSyncIds: string[]
    /** Case-insensitive name prefixes, e.g. "OLYMPN Sport ". */
    namePrefixes: string[]
  }
  hero: { image: string; alt: string; video?: string; poster?: string; lineup: string[] }
  intro: string
  waitlist: boolean
  /** Products are visible, but not buyable, before the release. */
  teaser: boolean
  /** Landing surface: cream (light) or navy (dark). */
  tone: 'light' | 'dark'
  /** Lowercase colour names in display order within a product family. */
  colourOrder: string[]
  /** "Model is 1,85 m and wears L" */
  modelNote?: string
}

export interface DropClockOptions {
  /** A valid SITE_PREVIEW_KEY cookie: an upcoming drop counts as live (QA only). */
  preview?: boolean
}

/**
 * The editions, oldest first. The OG range is not an edition: it left the
 * site with the v2 rebrand (spec section 5, Archive).
 */
export const DROPS: readonly Drop[] = [
  {
    id: 'olympian',
    edition: 1,
    title: 'Olympian',
    slug: 'olympian',
    window: { startsAt: '2026-06-19T19:00:00+02:00', endsAt: null },
    match: { printfulSyncIds: [], namePrefixes: ['Olympian '] },
    hero: {
      image: '/olympian/olympian-teal-model.jpg',
      alt: 'Model wearing the Olympian knitted tee in Ocean',
      video: '/olympian-trailer.mp4',
      poster: '/olympian/hero-poster.jpg',
      lineup: [
        '/olympian/olympian-teal-model.jpg',
        '/olympian/olympian-clay-model.jpg',
        '/olympian/olympian-wheat-model.jpg',
        '/olympian/olympian-rosa-model.jpg',
      ],
    },
    intro:
      'Ringer tees, knitted tees and backpacks in four colourways: Ocean, Coconut, Sand and Flamingo. Made to order.',
    waitlist: false,
    teaser: false,
    tone: 'light',
    colourOrder: ['ocean', 'coconut', 'sand', 'flamingo'],
  },
  {
    id: 'olympn-sport',
    edition: 2,
    title: 'OLYMPN Sport',
    slug: 'olympn-sport',
    window: { startsAt: '2026-11-01T12:00:00+01:00', endsAt: null },
    match: { printfulSyncIds: [], namePrefixes: ['OLYMPN Sport '] },
    hero: {
      image: '/brand/model-dune.webp',
      alt: 'Model wearing the OLYMPN Sport Relaxed Hoodie in Dune',
      video: '/brand/ad-dune.mp4',
      poster: '/brand/ad-dune-poster.jpg',
      lineup: [
        '/drops/olympn-sport/rose-red.webp',
        '/drops/olympn-sport/pistachio.webp',
        '/drops/olympn-sport/mocha.webp',
        '/drops/olympn-sport/obsidian-oversized.webp',
        '/drops/olympn-sport/dune.webp',
        '/drops/olympn-sport/olive.webp',
        '/drops/olympn-sport/obsidian-relaxed.webp',
        '/drops/olympn-sport/maritime.webp',
      ],
    },
    intro:
      'Oversized heavyweight and relaxed hoodies, eight pieces, finished with the OLYMPN SPORT gradient print. Made to order.',
    waitlist: true,
    teaser: true,
    tone: 'dark',
    colourOrder: ['rose red', 'pistachio', 'mocha', 'obsidian', 'dune', 'olive', 'maritime'],
  },
]

/**
 * The current time for pages. React's purity lint rule forbids Date.now() in
 * a component body; reading it through this helper keeps that rule happy and
 * gives tests one place to fake the clock.
 */
export function currentTimeMs(): number {
  return Date.now()
}

/** A live drop counts as "New in" for its first 30 days (tiles and the drop block). */
export const NEW_IN_MS = 30 * 24 * 60 * 60 * 1000

/** Same whitespace (also non-breaking), no leading space, lowercase. */
function comparable(value: string): string {
  return value.replace(/\s+/g, ' ').trimStart().toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getDropStatus(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): DropStatus {
  const endsAt = drop.window.endsAt === null ? null : Date.parse(drop.window.endsAt)
  if (endsAt !== null && now >= endsAt) return 'closed'
  if (now < Date.parse(drop.window.startsAt)) return opts.preview ? 'live' : 'upcoming'
  return 'live'
}

/**
 * The drop a product belongs to: an exact sync id first, then the name
 * prefix. Printful only; anything else (Printify, OG, unplanned products)
 * belongs to no drop and so never reaches the shop.
 */
export function matchDrop(
  p: Pick<NormalizedProduct, 'id' | 'provider' | 'name'>,
  drops: readonly Drop[] = DROPS
): Drop | null {
  if (p.provider !== 'printful') return null
  const byId = drops.find((d) => d.match.printfulSyncIds.includes(p.id))
  if (byId) return byId
  const name = comparable(p.name)
  return drops.find((d) => d.match.namePrefixes.some((prefix) => name.startsWith(comparable(prefix)))) ?? null
}

export function isPurchasable(drop: Drop | null, now: number = Date.now(), opts: DropClockOptions = {}): boolean {
  return drop !== null && getDropStatus(drop, now, opts) === 'live'
}

/** Products show in the shop when the drop is live, or upcoming with a teaser. */
export function isVisibleInShop(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): boolean {
  const status = getDropStatus(drop, now, opts)
  return status === 'live' || (status === 'upcoming' && drop.teaser)
}

/** Landing, archive and sitemap: every drop except an upcoming one without a teaser. */
export function isDropListed(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): boolean {
  return getDropStatus(drop, now, opts) !== 'upcoming' || drop.teaser
}

export function getDrop(id: string): Drop | null {
  return DROPS.find((d) => d.id === id) ?? null
}

export function getDropBySlug(slug: string): Drop | null {
  return DROPS.find((d) => d.slug === slug) ?? null
}

export function formatEdition(edition: number): string {
  return `Edition ${String(edition).padStart(2, '0')}`
}

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
})

const DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** "1 November 2026 at 12:00 CET": the static text next to every countdown. */
export function formatDropDate(iso: string): string {
  return DATE_TIME.format(new Date(iso))
}

/** "1 November 2026" */
export function formatDropDay(iso: string): string {
  return DAY.format(new Date(iso))
}

function colourIndex(drop: Drop, name: string): number {
  const n = comparable(name)
  return drop.colourOrder.findIndex((c) => new RegExp(`\\b${escapeRegExp(c)}\\b`).test(n))
}

/** Position in colourOrder; unknown colours sort after the known ones. */
export function colourRank(drop: Drop, name: string): number {
  const i = colourIndex(drop, name)
  return i === -1 ? drop.colourOrder.length : i
}

/** "Rose Red" from "OLYMPN Sport Oversized Hoodie Rose Red"; null when no known colour is in the name. */
export function colourLabel(drop: Drop, name: string): string | null {
  const i = colourIndex(drop, name)
  if (i === -1) return null
  return drop.colourOrder[i]
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** The name without its colour: colours of one product share a family. */
export function familyKey(drop: Drop, name: string): string {
  let n = comparable(name)
  for (const c of drop.colourOrder) {
    n = n.replace(new RegExp(`\\b${escapeRegExp(c)}\\b`, 'g'), ' ')
  }
  return n.replace(/\s+/g, ' ').trim()
}

/** What the UI needs about a drop, computed once on the server. */
export interface DropView {
  id: DropId
  edition: number
  editionLabel: string
  title: string
  slug: string
  href: string
  status: DropStatus
  startsAt: string
  startsAtLabel: string
  startsOnLabel: string
  endsAt: string | null
  intro: string
  tone: 'light' | 'dark'
  waitlist: boolean
  teaser: boolean
  hero: Drop['hero']
}

export function toDropView(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): DropView {
  return {
    id: drop.id,
    edition: drop.edition,
    editionLabel: formatEdition(drop.edition),
    title: drop.title,
    slug: drop.slug,
    href: `/collections/${drop.slug}`,
    status: getDropStatus(drop, now, opts),
    startsAt: drop.window.startsAt,
    startsAtLabel: formatDropDate(drop.window.startsAt),
    startsOnLabel: formatDropDay(drop.window.startsAt),
    endsAt: drop.window.endsAt,
    intro: drop.intro,
    tone: drop.tone,
    waitlist: drop.waitlist,
    teaser: drop.teaser,
    hero: drop.hero,
  }
}

export function listDropsNewestFirst(drops: readonly Drop[] = DROPS): Drop[] {
  return [...drops].sort((a, b) => b.edition - a.edition)
}

/** Home hero: the soonest upcoming listed drop, otherwise the newest live one. */
export function getNextDrop(
  now: number = Date.now(),
  opts: DropClockOptions = {},
  drops: readonly Drop[] = DROPS
): Drop | null {
  const listed = drops.filter((d) => isDropListed(d, now, opts))
  const upcoming = listed
    .filter((d) => getDropStatus(d, now, opts) === 'upcoming')
    .sort((a, b) => Date.parse(a.window.startsAt) - Date.parse(b.window.startsAt))
  if (upcoming.length > 0) return upcoming[0]
  return listDropsNewestFirst(listed.filter((d) => getDropStatus(d, now, opts) === 'live'))[0] ?? null
}
