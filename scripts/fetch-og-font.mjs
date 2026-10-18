// Downloads the static Archivo instance the OG images use (wdth 125, wght 900,
// italic) as TTF, plus its licence. ImageResponse reads ttf, otf and woff, not
// woff2 (image-response.md:52); Google serves TTF to clients that do not
// announce woff2 support, which is why no browser user agent is sent.
// Run with `npm run brand:og-font`; the result is committed.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,125,900'
const LICENSE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt'
const OUT_DIR = path.join(process.cwd(), 'app/_fonts')
const OUT_FILE = path.join(OUT_DIR, 'Archivo-ExpandedBlackItalic.ttf')
const HEADERS = { 'User-Agent': 'fetch-og-font' }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res
}

const css = await (await get(CSS_URL)).text()
const match = /src:\s*url\((https:[^)]+\.ttf)\)/.exec(css)
if (!match) throw new Error('No TTF url in the Google Fonts response')

const bytes = Buffer.from(await (await get(match[1])).arrayBuffer())
if (bytes.readUInt32BE(0) !== 0x00010000) throw new Error('Downloaded file is not a TrueType font')

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, bytes)
await writeFile(path.join(OUT_DIR, 'OFL.txt'), await (await get(LICENSE_URL)).text())
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)} (${bytes.length} bytes) and OFL.txt`)
