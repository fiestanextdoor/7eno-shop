# Combi-deals (Product Bundles) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers buy a curated set of products at a fixed amount off the summed item prices, choosing size/colour per item, with the discount applied server-side via a one-off Stripe coupon.

**Architecture:** Bundles are defined in a code config (`lib/bundles.ts`). A `/deals` page lists them; `/deals/[slug]` lets the customer pick a variant per product and add the whole set to the cart, each item tagged with a `bundleId`. The checkout API re-validates each complete set server-side and applies the discount as a one-off Stripe coupon, leaving the full-price line items intact so POD fulfillment is unchanged.

**Tech Stack:** Next.js 16 (App Router, server components), React 19, Zustand (cart), Stripe Checkout, Jest + Testing Library, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-06-07-combi-deals-bundles-design.md`

---

## File Structure

**New files**
- `lib/bundles.ts` — bundle config + pure pricing helper. (+ `lib/bundles.test.ts`)
- `lib/bundle-discount.ts` — pure server/client discount resolver. (+ `lib/bundle-discount.test.ts`)
- `app/deals/page.tsx` + `app/deals/deals.module.css` — deals overview.
- `app/deals/[slug]/page.tsx` — server loader for one bundle.
- `app/deals/[slug]/BundleConfigurator.tsx` + `app/deals/[slug]/configurator.module.css` — client variant pickers + add-to-cart.

**Modified files**
- `types/cart.ts` — add `bundleId?`, `bundleTitle?`.
- `lib/cart-key.ts` (+ `lib/cart-key.test.ts`) — bundle-aware key.
- `store/cart.ts` — pass `bundleId` through `keyOf`.
- `components/CartDrawer/CartDrawer.tsx` — group set items, show discount line, bundle-aware keys.
- `app/api/checkout/route.ts` — resolve bundle discounts, attach Stripe coupon, record `b` in metadata.
- `components/Footer/Footer.tsx` — add "Deals" link.

---

## Task 1: Bundle-aware cart key

**Files:**
- Modify: `lib/cart-key.ts`
- Test: `lib/cart-key.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `lib/cart-key.test.ts` inside the existing `describe`:

```ts
  it('keeps standalone keys unchanged when no bundleId is given', () => {
    expect(cartItemKey('printful', '9001')).toBe('printful:9001')
  })
  it('appends bundleId so set items do not merge with standalone items', () => {
    expect(cartItemKey('printful', '9001', 'beach-set')).toBe('printful:9001#beach-set')
    expect(cartItemKey('printful', '9001', 'beach-set')).not.toBe(cartItemKey('printful', '9001'))
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/cart-key.test.ts`
Expected: FAIL — `cartItemKey` ignores the third argument (the bundle test gets `printful:9001`).

- [ ] **Step 3: Implement the bundle-aware key**

Replace the body of `lib/cart-key.ts`:

```ts
import type { Provider } from '@/types/catalog'

/**
 * Stable cart key. Variant ids can collide across providers, so include both.
 * A `bundleId` is appended for items that belong to a set, so a set item never
 * merges with the same variant bought standalone.
 */
export function cartItemKey(provider: Provider, variantId: string, bundleId?: string): string {
  const base = `${provider}:${variantId}`
  return bundleId ? `${base}#${bundleId}` : base
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/cart-key.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cart-key.ts lib/cart-key.test.ts
git commit -m "feat: bundle-aware cart key"
```

---

## Task 2: CartItem bundle fields

**Files:**
- Modify: `types/cart.ts`

- [ ] **Step 1: Add optional bundle fields**

Replace `types/cart.ts`:

```ts
import type { Provider } from '@/types/catalog'

