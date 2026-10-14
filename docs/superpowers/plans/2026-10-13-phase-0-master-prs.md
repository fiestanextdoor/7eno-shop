# Fase 0: master-PR's (OLYMPN Sport verbergen, AppShell en hooks) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Twee kleine PR's op `master`: PR A verbergt en blokkeert alle producten met naamprefix `OLYMPN Sport `, PR B trekt de route-chrome en de cart/checkout-logica uit componenten naar `AppShell` en drie hooks, zonder gedrag of markup te veranderen.

**Architecture:** PR A voegt een pure naamcheck toe (`lib/unreleased.ts`) die `getCatalogProducts` gebruikt om producten weg te filteren en die `POST /api/checkout` gebruikt om een regel met 409 te weigeren. PR B hernoemt `CartProvider` naar `AppShell` en verplaatst variantkeuze (`useVariantPicker`), totalen (`useCartTotals`, met pure `computeCartTotals`) en checkout-formulier/promo/betaling (`useCheckout`) naar `hooks/`. Elke verplaatsing wordt eerst vastgepind met een test op het bestaande gedrag, daarna verplaatst.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19.2, TypeScript 5 (strict), Zustand 5 (`store/cart.ts`), Jest 30 via `next/jest` (jsdom, SWC), @testing-library/react 16 (`render`, `renderHook`, `act`), ESLint 9 flat config (`eslint-config-next` 16.2.6).

**Spec:** `docs/superpowers/specs/2026-10-13-rebrand-v2-design.md` (sectie 6 en de rij "0. Voorwerk master" in sectie 10; sectie 1 en 4 voor de kaders van de guard).

## Global Constraints

- Twee PR's op `master`, elk pas mergen na akkoord van Joep. De uitvoerder merget nooit zelf en pusht nooit naar `master`.
- PR A titel: `fix: hide unreleased OLYMPN Sport products`. PR B titel: `refactor: extract AppShell and cart/checkout hooks`.
- Prefix exact `OLYMPN Sport ` (met spatie), hoofdletterongevoelig (spec sectie 4: "namePrefixes hoofdletterongevoelig"). De spatie voorkomt botsing met OG-namen als "Ink/Butter Sport Tee".
- Checkout-API geeft 409 bij een niet-koopbare regel (spec sectie 4 en 9).
- Checkout-logica, Stripe-betalingen, promo-codes, verzendregels, Printful/Printify-orderflow en het Supabase-schema blijven functioneel gelijk (spec sectie 1). PR B: "Gedrag en markup ongewijzigd" (spec sectie 6).
- `package.json`: `"lint": "eslint ."` (spec sectie 6). In Next 16 bestaat `next lint` niet meer en `next build` lint niet meer (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, regel 1093-1095).
- Kwaliteitspoort per PR: `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run build` (spec sectie 9).
- Tests staan naast de bron als `*.test.ts` / `*.test.tsx` (bestaande stijl, bv. `lib/catalog.test.ts`, `components/ProductCarousel/QuickAddCard.test.tsx`).
- Commitberichten: conventional commits (`fix:`, `refactor:`, `test:`, `chore:`), Engels, geen em-dashes.
- `.env.local` in de hoofdcheckout bevat een **live** Stripe-sleutel (`sk_live_`). Nooit een betaling lokaal starten zonder `.env.development.local` met testsleutels (Task 9). Unit-tests mocken `@/lib/stripe`, `@/lib/printful`, `@/lib/printify` en `@/lib/supabase/server` altijd volledig.
- Werk in eigen git-worktrees naast de hoofdcheckout (het plan zelf staat op `redesign/v2`). Gebruik geen `git stash`: de stash is gedeeld tussen worktrees.
- `jest.mock()` krijgt altijd een **relatief** pad (`'./printful'`, `'../../../lib/stripe'`). De `next/jest`-config heeft geen `moduleNameMapper` voor `@/`; SWC herschrijft `@/` alleen in imports, dus `jest.mock('@/lib/stripe', ...)` faalt met `Cannot find module`. Gewone imports met `@/` werken wel.
- Jest behandelt een padargument als regex. Gebruik voor paden met `[slug]` de bestandsnaam als patroon (`npm test -- ProductDetail`).

## Review Focus

1. **Varianten van de productnaam** (kleine letters, spatie vooraan, dubbele spatie, non-breaking space uit Printful): een OLYMPN Sport-product moet dan nog steeds verborgen en geblokkeerd zijn. Test: `lib/unreleased.test.ts` (Task 1).
2. **Gemengde of oude winkelwagen** (een vrijgegeven product plus een OLYMPN Sport-regel, bv. uit een Preview-sessie of een handgemaakte request): de hele checkout geeft 409 en er wordt geen Stripe-sessie gemaakt. Test: `app/api/checkout/route.test.ts` (Task 3).
3. **OG-producten met "Sport" in de naam** (Ink/Butter Sport Tee, de vier Sport Sets in `lib/bundles.ts`) blijven zichtbaar en koopbaar. Test: `lib/unreleased.test.ts` (Task 1) en `lib/catalog.test.ts` (Task 2).
4. **Bedragen rond de verzendgrens** (precies EUR 75,00, EUR 74,99 en een float-som als 3 x 24,95 = 74,85): de getoonde verzendkosten moeten gelijk blijven aan wat de server met `computeShippingCents` rekent. Test: `hooks/useCartTotals.test.ts` (Task 6).
5. **PDP via deeplink `?color=` en one-size-producten** na de refactor: de kleur uit de URL is voorgeselecteerd, een one-size-product is direct toe te voegen, en "Add to cart" voegt de variant van de zichtbare kleur toe. Test: `app/shop/[slug]/ProductDetail.test.tsx` (Task 5).

---

## File Structure

**PR A (`fix/hide-olympn-sport`)**
- Create `lib/unreleased.ts`: enige plek met de prefixlijst en `isUnreleasedProductName`. Tijdelijk: verdwijnt als `lib/drops.ts` op master komt (spec sectie 7, go-live punt 7).
- Create `lib/unreleased.test.ts`
- Modify `lib/catalog.ts`: filter in `getCatalogProducts`.
- Modify `lib/catalog.test.ts`: provider-mocks en tests voor `getCatalogProducts`.
- Modify `app/api/checkout/route.ts`: 409-guard in de regel-loop.
- Create `app/api/checkout/route.test.ts`

**PR B (`refactor/app-shell-hooks`)**
- Modify `package.json` (lint-script), `app/terms/page.tsx`, `components/CookieBanner/CookieBanner.tsx`, `components/Nav/Nav.tsx`, `app/icon.tsx`: bestaande lintfouten weg zodat `npm run lint` groen is.
- Create `components/AppShell/AppShell.tsx` + `AppShell.test.tsx`; delete `components/CartProvider/CartProvider.tsx`; modify `app/layout.tsx`.
- Create `hooks/useVariantPicker.ts` + test; modify `app/shop/[slug]/ProductDetail.tsx`, `components/ProductCarousel/QuickAddCard.tsx`; create `app/shop/[slug]/ProductDetail.test.tsx`.
- Create `hooks/useCartTotals.ts` + test; modify `components/CartDrawer/CartDrawer.tsx`.
- Create `hooks/useCheckout.ts` + test; modify `app/checkout/page.tsx` (gebruikt ook `useCartTotals`).

---

### Task 1: Branch PR A en de naamguard

**Files:**
- Create: `lib/unreleased.ts`
- Test: `lib/unreleased.test.ts`

**Interfaces:**
- Consumes: niets.
- Produces: `export const UNRELEASED_NAME_PREFIXES: readonly string[]` en `export function isUnreleasedProductName(name: string): boolean` uit `@/lib/unreleased`. Task 2 en 3 gebruiken die.

- [ ] **Step 1: Worktree en branch vanaf master**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git fetch origin
git worktree add -b fix/hide-olympn-sport ../7eno-shop-pr-a origin/master
cp .env.local ../7eno-shop-pr-a/.env.local
cd ../7eno-shop-pr-a
npm ci
npm test
```

Expected: `Test Suites: 20 passed, 20 total`. Alle volgende stappen van Task 1 tot en met 3 draaien in `/Users/joep/Documents/Persoonlijk/7eno-shop-pr-a`.

- [ ] **Step 2: Schrijf de falende test**

`lib/unreleased.test.ts`:

```ts
import { isUnreleasedProductName, UNRELEASED_NAME_PREFIXES } from './unreleased'

describe('isUnreleasedProductName', () => {
  it('only lists the OLYMPN Sport prefix (with trailing space)', () => {
    expect(UNRELEASED_NAME_PREFIXES).toEqual(['OLYMPN Sport '])
  })

  it.each([
    'OLYMPN Sport Oversized Hoodie Rose Red',
    'olympn sport oversized hoodie rose red',
    'OLYMPN SPORT Track Pants Black',
    '  OLYMPN Sport Oversized Hoodie Mocha',
    'OLYMPN  Sport Oversized Hoodie Pistachio',
    'OLYMPN Sport Oversized Hoodie Dune',
  ])('treats "%s" as unreleased', (name) => {
    expect(isUnreleasedProductName(name)).toBe(true)
  })

  it.each([
    'Ink/Butter Sport Tee Unisex',
    'Butter/Stone Sport Shorts Unisex',
    'X Life4HSP Sport Tee',
    'Olympian Hoodie Teal',
    'OLYMPN Sportswear Tee',
    'OLYMPN Sport',
    '',
  ])('keeps "%s" visible', (name) => {
    expect(isUnreleasedProductName(name)).toBe(false)
  })
})
```

- [ ] **Step 3: Run de test, verwacht falen**

Run: `npm test -- lib/unreleased`
Expected: FAIL met `Cannot find module './unreleased'`.

- [ ] **Step 4: Minimale implementatie**

`lib/unreleased.ts`:

```ts
/**
 * Fase 0-guard: producten die al in de Printful-store staan maar nog niet
 * uit zijn. Productie toont ze niet en de checkout weigert ze. Deze module
 * verdwijnt zodra de drop-logica (`lib/drops.ts`, redesign/v2) op master staat.
 *
 * De spatie na "Sport" is bewust: OG-namen als "Ink/Butter Sport Tee" en een
 * toekomstige "OLYMPN Sportswear" mogen niet geraakt worden.
 */
export const UNRELEASED_NAME_PREFIXES: readonly string[] = ['OLYMPN Sport ']

/** Witruimte gelijktrekken (ook non-breaking space) en hoofdletterongevoelig maken. */
function comparable(value: string): string {
  return value.replace(/\s+/g, ' ').trimStart().toLowerCase()
}

