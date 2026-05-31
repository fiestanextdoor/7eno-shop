import { NextRequest, NextResponse } from 'next/server'
import { getStores, isAutoConfirmEnabled } from '@/lib/printful'

// Always evaluate live; never cache a status response.
export const dynamic = 'force-dynamic'

function has(name: string): boolean {
  const v = process.env[name]
  return typeof v === 'string' && v.length > 0
}

/**
 * Gated diagnostics for the order pipeline. Returns only booleans / non-secret
 * identifiers (store names, webhook URLs), never any secret value. Hidden behind
 * HEALTHCHECK_SECRET: without a matching key the route 404s so it cannot be
 * discovered or scraped. Pass the secret via the `x-healthcheck-key` header
 * (preferred, stays out of access logs) or `?key=` for a quick browser check.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.HEALTHCHECK_SECRET
  const provided = req.headers.get('x-healthcheck-key') ?? req.nextUrl.searchParams.get('key')
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const env = {
    PRINTFUL_API_KEY: has('PRINTFUL_API_KEY'),
    STRIPE_SECRET_KEY: has('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: has('STRIPE_WEBHOOK_SECRET'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: has('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_SUPABASE_URL: has('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: has('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: has('SUPABASE_SERVICE_ROLE_KEY'),
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? null,
  }

  const autoConfirm = isAutoConfirmEnabled()

  // Live Printful check: confirms the API key actually works (not just present).
  let printful: { reachable: boolean; stores: number; storeNames: string[] }
  try {
    const stores = await getStores()
    printful = { reachable: stores.length > 0, stores: stores.length, storeNames: stores.map((s) => s.name) }
  } catch {
    printful = { reachable: false, stores: 0, storeNames: [] }
  }

  // Live Stripe check: is a webhook endpoint registered and enabled for this site?
  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')
  const expectedWebhook = `${base}/api/webhook`
  let stripeWebhook: {
    configured: boolean
    enabled: boolean
    expected: string
    found: Array<{ url: string; status: string }>
  } = { configured: false, enabled: false, expected: expectedWebhook, found: [] }
  try {
    const { stripe } = await import('@/lib/stripe')
    const list = await stripe.webhookEndpoints.list({ limit: 100 })
    const found = list.data.map((e) => ({ url: e.url, status: e.status }))
    const match = found.find((e) => e.url === expectedWebhook)
    stripeWebhook = {
      configured: Boolean(match),
      enabled: match?.status === 'enabled',
      expected: expectedWebhook,
      found,
    }
  } catch {
    // Stripe key missing/invalid, or API error — leave the defaults (not configured).
  }

  // The full automatic flow is "green" only when every link is wired up.
  const automaticFlowReady =
    env.PRINTFUL_API_KEY &&
    env.STRIPE_SECRET_KEY &&
    env.STRIPE_WEBHOOK_SECRET &&
    printful.reachable &&
    stripeWebhook.configured &&
    stripeWebhook.enabled

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    automaticFlowReady,
    autoConfirm,
    autoConfirmNote: autoConfirm
      ? 'ON: paid orders are auto-submitted to Printful production. Requires Printful billing (card/Wallet) to be set up, otherwise fulfillment fails.'
      : 'OFF: paid orders arrive as drafts in Printful; confirm them manually.',
    printful,
    stripeWebhook,
    env,
  })
}
