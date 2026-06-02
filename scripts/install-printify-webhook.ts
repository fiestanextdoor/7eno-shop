/**
 * One-time installer: registers the Printify order webhook at our deployed URL.
 * Run once after deploy:
 *   npx tsx scripts/install-printify-webhook.ts https://www.7eno.shop
 * Requires PRINTIFY_API_KEY and PRINTIFY_SHOP_ID in the environment. Prints the
 * created webhook (including any returned secret) so it can be stored in
 * PRINTIFY_WEBHOOK_SECRET, and confirms the signature header name to wire into
 * app/api/printify-webhook/route.ts.
 */
const BASE = 'https://api.printify.com/v1'

async function main() {
  const baseUrl = process.argv[2]
  if (!baseUrl) throw new Error('Usage: install-printify-webhook.ts <base-url>')
  const key = process.env.PRINTIFY_API_KEY
  const shop = process.env.PRINTIFY_SHOP_ID
  if (!key || !shop) throw new Error('PRINTIFY_API_KEY and PRINTIFY_SHOP_ID must be set')

  const url = `${baseUrl.replace(/\/+$/, '')}/api/printify-webhook`
  const topics = [
    'order:created',
    'order:sent-to-production',
    'order:shipment:created',
    'order:shipment:delivered',
    'order:updated',
  ]

  for (const topic of topics) {
    const res = await fetch(`${BASE}/shops/${shop}/webhooks.json`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, url }),
    })
    const text = await res.text()
    console.log(`[${topic}] ${res.status}: ${text}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
