# Combi-deals (product bundles) — Design

**Date:** 2026-06-07
**Status:** Approved approach, pending spec review
**Project:** 7eno-shop (Next.js 16 / React 19 / Supabase / Stripe / Zustand)

## 1. Goal

Let customers buy a curated set of products at a lower price than buying the
items separately. Each set is hand-picked by 7ENO. The customer still chooses
size/colour per item. The discount is a fixed amount off the summed item prices
(e.g. "sum of the two items minus €7,05").

## 2. Non-goals (v1)

- Flexible "pick any N from a category" deals. Only fixed curated sets.
- A database/admin UI for managing deals. Deals live in a code config file.
- "Remove whole set" action in the cart. Removing a single set item just makes
  the set incomplete and the discount is silently dropped server-side.
- Multiple discount models. Only "fixed amount off the sum" in v1. The data
  model leaves room for other models later but they are not built.

## 3. Key constraint (why the discount is server-side)

`app/api/checkout/route.ts` never trusts client prices: it re-resolves every
variant price from Printful/Printify and rebuilds the Stripe line items from
that authoritative data. Therefore a bundle discount **cannot** be a lower
client price. It must be re-derived and applied server-side.

We keep each set item as a normal, full-price Stripe line item (so POD
fulfillment via the webhook is unchanged — it still has real variants), and
apply the bundle discount as a **one-off Stripe coupon** (`amount_off`) on the
Checkout Session. The discount is then transparent on the Stripe page and the
recorded order total (`amount_total`) already reflects it.

**Margin note (business, not code):** Printful/Printify still charge 7ENO the
full per-item cost. The discount eats into margin. The set price is a deliberate
margin decision by 7ENO.

## 4. Data model

### 4.1 Bundle config — `lib/bundles.ts`

```ts
import type { Provider } from '@/types/catalog'

/** One product slot in a set. The customer chooses the variant (size/colour). */
export interface BundleProductRef {
  provider: Provider
  productId: string   // live Printful/Printify product id — REQUIRED, real id
  slug: string        // product slug, for catalog lookup + linking
}

export interface Bundle {
  id: string                  // stable key, e.g. 'beach-set'
  title: string               // e.g. 'Beach Set'
  description?: string
  products: BundleProductRef[] // 2+ products that make up the set
  discountCents: number        // fixed amount off the summed item prices (e.g. 705)
  image?: string               // optional hero image (/public path or remote)
}

export function getBundle(id: string): Bundle | null
export function getBundleBySlug(slug: string): Bundle | null   // slug = bundle id
export function getBundles(): Bundle[]
```

The first real bundle's `productId`s must be supplied by 7ENO (they are live ids,
not derivable from code). The committed config ships with one clearly-marked
EXAMPLE bundle that must be replaced before launch.

### 4.2 Cart item — `types/cart.ts`

Add two optional fields:

```ts
export interface CartItem {
  // ...existing fields...
  bundleId?: string      // set this item belongs to (undefined = standalone)
  bundleTitle?: string   // display label for the cart grouping
}
```

### 4.3 Cart key — `lib/cart-key.ts`

Include `bundleId` so a set item never merges with the same variant bought
standalone (different price context):