export interface CartItem {
  provider: Provider
  variantId: string
  productId: string
  productName: string
  variantName: string
  price: string
  currency: string
  quantity: number
  imageUrl: string | null
  /** Set this item belongs to. Undefined for a standalone purchase. */
  bundleId?: string
  /** Display label for the set, shown grouped in the cart. */
  bundleTitle?: string
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: exit 0 (the new fields are optional, so nothing breaks).

- [ ] **Step 3: Commit**

```bash
git add types/cart.ts
git commit -m "feat: add optional bundle fields to CartItem"
```

---

## Task 3: Bundle config + pricing helper

**Files:**
- Create: `lib/bundles.ts`
- Test: `lib/bundles.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/bundles.test.ts`:

```ts
import { computeBundlePricing, getBundle, getBundleBySlug, getBundles } from './bundles'

describe('computeBundlePricing', () => {
  it('subtracts the discount from the summed price', () => {
    expect(computeBundlePricing(5000, 705)).toEqual({
      sumCents: 5000,
      discountCents: 705,
      setCents: 4295,
    })
  })
  it('clamps the discount so the set price never goes negative', () => {
    expect(computeBundlePricing(500, 705)).toEqual({
      sumCents: 500,
      discountCents: 500,
      setCents: 0,
    })
  })
  it('treats a negative discount as zero', () => {
    expect(computeBundlePricing(5000, -100)).toEqual({
      sumCents: 5000,
      discountCents: 0,
      setCents: 5000,
    })
  })
})

describe('bundle lookups', () => {
  it('returns the same list from getBundles', () => {
    expect(Array.isArray(getBundles())).toBe(true)
  })
  it('finds a bundle by id and the same one by slug', () => {
    const first = getBundles()[0]
    expect(getBundle(first.id)).toEqual(first)
    expect(getBundleBySlug(first.id)).toEqual(first)
  })
  it('returns null for an unknown id', () => {
    expect(getBundle('does-not-exist')).toBeNull()
    expect(getBundleBySlug('does-not-exist')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/bundles.test.ts`
Expected: FAIL — module `./bundles` does not exist.

- [ ] **Step 3: Implement `lib/bundles.ts`**

```ts
import type { Provider } from '@/types/catalog'

/** One product slot in a set. The customer chooses the variant (size/colour). */
export interface BundleProductRef {
  provider: Provider
  productId: string // live Printful/Printify product id — must be a real id
  slug: string      // product slug, for catalog lookup + linking
}

export interface Bundle {
  id: string                   // stable key; also the URL slug for /deals/[slug]
  title: string
  description?: string
  products: BundleProductRef[] // 2+ products that make up the set
  discountCents: number        // fixed amount off the summed item prices
  image?: string               // optional hero image (/public path or remote url)
}

export interface BundlePricing {
  sumCents: number
  discountCents: number
  setCents: number
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE bundle. REPLACE the productId/slug values with real live product ids
// before launch (products come from the Printful/Printify API, not from code).
// ─────────────────────────────────────────────────────────────────────────────
const BUNDLES: Bundle[] = [
  {
    id: 'beach-set',
    title: 'Beach Set',
    description: 'Swim shorts and a matching towel for the beach.',
    discountCents: 705,
    products: [
      { provider: 'printful', productId: 'REPLACE_ME_PRODUCT_ID_1', slug: 'swim-towel' },
      { provider: 'printful', productId: 'REPLACE_ME_PRODUCT_ID_2', slug: 'swim-shorts' },
    ],
  },
]

export function getBundles(): Bundle[] {
  return BUNDLES
}

export function getBundle(id: string): Bundle | null {
  return BUNDLES.find((b) => b.id === id) ?? null
}

/** The URL slug for a bundle is its id. */
export function getBundleBySlug(slug: string): Bundle | null {
  return getBundle(slug)
}

/** Pure pricing: set price = summed item prices minus the discount, clamped to [0, sum]. */
export function computeBundlePricing(sumCents: number, discountCents: number): BundlePricing {
  const clamped = Math.min(Math.max(discountCents, 0), sumCents)
  return { sumCents, discountCents: clamped, setCents: sumCents - clamped }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/bundles.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/bundles.ts lib/bundles.test.ts
git commit -m "feat: bundle config and pricing helper"
```

---

## Task 4: Server-side bundle discount resolver

**Files:**
- Create: `lib/bundle-discount.ts`
- Test: `lib/bundle-discount.test.ts`

This pure function decides how much discount to apply. It is used by both the
checkout API (authoritative) and the CartDrawer (display only).

- [ ] **Step 1: Write the failing test**

Create `lib/bundle-discount.test.ts`:

```ts
import { resolveBundleDiscountCents } from './bundle-discount'
import type { Bundle } from './bundles'

const BEACH: Bundle = {
  id: 'beach-set',
  title: 'Beach Set',
  discountCents: 705,
  products: [
    { provider: 'printful', productId: 'A', slug: 'a' },
    { provider: 'printful', productId: 'B', slug: 'b' },
  ],
}
const getBundle = (id: string) => (id === 'beach-set' ? BEACH : null)

describe('resolveBundleDiscountCents', () => {
  it('applies the discount when a complete set is present', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(705)
  })

  it('gives no discount when the set is incomplete', () => {
    const items = [{ bundleId: 'beach-set', productId: 'A', resolved: true }]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('gives no discount when the group has an extra product', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
      { bundleId: 'beach-set', productId: 'C', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('gives no discount when a member variant did not resolve', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: false },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('ignores unknown bundle ids', () => {
    const items = [
      { bundleId: 'ghost', productId: 'A', resolved: true },
      { bundleId: 'ghost', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 5000, getBundle)).toBe(0)
  })

  it('clamps the total discount to the subtotal', () => {
    const items = [
      { bundleId: 'beach-set', productId: 'A', resolved: true },
      { bundleId: 'beach-set', productId: 'B', resolved: true },
    ]
    expect(resolveBundleDiscountCents(items, 300, getBundle)).toBe(300)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest lib/bundle-discount.test.ts`
Expected: FAIL — module `./bundle-discount` does not exist.

- [ ] **Step 3: Implement `lib/bundle-discount.ts`**

```ts
import type { Bundle } from './bundles'

export interface BundleMemberItem {
  bundleId: string
  productId: string
  /** Whether the item's variant resolved to a real, available product variant. */
  resolved: boolean
}

/**
 * Sum of discounts for every complete & valid bundle present in the items,
 * clamped to the subtotal so the order can never go negative.
 *
 * A group (items sharing a bundleId) is valid iff the bundle exists, every
 * member resolved, and the set of member productIds exactly equals the set of
 * the bundle's product ids (one item per product, no extras, none missing).
 */
export function resolveBundleDiscountCents(
  items: BundleMemberItem[],
  subtotalCents: number,
  getBundle: (id: string) => Bundle | null,
): number {
  const groups = new Map<string, BundleMemberItem[]>()
  for (const item of items) {
    const group = groups.get(item.bundleId) ?? []
    group.push(item)
    groups.set(item.bundleId, group)
  }

  let discount = 0
  for (const [bundleId, members] of groups) {
    const bundle = getBundle(bundleId)
    if (!bundle) continue
    if (members.some((m) => !m.resolved)) continue

    const have = members.map((m) => m.productId).sort()
    const need = bundle.products.map((p) => p.productId).sort()
    if (have.length !== need.length) continue
    if (!need.every((id, i) => id === have[i])) continue

    discount += bundle.discountCents
  }

  return Math.min(Math.max(discount, 0), subtotalCents)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest lib/bundle-discount.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/bundle-discount.ts lib/bundle-discount.test.ts
git commit -m "feat: bundle discount resolver"
```

---

## Task 5: Cart store passes bundleId through the key

**Files:**
- Modify: `store/cart.ts:21`

- [ ] **Step 1: Update `keyOf`**

In `store/cart.ts`, replace the `keyOf` definition (line 21):

```ts
const keyOf = (i: CartItem) => cartItemKey(i.provider, i.variantId, i.bundleId)
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add store/cart.ts
git commit -m "feat: include bundleId in cart item key"
```

---

## Task 6: CartDrawer — bundle-aware keys, grouping, discount line

**Files:**
- Modify: `components/CartDrawer/CartDrawer.tsx`
- Modify: `components/CartDrawer/CartDrawer.module.css`

- [ ] **Step 1: Replace the CartDrawer component**

Replace the whole body of `components/CartDrawer/CartDrawer.tsx`:

```tsx
'use client'

import Image from 'next/image'
import { useCartStore } from '@/store/cart'
import { cartItemKey } from '@/lib/cart-key'
import { getBundle } from '@/lib/bundles'
import { resolveBundleDiscountCents } from '@/lib/bundle-discount'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import type { CartItem } from '@/types/cart'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const total = useCartStore((s) => s.total())

  // Client-side display of the bundle discount. The checkout API re-validates
  // this authoritatively; here it only keeps the shown total honest.
  const subtotalCents = Math.round(total * 100)
  const discountCents = resolveBundleDiscountCents(
    items.filter((i) => i.bundleId).map((i) => ({ bundleId: i.bundleId!, productId: i.productId, resolved: true })),
    subtotalCents,
    getBundle,
  )
  const currency = items[0]?.currency ?? 'EUR'
  const discountedTotal = (subtotalCents - discountCents) / 100

  // Group set items together; standalone items keep their order after the sets.
  const bundleGroups = new Map<string, CartItem[]>()
  const standalone: CartItem[] = []
  for (const item of items) {
    if (item.bundleId) {
      const group = bundleGroups.get(item.bundleId) ?? []
      group.push(item)
      bundleGroups.set(item.bundleId, group)
    } else {
      standalone.push(item)
    }
  }

  const renderItem = (item: CartItem) => (
    <li key={cartItemKey(item.provider, item.variantId, item.bundleId)} className={styles.item}>
      {item.imageUrl ? (
        <div className={styles.thumb}>
          <Image src={item.imageUrl} alt={item.productName} fill style={{ objectFit: 'cover' }} />
        </div>
      ) : (
        <div className={styles.thumbPlaceholder} />
      )}
      <div className={styles.itemInfo}>
        <div className={styles.itemName}>{item.productName}</div>
        <div className={styles.itemVariant}>{item.variantName}</div>
        <div className={styles.itemPrice}>
          {item.currency} {(parseFloat(item.price) * item.quantity).toFixed(2)}
        </div>
        <div className={styles.qtyRow}>
          <button className={styles.qtyBtn} onClick={() => updateQuantity(cartItemKey(item.provider, item.variantId, item.bundleId), item.quantity - 1)}>−</button>
          <span className={styles.qty}>{item.quantity}</span>
          <button className={styles.qtyBtn} onClick={() => updateQuantity(cartItemKey(item.provider, item.variantId, item.bundleId), item.quantity + 1)}>+</button>
        </div>
      </div>
      <button className={styles.removeBtn} onClick={() => removeItem(cartItemKey(item.provider, item.variantId, item.bundleId))} aria-label="Remove item">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.2A.8.8 0 003.8 14h8.4a.8.8 0 00.8-.8L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </li>
  )

  return (
    <>
      <div
        className={isOpen ? styles.overlayVisible : styles.overlayHidden}
        onClick={closeCart}
        onKeyDown={(e) => e.key === 'Escape' && closeCart()}
        role="button"
        tabIndex={0}
        aria-label="Close cart"
      />
      <aside
        className={isOpen ? styles.drawerOpen : styles.drawerClosed}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Cart</h2>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <line x1="2" y1="2" x2="16" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="2" x2="2" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Your cart is empty.</p>
        ) : (
          <>
            <ul className={styles.items}>
              {[...bundleGroups.entries()].map(([bundleId, group]) => (
                <li key={`group-${bundleId}`} className={styles.group}>
                  <span className={styles.groupTitle}>{group[0].bundleTitle ?? 'Set'}</span>
                  <ul className={styles.groupItems}>{group.map(renderItem)}</ul>
                </li>
              ))}
              {standalone.map(renderItem)}
            </ul>
            <div className={styles.footer}>
              {discountCents > 0 && (
                <div className={styles.discountRow}>
                  <span>Combi-deal discount</span>
                  <span>− {currency} {(discountCents / 100).toFixed(2)}</span>
                </div>
              )}
              <p className={styles.shippingNote}>
                {discountedTotal >= FREE_SHIPPING_THRESHOLD
                  ? '✓ Your order ships free.'
                  : `Free shipping on orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)} (add €${(FREE_SHIPPING_THRESHOLD - discountedTotal).toFixed(2)}).`}
              </p>
              <div className={styles.total}>
                <span>Total</span>
                <span>{currency} {discountedTotal.toFixed(2)}</span>
              </div>
              <a href="/checkout" className={styles.checkoutBtn} onClick={closeCart}>
                Checkout
              </a>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Add the new CSS classes**

Append to `components/CartDrawer/CartDrawer.module.css`:

```css
.group {
  list-style: none;
  border: 1px solid var(--rule);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

.groupTitle {
  display: block;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--stone);
  margin-bottom: 8px;
}

