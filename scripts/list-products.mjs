// Temporary read-only helper: lists all live products (provider, id, name, slug)
// so bundle productIds can be filled into lib/bundles.ts. Safe to delete after.
import { readFileSync } from 'node:fs'

// Minimal .env.local parser (KEY=VALUE, ignores comments/quotes).
function loadEnv() {
  const text = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[t.slice(0, i).trim()] = v
  }
  return env
}

function productSlug(name) {
  return name
    .toLowerCase()
    .replace(/^7eno\s+/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const env = loadEnv()

async function listPrintful() {
  const key = env.PRINTFUL_API_KEY
  if (!key) return []
  const headers = { Authorization: `Bearer ${key}` }
  if (env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = env.PRINTFUL_STORE_ID
  const out = []
  let offset = 0
  for (;;) {
    const res = await fetch(`https://api.printful.com/store/products?limit=100&offset=${offset}`, { headers })
    if (!res.ok) { console.error('Printful error', res.status, await res.text()); break }
    const json = await res.json()
    const items = json.result ?? []
    for (const p of items) out.push({ provider: 'printful', id: String(p.id), name: p.name })
    const total = json.paging?.total ?? items.length
    offset += items.length
    if (items.length === 0 || offset >= total) break
  }
  return out
}

async function listPrintify() {
  const key = env.PRINTIFY_API_KEY
  const shop = env.PRINTIFY_SHOP_ID
  if (!key || !shop) return []
  const headers = { Authorization: `Bearer ${key}` }
  const out = []
  let page = 1
  for (;;) {
    const res = await fetch(`https://api.printify.com/v1/shops/${shop}/products.json?page=${page}&limit=50`, { headers })
    if (!res.ok) { console.error('Printify error', res.status, await res.text()); break }
    const json = await res.json()
    const items = json.data ?? []
    for (const p of items) out.push({ provider: 'printify', id: String(p.id), name: p.title })
    if (items.length === 0 || !json.next_page_url) break
    page += 1
  }
  return out
}

const all = [...(await listPrintful()), ...(await listPrintify())]
console.log(`\nFound ${all.length} products:\n`)
for (const p of all) {
  console.log(`${p.provider.padEnd(9)} ${p.id.padEnd(12)} ${productSlug(p.name).padEnd(28)} ${p.name}`)
}
