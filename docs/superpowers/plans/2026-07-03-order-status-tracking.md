# Order status & tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De klant ziet in zijn account de live fulfillment-status + tracking (Printful-pariteit) en krijgt een verzend-mail met track&trace-link.

**Architecture:** Een Printful-webhook (spiegelbeeld van de bestaande Printify-webhook) werkt de `fulfillments` jsonb-array van de order bij met status + tracking. De account-UI leest die array via een gedeelde status-helper. Bij de transitie naar "shipped" gaat er een Resend-mail uit.

**Tech Stack:** Next.js 16 (App Router, route handlers), Supabase (jsonb + RLS), Resend, Jest + @swc/jest, TypeScript.

## Global Constraints

- Taal UI/mail: Engels (bestaande UI is Engels). Code-comments mogen NL/EN.
- Geen em-dashes in gegenereerde content/copy.
- Bedragen in minor units (cents), `total_amount` is integer.
- Webhook mag een betaalde order nooit laten falen: e-mail/DB-fouten worden gelogd, niet gethrowd.
- Printful tekent payloads niet met HMAC: beveiliging via geheim token in de URL.
- Tests colocated als `*.test.ts` naast de bron.

---

### Task 1: Datamodel + order-aanmaak

**Files:**
- Modify: `lib/supabase/types.ts` (Order Row/Insert, nieuw `Fulfillment` type)
- Create: `supabase/migrations/2026-07-03-orders-customer-email.sql`
- Modify: `lib/printful.ts:325-348` (createOrder: `externalId` param + `external_id` in body)
- Modify: `app/api/webhook/route.ts` (caller: session.id doorgeven + `customer_email` in upsert)

**Interfaces:**
- Produces: `Fulfillment { provider, order_id, status, tracking_number?, tracking_url?, carrier?, shipped_at? }`; `createOrder(recipient, items, externalId, shippingMethodId?)`.

- [ ] **Step 1:** Migratie schrijven:
```sql
-- Klant-e-mail op de order, nodig voor de verzend-mail (ook voor gast-orders
-- zonder auth.users-account). Nullable: bestaande rijen hebben geen adres.
alter table public.orders
  add column if not exists customer_email text;
```
- [ ] **Step 2:** In `lib/supabase/types.ts`: `customer_email: string | null` + `fulfillments: Json` toevoegen aan orders Row; `customer_email?`, `fulfillments?` aan Insert. Exporteer:
```ts
export interface Fulfillment {
  provider: string
  order_id: string
  status: string
  tracking_number?: string | null
  tracking_url?: string | null
  carrier?: string | null
  shipped_at?: string | null
}
```
- [ ] **Step 3:** `lib/printful.ts createOrder`: signature `(recipient, items, externalId: string, shippingMethodId?)`; body krijgt `external_id: externalId`.
- [ ] **Step 4:** `app/api/webhook/route.ts`: aanroep `createPrintfulOrder(printfulRecipient, pfItems, session.id, shipMethod)`; upsert krijgt `customer_email: customer.email ?? null`.
- [ ] **Step 5:** Build check: `npx tsc --noEmit` → geen errors.
- [ ] **Step 6:** Commit `feat: order customer_email + printful external_id + fulfillment type`.

---

### Task 2: Gedeelde order-status helper

**Files:**
- Create: `lib/order-status.ts`
- Test: `lib/order-status.test.ts`

**Interfaces:**
- Produces: `statusMeta(status): { label, tone, step }` (tone: 'default'|'green'|'red'|'amber'; step: 0..3); `deriveOrderStatus(fulfillments: Fulfillment[], fallback: string): { label, tone, step }`; `STEP_LABELS: string[]`.