.groupItems {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
}

.discountRow {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 1px;
  color: var(--oxblood);
  margin-bottom: 8px;
}
```

- [ ] **Step 3: Verify lint + type-check**

Run: `npx tsc --noEmit && npx eslint components/CartDrawer/CartDrawer.tsx`
Expected: exit 0 for both.

- [ ] **Step 4: Commit**

```bash
git add components/CartDrawer/CartDrawer.tsx components/CartDrawer/CartDrawer.module.css
git commit -m "feat: group set items and show bundle discount in cart drawer"
```

---

## Task 7: Checkout API — apply the bundle discount

**Files:**
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Add imports**

In `app/api/checkout/route.ts`, after the existing import of `computeShippingCents` (line 6), add:

```ts
import { getBundle } from '@/lib/bundles'
import { resolveBundleDiscountCents, type BundleMemberItem } from '@/lib/bundle-discount'
```

- [ ] **Step 2: Widen the cart metadata type and collect bundle members**

Find this block (around lines 77-79):

```ts
  const lineItems: NonNullable<CheckoutParams['line_items']> = []
  const cartMeta: { r: string; p: string; v: string; q: number }[] = []
  let subtotalCents = 0
  let currency = 'eur'
```

Replace it with:

```ts
  const lineItems: NonNullable<CheckoutParams['line_items']> = []
  const cartMeta: { r: string; p: string; v: string; q: number; b?: string }[] = []
  const bundleMembers: BundleMemberItem[] = []
  let subtotalCents = 0
  let currency = 'eur'
