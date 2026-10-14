// Downloads the eight OLYMPN Sport template mockups from Printful's CDN and
// stores them as webp (max 1600px on the long side) in
// public/drops/olympn-sport/. URLs: docs/drops/2026-10-13-printful-templates.json
// (result.items[].mockup_file_url). Run once: node scripts/download-drop-mockups.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OUT_DIR = path.join(process.cwd(), 'public', 'drops', 'olympn-sport')
const MAX_EDGE = 1600
// Printful's CDN answers plain clients too, but a browser User-Agent keeps the
// request identical to what the dashboard does.
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

const MOCKUPS = [
  { file: 'rose-red', title: 'OLYMPN Sport Oversized Hoodie Rose Red', url: 'https://files.cdn.printful.com/upload/product-templates/0c/0c2b7c72a128abef3a42bd7b51d996aa_l' },
  { file: 'pistachio', title: 'OLYMPN Sport Oversized Hoodie Pistachio', url: 'https://files.cdn.printful.com/upload/product-templates/9f/9fb814163c9fbbda66f81402db5e0c63_l' },
  { file: 'mocha', title: 'OLYMPN Sport Oversized Hoodie Mocha', url: 'https://files.cdn.printful.com/upload/product-templates/1e/1ef6f05b91ff3cfc0e5326d9eb3f8cc5_l' },
  { file: 'obsidian-oversized', title: 'OLYMPN Sport Oversized Hoodie Obsidian', url: 'https://files.cdn.printful.com/upload/product-templates/23/232da2cf521a59d70dcbcbab85266b5c_l' },
  { file: 'dune', title: 'OLYMPN Sport Relaxed Hoodie Dune', url: 'https://files.cdn.printful.com/upload/product-templates/9d/9dc0cb94e6759824537089df92cafb3d_l' },
  { file: 'olive', title: 'OLYMPN Sport Relaxed Hoodie Olive', url: 'https://files.cdn.printful.com/upload/product-templates/0d/0d84f8131c17f8c385276e5c9a441155_l' },
  { file: 'obsidian-relaxed', title: 'OLYMPN Sport Relaxed Hoodie Obsidian', url: 'https://files.cdn.printful.com/upload/product-templates/6a/6a8ef60d389751653484ee6496e28606_l' },
  { file: 'maritime', title: 'OLYMPN Sport Relaxed Hoodie Maritime', url: 'https://files.cdn.printful.com/upload/product-templates/f3/f31c78ec14b15d1cc8e6e5f02acfd9d0_l' },
]

async function download({ file, title, url }) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' } })
  if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`)
  const input = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer({ resolveWithObject: true })
  await writeFile(path.join(OUT_DIR, `${file}.webp`), data)
  console.log(`${file}.webp  ${info.width}x${info.height}  ${Math.round(data.length / 1024)} KB  (${title})`)
}

await mkdir(OUT_DIR, { recursive: true })
for (const mockup of MOCKUPS) {
  await download(mockup)
}
