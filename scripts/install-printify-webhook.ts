/**
 * One-time installer: registers the Printify order webhooks at our deployed URL,
 * signed with PRINTIFY_WEBHOOK_SECRET. Idempotent: it first deletes any existing
 * webhooks pointing at our endpoint, then recreates them with the secret, so
 * re-running never leaves duplicates.
 *
 * Run after deploy:
 *   npx tsx scripts/install-printify-webhook.ts https://www.7eno.shop
 *
 * Reads PRINTIFY_API_KEY, PRINTIFY_SHOP_ID and PRINTIFY_WEBHOOK_SECRET from the
 * environment, falling back to .env.local in the project root.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://api.printify.com/v1'

/** Load KEY=VALUE pairs from .env.local into process.env without overriding existing vars. */
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env) || process.env[key] === '') process.env[key] = value
    }
  } catch {
    // no .env.local — rely on real environment variables
  }
}

interface PrintifyWebhook {
  id: string
  topic: string
  url: string
}

async function main() {
  loadEnvLocal()
  const baseUrl = process.argv[2]
  if (!baseUrl) throw new Error('Usage: install-printify-webhook.ts <base-url>')
  const key = process.env.PRINTIFY_API_KEY
  const shop = process.env.PRINTIFY_SHOP_ID
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET
  if (!key || !shop) {
    throw new Error('PRINTIFY_API_KEY and PRINTIFY_SHOP_ID must be set (in .env.local or the environment)')
  }
  if (!secret) {
    throw new Error('PRINTIFY_WEBHOOK_SECRET must be set so webhooks are signed. Generate one and put it in .env.local first.')
  }

  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
  const url = `${baseUrl.replace(/\/+$/, '')}/api/printify-webhook`
  const topics = [
    'order:created',
    'order:sent-to-production',
    'order:shipment:created',
    'order:shipment:delivered',
    'order:updated',
  ]

  // 1) Delete any existing webhooks that point at our endpoint (avoids duplicates
  //    and removes the earlier secret-less ones).
  const listRes = await fetch(`${BASE}/shops/${shop}/webhooks.json`, { headers })
  if (!listRes.ok) throw new Error(`Could not list webhooks: ${listRes.status} ${await listRes.text()}`)
  const existing: PrintifyWebhook[] = await listRes.json()
  for (const wh of existing) {
    if (wh.url === url) {
      const del = await fetch(`${BASE}/shops/${shop}/webhooks/${wh.id}.json`, { method: 'DELETE', headers })
      console.log(`[delete ${wh.topic} ${wh.id}] ${del.status}`)
    }
  }

  // 2) Recreate each topic with the signing secret.
  for (const topic of topics) {
    const res = await fetch(`${BASE}/shops/${shop}/webhooks.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ topic, url, secret }),
    })
    const text = await res.text()
    console.log(`[create ${topic}] ${res.status}: ${text}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