```

- [ ] **Step 3: Record bundleId in metadata and members**

Find the `cartMeta.push({ ... })` block (around lines 117-122):

```ts
    cartMeta.push({
      r: item.provider,
      p: item.productId,
      v: item.variantId,
      q: item.quantity,
    })
```

Replace it with:

```ts
    cartMeta.push({
      r: item.provider,
      p: item.productId,
      v: item.variantId,
      q: item.quantity,
      ...(item.bundleId ? { b: item.bundleId } : {}),
    })

    // Every item past the `found` guard above has resolved to a real variant.
    if (item.bundleId) {
      bundleMembers.push({ bundleId: item.bundleId, productId: item.productId, resolved: true })
    }
```

- [ ] **Step 4: Compute the discount before building the session**

Find the line that computes shipping (around line 127):

```ts
  const shippingCents = computeShippingCents(subtotalCents)
```

Immediately **above** that line, insert:

```ts
  // Re-derive the bundle discount server-side from server-trusted data. Only
  // complete, valid sets earn a discount; the total is clamped to the subtotal.
  const bundleDiscountCents = resolveBundleDiscountCents(bundleMembers, subtotalCents, getBundle)
```

- [ ] **Step 5: Attach a one-off Stripe coupon to the session**

Find the session creation (around line 194):

```ts
    const session = await stripe.checkout.sessions.create(sessionParams)