- [ ] **Step 1: Failing test** (`lib/order-status.test.ts`):
```ts
import { statusMeta, deriveOrderStatus } from './order-status'

test('shipped is green, step 2', () => {
  expect(statusMeta('shipped')).toEqual({ label: 'Shipped', tone: 'green', step: 2 })
})
test('derive picks least-advanced fulfillment', () => {
  const r = deriveOrderStatus(
    [{ provider: 'printful', order_id: '1', status: 'shipped' },
     { provider: 'printify', order_id: '2', status: 'in_production' }], 'processing')
  expect(r.label).toBe('In production')
})
test('any failed → needs attention (red)', () => {
  expect(deriveOrderStatus([{ provider: 'printful', order_id: '1', status: 'failed' }], 'processing').tone).toBe('red')
})
test('empty fulfillments falls back to top-level status', () => {
  expect(deriveOrderStatus([], 'processing').label).toBe('Processing')
})
```
- [ ] **Step 2:** Run `npx jest order-status` → FAIL.
- [ ] **Step 3:** Implement `lib/order-status.ts`:
```ts
import type { Fulfillment } from './supabase/types'

type Tone = 'default' | 'green' | 'red' | 'amber'
interface Meta { label: string; tone: Tone; step: number }

// step: 0 ordered, 1 in production, 2 shipped, 3 delivered
const META: Record<string, Meta> = {
  processing:         { label: 'Processing',        tone: 'default', step: 0 },
  pending:            { label: 'Processing',        tone: 'default', step: 0 },
  on_hold:            { label: 'On hold',           tone: 'amber',   step: 0 },
  in_production:      { label: 'In production',     tone: 'default', step: 1 },
  partially_shipped:  { label: 'Partially shipped', tone: 'default', step: 2 },
  shipped:            { label: 'Shipped',           tone: 'green',   step: 2 },
  fulfilled:          { label: 'Shipped',           tone: 'green',   step: 2 },
  completed:          { label: 'Completed',         tone: 'green',   step: 3 },
  delivered:          { label: 'Delivered',         tone: 'green',   step: 3 },
  cancelled:          { label: 'Cancelled',         tone: 'red',     step: 0 },
  failed:             { label: 'Needs attention',   tone: 'red',     step: 0 },
  fulfillment_failed: { label: 'Needs attention',   tone: 'red',     step: 0 },
}

export const STEP_LABELS = ['Ordered', 'In production', 'Shipped', 'Delivered']

export function statusMeta(status: string): Meta {
  return META[status] ?? { label: status, tone: 'default', step: 0 }
}

const RANK: Record<string, number> = {
  failed: -2, fulfillment_failed: -2, cancelled: -1,
  pending: 0, processing: 0, on_hold: 1, in_production: 2,
  partially_shipped: 3, shipped: 4, fulfilled: 4, completed: 5, delivered: 5,
}

export function deriveOrderStatus(fulfillments: Fulfillment[], fallback: string): Meta {
  if (!fulfillments.length) return statusMeta(fallback)
  if (fulfillments.some((f) => RANK[f.status] === -2) || fallback === 'fulfillment_failed') {
    return statusMeta('failed')
  }
  const active = fulfillments.filter((f) => f.status !== 'cancelled')
  if (!active.length) return statusMeta('cancelled')
  const least = active.reduce((a, b) => ((RANK[a.status] ?? 0) <= (RANK[b.status] ?? 0) ? a : b))
  return statusMeta(least.status)
}
```
- [ ] **Step 4:** Run `npx jest order-status` → PASS.
- [ ] **Step 5:** Commit `feat: shared order-status helper`.

---

### Task 3: Printful webhook-logica

**Files:**
- Create: `lib/printful-webhook.ts`
- Test: `lib/printful-webhook.test.ts`

**Interfaces:**
- Produces: `verifyPrintfulToken(token, secret): boolean`; `mapPrintfulStatus(type, orderStatus?): string`; `extractShipment(data): { carrier, tracking_number, tracking_url, shipped_at } | null`.