/** True wanneer de productnaam met een niet-vrijgegeven prefix begint. */
export function isUnreleasedProductName(name: string): boolean {
  const n = comparable(name)
  return UNRELEASED_NAME_PREFIXES.some((prefix) => n.startsWith(comparable(prefix)))
}
```

- [ ] **Step 5: Run de test, verwacht slagen**

Run: `npm test -- lib/unreleased`
Expected: PASS, 14 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/unreleased.ts lib/unreleased.test.ts
git commit -m "fix: add name guard for unreleased OLYMPN Sport products"
```

---

### Task 2: Catalogus verbergt OLYMPN Sport

**Files:**
- Modify: `lib/catalog.ts:1-5` (import) en `lib/catalog.ts:46-53` (`getCatalogProducts`)
- Test: `lib/catalog.test.ts`

**Interfaces:**
- Consumes: `isUnreleasedProductName(name: string): boolean` uit `@/lib/unreleased` (Task 1).
- Produces: `getCatalogProducts(): Promise<NormalizedProduct[]>` met dezelfde signature, zonder OLYMPN Sport-producten. Alle afnemers (`app/page.tsx`, `app/shop/page.tsx`, `app/shop/[slug]/page.tsx` via `findBySlug`, `app/sitemap.ts`, `app/product-feed.xml/route.ts`, `app/olympian/page.tsx`, `app/size-guide/page.tsx`) erven het filter zonder wijziging. Een PDP-URL van een OLYMPN Sport-product geeft daardoor `notFound()`.

- [ ] **Step 1: Schrijf de falende test**

Voeg bovenaan `lib/catalog.test.ts`, direct na de bestaande `import type`-regel, toe:

```ts
import * as printful from '@/lib/printful'
import * as printify from '@/lib/printify'

// Relative paths: SWC rewrites '@/' in imports, not in jest.mock strings.
jest.mock('./printful', () => ({ getProducts: jest.fn(), getProduct: jest.fn() }))
jest.mock('./printify', () => ({ getProducts: jest.fn(), getProduct: jest.fn() }))
```

Voeg onderaan het bestand toe:

```ts
describe('getCatalogProducts', () => {
  const syncProduct = (id: number, name: string) => ({ id, name, thumbnail_url: null, variants: 5, synced: 5 })

  beforeEach(() => {
    jest.mocked(printful.getProducts).mockReset()
    jest.mocked(printify.getProducts).mockReset()
  })

  it('hides unreleased OLYMPN Sport products from both providers', async () => {
    jest.mocked(printful.getProducts).mockResolvedValue([
      syncProduct(1, 'Olympian Hoodie Teal'),
      syncProduct(2, 'OLYMPN Sport Oversized Hoodie Rose Red'),
    ])
    jest.mocked(printify.getProducts).mockResolvedValue([
      { ...pi, id: 'x', name: 'olympn sport tee' },
      pi,
    ])
    const { getCatalogProducts } = await import('./catalog')
    const names = (await getCatalogProducts()).map((p) => p.name)
    expect(names).toEqual(['Olympian Hoodie Teal', 'Olympus Tee'])
  })

  it('keeps OG sport products whose name only contains "Sport"', async () => {
    jest.mocked(printful.getProducts).mockResolvedValue([
      syncProduct(433345476, 'Ink/Butter Sport Tee Unisex'),
      syncProduct(433351405, 'Ink/Butter Sport Shorts Unisex'),
    ])
    jest.mocked(printify.getProducts).mockResolvedValue([])
    const { getCatalogProducts } = await import('./catalog')
    expect((await getCatalogProducts()).map((p) => p.id)).toEqual(['433345476', '433351405'])
  })

  it('still returns the surviving provider when the other one fails', async () => {
    jest.mocked(printful.getProducts).mockRejectedValue(new Error('printful down'))
    jest.mocked(printify.getProducts).mockResolvedValue([pi, { ...pi, id: 'y', name: 'OLYMPN Sport Cap' }])
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getCatalogProducts } = await import('./catalog')
    expect((await getCatalogProducts()).map((p) => p.id)).toEqual(['abc'])
    errorSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- lib/catalog`
Expected: FAIL in `hides unreleased OLYMPN Sport products from both providers`: ontvangen lijst bevat nog `OLYMPN Sport Oversized Hoodie Rose Red` en `olympn sport tee`. De bestaande tests (`mergeCatalogs`, `findBySlug`, `isInStock`) blijven groen.

- [ ] **Step 3: Minimale implementatie**

In `lib/catalog.ts`, voeg na regel 5 (`import * as printify from '@/lib/printify'`) toe:

```ts
import { isUnreleasedProductName } from '@/lib/unreleased'
```

Vervang `getCatalogProducts` (regel 46-53) door:

```ts
/**
 * All products across both providers (list-level; Printful has no variants here).
 * Products of a drop that is not out yet (OLYMPN Sport) are left out, so they
 * can already sit in the Printful store without production showing them.
 */
export async function getCatalogProducts(): Promise<NormalizedProduct[]> {
  const [pf, pi] = await Promise.allSettled([
    printful.getProducts().then((ps) => ps.map(normalizePrintfulProduct)),
    printify.getProducts(),
  ])
  return mergeCatalogs(pf, pi).filter((p) => !isUnreleasedProductName(p.name))
}
```

- [ ] **Step 4: Run de tests, verwacht slagen**

Run: `npm test -- lib/catalog lib/unreleased`
Expected: PASS, alle tests in beide suites.

- [ ] **Step 5: Commit**

```bash
git add lib/catalog.ts lib/catalog.test.ts
git commit -m "fix: hide OLYMPN Sport products from the catalog"
```

---

### Task 3: Checkout weigert OLYMPN Sport met 409, en PR A

**Files:**
- Modify: `app/api/checkout/route.ts:1-12` (import) en `app/api/checkout/route.ts:92-98` (na de `found`-check)
- Test: `app/api/checkout/route.test.ts`

**Interfaces:**
- Consumes: `isUnreleasedProductName(name: string): boolean` (Task 1). De naam komt uit `variantLookup` (server-side opgehaald via `getPrintfulProduct` + `normalizePrintfulDetail`, of `buildPrintifyLookup`), nooit uit `item.productName` van de client.
- Produces: `POST /api/checkout` antwoordt `409 { error: 'One or more products are not available yet' }` zodra een regel een niet-vrijgegeven product is, vóór Supabase en Stripe.

- [ ] **Step 1: Schrijf de falende test**

`app/api/checkout/route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from 'next/server'
import type { NormalizedProduct } from '@/types/catalog'
import { POST } from './route'

const mockCreateSession = jest.fn()
const mockGetPrintfulProduct = jest.fn()

// Every external module is mocked: the route must never reach Stripe,
// Printful, Printify or Supabase from a unit test. Relative paths, because
// SWC rewrites '@/' in imports but not in jest.mock strings.
jest.mock('../../../lib/stripe', () => ({
  stripe: {
    checkout: { sessions: { create: (...args: unknown[]) => mockCreateSession(...args) } },
    coupons: { create: jest.fn() },
  },
}))
jest.mock('../../../lib/printful', () => ({
  getProduct: (...args: unknown[]) => mockGetPrintfulProduct(...args),
}))
jest.mock('../../../lib/printful-normalize', () => ({
  normalizePrintfulDetail: (detail: unknown) => detail,
}))
jest.mock('../../../lib/printify', () => ({ buildVariantLookup: jest.fn(async () => new Map()) }))
jest.mock('../../../lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}))

function product(id: string, name: string): NormalizedProduct {
  return {
    provider: 'printful',
    id,
    name,
    thumbnailUrl: null,
    colors: [],
    currency: 'EUR',
    variants: [
      {
        provider: 'printful', productId: id, id: `v${id}`, name: 'M', size: 'M',
        color: 'Black', colorCode: '#111111', priceCents: 4500, currency: 'EUR',
        inStock: true, imageUrl: null,
      },
    ],
  }
}

const CATALOG: Record<string, NormalizedProduct> = {
  '1': product('1', 'Olympian Hoodie Teal'),
  '2': product('2', 'OLYMPN Sport Oversized Hoodie Rose Red'),
  '3': product('3', 'olympn sport track pants black'),
  '4': product('4', 'Ink/Butter Sport Tee Unisex'),
}

function line(productId: string) {
  return {
    provider: 'printful', productId, variantId: `v${productId}`,
    // The client-side name is deliberately harmless: the guard must use the
    // server-resolved product name, not what the browser sends.
    productName: 'Anything', variantName: 'M', price: '1.00', currency: 'EUR',
    quantity: 1, imageUrl: null,
  }
}

function checkoutRequest(productIds: string[]) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      items: productIds.map(line),
      address: { name: 'Test Klant', line1: 'Coolsingel 1', city: 'Rotterdam', postalCode: '3011AA', country: 'NL' },
    }),
  })
}

beforeEach(() => {
  mockCreateSession.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
  mockGetPrintfulProduct.mockReset().mockImplementation(async (id: string) => CATALOG[id])
})

describe('POST /api/checkout unreleased guard', () => {
  it('refuses an OLYMPN Sport line with 409 and never creates a Stripe session', async () => {
    const res = await POST(checkoutRequest(['2']))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'One or more products are not available yet' })
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('matches the prefix case-insensitively', async () => {
    const res = await POST(checkoutRequest(['3']))
    expect(res.status).toBe(409)
  })

  it('refuses a mixed cart when any line is unreleased', async () => {
    const res = await POST(checkoutRequest(['1', '2']))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('still sells released products, including OG sport tees', async () => {
    const res = await POST(checkoutRequest(['1', '4']))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/s/1' })
    expect(mockCreateSession).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- app/api/checkout`
Expected: FAIL: de drie 409-tests krijgen status `200`; `still sells released products` slaagt al.

- [ ] **Step 3: Minimale implementatie**

In `app/api/checkout/route.ts`, voeg na regel 9 (`import { findPromoCode, type PromoCode } from '@/lib/promo'`) toe:

```ts
import { isUnreleasedProductName } from '@/lib/unreleased'
```

Voeg in de loop `for (const item of items)` direct na het blok `if (!found) { ... }` (huidige regel 93-98) toe:

```ts
    // Fase 0: OLYMPN Sport may already sit in the Printful store, but is not
    // for sale before the drop. Checked against the server-resolved name, so a
    // stale cart or a crafted request cannot buy it early.
    if (isUnreleasedProductName(found.productName)) {
      return NextResponse.json(
        { error: 'One or more products are not available yet' },
        { status: 409 }
      )
    }
```

- [ ] **Step 4: Run de test, verwacht slagen**

Run: `npm test -- app/api/checkout`
Expected: PASS, 4 tests.

