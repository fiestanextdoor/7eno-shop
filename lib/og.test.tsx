/** @jest-environment node */
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { OLYMPN_SPORT_WORDMARK, WORDMARK } from './brand'
import { OG_FONT_FILE, OgCard, loadOgFont, ogCardProps } from './og'

const PNG_SIGNATURE = '89504e470d0a1a0a'

function dataUriBytes(src: string): Buffer {
  expect(src.startsWith('data:image/png;base64,')).toBe(true)
  return Buffer.from(src.slice('data:image/png;base64,'.length), 'base64')
}

describe('OG font', () => {
  it('is a real TrueType file, not woff2 under a ttf name', () => {
    const bytes = readFileSync(path.join(process.cwd(), OG_FONT_FILE))
    expect(bytes.readUInt32BE(0)).toBe(0x00010000)
  })

  it('stays well under the ImageResponse budget of 500 KB together with the largest logo', () => {
    const font = statSync(path.join(process.cwd(), OG_FONT_FILE)).size
    const logo = statSync(path.join(process.cwd(), 'public', OLYMPN_SPORT_WORDMARK.src)).size
    expect(font + logo * 1.34).toBeLessThan(500_000)
  })

  it('loads as Archivo, weight 900, italic', async () => {
    const font = await loadOgFont()
    expect([font.name, font.weight, font.style]).toEqual(['Archivo', 900, 'italic'])
    expect(font.data.length).toBeGreaterThan(50_000)
  })

  it('ships the licence next to the font', () => {
    expect(readFileSync(path.join(process.cwd(), 'app/_fonts/OFL.txt'), 'utf8')).toContain('SIL Open Font License')
  })
})

describe('ogCardProps', () => {
  it('gives the site-wide card on cream with the navy wordmark', async () => {
    const props = await ogCardProps()
    expect([props.tone, props.title, props.label]).toEqual(['light', 'Olympian and OLYMPN Sport', 'Pronounced Zeno'])
    expect([props.logo.width, props.logo.height]).toEqual([WORDMARK.navy.width, WORDMARK.navy.height])
    expect(dataUriBytes(props.logo.src).subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE)
  })

  it('gives OLYMPN Sport a navy card with its orange wordmark', async () => {
    const props = await ogCardProps('olympn-sport')
    expect([props.tone, props.title, props.label]).toEqual(['dark', 'OLYMPN Sport', 'Edition 02'])
    expect([props.logo.width, props.logo.height]).toEqual([OLYMPN_SPORT_WORDMARK.width, OLYMPN_SPORT_WORDMARK.height])
  })

  it('gives Olympian a cream card', async () => {
    const props = await ogCardProps('olympian')
    expect([props.tone, props.title, props.label]).toEqual(['light', 'Olympian', 'Edition 01'])
  })

  it('falls back to the site-wide card for an unknown slug', async () => {
    expect((await ogCardProps('does-not-exist')).title).toBe('Olympian and OLYMPN Sport')
  })
})

describe('OgCard', () => {
  it('renders the title, label and tagline without long dashes', async () => {
    const html = renderToStaticMarkup(<OgCard {...await ogCardProps('olympn-sport')} />)
    expect(html).toContain('OLYMPN Sport')
    expect(html).toContain('Edition 02')
    expect(html).not.toMatch(/[\u2013\u2014]/)
  })
})