- [ ] **Step 1: Failing test:**
```ts
import { verifyPrintfulToken, mapPrintfulStatus, extractShipment } from './printful-webhook'

test('token: empty secret accepts', () => expect(verifyPrintfulToken('x', '')).toBe(true))
test('token: match', () => expect(verifyPrintfulToken('s3cret', 's3cret')).toBe(true))
test('token: mismatch', () => expect(verifyPrintfulToken('nope', 's3cret')).toBe(false))
test('token: missing when secret set', () => expect(verifyPrintfulToken(null, 's3cret')).toBe(false))

test('package_shipped → shipped', () => expect(mapPrintfulStatus('package_shipped')).toBe('shipped'))
test('order_updated inprocess → in_production', () => expect(mapPrintfulStatus('order_updated', 'inprocess')).toBe('in_production'))
test('order_updated fulfilled → shipped', () => expect(mapPrintfulStatus('order_updated', 'fulfilled')).toBe('shipped'))
test('order_canceled → cancelled', () => expect(mapPrintfulStatus('order_canceled')).toBe('cancelled'))
test('order_failed → failed', () => expect(mapPrintfulStatus('order_failed')).toBe('failed'))

test('extractShipment reads tracking', () => {
  const s = extractShipment({ shipment: { carrier: 'USPS', tracking_number: '9400', tracking_url: 'http://t/9400' } })
  expect(s).toMatchObject({ carrier: 'USPS', tracking_number: '9400', tracking_url: 'http://t/9400' })
})
test('extractShipment null without shipment', () => expect(extractShipment({})).toBeNull())
```
- [ ] **Step 2:** Run `npx jest printful-webhook` → FAIL.
- [ ] **Step 3:** Implement `lib/printful-webhook.ts`:
```ts
import crypto from 'crypto'

/** Printful signeert de payload niet; we verifiëren een geheim token uit de
 *  webhook-URL. Lege secret = degraded accept (zoals de Printify-handler). */
export function verifyPrintfulToken(token: string | null, secret: string): boolean {
  if (!secret) return true
  if (!token) return false
  const a = Buffer.from(token)
  const b = Buffer.from(secret)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Map een Printful-webhook (type + order.status) op onze fulfillment-status. */
export function mapPrintfulStatus(type: string, orderStatus?: string): string {
  if (type === 'package_shipped') return 'shipped'
  if (type === 'order_canceled') return 'cancelled'
  if (type === 'order_failed') return 'failed'
  switch (orderStatus) {
    case 'draft':
    case 'pending':   return 'pending'
    case 'onhold':    return 'on_hold'
    case 'inprocess': return 'in_production'
    case 'partial':   return 'partially_shipped'
    case 'fulfilled': return 'shipped'
    case 'canceled':  return 'cancelled'
    case 'failed':    return 'failed'
    default:          return 'in_production'
  }
}

interface ShipmentOut { carrier: string; tracking_number: string; tracking_url: string; shipped_at: string | null }
export function extractShipment(data: {
  shipment?: { carrier?: string; tracking_number?: string; tracking_url?: string; ship_date?: string; shipped_at?: number }
}): ShipmentOut | null {
  const s = data?.shipment
  if (!s || !s.tracking_number) return null
  return {
    carrier: s.carrier ?? '',
    tracking_number: s.tracking_number,
    tracking_url: s.tracking_url ?? '',
    shipped_at: s.ship_date ?? (s.shipped_at ? new Date(s.shipped_at * 1000).toISOString() : null),
  }
}
```
- [ ] **Step 4:** Run `npx jest printful-webhook` → PASS.
- [ ] **Step 5:** Commit `feat: printful webhook logic`.

---

### Task 4: Verzend-mail

**Files:**
- Create: `lib/email/order-shipped.ts`
- Test: `lib/email/order-shipped.test.ts`

**Interfaces:**
- Consumes: `sendEmail` uit `./send`.
- Produces: `renderOrderShipped(data): { subject, html, text }`; `sendOrderShippedEmail(to, data)`; type `ShippedEmailData { orderRef, customerName, carrier, trackingNumber, trackingUrl, shippingAddress }`.

- [ ] **Step 1: Failing test** (`lib/email/order-shipped.test.ts`):
```ts
import { renderOrderShipped } from './order-shipped'

const data = {
  orderRef: 'PF123', customerName: 'Joep Arend', carrier: 'PostNL',
  trackingNumber: '3STOTAL', trackingUrl: 'https://postnl.nl/track/3STOTAL',
  shippingAddress: { name: 'Joep Arend', line1: 'Straat 1', city: 'Utrecht', postalCode: '3500 AA', country: 'NL' },
}
test('subject mentions on its way', () => {
  expect(renderOrderShipped(data).subject.toLowerCase()).toContain('on its way')
})
test('html has tracking url + number', () => {
  const { html } = renderOrderShipped(data)
  expect(html).toContain('https://postnl.nl/track/3STOTAL')
  expect(html).toContain('3STOTAL')
})
test('text has tracking url', () => {
  expect(renderOrderShipped(data).text).toContain('https://postnl.nl/track/3STOTAL')
})
```
- [ ] **Step 2:** Run `npx jest order-shipped` → FAIL.
- [ ] **Step 3:** Implement `lib/email/order-shipped.ts` — spiegel `order-confirmation.ts` (zelfde brand-palette, `escapeHtml`, `firstName`, absolute `baseUrl`), header "Shipped", een "Track your package"-button (`background:${INK};color:${BONE}`) naar `trackingUrl`, carrier + `trackingNumber` in mono, shipping address, footer. `sendOrderShippedEmail` gebruikt `sendEmail({ to, subject, html, text, bcc: process.env.ORDER_EMAIL_BCC })` en returned het resultaat (nooit throwen).
- [ ] **Step 4:** Run `npx jest order-shipped` → PASS.
- [ ] **Step 5:** Commit `feat: order-shipped email`.

---

### Task 5: Printful webhook-route

**Files:**
- Create: `app/api/printful-webhook/route.ts`