- [ ] **Step 5: Volledige kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: tsc zonder output, `Test Suites: 22 passed, 22 total`, build `✓ Compiled successfully`. `npm run lint` is op deze branch nog `next lint` en bestaat in Next 16 niet; dat lost PR B op. Draai daarom hier `npx eslint lib/unreleased.ts lib/unreleased.test.ts lib/catalog.ts lib/catalog.test.ts app/api/checkout/route.ts app/api/checkout/route.test.ts`. Expected: geen output.

- [ ] **Step 6: Commit**

```bash
git add app/api/checkout/route.ts app/api/checkout/route.test.ts
git commit -m "fix: refuse unreleased products at checkout with 409"
```

- [ ] **Step 7: Push en PR A openen (niet mergen)**

```bash
git push -u origin fix/hide-olympn-sport
gh pr create --base master --head fix/hide-olympn-sport \
  --title "fix: hide unreleased OLYMPN Sport products" \
  --body "$(cat <<'BODY'
## Wat
- `lib/unreleased.ts`: naamguard op prefix `OLYMPN Sport ` (hoofdletterongevoelig, witruimte genormaliseerd).
- `getCatalogProducts` laat die producten weg: shop, home, PDP (404), sitemap, product-feed, size guide.
- `POST /api/checkout` geeft 409 op een regel met zo'n product, op basis van de server-side productnaam.

## Waarom
Joep kan de acht OLYMPN Sport-templates na merge direct aan de Printful-store toevoegen zonder dat productie ze toont of verkoopt (spec 2026-10-13, sectie 6, PR A). Verdwijnt als `lib/drops.ts` op master komt.

## Test plan
- [x] `npx tsc --noEmit`
- [x] `npm test` (nieuw: `lib/unreleased.test.ts`, `getCatalogProducts` in `lib/catalog.test.ts`, `app/api/checkout/route.test.ts`)
- [x] `npm run build`
- [ ] Preview: shop toont hetzelfde aantal producten als productie
- [ ] Na merge en "Add to store": `/shop` toont geen OLYMPN Sport, `/shop/<slug>` geeft 404, niet in `/sitemap.xml` en `/product-feed.xml`

Niet mergen zonder akkoord van Joep.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

Expected: PR-URL. Laat de PR open.

---

### Task 4: Branch PR B, lint-script naar ESLint CLI en lint groen

**Files:**
- Modify: `package.json` (script `lint`)
- Modify: `app/terms/page.tsx:52` en `app/terms/page.tsx:68`
- Modify: `components/CookieBanner/CookieBanner.tsx:12-16`
- Modify: `components/Nav/Nav.tsx:25-26`
- Modify: `app/icon.tsx:24`

**Interfaces:**
- Consumes: niets.
- Produces: `npm run lint` draait `eslint .` en eindigt met exit 0. Elke volgende taak gebruikt dat als poort.

- [ ] **Step 1: Worktree en branch vanaf master**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git fetch origin
git worktree add -b refactor/app-shell-hooks ../7eno-shop-pr-b origin/master
cp .env.local ../7eno-shop-pr-b/.env.local
cd ../7eno-shop-pr-b
npm ci
npm test
```

Expected: `Test Suites: 20 passed, 20 total`. Task 4 tot en met 8 draaien in `/Users/joep/Documents/Persoonlijk/7eno-shop-pr-b`. PR B bouwt op `origin/master`, niet op PR A: de twee PR's raken geen gemeenschappelijke bestanden.

- [ ] **Step 2: Zet het lint-script om en zie het falen**

In `package.json`, vervang:

```json
    "lint": "next lint",
```

door:

```json
    "lint": "eslint .",
```

Run: `npm run lint`
Expected: FAIL, `✖ 5 problems (4 errors, 1 warning)`:
- `app/terms/page.tsx` 52 en 68: `react/no-unescaped-entities`
- `components/CookieBanner/CookieBanner.tsx` 14: `react-hooks/set-state-in-effect`
- `components/Nav/Nav.tsx` 26: `react-hooks/set-state-in-effect`
- `app/icon.tsx` 24: unused eslint-disable directive (warning)

- [ ] **Step 3: Los de vijf meldingen op zonder gedrag te wijzigen**

`app/terms/page.tsx` regel 52, vervang `customer's` door `customer&apos;s`:

```tsx
            <p>Return shipping costs are at the customer&apos;s expense unless the product is defective or incorrect.</p>
```

`app/terms/page.tsx` regel 68, vervang `7ENO's` door `7ENO&apos;s`:

```tsx
            <p>7ENO&apos;s liability is limited to the amount paid for the order in question. We are not liable for indirect damages, loss of profit, or consequential loss.</p>
```

`components/CookieBanner/CookieBanner.tsx` regel 12-16 wordt (zelfde patroon als `ProductDetail.tsx`: de waarde komt uit `localStorage`, dus alleen na mount bekend):

```tsx
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
    }
  }, [])
```

`components/Nav/Nav.tsx` regel 25-26 wordt:

```tsx
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
```

`app/icon.tsx` regel 24: verwijder de regel

```tsx
        {/* eslint-disable-next-line @next/next/no-img-element */}
```

- [ ] **Step 4: Run lint, typecheck en tests**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: lint zonder output (exit 0), tsc zonder output, `Test Suites: 20 passed, 20 total`.

- [ ] **Step 5: Commit**

```bash
git add package.json app/terms/page.tsx components/CookieBanner/CookieBanner.tsx components/Nav/Nav.tsx app/icon.tsx
git commit -m "chore: lint with the eslint cli and clear existing lint errors"
```

---

### Task 5: AppShell vervangt CartProvider

**Files:**
- Create: `components/AppShell/AppShell.tsx`
- Test: `components/AppShell/AppShell.test.tsx`
- Delete: `components/CartProvider/CartProvider.tsx`
- Modify: `app/layout.tsx:4` en `app/layout.tsx:127-131`

**Interfaces:**
- Consumes: niets uit eerdere taken.
- Produces: `export default function AppShell({ children }: { children: React.ReactNode }): JSX.Element` in `@/components/AppShell/AppShell`. Fase 1 (redesign/v2) bouwt hierop de nieuwe header en footer.

- [ ] **Step 1: Schrijf de falende test**

`components/AppShell/AppShell.test.tsx`:

```tsx
import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import AppShell from './AppShell'

// Function declaration (hoisted) so the jest.mock factories below can use it.
// jest.mock takes relative paths: SWC rewrites '@/' in imports only.
function mockChrome(testId: string) {
  return createElement('div', { 'data-testid': testId })
}

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))
jest.mock('../Nav/Nav', () => ({ __esModule: true, default: () => mockChrome('nav') }))
jest.mock('../CartDrawer/CartDrawer', () => ({ __esModule: true, default: () => mockChrome('cart-drawer') }))
jest.mock('../Footer/Footer', () => ({ __esModule: true, default: () => mockChrome('footer') }))
jest.mock('../CheckoutHeader/CheckoutHeader', () => ({ __esModule: true, default: () => mockChrome('checkout-header') }))
jest.mock('../StoreHydration/StoreHydration', () => ({ __esModule: true, default: () => mockChrome('store-hydration') }))
jest.mock('../CookieBanner/CookieBanner', () => ({ __esModule: true, default: () => mockChrome('cookie-banner') }))

function renderAt(pathname: string) {
  jest.mocked(usePathname).mockReturnValue(pathname)
  return render(
    <AppShell>
      <p>page content</p>
    </AppShell>
  )
}

const present = (testId: string) => screen.queryByTestId(testId) !== null

describe('AppShell route chrome', () => {
  it.each(['/', '/shop', '/shop/olympian-hoodie-teal', '/account', '/deals'])(
    'renders the full store chrome on %s',
    (path) => {
      renderAt(path)
      expect(present('store-hydration')).toBe(true)
      expect(present('cookie-banner')).toBe(true)
      expect(present('nav')).toBe(true)
      expect(present('cart-drawer')).toBe(true)
      expect(present('footer')).toBe(true)
      expect(present('checkout-header')).toBe(false)
      expect(screen.getByText('page content')).toBeInTheDocument()
    }
  )

  it('keeps the sticky-footer layout wrapper around the page', () => {
    renderAt('/shop')
    const outer = screen.getByText('page content').parentElement?.parentElement
    expect(outer).toHaveStyle({ minHeight: '100vh', display: 'flex', flexDirection: 'column' })
  })

  it.each(['/account/login', '/account/register'])('hides only the footer on %s', (path) => {
    renderAt(path)
    expect(present('nav')).toBe(true)
    expect(present('cart-drawer')).toBe(true)
    expect(present('footer')).toBe(false)
  })

  it('seals /checkout: hydration and checkout header only', () => {
    renderAt('/checkout')
    expect(present('store-hydration')).toBe(true)
    expect(present('checkout-header')).toBe(true)
    expect(present('nav')).toBe(false)
    expect(present('cart-drawer')).toBe(false)
    expect(present('footer')).toBe(false)
    expect(present('cookie-banner')).toBe(false)
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('renders /coming-soon bare, without any chrome or hydration', () => {
    renderAt('/coming-soon')
    for (const id of ['store-hydration', 'checkout-header', 'nav', 'cart-drawer', 'footer', 'cookie-banner']) {
      expect(present(id)).toBe(false)
    }
    expect(screen.getByText('page content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- components/AppShell`
Expected: FAIL met `Cannot find module './AppShell'`.

- [ ] **Step 3: Implementatie (zelfde markup als CartProvider)**

`components/AppShell/AppShell.tsx`:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import Nav from '@/components/Nav/Nav'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import Footer from '@/components/Footer/Footer'
import CheckoutHeader from '@/components/CheckoutHeader/CheckoutHeader'
import StoreHydration from '@/components/StoreHydration/StoreHydration'
import CookieBanner from '@/components/CookieBanner/CookieBanner'

const HIDE_FOOTER = ['/account/login', '/account/register']