```

Immediately **above** that line, insert:

```ts
    if (bundleDiscountCents > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: bundleDiscountCents,
        currency,
        duration: 'once',
        name: 'Combi-deal',
      })
      sessionParams.discounts = [{ coupon: coupon.id }]
    }
```

- [ ] **Step 6: Verify lint + type-check**

Run: `npx tsc --noEmit && npx eslint app/api/checkout/route.ts`
Expected: exit 0 for both.

- [ ] **Step 7: Commit**

```bash
git add app/api/checkout/route.ts
git commit -m "feat: apply bundle discount via stripe coupon at checkout"
```

---

## Task 8: Deals overview page `/deals`

**Files:**
- Create: `app/deals/page.tsx`
- Create: `app/deals/deals.module.css`

- [ ] **Step 1: Create the overview page**

Create `app/deals/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Nav from '@/components/Nav/Nav'
import { getBundles, computeBundlePricing } from '@/lib/bundles'
import { getCatalogProduct } from '@/lib/catalog'
import styles from './deals.module.css'

export const metadata: Metadata = {
  title: 'Deals — 7ENO',
  description: 'Curated 7ENO sets at a combined price.',
}

// Lowest variant price per product (variants of one product share a price).
function lowestPriceCents(variants: { priceCents: number }[]): number {
  return variants.reduce((min, v) => (v.priceCents < min ? v.priceCents : min), Infinity)
}

