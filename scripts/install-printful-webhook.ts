/**
 * One-time installer: registers the Printful status webhook at our deployed URL.
 * Printful uses a single webhook config (one URL + a list of event types), so
 * POSTing replaces any previous config — re-running is idempotent by nature.
 *
 * Printful does not sign webhook payloads, so the shared secret goes in the URL
 * as `?token=…`; the route (app/api/printful-webhook) verifies it.
 *
 * Run after deploy:
 *   npx tsx scripts/install-printful-webhook.ts https://www.7eno.shop
 *
 * Reads PRINTFUL_API_KEY, PRINTFUL_STORE_ID (optional) and
 * PRINTFUL_WEBHOOK_SECRET from the environment, falling back to .env.local.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://api.printful.com'

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

async function main() {
  loadEnvLocal()
  const baseUrl = process.argv[2]
  if (!baseUrl) throw new Error('Usage: install-printful-webhook.ts <base-url>')
  const key = process.env.PRINTFUL_API_KEY
  const storeId = process.env.PRINTFUL_STORE_ID
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET
  if (!key) {
    throw new Error('PRINTFUL_API_KEY must be set (in .env.local or the environment)')
  }
  if (!secret) {
    throw new Error('PRINTFUL_WEBHOOK_SECRET must be set so the endpoint is protected. Generate one and put it in .env.local first.')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
  if (storeId) headers['X-PF-Store-Id'] = storeId

  const url = `${baseUrl.replace(/\/+$/, '')}/api/printful-webhook?token=${encodeURIComponent(secret)}`
  const types = ['package_shipped', 'order_updated', 'order_canceled', 'order_failed']

  const res = await fetch(`${BASE}/webhooks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, types }),
  })
  const text = await res.text()
  console.log(`[create webhook] ${res.status}: ${text}`)
  if (!res.ok) process.exit(1)

  // Read back the config so you can confirm the URL + types stuck.
  const check = await fetch(`${BASE}/webhooks`, { headers })
  console.log(`[verify] ${check.status}: ${await check.text()}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