```ts
export function cartItemKey(provider: Provider, variantId: string, bundleId?: string): string
// `${provider}:${variantId}` when standalone; `${provider}:${variantId}#${bundleId}` in a set.
```

All call sites (`store/cart.ts`, `components/CartDrawer`, `app/checkout/page.tsx`)
pass `item.bundleId` through.

## 5. Pages

### 5.1 `/deals` — overview (server component)

- Mirrors the `/shop` aesthetic (Nav already global, dark/bone theme, CSS module).
- For each bundle: resolve its products via `getCatalogProduct`, compute the
  summed price using the **lowest variant price per product** (apparel variants
  of one product share a price, so this is stable), show the set price
  (`sum − discountCents`) and "You save €X".
- Each card links to `/deals/[slug]`.
- Linked from the Footer bottom bar (next to Shop/Returns) and optionally Nav.

### 5.2 `/deals/[slug]` — configure & add set

- Server component loads the bundle + each product's variants (reusing
  `getCatalogProduct` and the same colour/size resolution helpers used by
  `ProductDetail`).
- Client component renders one variant picker (colour + size) per product in the
  set, reusing existing swatch/size UI patterns.
- Live pricing panel: summed item prices, the discount, the final set price.
- "Add set to cart" is disabled until every product has a selected variant.
- On add: push one `CartItem` per product, each carrying the same `bundleId`
  and `bundleTitle`, then open the CartDrawer.

### 5.3 `generateStaticParams`

`/deals/[slug]` pre-renders params from `getBundles()` (ids = slugs), mirroring
the `/shop/[slug]` pattern.

## 6. Cart UI — `components/CartDrawer`

- Group items by `bundleId`. Standalone items render as today.
- A set renders its member items under a small set header (`bundleTitle`) with
  the bundle discount shown as a negative line beneath the group.
- The drawer total reflects the discount (client-side display only; the server
  re-validates at checkout — the displayed total is informational).
- No "remove set" control in v1 (removing a member item is allowed and may
  break the set).

## 7. Checkout server logic — `app/api/checkout/route.ts`

After the existing per-item validation and `variantLookup` resolution, before
creating the session:

1. Group incoming items by `bundleId` (ignore items without one).
2. For each group, look up the `Bundle` by id. The group is a **valid, complete
   set** iff:
   - the bundle exists, and
   - for every `BundleProductRef` in the bundle there is exactly one cart item
     whose `productId` matches and whose variant resolved in `variantLookup`,
     and
   - the group contains no extra products beyond the bundle definition.
3. `bundleDiscountCents = Σ discountCents` over valid groups, clamped so the
   discount can never exceed `subtotalCents` (guard against config error).
4. If `bundleDiscountCents > 0`, create a one-off coupon
   (`stripe.coupons.create({ amount_off, currency, duration: 'once', name })`)
   and pass `discounts: [{ coupon: coupon.id }]` on the session.
5. Invalid/incomplete groups simply get no discount (items already added as
   full-price line items). Bundle membership is also written into the compact
   `cart` metadata (new key `b` = bundleId) for traceability; the 500-char limit
   still applies and the existing guard stays.

Line items, shipping, and the rest of the flow are unchanged.

## 8. Fulfillment / webhook

Unchanged. The webhook reads real variants from `cart` metadata and forwards
them to Printful/Printify at full quantity. The order total recorded from the
Stripe session's `amount_total` already includes the bundle discount.

## 9. Edge cases

- **Incomplete set in cart:** no discount applied (full price). Acceptable v1.
- **Same variant standalone + in a set:** kept separate via the bundle-aware
  cart key; only the set instance counts toward the bundle.
- **Config discount ≥ subtotal:** clamped to subtotal (never negative charge).
- **Product in a bundle goes out of stock / is removed from POD:** variant fails
  to resolve → the set is incomplete → no discount, and the missing item already
  triggers the existing "no longer available" error. Good enough for v1.
- **Quantity > 1 of a set item:** v1 treats one valid item per product as
  satisfying the set once; extra quantity is charged at full price with no extra
  discount. Documented limitation.

## 10. Testing

Follow the existing `lib/`/`store/` Jest convention (pure logic only; pages are
not unit-tested in this repo):

- `lib/bundles.test.ts` — config lookups, `getBundleBySlug`.
- A pricing helper `computeBundlePricing(bundle, variants)` extracted into
  `lib/bundles.ts` (sum, discount, clamped set price) with unit tests.
- A checkout-grouping helper `resolveBundleDiscounts(items, variantLookup, getBundle)`
  extracted as a pure function (testable without Stripe) and unit-tested for:
  complete set, incomplete set, extra product, discount-exceeds-subtotal clamp.
- Cart-key test extended for the `bundleId` variant.

## 11. Files

**New**
- `lib/bundles.ts` (+ `lib/bundles.test.ts`)
- `app/deals/page.tsx` (+ `deals.module.css`)
- `app/deals/[slug]/page.tsx`, `app/deals/[slug]/BundleConfigurator.tsx` (+ css)

**Changed**
- `types/cart.ts` — `bundleId`, `bundleTitle`
- `lib/cart-key.ts` (+ test) — bundle-aware key
- `store/cart.ts` — pass `bundleId` through `keyOf`
- `components/CartDrawer/*` — group sets, show discount line
- `app/checkout/page.tsx` — pass `bundleId` to the cart key; show discount
- `app/api/checkout/route.ts` — `resolveBundleDiscounts` + Stripe coupon
- `components/Footer/Footer.tsx` — "Deals" link

## 12. Required input from 7ENO before launch

- The real product ids + the discount amount for the first concrete set. The
  committed config ships with one EXAMPLE bundle that must be replaced.

## 13. Open follow-ups (post-v1)

- "Remove whole set" control in the cart.
- Per-set quantity (buy a set ×2).
- Percentage / fixed-price discount models.
- Admin-managed deals in Supabase.