export default async function DealsPage() {
  const bundles = getBundles()

  const cards = await Promise.all(
    bundles.map(async (bundle) => {
      try {
        const products = await Promise.all(
          bundle.products.map((p) => getCatalogProduct(p.provider, p.productId)),
        )
        const sumCents = products.reduce((sum, prod) => sum + lowestPriceCents(prod.variants), 0)
        if (!Number.isFinite(sumCents)) return null
        const pricing = computeBundlePricing(sumCents, bundle.discountCents)
        const currency = products[0]?.currency ?? 'EUR'
        return { bundle, pricing, currency, productNames: products.map((p) => p.name) }
      } catch {
        return null
      }
    }),
  )

  const visible = cards.filter((c): c is NonNullable<typeof c> => c !== null)
  const symbol = (c: string) => (c === 'EUR' ? '€' : c === 'USD' ? '$' : c)

  return (
    <>
      <Nav />
      <main className={styles.page}>
        <header className={styles.header}>
          <p className={styles.headerLabel}>by Abra Entertainment</p>
          <h1 className={styles.title}>Deals</h1>
        </header>

        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No deals right now.</p>
            <p className={styles.emptySub}>Check back soon for curated sets.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map(({ bundle, pricing, currency, productNames }) => (
              <Link key={bundle.id} href={`/deals/${bundle.id}`} className={styles.card}>
                <div className={styles.imageWrap}>
                  {bundle.image ? (
                    <Image src={bundle.image} alt={bundle.title} fill className={styles.image} sizes="(max-width: 640px) 100vw, 50vw" unoptimized />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>
                <div className={styles.info}>
                  <p className={styles.cardTitle}>{bundle.title}</p>
                  <p className={styles.cardProducts}>{productNames.join(' + ')}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.from}>{symbol(currency)}{(pricing.sumCents / 100).toFixed(2)}</span>
                    <span className={styles.setPrice}>{symbol(currency)}{(pricing.setCents / 100).toFixed(2)}</span>
                  </div>
                  <span className={styles.save}>You save {symbol(currency)}{(pricing.discountCents / 100).toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 2: Create the stylesheet**

Create `app/deals/deals.module.css`:

```css
.page {
  background: var(--ink);
  min-height: 100vh;
  padding: 120px var(--gutter) 80px;
}

.header {
  max-width: 1200px;
  margin: 0 auto 48px;
}

.headerLabel {
  font-family: var(--font-mono);
  font-size: 0.55rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(246, 243, 236, 0.4);
}

.title {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 600;
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--bone);
  line-height: 1.1;
}

.grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
}

.imageWrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--paper);
  overflow: hidden;
}

.image {
  object-fit: cover;
}

.placeholder {
  width: 100%;
  height: 100%;
  background: var(--paper);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 2px;
}

.cardTitle {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--bone);
}

.cardProducts {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 1px;
  color: rgba(246, 243, 236, 0.5);
}

.priceRow {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 4px;
}

.from {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: rgba(246, 243, 236, 0.4);
  text-decoration: line-through;
}

.setPrice {
  font-family: var(--font-serif);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--bone);
}

.save {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--oxblood);
}

.empty {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  padding: 80px 0;
}

.emptyTitle {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.4rem;
  color: var(--bone);
}

.emptySub {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(246, 243, 236, 0.4);
  margin-top: 8px;
}
```

- [ ] **Step 3: Verify lint + type-check**

Run: `npx tsc --noEmit && npx eslint app/deals/page.tsx`
Expected: exit 0 for both.

- [ ] **Step 4: Commit**

```bash
git add app/deals/page.tsx app/deals/deals.module.css
git commit -m "feat: deals overview page"
```

---

## Task 9: Deals configurator page `/deals/[slug]`

**Files:**
- Create: `app/deals/[slug]/page.tsx`
- Create: `app/deals/[slug]/BundleConfigurator.tsx`
- Create: `app/deals/[slug]/configurator.module.css`

- [ ] **Step 1: Create the server loader page**

Create `app/deals/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav/Nav'
import { getBundleBySlug, getBundles, computeBundlePricing } from '@/lib/bundles'
import { getCatalogProduct } from '@/lib/catalog'
import type { NormalizedVariant } from '@/types/catalog'
import BundleConfigurator, { type BundleProductData } from './BundleConfigurator'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getBundles().map((b) => ({ slug: b.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const bundle = getBundleBySlug(slug)
  return { title: bundle ? `${bundle.title} — 7ENO` : '7ENO' }
}

function lowestPriceCents(variants: NormalizedVariant[]): number {
  return variants.reduce((min, v) => (v.priceCents < min ? v.priceCents : min), Infinity)
}

export default async function DealPage({ params }: Props) {
  const { slug } = await params
  const bundle = getBundleBySlug(slug)
  if (!bundle) notFound()

  let products: BundleProductData[]
  try {
    products = await Promise.all(
      bundle.products.map(async (ref) => {
        const detail = await getCatalogProduct(ref.provider, ref.productId)
        return {
          provider: ref.provider,
          productId: ref.productId,
          name: detail.name,
          thumbnailUrl: detail.thumbnailUrl,
          variants: detail.variants,
        }
      }),
    )
  } catch {
    notFound()
  }

  const sumCents = products!.reduce((sum, p) => sum + lowestPriceCents(p.variants), 0)
  const pricing = computeBundlePricing(Number.isFinite(sumCents) ? sumCents : 0, bundle.discountCents)

  return (
    <>
      <Nav />
      <BundleConfigurator
        bundleId={bundle.id}
        bundleTitle={bundle.title}
        description={bundle.description ?? null}
        products={products!}
        discountCents={pricing.discountCents}
      />
    </>
  )
}
```

- [ ] **Step 2: Create the configurator client component**

Create `app/deals/[slug]/BundleConfigurator.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { NormalizedVariant, Provider } from '@/types/catalog'
import { useCartStore } from '@/store/cart'
import { resolveHex } from '@/lib/color-utils'
import { computeBundlePricing } from '@/lib/bundles'
import styles from './configurator.module.css'

export interface BundleProductData {
  provider: Provider
  productId: string
  name: string
  thumbnailUrl: string | null
  variants: NormalizedVariant[]
}

interface Props {
  bundleId: string
  bundleTitle: string
  description: string | null
  products: BundleProductData[]
  discountCents: number
}

const EXCLUDED_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

export default function BundleConfigurator({ bundleId, bundleTitle, description, products, discountCents }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useCartStore((s) => s.openCart)

  // Selected variant id per product index.
  const [selected, setSelected] = useState<(string | null)[]>(() => products.map(() => null))
  const [added, setAdded] = useState(false)

  const currency = products[0]?.variants[0]?.currency ?? 'EUR'
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency

  const selectedVariants = products.map((p, i) => p.variants.find((v) => v.id === selected[i]) ?? null)
  const allChosen = selectedVariants.every((v) => v !== null)

  const sumCents = selectedVariants.reduce((sum, v, i) => {
    if (v) return sum + v.priceCents
    const fallback = products[i].variants.reduce((m, vv) => (vv.priceCents < m ? vv.priceCents : m), Infinity)
    return sum + (Number.isFinite(fallback) ? fallback : 0)
  }, 0)
  const pricing = computeBundlePricing(sumCents, discountCents)

  const setVariant = (productIndex: number, variantId: string) => {
    setSelected((prev) => prev.map((v, i) => (i === productIndex ? variantId : v)))
    setAdded(false)
  }

  const handleAddSet = () => {
    if (!allChosen) return
    selectedVariants.forEach((variant, i) => {
      if (!variant) return
      const product = products[i]
      addItem({
        provider: product.provider,
        variantId: variant.id,
        productId: product.productId,
        productName: product.name,
        variantName: variant.name,
        price: (variant.priceCents / 100).toFixed(2),
        currency: variant.currency,
        quantity: 1,
        imageUrl: variant.imageUrl ?? product.thumbnailUrl,
        bundleId,
        bundleTitle,
      })
    })
    setAdded(true)
    openCart()
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{bundleTitle}</h1>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.products}>
          {products.map((product, i) => {
            const colors = Array.from(
              new Map(product.variants.filter((v) => v.color).map((v) => [v.color, v])).values(),
            )
            const hasColors = colors.length > 1
            const chosen = selectedVariants[i]
            const activeColor = chosen?.color ?? colors[0]?.color ?? ''
            const sizes = Array.from(
              new Map(
                product.variants
                  .filter((v) => (hasColors ? v.color === activeColor : true))
                  .map((v) => [v.size || v.name, v]),
              ).values(),
            ).filter((v) => !EXCLUDED_SIZES.has(v.size))

            return (
              <div key={product.productId} className={styles.product}>
                <div className={styles.thumb}>
                  {product.thumbnailUrl ? (
                    <Image src={product.thumbnailUrl} alt={product.name} fill className={styles.thumbImg} sizes="120px" unoptimized />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <p className={styles.productName}>{product.name}</p>

                  {hasColors && (
                    <div className={styles.swatches}>
                      {colors.map((v) => (
                        <button
                          key={v.color}
                          type="button"
                          className={[styles.swatch, activeColor === v.color ? styles.swatchActive : ''].join(' ')}
                          style={{ background: resolveHex(v.color, v.colorCode ?? '') }}
                          aria-label={v.color}
                          aria-pressed={activeColor === v.color}
                          onClick={() => {
                            const first = product.variants.find((cv) => cv.color === v.color && !EXCLUDED_SIZES.has(cv.size))
                            if (first) setVariant(i, first.id)
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className={styles.sizes}>
                    {sizes.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={[styles.sizeBtn, chosen?.id === v.id ? styles.sizeSelected : '', v.inStock === false ? styles.outOfStock : ''].join(' ')}
                        disabled={v.inStock === false}
                        aria-pressed={chosen?.id === v.id}
                        onClick={() => setVariant(i, v.id)}
                      >
                        {(v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Items separately</span>
            <span className={styles.strike}>{symbol}{(pricing.sumCents / 100).toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Set price</span>
            <span className={styles.setPrice}>{symbol}{(pricing.setCents / 100).toFixed(2)}</span>
          </div>
          <div className={styles.saveRow}>You save {symbol}{(pricing.discountCents / 100).toFixed(2)}</div>
        </div>

        <button className={[styles.addBtn, added ? styles.added : ''].join(' ')} onClick={handleAddSet} disabled={!allChosen}>
          {added ? '✓ Set added to cart' : allChosen ? 'Add set to cart' : 'Choose size & colour for each item'}
        </button>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create the stylesheet**

Create `app/deals/[slug]/configurator.module.css`:

```css
.page {
  background: var(--ink);
  min-height: 100vh;
  padding: 120px var(--gutter) 80px;
}

.inner {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.title {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 600;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  color: var(--bone);
  line-height: 1.1;
}

.description {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: rgba(246, 243, 236, 0.7);
  line-height: 1.7;
  margin-top: -16px;
}

.products {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 20px;
  padding-top: 24px;
  border-top: 1px solid rgba(246, 243, 236, 0.08);
}

.thumb {
  position: relative;
  width: 120px;
  height: 120px;
  background: var(--paper);
  overflow: hidden;
}

.thumbImg {
  object-fit: cover;
}

.thumbPlaceholder {
  width: 100%;
  height: 100%;
  background: var(--paper);
}

.productInfo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.productName {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--bone);
}

.swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.swatch {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(246, 243, 236, 0.2);
  cursor: pointer;
  padding: 0;
}

.swatchActive {
  outline: 2px solid var(--bone);
  outline-offset: 2px;
}

.sizes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sizeBtn {
  min-width: 44px;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid rgba(246, 243, 236, 0.25);
  color: var(--bone);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  cursor: pointer;
}

.sizeSelected {
  background: var(--bone);
  color: var(--ink);
}

.outOfStock {
  opacity: 0.35;
  cursor: not-allowed;
  text-decoration: line-through;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid rgba(246, 243, 236, 0.08);
}

.summaryRow {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: rgba(246, 243, 236, 0.7);
}

.strike {
  text-decoration: line-through;
  color: rgba(246, 243, 236, 0.4);
}

.setPrice {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--bone);
}

.saveRow {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--oxblood);
}

.addBtn {
  background: var(--bone);
  color: var(--ink);
  border: none;
  padding: 18px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s;
}

.addBtn:hover:not(:disabled) {
  background: var(--butter);
}

.addBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.added {
  background: var(--butter);
}

@media (prefers-reduced-motion: reduce) {
  .addBtn { transition: none; }
}
```

- [ ] **Step 4: Verify lint + type-check**

Run: `npx tsc --noEmit && npx eslint "app/deals/[slug]/page.tsx" "app/deals/[slug]/BundleConfigurator.tsx"`
Expected: exit 0 for both.

- [ ] **Step 5: Commit**

```bash
git add "app/deals/[slug]"
git commit -m "feat: deal configurator page with per-product variant pickers"
```

---

## Task 10: Footer link to /deals

**Files:**
- Modify: `components/Footer/Footer.tsx`

- [ ] **Step 1: Add the Deals link in the bottom bar**

In `components/Footer/Footer.tsx`, find the bottom-bar links (the `<Link href="/terms" ...>` block) and add a Deals link directly before the Terms link:

```tsx
          <Link href="/deals" className={styles.copy} style={{ textDecoration: 'none' }}>
            Deals
          </Link>
```

- [ ] **Step 2: Verify lint + type-check**

Run: `npx tsc --noEmit && npx eslint components/Footer/Footer.tsx`
Expected: exit 0 for both.

- [ ] **Step 3: Commit**

```bash
git add components/Footer/Footer.tsx
git commit -m "feat: add Deals link to footer"
```

---

## Task 11: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx jest`
Expected: PASS — all suites, including the new `lib/bundles.test.ts`, `lib/bundle-discount.test.ts`, and the extended `lib/cart-key.test.ts`.

- [ ] **Step 2: Type-check and lint the whole project**

Run: `npx tsc --noEmit && npx next lint`
Expected: exit 0 / no errors.

- [ ] **Step 3: Manual smoke test (requires real product ids)**

Replace the `REPLACE_ME_PRODUCT_ID_*` values in `lib/bundles.ts` with two real
live product ids (and matching slugs), then:

Run: `npm run dev`
Verify:
1. `/deals` shows the Beach Set card with a struck-through "from" price, the set price, and the savings.
2. `/deals/beach-set` lets you pick size/colour for each product; "Add set to cart" enables only when both are chosen.
3. The CartDrawer groups the two items under "Beach Set" and shows the "Combi-deal discount" line and the reduced total.
4. Stripe Checkout shows the discount as a deduction; the order total matches the set price plus shipping.

Expected: all four behave as described.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during bundle smoke test"
```

(Skip this commit if the smoke test surfaced nothing.)

---

## Notes for the implementer

- **Do not** add a "remove whole set" control — out of scope for v1 (see spec §2).
- **Server trust:** never move pricing or discount decisions to the client. The
  CartDrawer's discount display is informational only; `app/api/checkout/route.ts`
  is the single source of truth (Task 7).
- **Attribution:** commit messages use conventional-commit prefixes with no
  co-author/attribution trailer (disabled globally in this environment).
- The example bundle ships with placeholder product ids on purpose; the `/deals`
  page silently drops bundles whose products fail to resolve, so an unconfigured
  build shows an empty deals page rather than crashing.
