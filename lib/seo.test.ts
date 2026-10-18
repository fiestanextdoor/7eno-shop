/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { getDrop, type Drop } from './drops'
import {
  BACKGROUND_COLOR, BRAND_KEYWORDS, SITE_DESCRIPTION, THEME_COLOR, collectionDescription, organizationJsonLd, webSiteJsonLd,
} from './seo'

describe('seo', () => {
  it('names the two editions and no longer OG', () => {
    expect(SITE_DESCRIPTION).toContain('Olympian and OLYMPN Sport')
    expect(SITE_DESCRIPTION).not.toMatch(/\bOG\b/)
    expect(BRAND_KEYWORDS).not.toContain('OG collection')
    expect(BRAND_KEYWORDS).toEqual(expect.arrayContaining(['Olympian collection', 'OLYMPN Sport']))
    expect(webSiteJsonLd().description).toBe(SITE_DESCRIPTION)
  })

  it('uses the official navy and cream', () => {
    expect(THEME_COLOR).toBe('#2D3A4F')
    expect(BACKGROUND_COLOR).toBe('#F7F1DA')
  })

  it('points the organisation logo at the square 7ENO tile', () => {
    const org = organizationJsonLd()
    expect(org.logo.url).toMatch(/\/brand\/instagram-logo-nieuw\.webp$/)
    expect(org.image).toBe(org.logo.url)
  })

  it('writes a description per collection', () => {
    const sport = getDrop('olympn-sport') as Drop
    const text = collectionDescription(sport)
    expect(text.startsWith('OLYMPN Sport (Edition 02) by 7ENO (Zeno): ')).toBe(true)
    expect(text).toContain(sport.intro)
    expect(text.endsWith('Free shipping over €75.')).toBe(true)
  })

  it('feeds the root layout from these constants', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8')
    expect(layout).toContain('themeColor: THEME_COLOR')
    expect(layout).not.toContain('const SITE_DESCRIPTION')
    expect(layout).not.toContain('OG and Olympian')
  })
})