**Interfaces:**
- Consumes: `verifyPrintfulToken`, `mapPrintfulStatus`, `extractShipment`, `createServiceClient`, `sendOrderShippedEmail`, `Fulfillment`.

- [ ] **Step 1:** Implement route (mirror `app/api/printify-webhook/route.ts`):
  - `token = new URL(req.url).searchParams.get('token')`; `secret = process.env.PRINTFUL_WEBHOOK_SECRET ?? ''`; ongeldig → 400.
  - Parse body `{ type, data: { order?: { id, external_id, status }, shipment? } }`. Type niet in de bekende set → `200 { ignored: true }`.
  - Match order: `external_id` → `stripe_session_id`, fallback `printful_order_id = String(order.id)`. Geen match → `200 { unmatched: true }`.
  - Bepaal `wasShipped` (huidige printful-entry al 'shipped'/'delivered'). Update de printful-entry: `status = mapPrintfulStatus(...)`; bij `extractShipment` → tracking-velden + `shipped_at`.
  - Schrijf `fulfillments` terug (service client).
  - Als `status === 'shipped' && !wasShipped && row.customer_email` → `sendOrderShippedEmail(...)` in try/catch (gelogd, nooit gethrowd), met `orderRef = printful_order_id ?? session.slice(-12)`, `customerName`/`shippingAddress` uit `shipping_address`.
  - Return `200 { received: true }`.
- [ ] **Step 2:** Build check `npx tsc --noEmit` → geen errors.
- [ ] **Step 3:** Commit `feat: printful webhook route`.

---

### Task 6: Orders-pagina UI

**Files:**
- Modify: `app/account/(protected)/orders/page.tsx`
- Modify: `app/account/(protected)/orders/orders.module.css`

- [ ] **Step 1:** `page.tsx`: importeer `deriveOrderStatus, statusMeta, STEP_LABELS` en `Fulfillment`. Per order: `const fulfillments = (Array.isArray(order.fulfillments) ? order.fulfillments : []) as Fulfillment[]`. Vervang de lokale `statusLabel`/`statusClass` door `deriveOrderStatus(fulfillments, order.status)`. Toon badge met tone-class. Render een 4-staps stepper (`STEP_LABELS`, actieve stap = `meta.step`). Onder de items: per verzonden fulfillment een tracking-rij: `{carrier} · {tracking_number}` + link "Track your package →" (`href={f.tracking_url}` target=_blank rel=noopener) als `f.tracking_url`.
- [ ] **Step 2:** `orders.module.css`: `.statusAmber` (amber tint), `.stepper` (flex, mono uppercase micro-labels), `.step`/`.stepActive`/`.stepDone`, `.trackRow` (mono, border-top zoals `.shippingLine`), `.trackLink` (bone, underline).
- [ ] **Step 3:** Verify via preview (server + snapshot). Commit `feat: orders page shows fulfillment status + tracking`.

---

### Task 7: Dashboard-status

**Files:**
- Modify: `app/account/(protected)/dashboard/page.tsx`

- [ ] **Step 1:** Vervang de lokale `statusLabel` door `deriveOrderStatus(fulfillments, order.status).label`, met `fulfillments` net als in Task 6.
- [ ] **Step 2:** Commit `feat: dashboard recent-order status from fulfillments`.

---

### Task 8: Env + registratiescript + docs

**Files:**
- Modify: `.env.example`
- Create: `scripts/register-printful-webhook.mjs`

- [ ] **Step 1:** `.env.example`: `PRINTFUL_WEBHOOK_SECRET=` toevoegen bij de Printful-blok, met comment dat het in de webhook-URL komt (`?token=`).
- [ ] **Step 2:** `scripts/register-printful-webhook.mjs`: node-script dat `POST https://api.printful.com/webhooks` doet met `{ url: "${BASE}/api/printful-webhook?token=${SECRET}", types: ["package_shipped","order_updated","order_canceled","order_failed"] }`, headers `Authorization: Bearer ${PRINTFUL_API_KEY}` + `X-PF-Store-Id`. Logt de response. Documenteer bovenaan hoe te draaien.
- [ ] **Step 3:** Commit `chore: printful webhook env + registration script`.

---

### Task 9: Volledige verificatie

- [ ] **Step 1:** `npx jest` → alles groen.
- [ ] **Step 2:** `npx next lint` → geen nieuwe errors.
- [ ] **Step 3:** `npx tsc --noEmit` → geen errors.
- [ ] **Step 4:** Preview: dev server + orders-pagina snapshot/screenshot (met een order die tracking heeft, indien mogelijk via seed/mock).
- [ ] **Step 5:** Code-review via jkc-code-reviewer agent; HIGH/CRITICAL fixen.
