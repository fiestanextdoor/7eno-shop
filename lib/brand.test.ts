/** @jest-environment node */
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import generated from './brand-assets.json'
import {
  APP_ICONS, BEELDMERK, BRAND_COLOURS, MODEL_DUNE, OLYMPN_BADGE, OLYMPN_SPORT_WORDMARK, SEVENO_TILE,
  SOMETHING_IS_COMING, SPORT_ADS, WORDMARK, heightAt, widthAt, type BrandImage,
} from './brand'

const file = (src: string) => path.join(process.cwd(), 'public', src)

async function rgba(src: string) {
  const { data, info } = await sharp(file(src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

const IMAGES: BrandImage[] = [
  WORDMARK.navy, WORDMARK.cream, BEELDMERK.navy, BEELDMERK.cream, ...APP_ICONS,
  OLYMPN_SPORT_WORDMARK, OLYMPN_BADGE, SOMETHING_IS_COMING, MODEL_DUNE, SEVENO_TILE,
]

describe('brand register', () => {
  it('uses the official palette', () => {
    expect(BRAND_COLOURS).toEqual({ navy: '#2D3A4F', cream: '#F7F1DA', periwinkle: '#7995C7', orange: '#FEAB27' })
  })

  it.each(IMAGES.map((image) => [image.src, image] as const))('%s exists at the size the code assumes', async (_src, image) => {
    const meta = await sharp(file(image.src)).metadata()
    expect([meta.width, meta.height]).toEqual([image.width, image.height])
  })

  it('lists every generated file', () => {
    for (const name of Object.keys(generated)) expect(existsSync(file(`/brand/${name}`))).toBe(true)
  })

  it('serves every file from public/brand, never from public/logos', () => {
    const paths = [...IMAGES.map((i) => i.src), ...SPORT_ADS.flatMap((ad) => [ad.src, ad.poster])]
    for (const src of paths) {
      expect(src.startsWith('/brand/')).toBe(true)
      expect(existsSync(file(src))).toBe(true)
    }
  })

  it.each(['navy', 'cream'] as const)('lifts the %s wordmark cleanly off its tile', async (tone) => {
    const { data } = await rgba(WORDMARK[tone].src)
    const pixels = data.length / 4
    let clear = 0
    let solid = 0
    let wrongColour = 0
    const target = tone === 'navy' ? [45, 58, 79] : [247, 241, 218]
    for (let o = 0; o < data.length; o += 4) {
      if (data[o + 3] === 0) clear += 1
      if (data[o + 3] === 255) {
        solid += 1
        if (data[o] !== target[0] || data[o + 1] !== target[1] || data[o + 2] !== target[2]) wrongColour += 1
      }
    }
    expect(clear / pixels).toBeGreaterThan(0.3)
    expect(solid / pixels).toBeGreaterThan(0.2)
    expect(wrongColour).toBe(0)
  })

  it('makes square app icons of exactly 192, 512 and 512 px, cream on navy', async () => {
    expect(APP_ICONS.map((i) => [i.width, i.height, i.purpose])).toEqual([
      [192, 192, 'any'], [512, 512, 'any'], [512, 512, 'maskable'],
    ])
    for (const icon of APP_ICONS) {
      const { data } = await rgba(icon.src)
      expect([...data.subarray(0, 4)]).toEqual([45, 58, 79, 255])
    }
  })

  it('keeps the maskable mark inside the safe zone', async () => {
    const icon = APP_ICONS[2]
    const { data, width } = await rgba(icon.src)
    const y = Math.round(icon.height / 2)
    for (const x of [Math.round(width * 0.12), Math.round(width * 0.88)]) {
      const o = (y * width + x) * 4
      expect([...data.subarray(o, o + 3)]).toEqual([45, 58, 79])
    }
  })

  it('draws nothing but navy outside the maskable safe circle (radius 40% of the side)', async () => {
    const { data, width, height } = await rgba(APP_ICONS[2].src)
    const radius = width * 0.4
    let outside = 0
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2) <= radius) continue
        const o = (y * width + x) * 4
        if (data[o] !== 45 || data[o + 1] !== 58 || data[o + 2] !== 79) outside += 1
      }
    }
    expect(outside).toBe(0)
  })

  it('ships the apple touch icon at 180 px', async () => {
    const meta = await sharp(path.join(process.cwd(), 'app/apple-icon.png')).metadata()
    expect([meta.width, meta.height]).toEqual([180, 180])
  })

  it.each(SPORT_ADS.map((ad) => [ad.src, ad] as const))('%s is a real video with a portrait poster', async (_src, ad) => {
    expect(statSync(file(ad.src)).size).toBeGreaterThan(100_000)
    const meta = await sharp(file(ad.poster)).metadata()
    expect([meta.width, meta.height]).toEqual([ad.width, ad.height])
  })

  it('serves the beeldmerk as app/favicon.ico with three PNG frames', async () => {
    const ico = readFileSync(path.join(process.cwd(), 'app/favicon.ico'))
    expect(ico.length).toBeLessThan(20_000)
    expect([...ico.subarray(0, 4)]).toEqual([0x00, 0x00, 0x01, 0x00])
    expect(ico.readUInt16LE(4)).toBe(3)
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
    const sides: number[] = []
    for (let i = 0; i < 3; i += 1) {
      const entry = 6 + i * 16
      const size = ico.readUInt32LE(entry + 8)
      const offset = ico.readUInt32LE(entry + 12)
      const payload = ico.subarray(offset, offset + size)
      expect([...payload.subarray(0, 8)]).toEqual(png)
      const meta = await sharp(payload).metadata()
      expect(meta.width).toBe(ico.readUInt8(entry))
      // RGBA, never a palette PNG: the Next.js ICO decoder rejects anything else.
      expect([meta.channels, meta.isPalette]).toEqual([4, false])
      sides.push(meta.width ?? 0)
    }
    expect(sides).toEqual([16, 32, 48])
  })

  it('scales by the natural ratio', () => {
    expect(heightAt({ src: '', width: 444, height: 342 }, 120)).toBe(92)
    expect(widthAt({ src: '', width: 444, height: 342 }, 32)).toBe(42)
  })
})