/**
 * Route chrome around every page: which header, drawer and footer a route
 * gets. It provides no context; the cart lives in the Zustand store.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showFooter = !HIDE_FOOTER.some((p) => pathname.startsWith(p))

  // The coming-soon teaser is a sealed full-screen page: no nav, cart or footer
  // (nothing to navigate to while the shop is locked).
  if (pathname === '/coming-soon') {
    return <>{children}</>
  }

  // Checkout is a sealed step: no nav, cart drawer or footer, only the centred
  // logo, so the customer stays in the flow until the order is placed.
  // StoreHydration stays so the cart the checkout reads is still loaded.
  if (pathname === '/checkout') {
    return (
      <>
        <StoreHydration />
        <CheckoutHeader />
        {children}
      </>
    )
  }

  return (
    <>
      <StoreHydration />
      <CookieBanner />
      <Nav />
      <CartDrawer />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Layout omzetten en CartProvider verwijderen**

In `app/layout.tsx` regel 4, vervang:

```tsx
import CartProvider from '@/components/CartProvider/CartProvider'
```

door:

```tsx
import AppShell from '@/components/AppShell/AppShell'
```

En regel 127-131:

```tsx
        <AppShell>
          <SmoothScroll />
          <PageTransition />
          {children}
        </AppShell>
```

Verwijder de oude component:

```bash
git rm components/CartProvider/CartProvider.tsx
grep -rn "CartProvider" app components lib hooks store 2>/dev/null
```

Expected: `grep` geeft geen output.

- [ ] **Step 5: Run de tests, typecheck en lint**

Run: `npm test -- components/AppShell && npx tsc --noEmit && npm run lint`
Expected: PASS (10 tests), tsc en lint zonder output.

- [ ] **Step 6: Commit**

```bash
git add components/AppShell app/layout.tsx
git commit -m "refactor: replace CartProvider with AppShell"
```

---

### Task 6: useVariantPicker uit PDP en quick-add

**Files:**
- Create: `hooks/useVariantPicker.ts`
- Test: `hooks/useVariantPicker.test.ts`
- Test (karakterisering, eerst groen op de oude code): `app/shop/[slug]/ProductDetail.test.tsx`
- Modify: `app/shop/[slug]/ProductDetail.tsx:1-14` (imports, `EXCLUDED_SIZES` weg), `:103-188` (state, afgeleiden, effects), `:362` (onClick van de maatknop)
- Modify: `components/ProductCarousel/QuickAddCard.tsx:1-12` (imports, `EXCLUDED_SIZES` weg), `:46-66` (state en maten), `:131-134` (swatch onClick)

**Interfaces:**
- Consumes: niets uit eerdere taken.
- Produces (uit `@/hooks/useVariantPicker`):

```ts
export const HIDDEN_SIZES: ReadonlySet<string>
export interface PickableVariant { id: string; color: string; size: string; name: string; inStock: boolean }
export interface VariantPickerOptions<V extends PickableVariant> { variants: V[]; colors: string[]; initialColor?: string }
export interface VariantPicker<V extends PickableVariant> {
  selectedColor: string
  hasColors: boolean
  colorVariants: V[]
  sizes: V[]            // uniek per maat (size || name), HIDDEN_SIZES eruit, inclusief uitverkocht
  availableSizes: V[]   // sizes waarvoor isAvailable true is
  isAvailable: (variant: V) => boolean
  selectedVariantId: string | null
  selectedVariant: V | null
  selectColor: (color: string) => void         // wist ook de gekozen variant
  selectVariant: (variantId: string | null) => void
}
export function useVariantPicker<V extends PickableVariant>(options: VariantPickerOptions<V>): VariantPicker<V>
```

Beide afnemers geven hun eigen type door (`NormalizedVariant`, `CarouselVariant`); beide voldoen aan `PickableVariant`.

Gelijkwaardigheid met de oude code (zo controleer je de review):
- PDP `allOutOfStock` was `every(...)` ook op een lege lijst; de hook vraagt `length > 0`. Bij een lege `colorVariants` is `sizes` leeg, dus `isAvailable` wordt nergens aangeroepen: geen zichtbaar verschil.
- PDP filterde op `hasColors && selectedColor`, quick-add op `hasColors`. Met `hasColors` is `selectedColor` altijd een niet-lege kleur (beide filteren lege kleuren weg), dus gelijk.
- PDP liet uitverkochte maten zien (uitgeschakeld): gebruikt `sizes`. Quick-add verborg ze: gebruikt `availableSizes`.
- De one-size-autoselect en de `?color=`-deeplink blijven effects in `ProductDetail`, in dezelfde volgorde, zodat de state-volgorde gelijk blijft.

- [ ] **Step 1: Schrijf de karakteriseringstest voor de PDP (oude code)**

`app/shop/[slug]/ProductDetail.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ProductDetail from './ProductDetail'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'

function variant(id: string, color: string, size: string, inStock = true): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${size} / ${color}`, size, color,
    colorCode: color === 'Black' ? '#111111' : '#7b1f2b', priceCents: 4500, currency: 'EUR',
    inStock, imageUrl: null,
  }
}

const twoColours = [
  variant('b-m', 'Black', 'M'),
  variant('b-l', 'Black', 'L', false),
  variant('b-4xl', 'Black', '4XL'),
  variant('r-m', 'Maroon', 'M'),
  variant('r-l', 'Maroon', 'L'),
]

function renderPdp(variants: NormalizedVariant[]) {
  return render(
    <ProductDetail provider="printful" productId="p1" productName="Olympian Tee" variants={variants} />
  )
}

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympian-tee')
})

describe('ProductDetail variant picking', () => {
  it('asks for a size first, then adds the chosen size of the first colour', () => {
    renderPdp(twoColours)
    const cta = screen.getByRole('button', { name: 'Select a size' })
    expect(cta).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['b-m'])
  })

  it('never offers hidden sizes and disables sold-out sizes', () => {
    renderPdp(twoColours)
    expect(screen.queryByRole('button', { name: '4XL' })).toBeNull()
    expect(screen.getByRole('button', { name: 'L' })).toBeDisabled()
  })

  it('clears the chosen size when another colour is picked', () => {
    const { container } = renderPdp(twoColours)
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    const swatches = container.querySelectorAll('button.colorSwatch')
    expect(swatches).toHaveLength(2)
    fireEvent.click(swatches[1])
    expect(screen.getByRole('button', { name: 'Select a size' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'L' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['r-l'])
  })

  it('preselects the colour from a ?color= deep link', () => {
    window.history.replaceState({}, '', '/shop/olympian-tee?color=Maroon')
    renderPdp(twoColours)
    fireEvent.click(screen.getByRole('button', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['r-m'])
  })

  it('auto-selects the only variant of a one-size product', () => {
    renderPdp([variant('cap', '', 'One size')])
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['cap'])
  })
})
```

- [ ] **Step 2: Run de karakterisering op de oude code, verwacht slagen**

Run: `npm test -- ProductDetail`
Expected: PASS, 5 tests. Faalt er een, dan klopt de test niet met het huidige gedrag: pas de test aan, niet de component.

- [ ] **Step 3: Commit de karakterisering**

```bash
git add "app/shop/[slug]/ProductDetail.test.tsx"
git commit -m "test: pin product detail variant picking before the refactor"
```

- [ ] **Step 4: Schrijf de falende hooktest**

`hooks/useVariantPicker.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react'
import { useVariantPicker, HIDDEN_SIZES, type PickableVariant } from './useVariantPicker'

const v = (id: string, color: string, size: string, inStock = true, name = `${size} / ${color}`): PickableVariant =>
  ({ id, color, size, name, inStock })

const variants = [
  v('b-s', 'Black', 'S'),
  v('b-m', 'Black', 'M', false),
  v('b-4xl', 'Black', '4XL'),
  v('b-5xl', 'Black', '5X-Large'),
  v('r-s', 'Maroon', 'S'),
  v('r-m', 'Maroon', 'M'),
]

describe('useVariantPicker', () => {
  it('starts on the first colour and lists only its sizes', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    expect(result.current.hasColors).toBe(true)
    expect(result.current.selectedColor).toBe('Black')
    expect(result.current.sizes.map((s) => s.id)).toEqual(['b-s', 'b-m'])
  })

  it('removes the hidden sizes', () => {
    expect([...HIDDEN_SIZES]).toEqual(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    expect(result.current.sizes.some((s) => HIDDEN_SIZES.has(s.size))).toBe(false)
  })

  it('keeps sold-out sizes in sizes but not in availableSizes', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    const m = result.current.sizes.find((s) => s.id === 'b-m')!
    expect(result.current.isAvailable(m)).toBe(false)
    expect(result.current.availableSizes.map((s) => s.id)).toEqual(['b-s'])
  })

  it('treats every size as available when the whole colour is sold out (pre-sale)', () => {
    const soldOut = [v('a', 'Black', 'S', false), v('b', 'Black', 'M', false)]
    const { result } = renderHook(() => useVariantPicker({ variants: soldOut, colors: ['Black'] }))
    expect(result.current.availableSizes.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('switches colour and clears the selected variant', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    act(() => result.current.selectVariant('b-s'))
    expect(result.current.selectedVariant?.id).toBe('b-s')
    act(() => result.current.selectColor('Maroon'))
    expect(result.current.selectedColor).toBe('Maroon')
    expect(result.current.selectedVariantId).toBeNull()
    expect(result.current.selectedVariant).toBeNull()
    expect(result.current.sizes.map((s) => s.id)).toEqual(['r-s', 'r-m'])
  })

  it('ignores colour filtering for a single-colour product', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black'] }))
    expect(result.current.hasColors).toBe(false)
    expect(result.current.colorVariants).toHaveLength(variants.length)
  })

  it('dedupes by size and falls back to the variant name when size is empty', () => {
    const dupes = [v('1', '', 'M'), v('2', '', 'M'), v('3', '', '', true, 'One size')]
    const { result } = renderHook(() => useVariantPicker({ variants: dupes, colors: [] }))
    expect(result.current.sizes.map((s) => s.id)).toEqual(['2', '3'])
  })

  it('honours initialColor and returns null for an unknown variant id', () => {
    const { result } = renderHook(() =>
      useVariantPicker({ variants, colors: ['Black', 'Maroon'], initialColor: 'Maroon' })
    )
    expect(result.current.selectedColor).toBe('Maroon')
    act(() => result.current.selectVariant('does-not-exist'))
    expect(result.current.selectedVariant).toBeNull()
  })

  it('survives a product without variants', () => {
    const { result } = renderHook(() => useVariantPicker({ variants: [], colors: [] }))
    expect(result.current.selectedColor).toBe('')
    expect(result.current.sizes).toEqual([])
    expect(result.current.availableSizes).toEqual([])
  })
})
```

Let op de dedupe-verwachting `['2', '3']`: `new Map(...)` houdt de **laatste** variant per sleutel, op de plek van de eerste. Dat is het bestaande gedrag van beide componenten.

- [ ] **Step 5: Run de test, verwacht falen**

Run: `npm test -- hooks/useVariantPicker`
Expected: FAIL met `Cannot find module './useVariantPicker'`.

- [ ] **Step 6: Implementeer de hook**

`hooks/useVariantPicker.ts`:

```ts
import { useState } from 'react'

/** Sizes the shop never offers, on the product page and in quick-add alike. */
export const HIDDEN_SIZES: ReadonlySet<string> = new Set([
  '4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large',
])

