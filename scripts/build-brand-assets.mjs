// Builds the v2 brand files in public/brand (and app/apple-icon.png) from the
// sources in docs/brand (spec section 8). Deterministic: run it again after a
// source changes, with `npm run brand:assets`. PNG until Joep delivers the SVG
// exports; then the wordmark and mark files are replaced and this script goes.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { alphaBounds, brightestPixel, hexToRgb, knockout, recolour } from './lib/brand-pixels.mjs'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public/brand')
const NAVY_HEX = '#2D3A4F'
const TONES = { navy: hexToRgb(NAVY_HEX), cream: hexToRgb('#F7F1DA') }
const TILE = path.join(ROOT, 'docs/brand/olympn-marketing-3/instagram logo nieuw.png')
const MARK = path.join(ROOT, 'docs/brand/source/beeldmerk.png')

/** File name to pixel size, written to lib/brand-assets.json for lib/brand.ts. */
const sizes = {}

async function save(name, pipeline) {
  const info = await pipeline.png({ compressionLevel: 9 }).toFile(path.join(OUT, name))
  sizes[name] = { width: info.width, height: info.height }
}

/** The 7ENO wordmark, lifted off its periwinkle-on-navy tile. */
async function wordmarks() {
  const { data, info } = await sharp(TILE).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const tile = [data[0], data[1], data[2]]
  const logo = brightestPixel(data, info.channels)
  for (const [tone, rgb] of Object.entries(TONES)) {
    const rgba = knockout(data, info.channels, tile, logo, rgb)
    const box = alphaBounds(rgba, info.width, info.height)
    const raw = { raw: { width: info.width, height: info.height, channels: 4 } }
    await save(`7eno-wordmark-${tone}.png`, sharp(rgba, raw).extract(box))
  }
}

/** The 7 with the lightning bolt, black on transparent in the source. */
async function marks() {
  const { data, info } = await sharp(MARK).ensureAlpha().resize({ width: 512 }).raw().toBuffer({ resolveWithObject: true })
  for (const [tone, rgb] of Object.entries(TONES)) {
    const raw = { raw: { width: info.width, height: info.height, channels: 4 } }
    await save(`beeldmerk-${tone}.png`, sharp(recolour(data, rgb), raw))
  }
}

/** Cream mark centred on a navy square; `share` is the mark height over the side. */
async function icon(file, size, share) {
  const mark = await sharp(path.join(OUT, 'beeldmerk-cream.png'))
    .resize({ height: Math.round(size * share) })
    .png()
    .toBuffer()
  const info = await sharp({ create: { width: size, height: size, channels: 4, background: NAVY_HEX } })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(file)
  return { width: info.width, height: info.height }
}

await mkdir(OUT, { recursive: true })
await wordmarks()
await marks()
sizes['icon-192.png'] = await icon(path.join(OUT, 'icon-192.png'), 192, 0.62)
sizes['icon-512.png'] = await icon(path.join(OUT, 'icon-512.png'), 512, 0.62)
// Maskable icons are cropped to a circle of 80% of the side: keep the mark at half.
sizes['icon-maskable-512.png'] = await icon(path.join(OUT, 'icon-maskable-512.png'), 512, 0.5)
await icon(path.join(ROOT, 'app/apple-icon.png'), 180, 0.62)

const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(path.join(ROOT, 'lib/brand-assets.json'), `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`Wrote ${Object.keys(sorted).length} files to public/brand, app/apple-icon.png and lib/brand-assets.json`)