/** The variant fields the picker needs; NormalizedVariant and CarouselVariant both fit. */
export interface PickableVariant {
  id: string
  color: string
  size: string
  name: string
  inStock: boolean
}

export interface VariantPickerOptions<V extends PickableVariant> {
  variants: V[]
  /** Colour keys in display order. More than one turns on per-colour filtering. */
  colors: string[]
  /** Colour selected on first render. Defaults to the first colour. */
  initialColor?: string
}

export interface VariantPicker<V extends PickableVariant> {
  selectedColor: string
  hasColors: boolean
  colorVariants: V[]
  /** One variant per size (size, else name), hidden sizes removed, sold-out included. */
  sizes: V[]
  /** `sizes` without the ones that cannot be bought. */
  availableSizes: V[]
  isAvailable: (variant: V) => boolean
  selectedVariantId: string | null
  selectedVariant: V | null
  /** Switch colour; the chosen size belongs to the old colour, so it is cleared. */
  selectColor: (color: string) => void
  selectVariant: (variantId: string | null) => void
}

export function useVariantPicker<V extends PickableVariant>({
  variants,
  colors,
  initialColor,
}: VariantPickerOptions<V>): VariantPicker<V> {
  const hasColors = colors.length > 1
  const [selectedColor, setSelectedColor] = useState<string>(initialColor ?? colors[0] ?? '')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const colorVariants = hasColors && selectedColor
    ? variants.filter((v) => v.color === selectedColor)
    : variants

  // When a whole colour is out of stock (pre-sale), every size stays orderable.
  const allOutOfStock = colorVariants.length > 0 && colorVariants.every((v) => v.inStock === false)
  const isAvailable = (v: V) => (allOutOfStock ? true : v.inStock !== false)

  const sizes = Array.from(
    new Map(colorVariants.map((v) => [v.size || v.name, v])).values()
  ).filter((v) => !HIDDEN_SIZES.has(v.size))
  const availableSizes = sizes.filter(isAvailable)

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null

  const selectColor = (color: string) => {
    setSelectedColor(color)
    setSelectedVariantId(null)
  }

  return {
    selectedColor,
    hasColors,
    colorVariants,
    sizes,
    availableSizes,
    isAvailable,
    selectedVariantId,
    selectedVariant,
    selectColor,
    selectVariant: setSelectedVariantId,
  }
}
```

- [ ] **Step 7: Run de hooktest, verwacht slagen**

Run: `npm test -- hooks/useVariantPicker`
Expected: PASS, 9 tests.

- [ ] **Step 8: ProductDetail op de hook zetten**

In `app/shop/[slug]/ProductDetail.tsx`:

Na regel 8 (`import { useCartStore } from '@/store/cart'`) toevoegen:

```tsx
import { useVariantPicker } from '@/hooks/useVariantPicker'
```

Regel 14 (`const EXCLUDED_SIZES = new Set([...])`) en de lege regel erna verwijderen.

Vervang het blok vanaf `const defaultColor = uniqueColors[0]?.color ?? ''` tot en met het `useEffect` dat `added` na 2200 ms reset (huidige regel 103-188) door:

```tsx
  const defaultColor = uniqueColors[0]?.color ?? ''

  const frontFor = (color: string) => frontOverride ?? colorImages[color] ?? baseImageUrl
  const backFor = (color: string) => backOverride ?? colorBackImages[color] ?? null

  const {
    selectedColor,
    selectedVariantId,
    selectedVariant,
    sizes: uniqueSizes,
    isAvailable,
    selectColor,
    selectVariant,
  } = useVariantPicker({ variants, colors: uniqueColors.map((v) => v.color) })
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(frontFor(defaultColor))
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const frontImageUrl = frontFor(selectedColor)
  const backImageUrl = backFor(selectedColor)
  // Front/back mockup first, then the colour's remaining provider mockups
  // (flat, on-model, detail crops), then any local lifestyle photos. Deduped so
  // a mockup that already serves as the front/back isn't repeated.
  const gallery = [
    ...new Set(
      [
        frontImageUrl,
        backImageUrl,
        ...(colorGalleryImages[selectedColor] ?? []),
        ...extraImages,
      ].filter((u): u is string => Boolean(u)),
    ),
  ]

  const handleColorChange = (color: string) => {
    selectColor(color)
    setActiveImageUrl(frontFor(color))
  }

  const handleAddToCart = () => {
    if (!selectedVariant) return
    addItem({
      provider,
      variantId: selectedVariant.id,
      productId,
      productName,
      variantName: selectedVariant.name,
      price: (selectedVariant.priceCents / 100).toFixed(2),
      currency: selectedVariant.currency,
      quantity: 1,
      imageUrl: frontImageUrl,
    })
    setAdded(true)
  }

  // Preselect a color when arriving via a swatch deep-link (/shop/{slug}?color=…)
  useEffect(() => {
    const colorParam = new URLSearchParams(window.location.search).get('color')
    if (!colorParam || !uniqueColors.some((v) => v.color === colorParam)) return
    selectColor(colorParam)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveImageUrl(frontFor(colorParam))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-select the only variant for one-size products (e.g. caps, accessories)
  useEffect(() => {
    if (uniqueSizes.length === 1 && isAvailable(uniqueSizes[0])) {
      selectVariant(uniqueSizes[0].id)
    }
  }, [selectedColor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2200)
    return () => clearTimeout(t)
  }, [added])
```

In de maatknop (huidige regel 362), vervang:

```tsx
                  onClick={() => isAvailable(v) && setSelectedVariantId(v.id)}
```

door:

```tsx
                  onClick={() => isAvailable(v) && selectVariant(v.id)}
```

`const hasColors = uniqueColors.length > 1` (regel 87) blijft staan: de JSX gebruikt het en het is gelijk aan `hasColors` uit de hook.

- [ ] **Step 9: QuickAddCard op de hook zetten**

In `components/ProductCarousel/QuickAddCard.tsx`, vervang regel 1-12 (tot en met de `EXCLUDED_SIZES`-regel) door:

```tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useVariantPicker } from '@/hooks/useVariantPicker'
import type { CarouselItem, CarouselVariant } from './ProductCarousel'
import styles from './QuickAddCard.module.css'
```

Vervang in de component het blok van `const colors = item.colors.filter((c) => c.color)` tot en met `const canQuickAdd = sizes.length > 0` (huidige regel 50-68) door:

```tsx
  const colors = item.colors.filter((c) => c.color)
  // Same size rules as the product page (shared hook), but quick-add only
  // offers sizes that can actually be bought.
  const {
    hasColors,
    selectedColor: activeColor,
    selectColor,
    colorVariants,
    availableSizes: sizes,
  } = useVariantPicker({ variants: item.variants, colors: colors.map((c) => c.color) })
  const [open, setOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const canQuickAdd = sizes.length > 0
```

Vervang in de swatch-knop (huidige regel 131-134):

```tsx
                onClick={() => {
                  setActiveColor(c.color)
                  setJustAdded(false)
                }}
```

door:

```tsx
                onClick={() => {
                  selectColor(c.color)
                  setJustAdded(false)
                }}
```

- [ ] **Step 10: Run alle betrokken tests, typecheck en lint**

Run: `npm test -- ProductDetail QuickAddCard hooks/useVariantPicker && npx tsc --noEmit && npm run lint`
Expected: PASS (5 + 6 + 9 tests), tsc zonder output, lint zonder output. Meldt lint `react-hooks/set-state-in-effect` op `selectColor(colorParam)` of `selectVariant(uniqueSizes[0].id)`, zet dan direct boven die regel `// eslint-disable-next-line react-hooks/set-state-in-effect` (zelfde reden als het origineel) en draai lint opnieuw. Meldt lint `Unused eslint-disable directive`, verwijder die directive.

- [ ] **Step 11: Commit**

```bash
git add hooks/useVariantPicker.ts hooks/useVariantPicker.test.ts "app/shop/[slug]/ProductDetail.tsx" components/ProductCarousel/QuickAddCard.tsx
git commit -m "refactor: extract useVariantPicker from product detail and quick-add"
```

---

### Task 7: useCartTotals, en de cart-drawer erop

**Files:**
- Create: `hooks/useCartTotals.ts`
- Test: `hooks/useCartTotals.test.ts`
- Modify: `components/CartDrawer/CartDrawer.tsx:1-31`

**Interfaces:**
- Consumes: `useCartStore` (`store/cart.ts`, `items: CartItem[]`), `resolveBundleDiscountCents(items: BundleMemberItem[], subtotalCents: number, getBundle: (id: string) => Bundle | null): number` (`lib/bundle-discount.ts`), `getBundle(id: string): Bundle | null` en `type Bundle` (`lib/bundles.ts`), `computeShippingCents(subtotalCents: number): number` en `FREE_SHIPPING_THRESHOLD` (`lib/shipping.ts`).
- Produces (uit `@/hooks/useCartTotals`), gebruikt door Task 8:

```ts
export interface AppliedPromo { code: string; percentOff: number; freeShipping: boolean }
export interface CartTotals {
  subtotal: number             // euro, som van parseFloat(price) * quantity
  subtotalCents: number        // Math.round(subtotal * 100)
  bundleDiscountCents: number  // combi-deal, alleen complete sets
  discountedTotal: number      // euro, subtotaal min combi-deal (cart-drawer)
  shippingCost: number         // euro, 0 bij promo met freeShipping, anders computeShippingCents(subtotalCents) / 100
  freeShipping: boolean        // shippingCost === 0
  remainingForFree: number     // euro, max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  promoDiscount: number        // euro, subtotal * percentOff / 100, 0 zonder promo
  grandTotal: number           // euro, max(0, subtotal + shippingCost - promoDiscount) (checkout)
}
export function computeCartTotals(items: CartItem[], promo?: AppliedPromo | null, getBundle?: (id: string) => Bundle | null): CartTotals
export function useCartTotals(promo?: AppliedPromo | null): CartTotals
```

Bestaand gedrag dat bewust gelijk blijft (niet "repareren" in deze PR, wel in de PR-beschrijving noemen): de checkoutpagina toont geen combi-deal-korting in `grandTotal` (Stripe trekt die er wel af), en de cart-drawer baseert zijn gratis-verzendregel op `discountedTotal` terwijl de server `computeShippingCents` op het subtotaal vóór korting rekent.

- [ ] **Step 1: Schrijf de falende test**

`hooks/useCartTotals.test.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { computeCartTotals, useCartTotals, type AppliedPromo } from './useCartTotals'
import { useCartStore } from '@/store/cart'
import type { Bundle } from '@/lib/bundles'
import type { CartItem } from '@/types/cart'

function item(price: string, quantity = 1, extra: Partial<CartItem> = {}): CartItem {
  return {
    provider: 'printful', variantId: `v-${price}-${quantity}`, productId: `p-${price}`,
    productName: 'Olympian Tee', variantName: 'M', price, currency: 'EUR', quantity,
    imageUrl: null, ...extra,
  }
}

const SET: Bundle = {
  id: 'set', title: 'Test Set', discountCents: 500,
  products: [
    { provider: 'printful', productId: 'tee', slug: 'tee' },
    { provider: 'printful', productId: 'shorts', slug: 'shorts' },
  ],
}
const fixtureBundle = (id: string) => (id === 'set' ? SET : null)

describe('computeCartTotals', () => {
  it('charges the flat rate below the threshold and says how much is missing', () => {
    const t = computeCartTotals([item('29.95', 2)])
    expect(t.subtotal).toBeCloseTo(59.9)
    expect(t.subtotalCents).toBe(5990)
    expect(t.shippingCost).toBe(4.95)
    expect(t.freeShipping).toBe(false)
    expect(t.remainingForFree).toBeCloseTo(15.1)
    expect(t.grandTotal).toBeCloseTo(64.85)
  })

  it.each<{ label: string; items: CartItem[]; shipping: number }>([
    { label: 'exactly 75.00', items: [item('75.00')], shipping: 0 },
    { label: '74.99', items: [item('74.99')], shipping: 4.95 },
    { label: '3 x 24.95 = 74.85 (float sum)', items: [item('24.95', 3)], shipping: 4.95 },
    { label: '3 x 25.00', items: [item('25.00', 3)], shipping: 0 },
  ])('matches the server shipping rule at $label', ({ items, shipping }) => {
    expect(computeCartTotals(items).shippingCost).toBe(shipping)
  })

  it('applies a percentage promo to the product subtotal only', () => {
    const promo: AppliedPromo = { code: 'MAARDANWEL', percentOff: 7, freeShipping: false }
    const t = computeCartTotals([item('50.00')], promo)
    expect(t.promoDiscount).toBeCloseTo(3.5)
    expect(t.shippingCost).toBe(4.95)
    expect(t.grandTotal).toBeCloseTo(51.45)
  })

  it('waives shipping below the threshold for a free-shipping promo', () => {
    const promo: AppliedPromo = { code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true }
    const t = computeCartTotals([item('20.00')], promo)
    expect(t.shippingCost).toBe(0)
    expect(t.freeShipping).toBe(true)
    expect(t.grandTotal).toBeCloseTo(17)
  })

  it('gives the combi-deal discount only for a complete set', () => {
    const tee = item('30.00', 1, { productId: 'tee', bundleId: 'set' })
    const shorts = item('25.00', 1, { productId: 'shorts', bundleId: 'set' })
    const complete = computeCartTotals([tee, shorts], null, fixtureBundle)
    expect(complete.bundleDiscountCents).toBe(500)
    expect(complete.discountedTotal).toBeCloseTo(50)
    const incomplete = computeCartTotals([tee], null, fixtureBundle)
    expect(incomplete.bundleDiscountCents).toBe(0)
    expect(incomplete.discountedTotal).toBeCloseTo(30)
  })

  it('keeps the checkout grand total without the combi-deal (existing behaviour)', () => {
    const tee = item('30.00', 1, { productId: 'tee', bundleId: 'set' })
    const shorts = item('25.00', 1, { productId: 'shorts', bundleId: 'set' })
    expect(computeCartTotals([tee, shorts], null, fixtureBundle).grandTotal).toBeCloseTo(59.95)
  })

  it('treats an unparsable price as zero and an empty cart as flat-rate shipping', () => {
    expect(computeCartTotals([item('abc', 2)]).subtotal).toBe(0)
    const empty = computeCartTotals([])
    expect(empty.subtotal).toBe(0)
    expect(empty.shippingCost).toBe(4.95)
    expect(empty.grandTotal).toBeCloseTo(4.95)
  })
})

describe('useCartTotals', () => {
  beforeEach(() => useCartStore.setState({ items: [], isCartOpen: false }))

  it('reads the items from the cart store', () => {
    useCartStore.setState({ items: [item('40.00', 2)] })
    const { result } = renderHook(() => useCartTotals())
    expect(result.current.subtotal).toBeCloseTo(80)
    expect(result.current.shippingCost).toBe(0)
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- hooks/useCartTotals`
Expected: FAIL met `Cannot find module './useCartTotals'`.

- [ ] **Step 3: Implementeer de hook**

`hooks/useCartTotals.ts`:

```ts
import { useCartStore } from '@/store/cart'
import { getBundle as liveGetBundle, type Bundle } from '@/lib/bundles'
import { resolveBundleDiscountCents } from '@/lib/bundle-discount'
import { computeShippingCents, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import type { CartItem } from '@/types/cart'

/** A discount code the server accepted (see /api/promo/validate). */
export interface AppliedPromo {
  code: string
  percentOff: number
  freeShipping: boolean
}

/**
 * Display totals for the cart drawer and the checkout. Amounts in euro unless
 * the name says cents. Display only: /api/checkout recomputes everything from
 * server-trusted prices.
 */
export interface CartTotals {
  subtotal: number
  subtotalCents: number
  bundleDiscountCents: number
  discountedTotal: number
  shippingCost: number
  freeShipping: boolean
  remainingForFree: number
  promoDiscount: number
  grandTotal: number
}

export function computeCartTotals(
  items: CartItem[],
  promo: AppliedPromo | null = null,
  getBundle: (id: string) => Bundle | null = liveGetBundle,
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0)
  const subtotalCents = Math.round(subtotal * 100)

  const bundleDiscountCents = resolveBundleDiscountCents(
    items.filter((i) => i.bundleId).map((i) => ({ bundleId: i.bundleId!, productId: i.productId, resolved: true })),
    subtotalCents,
    getBundle,
  )

  // Same rule as the server: flat fee, free from the threshold, waived by a
  // free-shipping code.
  const shippingCost = promo?.freeShipping ? 0 : computeShippingCents(subtotalCents) / 100
  // The discount code applies to the product subtotal, never to shipping.
  const promoDiscount = promo ? (subtotal * promo.percentOff) / 100 : 0

  return {
    subtotal,
    subtotalCents,
    bundleDiscountCents,
    discountedTotal: (subtotalCents - bundleDiscountCents) / 100,
    shippingCost,
    freeShipping: shippingCost === 0,
    remainingForFree: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    promoDiscount,
    grandTotal: Math.max(0, subtotal + shippingCost - promoDiscount),
  }
}

/** Totals for the current cart in the store. */
export function useCartTotals(promo: AppliedPromo | null = null): CartTotals {
  const items = useCartStore((s) => s.items)
  return computeCartTotals(items, promo)
}
```

- [ ] **Step 4: Run de test, verwacht slagen**

Run: `npm test -- hooks/useCartTotals`
Expected: PASS, 11 tests.

- [ ] **Step 5: CartDrawer op de hook zetten**

In `components/CartDrawer/CartDrawer.tsx`, vervang regel 1-31 (tot en met `const discountedTotal = ...`) door:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { cartItemKey } from '@/lib/cart-key'
import { productSlug } from '@/lib/slug'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { useCartTotals } from '@/hooks/useCartTotals'
import type { CartItem } from '@/types/cart'
import styles from './CartDrawer.module.css'

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  // Client-side display of the bundle discount. The checkout API re-validates
  // this authoritatively; here it only keeps the shown total honest.
  const { bundleDiscountCents: discountCents, discountedTotal } = useCartTotals()
  const currency = items[0]?.currency ?? 'EUR'
```

De rest van het bestand (vanaf `// Group set items together; ...`) blijft ongewijzigd en gebruikt `discountCents`, `discountedTotal` en `currency` zoals voorheen.

- [ ] **Step 6: Run tests, typecheck en lint**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: alle suites groen (`Test Suites: 24 passed, 24 total`), tsc en lint zonder output.

- [ ] **Step 7: Commit**

```bash
git add hooks/useCartTotals.ts hooks/useCartTotals.test.ts components/CartDrawer/CartDrawer.tsx
git commit -m "refactor: extract useCartTotals and use it in the cart drawer"
```

---

### Task 8: useCheckout uit de checkoutpagina, en PR B

**Files:**
- Create: `hooks/useCheckout.ts`
- Test: `hooks/useCheckout.test.ts`
- Modify: `app/checkout/page.tsx:1-161` (imports, state, handlers) en drie JSX-handlers (promo-input, voorwaarden-checkbox, betaalknop)

**Interfaces:**
- Consumes: `type AppliedPromo` en `useCartTotals(promo?: AppliedPromo | null): CartTotals` uit `@/hooks/useCartTotals` (Task 7); `CartItem` uit `@/types/cart`. Responsevormen: `POST /api/promo/validate` geeft bij succes `{ valid: true, code, percentOff, freeShipping }`, anders `{ error }` met status 400/401/409; `POST /api/checkout` geeft `{ url }` of `{ error }`.
- Produces (uit `@/hooks/useCheckout`):

```ts
export interface AddressForm { name: string; line1: string; line2: string; city: string; postalCode: string; country: string }
export const EMPTY_FORM: AddressForm
export interface PromoMessage { type: 'error' | 'success'; text: string }
export interface UseCheckoutOptions { redirect?: (url: string) => void }
export interface UseCheckout {
  form: AddressForm
  updateField: (key: keyof AddressForm, value: string) => void
  addressComplete: boolean
  agreed: boolean
  changeAgreed: (checked: boolean) => void
  canPay: boolean
  promoInput: string
  changePromoInput: (value: string) => void
  promo: AppliedPromo | null
  promoMsg: PromoMessage | null
  promoNeedsLogin: boolean
  promoLoading: boolean
  applyPromo: () => Promise<void>
  removePromo: () => void
  payLoading: boolean
  payError: string | null
  pay: () => Promise<void>
}
export function useCheckout(items: CartItem[], options?: UseCheckoutOptions): UseCheckout
```

De auth-detectie (`loggedIn` via Supabase) blijft in de pagina: die hoort niet bij formulier, promo of betaling.

- [ ] **Step 1: Schrijf de falende test**

`hooks/useCheckout.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react'
import { useCheckout, EMPTY_FORM } from './useCheckout'
import type { CartItem } from '@/types/cart'

const items: CartItem[] = [
  {
    provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee',
    variantName: 'M', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null,
  },
]

const fetchMock = jest.fn()
const redirect = jest.fn()

function respond(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

function setup() {
  return renderHook(() => useCheckout(items, { redirect }))
}

function fillAddress(result: ReturnType<typeof setup>['result']) {
  act(() => {
    result.current.updateField('name', 'Test Klant')
    result.current.updateField('line1', 'Coolsingel 1')
    result.current.updateField('postalCode', '3011AA')
    result.current.updateField('city', 'Rotterdam')
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  redirect.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

describe('useCheckout address and consent', () => {
  it('starts empty and cannot pay', () => {
    const { result } = setup()
    expect(result.current.form).toEqual(EMPTY_FORM)
    expect(result.current.form.country).toBe('NL')
    expect(result.current.addressComplete).toBe(false)
    expect(result.current.canPay).toBe(false)
  })

  it('needs name, address, postal code and city, ignoring whitespace-only values', () => {
    const { result } = setup()
    fillAddress(result)
    expect(result.current.addressComplete).toBe(true)
    act(() => result.current.updateField('city', '   '))
    expect(result.current.addressComplete).toBe(false)
  })

  it('can pay only with a complete address and accepted terms', () => {
    const { result } = setup()
    fillAddress(result)
    expect(result.current.canPay).toBe(false)
    act(() => result.current.changeAgreed(true))
    expect(result.current.canPay).toBe(true)
  })
})

describe('useCheckout payment', () => {
  it('does nothing when it cannot pay', async () => {
    const { result } = setup()
    await act(async () => { await result.current.pay() })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts items and address and redirects to Stripe', async () => {
    fetchMock.mockResolvedValue(respond(200, { url: 'https://checkout.stripe.test/s/1' }))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(fetchMock).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({ method: 'POST' }))
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ items, address: { ...EMPTY_FORM, name: 'Test Klant', line1: 'Coolsingel 1', postalCode: '3011AA', city: 'Rotterdam' } })
    expect(redirect).toHaveBeenCalledWith('https://checkout.stripe.test/s/1')
    expect(result.current.payLoading).toBe(false)
  })

  it('shows the server error, for example the 409 for an unreleased product', async () => {
    fetchMock.mockResolvedValue(respond(409, { error: 'One or more products are not available yet' }))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(result.current.payError).toBe('One or more products are not available yet')
    expect(redirect).not.toHaveBeenCalled()
  })

  it('falls back to a generic message without an error field', async () => {
    fetchMock.mockResolvedValue(respond(500, {}))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(result.current.payError).toBe('Could not start checkout. Please try again.')
  })

  it('reports a network error and clears it when the form changes', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup()
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(result.current.payError).toBe('Network error. Please try again.')
    expect(result.current.payLoading).toBe(false)
    act(() => result.current.updateField('line2', 'Bus 2'))
    expect(result.current.payError).toBeNull()
  })
})

describe('useCheckout discount code', () => {
  it('ignores a blank code', async () => {
    const { result } = setup()
    act(() => result.current.changePromoInput('   '))
    await act(async () => { await result.current.applyPromo() })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('applies a valid code and sends it with the payment', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { valid: true, code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true }))
    const { result } = setup()
    act(() => result.current.changePromoInput(' 7eno-zgsea '))
    await act(async () => { await result.current.applyPromo() })
    expect(fetchMock).toHaveBeenCalledWith('/api/promo/validate', expect.objectContaining({ body: JSON.stringify({ code: '7eno-zgsea' }) }))
    expect(result.current.promo).toEqual({ code: '7ENO-ZGSEA', percentOff: 15, freeShipping: true })
    expect(result.current.promoMsg).toEqual({ type: 'success', text: 'Code 7ENO-ZGSEA applied: 15% off and free shipping.' })

    fetchMock.mockResolvedValueOnce(respond(200, { url: 'https://checkout.stripe.test/s/2' }))
    fillAddress(result)
    act(() => result.current.changeAgreed(true))
    await act(async () => { await result.current.pay() })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).promoCode).toBe('7ENO-ZGSEA')
  })

  it('asks a guest to log in on 401', async () => {
    fetchMock.mockResolvedValue(respond(401, { error: 'Create an account or log in to use this discount code.' }))
    const { result } = setup()
    act(() => result.current.changePromoInput('MAARDANWEL'))
    await act(async () => { await result.current.applyPromo() })
    expect(result.current.promo).toBeNull()
    expect(result.current.promoNeedsLogin).toBe(true)
    expect(result.current.promoMsg).toEqual({ type: 'error', text: 'Create an account or log in to use this discount code.' })
  })

  it('keeps an applied code on a network error', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { valid: true, code: 'MAARDANWEL', percentOff: 7, freeShipping: false }))
    const { result } = setup()
    act(() => result.current.changePromoInput('MAARDANWEL'))
    await act(async () => { await result.current.applyPromo() })
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await act(async () => { await result.current.applyPromo() })
    expect(result.current.promo?.code).toBe('MAARDANWEL')
    expect(result.current.promoMsg).toEqual({ type: 'error', text: 'Network error. Please try again.' })
    expect(result.current.promoLoading).toBe(false)
  })

  it('removes the code and resets the input and message', async () => {
    fetchMock.mockResolvedValue(respond(200, { valid: true, code: 'MAARDANWEL', percentOff: 7, freeShipping: false }))
    const { result } = setup()
    act(() => result.current.changePromoInput('MAARDANWEL'))
    await act(async () => { await result.current.applyPromo() })
    act(() => result.current.removePromo())
    expect(result.current.promo).toBeNull()
    expect(result.current.promoInput).toBe('')
    expect(result.current.promoMsg).toBeNull()
    expect(result.current.promoNeedsLogin).toBe(false)
  })

  it('clears the message when the code is edited', async () => {
    fetchMock.mockResolvedValue(respond(400, { error: 'This discount code is not valid.' }))
    const { result } = setup()
    act(() => result.current.changePromoInput('NOPE'))
    await act(async () => { await result.current.applyPromo() })
    expect(result.current.promoMsg?.type).toBe('error')
    act(() => result.current.changePromoInput('NOPE2'))
    expect(result.current.promoMsg).toBeNull()
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- hooks/useCheckout`
Expected: FAIL met `Cannot find module './useCheckout'`.

- [ ] **Step 3: Implementeer de hook**

`hooks/useCheckout.ts`:

```ts
import { useState } from 'react'
import type { CartItem } from '@/types/cart'
import type { AppliedPromo } from '@/hooks/useCartTotals'

export interface AddressForm {
  name: string
  line1: string
  line2: string
  city: string
  postalCode: string
  country: string
}

export const EMPTY_FORM: AddressForm = {
  name: '',
  line1: '',
  city: '',
  line2: '',
  postalCode: '',
  country: 'NL',
}

export interface PromoMessage {
  type: 'error' | 'success'
  text: string
}

export interface UseCheckoutOptions {
  /** Where a created Stripe session sends the browser. Injected in tests. */
  redirect?: (url: string) => void
}

export interface UseCheckout {
  form: AddressForm
  updateField: (key: keyof AddressForm, value: string) => void
  addressComplete: boolean
  agreed: boolean
  changeAgreed: (checked: boolean) => void
  canPay: boolean
  promoInput: string
  changePromoInput: (value: string) => void
  promo: AppliedPromo | null
  promoMsg: PromoMessage | null
  promoNeedsLogin: boolean
  promoLoading: boolean
  applyPromo: () => Promise<void>
  removePromo: () => void
  payLoading: boolean
  payError: string | null
  pay: () => Promise<void>
}

function goTo(url: string) {
  window.location.href = url
}

/**
 * Checkout form state, discount code and payment start. The server
 * (/api/promo/validate and /api/checkout) re-validates everything; this hook
 * only drives the page.
 */
export function useCheckout(items: CartItem[], { redirect = goTo }: UseCheckoutOptions = {}): UseCheckout {
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM)
  const [agreed, setAgreed] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  // Discount code state. The code is single-use per account and not combinable
  // with bundle deals; the server re-validates everything before applying it.
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<AppliedPromo | null>(null)
  const [promoMsg, setPromoMsg] = useState<PromoMessage | null>(null)
  const [promoNeedsLogin, setPromoNeedsLogin] = useState(false)
  const [promoLoading, setPromoLoading] = useState(false)

  const addressComplete =
    form.name.trim() !== '' &&
    form.line1.trim() !== '' &&
    form.city.trim() !== '' &&
    form.postalCode.trim() !== ''

  const canPay = addressComplete && agreed

  const updateField = (key: keyof AddressForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setPayError(null)
  }

  const changeAgreed = (checked: boolean) => {
    setAgreed(checked)
    setPayError(null)
  }

  const changePromoInput = (value: string) => {
    setPromoInput(value)
    setPromoMsg(null)
  }

  const applyPromo = async () => {
    const code = promoInput.trim()
    if (code === '') return
    setPromoLoading(true)
    setPromoMsg(null)
    setPromoNeedsLogin(false)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setPromo({ code: data.code, percentOff: data.percentOff, freeShipping: Boolean(data.freeShipping) })
        setPromoMsg({
          type: 'success',
          text: `Code ${data.code} applied: ${data.percentOff}% off${data.freeShipping ? ' and free shipping' : ''}.`,
        })
      } else {
        setPromo(null)
        setPromoNeedsLogin(res.status === 401)
        setPromoMsg({ type: 'error', text: data.error ?? 'Could not apply this code.' })
      }
    } catch {
      setPromoMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromo = () => {
    setPromo(null)
    setPromoInput('')
    setPromoMsg(null)
    setPromoNeedsLogin(false)
  }

  const pay = async () => {
    if (!canPay) return
    setPayLoading(true)
    setPayError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address: form, ...(promo ? { promoCode: promo.code } : {}) }),
      })
      const data = await res.json()
      if (data.url) {
        redirect(data.url)
      } else {
        setPayError(data.error ?? 'Could not start checkout. Please try again.')
      }
    } catch {
      setPayError('Network error. Please try again.')
    } finally {
      setPayLoading(false)
    }
  }

  return {
    form,
    updateField,
    addressComplete,
    agreed,
    changeAgreed,
    canPay,
    promoInput,
    changePromoInput,
    promo,
    promoMsg,
    promoNeedsLogin,
    promoLoading,
    applyPromo,
    removePromo,
    payLoading,
    payError,
    pay,
  }
}
```

- [ ] **Step 4: Run de test, verwacht slagen**

Run: `npm test -- hooks/useCheckout`
Expected: PASS, 14 tests.

- [ ] **Step 5: Checkoutpagina op de hooks zetten**

In `app/checkout/page.tsx`, vervang regel 1 tot en met het einde van `handleCheckout` (huidige regel 1-161) door:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import { cartItemKey } from '@/lib/cart-key'
import {
  ALLOWED_COUNTRIES,
  COUNTRY_NAMES,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_RATE,
} from '@/lib/shipping'
import { useCheckout } from '@/hooks/useCheckout'
import { useCartTotals } from '@/hooks/useCartTotals'
import styles from './checkout.module.css'

export default function CheckoutPage() {
  const { items } = useCartStore()
  const {
    form,
    updateField,
    addressComplete,
    agreed,
    changeAgreed,
    canPay,
    promoInput,
    changePromoInput,
    promo,
    promoMsg,
    promoNeedsLogin,
    promoLoading,
    applyPromo,
    removePromo,
    payLoading,
    payError,
    pay,
  } = useCheckout(items)

  // Detect auth so we only nudge guests to create an account. null = not yet
  // resolved, so we never flash the notice for logged-in customers. Mirrors the
  // AccountButton pattern (getUser + onAuthStateChange).
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const appliedCode = promo?.code ?? null
  const promoPercent = promo?.percentOff ?? 0
  const promoFreeShipping = promo?.freeShipping ?? false

  const hasBundle = items.some((item) => Boolean(item.bundleId))

  // Shipping is a flat fee, free above the threshold, or waived by a discount
  // code. The server recomputes all of this; the page only displays it.
  const {
    subtotal,
    shippingCost,
    freeShipping,
    remainingForFree,
    promoDiscount: discount,
    grandTotal,
  } = useCartTotals(promo)
```

De JSX vanaf `if (items.length === 0) {` blijft gelijk, op drie handlers na.

Promo-input, vervang:

```tsx
                onChange={(e) => {
                  setPromoInput(e.target.value)
                  setPromoMsg(null)
                }}
```

door:

```tsx
                onChange={(e) => changePromoInput(e.target.value)}
```

Voorwaarden-checkbox, vervang:

```tsx
            onChange={(e) => {
              setAgreed(e.target.checked)
              setPayError(null)
            }}
```

door:

```tsx
            onChange={(e) => changeAgreed(e.target.checked)}
```

Betaalknop, vervang:

```tsx
          onClick={handleCheckout}
```

door:

```tsx
          onClick={pay}
```

Controleer dat er geen oude namen over zijn:

```bash
grep -nE "setPromoInput|setPromoMsg|setAgreed|setPayError|handleCheckout|computeShippingCents|EMPTY_FORM|total\(\)" app/checkout/page.tsx
```

Expected: geen output.

- [ ] **Step 6: Volledige kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: tsc zonder output, `Test Suites: 25 passed, 25 total`, lint zonder output, build `✓ Compiled successfully`. De routetabel van de build toont dezelfde routes als voorheen (`/checkout`, `/shop/[slug]`, `/api/checkout` en de rest): geen nieuwe of verdwenen route.

- [ ] **Step 7: Commit**

```bash
git add hooks/useCheckout.ts hooks/useCheckout.test.ts app/checkout/page.tsx
git commit -m "refactor: extract useCheckout from the checkout page"
```

- [ ] **Step 8: Push en PR B openen (niet mergen)**

```bash
git push -u origin refactor/app-shell-hooks
gh pr create --base master --head refactor/app-shell-hooks \
  --title "refactor: extract AppShell and cart/checkout hooks" \
  --body "$(cat <<'BODY'
## Wat
- `components/AppShell/AppShell.tsx` vervangt `CartProvider` (route-chrome: checkout, coming-soon, footer-uitzonderingen). `app/layout.tsx` gebruikt AppShell.
- `hooks/useVariantPicker.ts`: kleur, maat, beschikbaarheid, `HIDDEN_SIZES`, gekozen variant. Gebruikt door PDP en quick-add.
- `hooks/useCartTotals.ts`: subtotaal, combi-deal, promo, verzending via `lib/shipping.ts`. Gebruikt door cart-drawer en checkout.
- `hooks/useCheckout.ts`: formulier, promo-validatie, POST naar `/api/checkout`, fouten.
- `npm run lint` is nu `eslint .` (`next lint` bestaat niet in Next 16); vier bestaande lintfouten opgelost zonder gedragswijziging.

Gedrag en markup ongewijzigd (spec 2026-10-13, sectie 6, PR B). Bewust niet aangepast: de checkout toont de combi-deal-korting niet in het totaal (Stripe trekt die wel af) en de cart-drawer rekent de gratis-verzendregel op het bedrag na combi-deal. Dat blijft voor fase 3.

## Test plan
- [x] `npx tsc --noEmit`
- [x] `npm test` (nieuw: AppShell, ProductDetail-karakterisering, useVariantPicker, useCartTotals, useCheckout)
- [x] `npm run lint`
- [x] `npm run build`
- [ ] Handmatige testbestelling in Stripe testmodus (kaart en iDEAL), zie plan Task 9

Niet mergen zonder akkoord van Joep.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

Expected: PR-URL. Laat de PR open.

---

### Task 9: Handmatige testbestelling vóór merge, daarna redesign/v2 rebasen

**Files:**
- Create (lokaal, nooit committen): `/Users/joep/Documents/Persoonlijk/7eno-shop-pr-b/.env.development.local`
- Geen codewijzigingen.

**Interfaces:**
- Consumes: de open PR's A en B.
- Produces: een testverslag als PR-comment op PR B (en een korte op PR A), en na merge door Joep een gerebasede `redesign/v2`.

Waarom lokaal en niet op de Vercel Preview van de PR-branch: de Preview-env uit spec sectie 7 is gescoped op `redesign/v2`, dus de Preview van `refactor/app-shell-hooks` heeft niet gegarandeerd testsleutels. Lokaal met `.env.development.local` is controleerbaar. Next laadt `.env.development.local` vóór `.env.local` bij `next dev` (`node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`, "Environment Variable Load Order").

- [ ] **Step 1: Testsleutels klaarzetten (vraag Joep om de waarden)**

`.env.development.local` in `/Users/joep/Documents/Persoonlijk/7eno-shop-pr-b`, met de Stripe-testsleutels van Joep:

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # uit stap 2
PRINTFUL_AUTO_CONFIRM=false
PRINTIFY_AUTO_CONFIRM=false
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Controleer vóór elke betaling:

```bash
grep -c "^STRIPE_SECRET_KEY=sk_test_" .env.development.local
grep -c "^PRINTFUL_AUTO_CONFIRM=false" .env.development.local
git status --short --ignored .env.development.local
```

Expected: `1`, `1`, en `!! .env.development.local` (genegeerd, wordt niet gecommit). Is een van de drie anders: stop, niet betalen. `.env.local` bevat `sk_live_`.

- [ ] **Step 2: Webhook en dev-server starten**

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Zet de getoonde `whsec_...` in `.env.development.local` en start in een tweede terminal:

```bash
npm run dev
```

- [ ] **Step 3: Doorloop de winkel (PR B, gedrag gelijk aan productie)**

Vergelijk elke stap met https://7eno.shop in een tweede venster:
1. `/`, `/shop`, `/faq`: header, cart-drawer, footer zoals productie. `/account/login`: geen footer. `/coming-soon`: geen chrome.
2. PDP met meerdere kleuren: kleur wisselen wist de maat, "Select a size" tot een maat gekozen is, 4XL ontbreekt, uitverkochte maat uitgeschakeld. Deeplink `/shop/<slug>?color=<kleur>` selecteert die kleur.
3. Quick-add in de carrousel op home: kleur wisselen, maat kiezen, drawer opent met de juiste kleur.
4. Drawer: aantal +/-, verwijderen, gratis-verzendregel. Voeg via `/deals` een complete set toe: "Combi-deal discount" verschijnt.
5. `/checkout`: subtotaal, verzending (EUR 4,95 onder EUR 75, "Free" erboven), code `MAARDANWEL` als gast geeft de login-melding met link; ingelogd met een testaccount geeft "Code MAARDANWEL applied: 7% off."; "Remove" zet alles terug. Met een set in de cart is het codeveld vervangen door de melding over bundels.
6. Adres invullen, voorwaarden aanvinken, "Pay with Stripe".

- [ ] **Step 4: Betaal twee keer in Stripe testmodus**

1. Kaart `4242 4242 4242 4242`, datum in de toekomst, CVC `123`.
2. iDEAL, testbank, "Authorize".

Per betaling controleren: `/success` toont de order; `stripe listen` toont `checkout.session.completed` met `200`; in Supabase staat een order met `stripe_session_id` beginnend met `cs_test_`; in Printful staat een **concept**-order (niet bevestigd); de bevestigingsmail komt binnen op `ORDER_EMAIL_BCC`; het bedrag in Stripe is gelijk aan wat `/checkout` toonde (bij een set: min EUR 5,00 combi-deal).

- [ ] **Step 5: Opruimen**

Concept-orders in Printful verwijderen, `cs_test_`-orders in Supabase verwijderen (spec sectie 7), `.env.development.local` verwijderen:

```bash
rm .env.development.local
```

- [ ] **Step 6: Verslag op de PR's**

```bash
gh pr comment refactor/app-shell-hooks --body "Handmatige test (Stripe testmodus, lokaal): winkel, PDP, quick-add, drawer, combi-deal, promo (gast en ingelogd), kaart en iDEAL betaald, webhook 200, Supabase-order, Printful-concept, mail ontvangen. Bedragen gelijk aan /checkout. Testdata opgeruimd."
gh pr comment fix/hide-olympn-sport --body "Unit-tests groen. Na merge en Add to store controleren: /shop zonder OLYMPN Sport, /shop/<slug> geeft 404, niet in sitemap.xml en product-feed.xml."
```

Pas de tekst aan als een controle afweek, en noem dan wat afweek. Daarna wacht de uitvoerder op Joep: hij merget A en B.

- [ ] **Step 7: Na merge door Joep: redesign/v2 rebasen op master**

In de hoofdcheckout:

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git status --short
git fetch origin
git switch redesign/v2
git rebase origin/master
npm ci
npx tsc --noEmit && npm test && npm run lint && npm run build
git push -u origin redesign/v2
```

Expected: `git status --short` leeg vóór de rebase; rebase zonder conflicten (redesign/v2 bevat tot nu toe alleen `docs/`); alle vier de checks groen. Staat `redesign/v2` al op origin, gebruik dan `git push --force-with-lease origin redesign/v2`. Ruim daarna de worktrees op:

```bash
git worktree remove ../7eno-shop-pr-a
git worktree remove ../7eno-shop-pr-b
```

Joep voegt na de merge van PR A de acht OLYMPN Sport-templates toe via "Add to store" (spec sectie 4, punt 1) en controleert dat productie ze niet toont.
