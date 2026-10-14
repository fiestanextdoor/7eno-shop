# Fase 1 en 2: fundament en drops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Op `redesign/v2` het nieuwe fundament (tokens, fonts, chrome, dropmodel, allow-list-catalogus, guard, redirects, sitemap/feed) en de drop-gedreven winkel (PLP met filters en griddichtheid, collectiepagina's met aftelklok en waitlist, Archive, home-hero, teaser-PDP) bouwen, zodat de Vercel Preview na elke taak bouwt en te demonstreren is.

**Architecture:** `lib/drops.ts` is de enige bron van waarheid over collecties: welke Printful-producten bij welke editie horen, wanneer een editie live gaat en of iets koopbaar is. `getShopProducts(now)` in `lib/catalog.ts` past die allow-list toe op de Printful-catalogus; elke pagina, de sitemap, de feed en de checkout-guard lezen daaruit. De nieuwe UI staat in `components/ui/*` en gebruikt alleen de nieuwe tokens uit `styles/tokens.css`; oude pagina's blijven werken onder de nieuwe chrome tot ze in fase 3 en 4 worden omgebouwd.

**Tech Stack:** Next.js 16.2.6 (App Router, `proxy.ts`), React 19.2, TypeScript 5 (strict), CSS Modules, `next/font/google`, Zustand 5, Resend 6.13 (contacts), sharp 0.34.5 (via Next), Jest 30 via `next/jest` (jsdom, SWC), @testing-library/react 16, ESLint 9 flat config (`eslint-config-next` 16.2.6, met de React Compiler-regels `react-hooks/purity` en `react-hooks/set-state-in-effect`).

**Spec:** `docs/superpowers/specs/2026-10-13-rebrand-v2-design.md` (sectie 2 tot en met 5 en 9, rijen 1 en 2 in sectie 10). Referentiepatronen: `docs/research/2026-10-13-rebrand-brief.md`.

## Global Constraints

- Alles op branch `redesign/v2` in `/Users/joep/Documents/Persoonlijk/7eno-shop-master`. Nooit `master` aanraken, nooit mergen, nooit `git stash` (gedeeld over worktrees). Een push van `redesign/v2` geeft alleen een Preview.
- `.env.local` bevat een **live** Stripe-sleutel. Geen enkele taak start een echte checkout of opent `/checkout` met betaalgegevens. Unit-tests mocken `stripe`, `printful`, `printify`, `supabase` en `resend` altijd volledig.
- Checkout, Stripe, promo-codes, verzendregels, Printful/Printify-orderflow en het Supabase-schema blijven functioneel gelijk; de enige wijziging is de koopbaarheidsguard (409) in `app/api/checkout/route.ts` (spec sectie 1 en 4).
- Kwaliteitspoort na elke taak: `npx tsc --noEmit && npm test && npm run lint && npm run build`. In Next 16 bestaat `next lint` niet; `npm run lint` is `eslint .`.
- Jest: tests staan naast de bron. `jest.mock()` krijgt een **relatief** pad (geen `@/`, want `next/jest` heeft geen `moduleNameMapper` voor `@/`). Het padargument van `npm test -- <arg>` is een regex. Route handlers en server-only modules krijgen `/** @jest-environment node */`. Componenten met Testing Library (`render`, `screen`, `fireEvent`, `act`). `next/navigation` wordt gemockt waar `useRouter`/`usePathname` gebruikt wordt.
- TS strict. CSS Modules in `components/ui/*` en nieuwe pagina's gebruiken **alleen** de nieuwe tokens (`--c-`, `--f-`, `--fs-`, `--s-`, `--r-`, `--l-`, `--m-`). Oude tokens (`--ink`, `--bone`, `--gutter`, `--font-sans`, `.oly-theme`) blijven onaangeroerd tot fase 5.
- Lint-regel `react-hooks/purity` verbiedt `Date.now()` in een component (ook in async server components). Pagina's halen de tijd via `currentTimeMs()` uit `lib/drops.ts`.
- Geen em-dashes en geen en-dashes, niet in proza, code, commentaar of commitberichten. Commits: conventional commits in het Engels (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- Kleuren (spec sectie 2): `--c-bg #F7F1DA`, `--c-surface #FFFFFF`, `--c-stone #C4C4B5`, `--c-text #2D3A4F`, `--c-text-muted #5B5A58`, `--c-border-strong #8A897F`, `--c-accent #7995C7`, `--c-accent-ink #3E5A8F`, `--c-live #FEAB27`, `--c-sage #BACCB1`, `--c-rose #E8697D`, `--c-peach #F5C190`, `--c-inverse-bg #2D3A4F`, `--c-inverse-text #F7F1DA`, `--c-success #3E5A2E`, `--c-error #A32020`, `--c-focus #2D3A4F`; swatches `#621926` rose red, `#9CAF92` pistachio, `#9E7551` mocha, `#0E0B0B` obsidian, `#C3B99C` dune, `#3C3D2E` olive, `#071429` maritime. Pastels en `--c-live` nooit als tekst op crème; tekst is altijd navy.
- Type: `--f-display` Archivo (variabel, `wght` 900, `wdth` 125, cursief voor drop-titels, terugval Archivo Black), `--f-body` Instrument Sans 400/500/600, `--f-mono` IBM Plex Mono 400/500; `--fs-display clamp(2.75rem, 8vw, 7.5rem)`, `--fs-h1 clamp(2rem, 5vw, 4rem)`, `--fs-h2 clamp(1.5rem, 3vw, 2.25rem)`, `--fs-h3 1.25rem`, `--fs-body 1rem`, `--fs-small 0.875rem`, `--fs-label 0.75rem` (labels uppercase, `letter-spacing: 0.08em`). Koppen uppercase, `line-height: 0.95`; body `line-height: 1.5`; klok en prijs `font-variant-numeric: tabular-nums`.
- Maat: `--s-1` tot `--s-10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px; `--r-0 0`, `--r-1 2px`; `--l-gutter` 16px (24px vanaf 768px, 32px vanaf 1200px); `--l-grid-gap 2px`; `--l-max 1600px`; `--l-text-max 68ch`; `--l-nav` 56px (64px vanaf 1024px); `--l-announce 32px`.
- Motion: `--m-fast 120ms`, `--m-base 200ms`, `--m-slow 400ms`, `--m-ease cubic-bezier(0.2, 0, 0, 1)`, `--m-ease-out cubic-bezier(0.16, 1, 0.3, 1)`. Alleen `transform` en `opacity` animeren. Onder `prefers-reduced-motion: reduce` alle duren `0.01ms` en de announcement-bar stil. Geen GSAP, geen Lenis, geen `PageTransition`.
- Focus: 2px solide `--c-focus` met 2px offset; op donkere vlakken `--c-inverse-text`.
- Navigatie: Shop, Olympian, OLYMPN Sport, Archive, About; rechts account en cart met aantal.
- Routes (spec sectie 3): `/shop?collection=olympian|olympn-sport`, `?category=tees|knits|hoodies|bags`, `?sort=`; `?gender` en `?line` vervallen. `/collections/[slug]` en `/archive` nieuw. 308: `/olympian` naar `/collections/olympian`; `/deals` en `/deals/[slug]` naar `/shop`; `/coming-soon` naar `/`; `/shop?line=olympian` naar `/collections/olympian` (`has: query`); `/shop?line=og` naar `/shop`. PDP van een product zonder drop: `permanentRedirect('/shop')`. Query gaat mee naar de bestemming.
- Drops (spec sectie 4): Olympian editie 1, `startsAt 2026-06-19T19:00:00+02:00`, `endsAt null`, prefix `Olympian `, `teaser: false`. OLYMPN Sport editie 2, `startsAt 2026-11-01T12:00:00+01:00`, `endsAt null`, prefix `OLYMPN Sport `, `tone: 'dark'`, `teaser: true`, `waitlist: true`, lineup = de acht template-mockups in `public/drops/olympn-sport/`. Sync-id gaat voor op naam; `matchDrop` matcht alleen `provider: 'printful'`; prefixen hoofdletterongevoelig.
- Env: `SITE_PREVIEW_KEY` (cookie maakt een upcoming drop live voor QA, alleen buiten `VERCEL_ENV=production`), `RESEND_API_KEY`, `RESEND_WAITLIST_AUDIENCE_ID`. Geen Supabase-wijziging.
- Productbeeld: mockup op `--c-surface`, verhouding 4:5, `object-fit: contain`. Tegels met vaste `aspect-ratio`; eerste rij tegels `loading="eager"`; hero-beeld `fetchPriority="high"` (spec sectie 9).

## Review Focus

1. **De klok op de exacte releaseseconde, NL-tijd tegen UTC** (`2026-11-01T10:59:59.999Z` is nog upcoming, `2026-11-01T11:00:00.000Z` is live; Olympian op `2026-06-19T17:00:00Z`; een machine in een andere tijdzone mag niets veranderen): status, koopbaarheid en de checkout-guard kantelen op dezelfde milliseconde. Tests: `lib/drops.test.ts` (Task 6) en `app/api/checkout/route.test.ts` (Task 8).
2. **Een Printful-product met een onverwachte naam** (kleine letters, spatie of non-breaking space vooraan, dubbele spatie, `OLYMPN Sportswear Tee`, OG `Ink/Butter Sport Tee Unisex`, een Printify-product dat `Olympian Tee` heet, een sync-id die bij de ene drop staat terwijl de naam bij de andere past): alleen echte drop-producten verschijnen, sync-id wint, Printify nooit. Tests: `lib/drops.test.ts` (Task 6) en `lib/catalog.test.ts` (Task 7).
3. **`localStorage` geblokkeerd of kapot** (accessor gooit `SecurityError`, `setItem` gooit `QuotaExceededError`, opgeslagen waarde is geen JSON of een onbekend getal): de griddichtheid valt terug op mobiel 2 en desktop 4 en de schakelaar blijft werken. Test: `hooks/useGridDensity.test.tsx` (Task 12).
4. **Waitlist dubbel verstuurd** (twee klikken snel achter elkaar, Enter plus klik, of hetzelfde adres nog eens nadat het al op de lijst staat): één request vanuit de browser, en een bestaand contact geeft gewoon "You're on the list". Tests: `components/ui/WaitlistForm/WaitlistForm.test.tsx` en `lib/waitlist-resend.test.ts` (Task 15).
5. **Redirect met extra query** (`/shop?line=og&category=tees&utm_source=ig`, `/shop?line=OG`, `/deals/x?utm_source=ig`): 308 naar de bestemming met de overige parameters, en `/shop?line=og` mag nooit naar zichzelf blijven doorsturen (de `has`-redirect van Next geeft de query door en zou een lus geven). Tests: `lib/legacy-redirects.test.ts` en `next.config.test.ts` (Task 9).

---

## File Structure

**Fase 1: fundament**
- `styles/tokens.css` (+ `styles/tokens.test.ts`): alle tokens uit spec sectie 2, `--l-chrome` als som van announce en nav, reduced-motion-regel.
- `app/layout.tsx`: drie nieuwe fonts naast de oude, `tokens.css` na `globals.css`, zonder `SmoothScroll` en `PageTransition`.
- `components/ui/Button`, `components/ui/Badge`: knoppen (radius 0) en labels.
- `hooks/useFocusTrap.ts`: focus-trap, Esc en scroll-lock voor elk dialoogvlak.
- `components/ui/Drawer`: basis voor de filterlade (fase 2) en de cart (fase 3).
- `lib/nav.ts`: hoofdnavigatie, footerlinks, announcement-teksten.
- `components/ui/SiteHeader`, `components/ui/MobileNav`, `components/ui/AnnouncementBar`, `components/ui/SiteFooter`: de nieuwe chrome; `components/AppShell/AppShell.tsx` monteert ze.
- `lib/drops.ts` (+ test): types, de twee edities, status, match, koopbaarheid, labels, `DropView`.
- `lib/preview.ts`, `lib/preview-session.ts` (+ tests): de `SITE_PREVIEW_KEY`-cookie; `proxy.ts` zet hem.
- `scripts/download-drop-mockups.mjs` en `public/drops/olympn-sport/*.webp`: de lineup.
- `lib/catalog.ts` (+ test): `ShopProduct`, `getShopProducts`, `isRetiredProductSlug`. `lib/bundles.ts`: lege lijst.
- `app/api/checkout/route.ts` (+ test): `isPurchasable` per regel. `lib/unreleased.ts` verdwijnt.
- `next.config.ts` (+ `next.config.test.ts`), `lib/legacy-redirects.ts` (+ test), `proxy.ts`: redirects; seal, `lib/release.ts`, `/coming-soon`, `/olympian` en `/deals`-pagina's weg.
- `lib/product-classify.ts`, `lib/merchant-feed.ts`, `app/product-feed.xml/route.ts`, `app/sitemap.ts` (+ tests): soorten en alleen live drops.

**Fase 2: shop en drops**
- `lib/tiles.ts` (+ test) en `components/ui/ProductTile`: tegeldata en tegel.
- `hooks/useGridDensity.ts` (+ test) en `components/ui/GridDensityToggle`.
- `lib/shop-query.ts` (+ test) en `components/ui/FilterBar`.
- `components/ui/ShopView` en `app/shop/page.tsx` + `app/shop/shop.module.css`: de PLP.
- `lib/waitlist.ts`, `lib/waitlist-resend.ts`, `app/api/waitlist/route.ts` (+ tests) en `components/ui/WaitlistForm`.
- `components/ui/Countdown`, `components/ui/DropBlock`, `components/ui/EditionCard`.
- `app/collections/[slug]/page.tsx`, `app/archive/page.tsx` (+ tests).
- `app/page.tsx` (hero), `app/shop/[slug]/page.tsx` en `ProductDetail.tsx` (teaser-guard).

Regelnummers in de Modify-regels gelden voor commit `16d8c3c` (de huidige `redesign/v2`). Raakt een eerdere taak hetzelfde bestand, dan staat dat erbij; de Edit-stappen ankeren altijd op exacte tekst.

---

### Voorbereiding

- [ ] **Step 1: Schone branch en groene basis**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git switch redesign/v2
git status --short
npm ci
npm test
```

Expected: `git status --short` is leeg; `Test Suites: 27 passed, 27 total`. Is de tree niet schoon, stop en vraag Joep wat er met de wijzigingen moet gebeuren (geen `git stash`).

---

### Task 1: Design-tokens en fonts

**Files:**
- Create: `styles/tokens.css`
- Test: `styles/tokens.test.ts`
- Modify: `app/layout.tsx:1-8` (imports), `app/layout.tsx:10-29` (fonts), `app/layout.tsx:101` (`className`), `app/layout.tsx:126-131` (body)
- Modify: `package.json:19` (`lenis`), `package-lock.json`
- Delete: `components/SmoothScroll/SmoothScroll.tsx`, `components/PageTransition/PageTransition.tsx`, `components/PageTransition/PageTransition.module.css`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` (regel 160-170 `axes`, regel 208-220 `adjustFontFallback`, regel 222 `variable`). Archivo heeft in `next/font` de assen `wdth` (62-125) en `wght` (100-900) en stijlen `normal`/`italic`; Instrument Sans is variabel (400-700); IBM Plex Mono is niet variabel en krijgt dus `weight` (bron: `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`).

**Interfaces:**
- Consumes: niets.
- Produces: CSS-variabelen uit Global Constraints plus `--l-chrome: calc(var(--l-announce) + var(--l-nav))`; font-variabelen `--font-archivo`, `--font-instrument`, `--font-plex-mono` op `<html>`; selector `[data-announcement-track]` die onder reduced motion stilstaat (Task 5 zet dat attribuut).

- [ ] **Step 1: Schrijf de falende test**

`styles/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'

const css = readFileSync(path.join(process.cwd(), 'styles/tokens.css'), 'utf8')
const layout = readFileSync(path.join(process.cwd(), 'app/layout.tsx'), 'utf8')

/** The full block that opens with `selector {`, braces balanced. */
function block(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`)
  if (start === -1) return ''
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return ''
}

const root = block(css, ':root')

const TOKENS: [string, string][] = [
  ['--c-bg', '#F7F1DA'],
  ['--c-surface', '#FFFFFF'],
  ['--c-stone', '#C4C4B5'],
  ['--c-text', '#2D3A4F'],
  ['--c-text-muted', '#5B5A58'],
  ['--c-border-strong', '#8A897F'],
  ['--c-accent', '#7995C7'],
  ['--c-accent-ink', '#3E5A8F'],
  ['--c-live', '#FEAB27'],
  ['--c-sage', '#BACCB1'],
  ['--c-rose', '#E8697D'],
  ['--c-peach', '#F5C190'],
  ['--c-inverse-bg', '#2D3A4F'],
  ['--c-inverse-text', '#F7F1DA'],
  ['--c-success', '#3E5A2E'],
  ['--c-error', '#A32020'],
  ['--c-focus', '#2D3A4F'],
  ['--c-swatch-rose-red', '#621926'],
  ['--c-swatch-pistachio', '#9CAF92'],
  ['--c-swatch-mocha', '#9E7551'],
  ['--c-swatch-obsidian', '#0E0B0B'],
  ['--c-swatch-dune', '#C3B99C'],
  ['--c-swatch-olive', '#3C3D2E'],
  ['--c-swatch-maritime', '#071429'],
  ['--f-display', "var(--font-archivo), 'Archivo Black', 'Arial Black', sans-serif"],
  ['--f-body', 'var(--font-instrument), system-ui, sans-serif'],
  ['--f-mono', 'var(--font-plex-mono), ui-monospace, monospace'],
  ['--fs-display', 'clamp(2.75rem, 8vw, 7.5rem)'],
  ['--fs-h1', 'clamp(2rem, 5vw, 4rem)'],
  ['--fs-h2', 'clamp(1.5rem, 3vw, 2.25rem)'],
  ['--fs-h3', '1.25rem'],
  ['--fs-body', '1rem'],
  ['--fs-small', '0.875rem'],
  ['--fs-label', '0.75rem'],
  ['--s-1', '4px'],
  ['--s-2', '8px'],
  ['--s-3', '12px'],
  ['--s-4', '16px'],
  ['--s-5', '24px'],
  ['--s-6', '32px'],
  ['--s-7', '48px'],
  ['--s-8', '64px'],
  ['--s-9', '96px'],
  ['--s-10', '128px'],
  ['--r-0', '0'],
  ['--r-1', '2px'],
  ['--l-gutter', '16px'],
  ['--l-grid-gap', '2px'],
  ['--l-max', '1600px'],
  ['--l-text-max', '68ch'],
  ['--l-nav', '56px'],
  ['--l-announce', '32px'],
  ['--l-chrome', 'calc(var(--l-announce) + var(--l-nav))'],
  ['--m-fast', '120ms'],
  ['--m-base', '200ms'],
  ['--m-slow', '400ms'],
  ['--m-ease', 'cubic-bezier(0.2, 0, 0, 1)'],
  ['--m-ease-out', 'cubic-bezier(0.16, 1, 0.3, 1)'],
]

describe('styles/tokens.css', () => {
  it.each(TOKENS)('defines %s as %s on :root', (name, value) => {
    expect(root).toContain(`${name}: ${value};`)
  })

  it('steps the gutter and nav height up at the spec breakpoints', () => {
    expect(block(css, '@media (min-width: 768px)')).toContain('--l-gutter: 24px;')
    expect(block(css, '@media (min-width: 1024px)')).toContain('--l-nav: 64px;')
    expect(block(css, '@media (min-width: 1200px)')).toContain('--l-gutter: 32px;')
  })

  it('collapses every duration and stops the announcement bar under reduced motion', () => {
    const reduced = block(css, '@media (prefers-reduced-motion: reduce)')
    for (const name of ['--m-fast', '--m-base', '--m-slow']) {
      expect(reduced).toContain(`${name}: 0.01ms;`)
    }
    expect(reduced).toContain('[data-announcement-track]')
    expect(reduced).toContain('animation: none')
  })

  it('declares only the new prefixes, so it can never clash with --ink or --gutter', () => {
    const declared = [...css.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(50)
    for (const name of declared) expect(name).toMatch(/^--(c|f|fs|s|r|l|m)-/)
  })

  it('is imported after globals.css in the root layout', () => {
    const globals = layout.indexOf("import '@/styles/globals.css'")
    const tokens = layout.indexOf("import '@/styles/tokens.css'")
    expect(globals).toBeGreaterThan(-1)
    expect(tokens).toBeGreaterThan(globals)
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- styles/tokens`
Expected: FAIL, `ENOENT: no such file or directory, open '.../styles/tokens.css'`.

- [ ] **Step 3: Schrijf `styles/tokens.css`**

```css
/*
 * 7ENO rebrand v2 design tokens (spec section 2). New prefixes only, so they
 * sit next to the old tokens in globals.css without clashing. New components
 * use these tokens and nothing else.
 */
:root {
  /* Colour */
  --c-bg: #F7F1DA;
  --c-surface: #FFFFFF;
  --c-stone: #C4C4B5;
  --c-text: #2D3A4F;
  --c-text-muted: #5B5A58;
  --c-border-strong: #8A897F;
  --c-accent: #7995C7;
  --c-accent-ink: #3E5A8F;
  --c-live: #FEAB27;
  --c-sage: #BACCB1;
  --c-rose: #E8697D;
  --c-peach: #F5C190;
  --c-inverse-bg: #2D3A4F;
  --c-inverse-text: #F7F1DA;
  --c-success: #3E5A2E;
  --c-error: #A32020;
  --c-focus: #2D3A4F;
  --c-swatch-rose-red: #621926;
  --c-swatch-pistachio: #9CAF92;
  --c-swatch-mocha: #9E7551;
  --c-swatch-obsidian: #0E0B0B;
  --c-swatch-dune: #C3B99C;
  --c-swatch-olive: #3C3D2E;
  --c-swatch-maritime: #071429;

  /* Type */
  --f-display: var(--font-archivo), 'Archivo Black', 'Arial Black', sans-serif;
  --f-body: var(--font-instrument), system-ui, sans-serif;
  --f-mono: var(--font-plex-mono), ui-monospace, monospace;
  --fs-display: clamp(2.75rem, 8vw, 7.5rem);
  --fs-h1: clamp(2rem, 5vw, 4rem);
  --fs-h2: clamp(1.5rem, 3vw, 2.25rem);
  --fs-h3: 1.25rem;
  --fs-body: 1rem;
  --fs-small: 0.875rem;
  --fs-label: 0.75rem;

  /* Space */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 48px;
  --s-8: 64px;
  --s-9: 96px;
  --s-10: 128px;

  /* Radius */
  --r-0: 0;
  --r-1: 2px;

  /* Layout */
  --l-gutter: 16px;
  --l-grid-gap: 2px;
  --l-max: 1600px;
  --l-text-max: 68ch;
  --l-nav: 56px;
  --l-announce: 32px;
  --l-chrome: calc(var(--l-announce) + var(--l-nav));

  /* Motion */
  --m-fast: 120ms;
  --m-base: 200ms;
  --m-slow: 400ms;
  --m-ease: cubic-bezier(0.2, 0, 0, 1);
  --m-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

@media (min-width: 768px) {
  :root {
    --l-gutter: 24px;
  }
}

@media (min-width: 1024px) {
  :root {
    --l-nav: 64px;
  }
}

@media (min-width: 1200px) {
  :root {
    --l-gutter: 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --m-fast: 0.01ms;
    --m-base: 0.01ms;
    --m-slow: 0.01ms;
  }

  [data-announcement-track] {
    animation: none !important;
    transform: none !important;
  }
}
```

- [ ] **Step 4: Fonts en import in `app/layout.tsx`**

Vervang regel 1-8:

```tsx
import type { Metadata, Viewport } from 'next'
import { Space_Mono, Cormorant_Garamond, Archivo, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import AppShell from '@/components/AppShell/AppShell'
import { BASE_URL, BRAND_KEYWORDS, organizationJsonLd, webSiteJsonLd } from '@/lib/seo'
import '@/styles/globals.css'
import '@/styles/tokens.css'
```

Voeg direct na het `spaceMono`-blok (na regel 29) toe:

```tsx

// Rebrand v2 type (spec section 2). Archivo is loaded as a variable font with
// the width axis, so the display face can run at wdth 125 / wght 900 and in
// italic for drop titles. adjustFontFallback keeps the swap from shifting the
// layout (CLS). Self-hosted by next/font, so the CSP stays `font-src 'self'`.
const archivo = Archivo({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
  adjustFontFallback: true,
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  adjustFontFallback: true,
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
  adjustFontFallback: true,
})
```

Vervang de `<html>`-regel (regel 101):

```tsx
    <html
      lang="en"
      className={`${cormorant.variable} ${spaceMono.variable} ${archivo.variable} ${instrumentSans.variable} ${plexMono.variable}`}
    >
```

Vervang het body-blok (regel 126-131):

```tsx
      <body>
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
```

- [ ] **Step 5: Lenis en de paginatransitie weg**

```bash
npm uninstall lenis
git rm components/SmoothScroll/SmoothScroll.tsx components/PageTransition/PageTransition.tsx components/PageTransition/PageTransition.module.css
git grep -n -E "SmoothScroll|PageTransition|from 'lenis'" -- '*.ts' '*.tsx'
```

Expected: de grep geeft niets. De `data-lenis-prevent`-attributen in `CartDrawer` en `QuickAddCard` zijn nu betekenisloos maar onschadelijk; fase 3 vervangt die markup.

- [ ] **Step 6: Run de test, verwacht slagen**

Run: `npm test -- styles/tokens`
Expected: PASS, 62 tests.

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `next build` haalt de drie Google Fonts op en host ze zelf.

- [ ] **Step 8: Commit**

```bash
git add styles/tokens.css styles/tokens.test.ts app/layout.tsx package.json package-lock.json
git commit -m "feat: add v2 design tokens and fonts, drop Lenis and page transition"
```

---

### Task 2: Button en Badge

**Files:**
- Create: `components/ui/Button/Button.tsx`, `components/ui/Button/Button.module.css`
- Test: `components/ui/Button/Button.test.tsx`
- Create: `components/ui/Badge/Badge.tsx`, `components/ui/Badge/Badge.module.css`
- Test: `components/ui/Badge/Badge.test.tsx`

**Interfaces:**
- Consumes: tokens uit Task 1.
- Produces:
  - `export type ButtonVariant = 'primary' | 'accent' | 'ghost'`, `export type ButtonSize = 'md' | 'lg'`
  - `export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }`
  - `export default function Button(props: ButtonProps)` (default `type="button"`, `loading` zet `disabled` en `aria-busy`)
  - `export function buttonClasses(variant?: ButtonVariant, size?: ButtonSize): string` voor een `<Link>` die eruitziet als knop
  - `export type BadgeKind = 'new' | 'coming' | 'sold-out' | 'edition'`
  - `export const BADGE_LABELS: Record<Exclude<BadgeKind, 'edition'>, string>` = `{ new: 'New in', coming: 'Coming soon', 'sold-out': 'Sold out' }`
  - `export default function Badge({ kind, children }: { kind: BadgeKind; children?: ReactNode })`

- [ ] **Step 1: Schrijf de falende tests**

`components/ui/Button/Button.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button, { buttonClasses } from './Button'

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>Shop the drop</Button>)
    const button = screen.getByRole('button', { name: 'Shop the drop' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('button', 'primary', 'md')
  })

  it('applies the variant and size classes', () => {
    render(<Button variant="accent" size="lg">Notify me</Button>)
    expect(screen.getByRole('button', { name: 'Notify me' })).toHaveClass('accent', 'lg')
  })

  it('is disabled and busy while loading, and ignores clicks', () => {
    const onClick = jest.fn()
    render(<Button loading onClick={onClick}>Notify me</Button>)
    const button = screen.getByRole('button', { name: 'Notify me' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes clicks through when idle', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('exposes the same classes for links styled as buttons', () => {
    expect(buttonClasses('ghost', 'lg')).toBe('button ghost lg')
    expect(buttonClasses()).toBe('button primary md')
  })
})
```

`components/ui/Badge/Badge.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it.each([
    ['new', 'New in'],
    ['coming', 'Coming soon'],
    ['sold-out', 'Sold out'],
  ] as const)('renders the %s badge with its fixed label', (kind, label) => {
    render(<Badge kind={kind} />)
    const badge = screen.getByText(label)
    expect(badge).toHaveAttribute('data-kind', kind)
    expect(badge).toHaveClass('badge', kind)
  })

  it('renders an edition badge with the given text', () => {
    render(<Badge kind="edition">Edition 02</Badge>)
    expect(screen.getByText('Edition 02')).toHaveAttribute('data-kind', 'edition')
  })

  it('lets a caller override the fixed label', () => {
    render(<Badge kind="coming">Drops 1 November</Badge>)
    expect(screen.getByText('Drops 1 November')).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).toBeNull()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- components/ui/(Button|Badge)`
Expected: FAIL, `Cannot find module './Button'` en `Cannot find module './Badge'`.

- [ ] **Step 3: Implementeer Button**

`components/ui/Button/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'ghost'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner, disables the button and marks it busy. */
  loading?: boolean
}

/** Class list for a button, also used by links that look like one. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return [styles.button, styles[variant], styles[size]].join(' ')
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={[buttonClasses(variant, size), className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
    </button>
  )
}
```

`components/ui/Button/Button.module.css`:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  border: 1px solid transparent;
  border-radius: var(--r-0);
  font-family: var(--f-body);
  font-weight: 600;
  font-size: var(--fs-small);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: opacity var(--m-fast) var(--m-ease);
}

.button:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.md {
  min-height: 44px;
  padding: 0 var(--s-5);
}

.lg {
  min-height: 52px;
  padding: 0 var(--s-6);
  font-size: var(--fs-body);
}

.primary {
  background: var(--c-text);
  color: var(--c-inverse-text);
}

.accent {
  background: var(--c-accent);
  color: var(--c-text);
  /* Navy on periwinkle is 3.8:1: enough only for large text (WCAG 1.4.3),
     so the accent button always sets its label at 20px bold. */
  font-size: var(--fs-h3);
  font-weight: 700;
}

.ghost {
  background: transparent;
  color: currentColor;
  border-color: currentColor;
}

.primary:hover:not(:disabled),
.accent:hover:not(:disabled),
.ghost:hover:not(:disabled) {
  opacity: 0.85;
}

.label {
  display: inline-block;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
```

- [ ] **Step 4: Implementeer Badge**

`components/ui/Badge/Badge.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeKind = 'new' | 'coming' | 'sold-out' | 'edition'

export const BADGE_LABELS: Record<Exclude<BadgeKind, 'edition'>, string> = {
  new: 'New in',
  coming: 'Coming soon',
  'sold-out': 'Sold out',
}

/** Small mono label on tiles and the product page. Colour is never the only signal: every badge carries text. */
export default function Badge({ kind, children }: { kind: BadgeKind; children?: ReactNode }) {
  const label = children ?? (kind === 'edition' ? null : BADGE_LABELS[kind])
  return (
    <span className={`${styles.badge} ${styles[kind]}`} data-kind={kind}>
      {label}
    </span>
  )
}
```

`components/ui/Badge/Badge.module.css`:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  min-height: 22px;
  padding: 0 var(--s-2);
  border-radius: var(--r-1);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  color: var(--c-text);
  white-space: nowrap;
}

.new {
  background: var(--c-peach);
}

.coming {
  background: var(--c-sage);
}

/* Rose on its own is too light for small navy text (spec section 2), so the
   sold-out badge is a white chip with a rose marker plus the text. */
.sold-out {
  background: var(--c-surface);
  border: 1px solid var(--c-rose);
}

.sold-out::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-rose);
}

.edition {
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- components/ui/(Button|Badge)`
Expected: PASS, 10 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add components/ui/Button components/ui/Badge
git commit -m "feat: add Button and Badge ui primitives"
```

---

### Task 3: Focus-trap en Drawer

**Files:**
- Create: `hooks/useFocusTrap.ts`
- Test: `hooks/useFocusTrap.test.tsx`
- Create: `components/ui/Drawer/Drawer.tsx`, `components/ui/Drawer/Drawer.module.css`
- Test: `components/ui/Drawer/Drawer.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 1).
- Produces:
  - `export function useFocusTrap<T extends HTMLElement>(ref: RefObject<T | null>, active: boolean, onEscape?: () => void): void` (focus naar het eerste focusbare element, Tab en Shift+Tab blijven binnen, Esc roept `onEscape`, bij sluiten focus terug naar waar hij was)
  - `export function useScrollLock(active: boolean): void`
  - `export interface DrawerProps { open: boolean; onClose(): void; side: 'left' | 'right'; title: string; children: ReactNode; footer?: ReactNode; id?: string }`
  - `export default function Drawer(props: DrawerProps)` (`role="dialog"`, `aria-modal`, gesloten = `inert`)

- [ ] **Step 1: Schrijf de falende tests**

`hooks/useFocusTrap.test.tsx`:

```tsx
import { useRef, useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useFocusTrap, useScrollLock } from './useFocusTrap'

function Panel({ onEscape }: { onEscape: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, () => {
    onEscape()
    setOpen(false)
  })
  useScrollLock(open)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      {open && (
        <div ref={ref} tabIndex={-1}>
          <button type="button">First</button>
          <a href="/shop">Middle</a>
          <button type="button">Last</button>
          <button type="button" disabled>Disabled</button>
        </div>
      )}
    </>
  )
}

function openPanel(onEscape = jest.fn()) {
  render(<Panel onEscape={onEscape} />)
  const opener = screen.getByRole('button', { name: 'Open' })
  opener.focus()
  fireEvent.click(opener)
  return { opener, onEscape }
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when it opens', () => {
    openPanel()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  it('wraps Tab from the last element to the first, skipping disabled ones', () => {
    openPanel()
    screen.getByRole('button', { name: 'Last' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first element to the last', () => {
    openPanel()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus()
  })

  it('calls onEscape on Escape and returns focus to the opener', () => {
    const { opener, onEscape } = openPanel()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1)
    expect(opener).toHaveFocus()
  })
})

describe('useScrollLock', () => {
  it('locks body scroll while active and restores it afterwards', () => {
    document.body.style.overflow = 'auto'
    openPanel()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('auto')
  })
})
```

`components/ui/Drawer/Drawer.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Drawer from './Drawer'

function renderDrawer(open: boolean, onClose = jest.fn()) {
  render(
    <Drawer open={open} onClose={onClose} side="left" title="Filters" footer={<button type="button">Show 4 results</button>}>
      <a href="/shop?category=tees">Tees</a>
    </Drawer>
  )
  return onClose
}

describe('Drawer', () => {
  it('is a labelled modal dialog', () => {
    renderDrawer(true)
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('focuses the close button first when opened', () => {
    renderDrawer(true)
    expect(screen.getByRole('button', { name: 'Close filters' })).toHaveFocus()
  })

  it('closes on Escape, on the close button and on the backdrop', () => {
    const onClose = renderDrawer(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close filters' }))
    fireEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('keeps Tab inside the panel', () => {
    renderDrawer(true)
    screen.getByRole('button', { name: 'Show 4 results' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Close filters' })).toHaveFocus()
  })

  it('is inert and out of the accessibility tree when closed', () => {
    const { container } = render(
      <Drawer open={false} onClose={jest.fn()} side="right" title="Cart">
        <p>Empty</p>
      </Drawer>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('inert')
    expect(root).toHaveAttribute('data-open', 'false')
    expect(root).toHaveAttribute('data-side', 'right')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (useFocusTrap|Drawer)`
Expected: FAIL, `Cannot find module './useFocusTrap'` en `Cannot find module './Drawer'`.

- [ ] **Step 3: Implementeer de hooks**

`hooks/useFocusTrap.ts`:

```ts
'use client'

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function focusablesIn(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.closest('[inert]') === null
  )
}

/**
 * Keeps keyboard focus inside `ref` while `active`: focus moves in on open,
 * Tab and Shift+Tab wrap, Escape calls `onEscape`, and focus returns to the
 * element that had it before the panel opened.
 */
export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onEscape?: () => void
): void {
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ;(focusablesIn(node)[0] ?? node).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscapeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusablesIn(node)
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [active, ref])
}

/** Stops the page behind an open panel from scrolling; restores the old value on close. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}
```

- [ ] **Step 4: Implementeer Drawer**

`components/ui/Drawer/Drawer.tsx`:

```tsx
'use client'

import { useId, useRef, type ReactNode } from 'react'
import { useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap'
import styles from './Drawer.module.css'

export interface DrawerProps {
  open: boolean
  onClose(): void
  side: 'left' | 'right'
  title: string
  children: ReactNode
  /** Sticky area under the body, e.g. "Show 12 results" or the checkout button. */
  footer?: ReactNode
  id?: string
}

/**
 * Full-height side panel: base for the filter drawer (phase 2) and the cart
 * (phase 3). Stays mounted so it can slide; while closed it is inert, so it
 * is neither focusable nor read out.
 */
export default function Drawer({ open, onClose, side, title, children, footer, id }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useFocusTrap(panelRef, open, onClose)
  useScrollLock(open)

  return (
    <div className={styles.root} data-open={open ? 'true' : 'false'} data-side={side} inert={!open}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" data-testid="drawer-backdrop" />
      <div
        ref={panelRef}
        id={id}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
```

`components/ui/Drawer/Drawer.module.css`:

```css
.root {
  position: fixed;
  inset: 0;
  z-index: 400;
  pointer-events: none;
}

.root[data-open='true'] {
  pointer-events: auto;
}

.backdrop {
  position: absolute;
  inset: 0;
  background: var(--c-text);
  opacity: 0;
  transition: opacity var(--m-base) var(--m-ease);
}

.root[data-open='true'] .backdrop {
  opacity: 0.4;
}

.panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: min(420px, 100vw);
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  color: var(--c-text);
  transition: transform var(--m-slow) var(--m-ease-out);
}

.root[data-side='left'] .panel {
  left: 0;
  transform: translateX(-100%);
}

.root[data-side='right'] .panel {
  right: 0;
  transform: translateX(100%);
}

.root[data-open='true'] .panel {
  transform: translateX(0);
}

.panel:focus-visible {
  outline: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--l-nav);
  padding: 0 var(--l-gutter);
  border-bottom: 1px solid var(--c-stone);
}

.title {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: calc(var(--s-3) * -1);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.close:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-5) var(--l-gutter);
}

.footer {
  padding: var(--s-4) var(--l-gutter);
  border-top: 1px solid var(--c-stone);
  background: var(--c-surface);
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (useFocusTrap|Drawer)`
Expected: PASS, 10 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add hooks/useFocusTrap.ts hooks/useFocusTrap.test.tsx components/ui/Drawer
git commit -m "feat: add focus trap hook and Drawer base"
```

---
### Task 4: Navigatiedata, SiteHeader en MobileNav

**Files:**
- Create: `lib/nav.ts`
- Test: `lib/nav.test.ts`
- Create: `components/ui/SiteHeader/SiteHeader.tsx`, `components/ui/SiteHeader/SiteHeader.module.css`
- Test: `components/ui/SiteHeader/SiteHeader.test.tsx`
- Create: `components/ui/MobileNav/MobileNav.tsx`, `components/ui/MobileNav/MobileNav.module.css`
- Test: `components/ui/MobileNav/MobileNav.test.tsx`

**Interfaces:**
- Consumes: `useFocusTrap`, `useScrollLock` (Task 3); `AccountButton` (`components/AccountButton/AccountButton.tsx`, bestaand, logica blijft); `LogoWordmark` (`components/Logo/Logo.tsx`, bestaand tot fase 4); `FREE_SHIPPING_THRESHOLD` uit `lib/shipping.ts`.
- Produces:
  - `export interface NavItem { label: string; href: string; external?: boolean }`
  - `export const MAIN_NAV: NavItem[]` (Shop `/shop`, Olympian `/collections/olympian`, OLYMPN Sport `/collections/olympn-sport`, Archive `/archive`, About `/about`)
  - `export const HELP_NAV: NavItem[]`, `export const LEGAL_NAV: NavItem[]`, `export const ANNOUNCEMENTS: string[]`
  - `export function isActivePath(href: string, path: string): boolean`
  - `export interface SiteHeaderProps { nav: NavItem[]; cartCount: number; currentPath: string; menuOpen: boolean; onMenuOpen(): void; onCartOpen(): void }`
  - `export interface MobileNavProps { nav: NavItem[]; open: boolean; onClose(): void; currentPath: string }`

De links naar `/collections/*` en `/archive` geven een 404 tot Task 17; dat is verwacht.

- [ ] **Step 1: Schrijf de falende tests**

`lib/nav.test.ts`:

```ts
import { ANNOUNCEMENTS, MAIN_NAV, isActivePath } from './nav'

describe('MAIN_NAV', () => {
  it('lists the five v2 destinations in order', () => {
    expect(MAIN_NAV).toEqual([
      { label: 'Shop', href: '/shop' },
      { label: 'Olympian', href: '/collections/olympian' },
      { label: 'OLYMPN Sport', href: '/collections/olympn-sport' },
      { label: 'Archive', href: '/archive' },
      { label: 'About', href: '/about' },
    ])
  })
})

describe('ANNOUNCEMENTS', () => {
  it('names the free-shipping threshold from the shipping rules', () => {
    expect(ANNOUNCEMENTS[0]).toBe('Free shipping on orders over €75')
  })
})

describe('isActivePath', () => {
  it.each([
    ['/shop', '/shop', true],
    ['/shop', '/shop/olympian-tee-sand-unisex', true],
    ['/shop', '/shopping', false],
    ['/collections/olympian', '/collections/olympian', true],
    ['/collections/olympian', '/collections/olympn-sport', false],
    ['/', '/', true],
    ['/', '/shop', false],
  ])('%s is active on %s: %s', (href, path, expected) => {
    expect(isActivePath(href, path)).toBe(expected)
  })
})
```

`components/ui/SiteHeader/SiteHeader.test.tsx`:

```tsx
import { createElement } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SiteHeader from './SiteHeader'
import { MAIN_NAV } from '@/lib/nav'

jest.mock('../../AccountButton/AccountButton', () => ({
  __esModule: true,
  default: () => createElement('a', { href: '/account/login' }, 'Account'),
}))

function renderHeader(overrides: Partial<Parameters<typeof SiteHeader>[0]> = {}) {
  const props = {
    nav: MAIN_NAV,
    cartCount: 0,
    currentPath: '/',
    menuOpen: false,
    onMenuOpen: jest.fn(),
    onCartOpen: jest.fn(),
    ...overrides,
  }
  render(<SiteHeader {...props} />)
  return props
}

describe('SiteHeader', () => {
  it('links every main destination', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const item of MAIN_NAV) {
      expect(nav.querySelector(`a[href="${item.href}"]`)).toHaveTextContent(item.label)
    }
  })

  it('marks the current section with aria-current', () => {
    renderHeader({ currentPath: '/collections/olympn-sport' })
    expect(screen.getByRole('link', { name: 'OLYMPN Sport' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Shop' })).not.toHaveAttribute('aria-current')
  })

  it('shows the cart count and announces it in the button name', () => {
    const props = renderHeader({ cartCount: 3 })
    const cart = screen.getByRole('button', { name: 'Open cart, 3 items' })
    expect(cart).toHaveTextContent('3')
    fireEvent.click(cart)
    expect(props.onCartOpen).toHaveBeenCalledTimes(1)
  })

  it('hides the count for an empty cart', () => {
    renderHeader({ cartCount: 0 })
    expect(screen.getByRole('button', { name: 'Open cart' }).querySelector('span')).toBeNull()
  })

  it('uses the singular for one item', () => {
    renderHeader({ cartCount: 1 })
    expect(screen.getByRole('button', { name: 'Open cart, 1 item' })).toBeInTheDocument()
  })

  it('opens the mobile menu and reports its state', () => {
    const props = renderHeader({ menuOpen: false })
    const menu = screen.getByRole('button', { name: 'Open menu' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(menu).toHaveAttribute('aria-controls', 'mobile-nav')
    fireEvent.click(menu)
    expect(props.onMenuOpen).toHaveBeenCalledTimes(1)
  })

  it('keeps the account link', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/account/login')
  })
})
```

`components/ui/MobileNav/MobileNav.test.tsx`:

```tsx
import type { ReactNode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileNav from './MobileNav'
import { MAIN_NAV } from '@/lib/nav'

// next/link navigates through the mounted app router, which a unit test does
// not have (a click would throw "Router action dispatched before
// initialization"). A plain anchor that cancels the navigation is enough to
// test our own click handlers.
jest.mock('next/link', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react')
  return {
    __esModule: true,
    default: (props: { href: string; className?: string; onClick?: () => void; children?: ReactNode; 'aria-current'?: 'page' | 'true' }) =>
      createElement(
        'a',
        {
          href: props.href,
          className: props.className,
          'aria-current': props['aria-current'],
          onClick: (event: { preventDefault(): void }) => {
            event.preventDefault()
            props.onClick?.()
          },
        },
        props.children
      ),
  }
})

describe('MobileNav', () => {
  it('is a labelled modal that takes focus on open', () => {
    render(<MobileNav nav={MAIN_NAV} open onClose={jest.fn()} currentPath="/" />)
    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus()
  })

  it('closes on Escape and on the close button', () => {
    const onClose = jest.fn()
    render(<MobileNav nav={MAIN_NAV} open onClose={onClose} currentPath="/" />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('closes when a link is followed', () => {
    const onClose = jest.fn()
    render(<MobileNav nav={MAIN_NAV} open onClose={onClose} currentPath="/" />)
    fireEvent.click(screen.getByRole('link', { name: 'Archive' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('marks the current section', () => {
    render(<MobileNav nav={MAIN_NAV} open onClose={jest.fn()} currentPath="/shop/olympian-tee-sand-unisex" />)
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
  })

  it('is inert while closed', () => {
    render(<MobileNav nav={MAIN_NAV} open={false} onClose={jest.fn()} currentPath="/" />)
    const root = document.getElementById('mobile-nav')
    expect(root).toHaveAttribute('inert')
    expect(root).toHaveAttribute('data-open', 'false')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (lib/nav|SiteHeader|MobileNav)`
Expected: FAIL, `Cannot find module './nav'`, `'./SiteHeader'`, `'./MobileNav'`.

- [ ] **Step 3: Implementeer `lib/nav.ts`**

```ts
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'

export interface NavItem {
  label: string
  href: string
  /** mailto or another site: rendered as a plain anchor, not a route link. */
  external?: boolean
}

/** Header and mobile menu (spec section 3). */
export const MAIN_NAV: NavItem[] = [
  { label: 'Shop', href: '/shop' },
  { label: 'Olympian', href: '/collections/olympian' },
  { label: 'OLYMPN Sport', href: '/collections/olympn-sport' },
  { label: 'Archive', href: '/archive' },
  { label: 'About', href: '/about' },
]

export const HELP_NAV: NavItem[] = [
  { label: 'Size guide', href: '/size-guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Returns', href: '/returns' },
  { label: 'Contact', href: 'mailto:info@7eno.shop', external: true },
]

export const LEGAL_NAV: NavItem[] = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
]

/** Announcement bar USPs. Facts only: the threshold comes from lib/shipping. */
export const ANNOUNCEMENTS: string[] = [
  `Free shipping on orders over €${FREE_SHIPPING_THRESHOLD}`,
  '14-day returns',
  'Made to order in numbered editions',
]

/** True when `path` is `href` itself or a page below it. */
export function isActivePath(href: string, path: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}
```

- [ ] **Step 4: Implementeer SiteHeader**

`components/ui/SiteHeader/SiteHeader.tsx`:

```tsx
'use client'

import Link from 'next/link'
import AccountButton from '@/components/AccountButton/AccountButton'
import { LogoWordmark } from '@/components/Logo/Logo'
import { isActivePath, type NavItem } from '@/lib/nav'
import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  nav: NavItem[]
  cartCount: number
  currentPath: string
  menuOpen: boolean
  onMenuOpen(): void
  onCartOpen(): void
}

export default function SiteHeader({ nav, cartCount, currentPath, menuOpen, onMenuOpen, onCartOpen }: SiteHeaderProps) {
  const cartLabel = cartCount > 0 ? `Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Open cart'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.iconButton + ' ' + styles.menuButton}
          onClick={onMenuOpen}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <Link href="/" className={styles.logo} aria-label="7ENO home">
          <LogoWordmark variant="ink" height={28} />
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <ul className={styles.navList}>
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  aria-current={isActivePath(item.href, currentPath) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <AccountButton />
          <button type="button" className={styles.iconButton} onClick={onCartOpen} aria-label={cartLabel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className={styles.cartCount} aria-hidden="true">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
```

`components/ui/SiteHeader/SiteHeader.module.css`:

```css
.header {
  height: var(--l-nav);
  background: var(--c-bg);
  color: var(--c-text);
  border-bottom: 1px solid var(--c-stone);
}

.inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--s-4);
  height: 100%;
  max-width: var(--l-max);
  margin: 0 auto;
  padding: 0 var(--l-gutter);
}

.iconButton {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.menuButton {
  justify-self: start;
  margin-left: calc(var(--s-3) * -1);
}

.logo {
  justify-self: center;
  display: block;
  width: 98px;
}

.nav {
  display: none;
}

.navList {
  display: flex;
  gap: var(--s-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.navLink {
  display: inline-block;
  padding: var(--s-2) 0;
  font-family: var(--f-body);
  font-size: var(--fs-small);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text);
  text-decoration: none;
}

.navLink::after {
  content: '';
  display: block;
  height: 2px;
  margin-top: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--m-base) var(--m-ease);
}

.navLink:hover::after,
.navLink[aria-current='page']::after {
  transform: scaleX(1);
}

.actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--s-1);
}

.cartCount {
  position: absolute;
  top: 4px;
  right: 2px;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--s-1);
  border-radius: 9px;
  background: var(--c-text);
  color: var(--c-inverse-text);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  line-height: 18px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.iconButton:focus-visible,
.navLink:focus-visible,
.logo:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .inner {
    grid-template-columns: auto 1fr auto;
  }

  .menuButton {
    display: none;
  }

  .logo {
    justify-self: start;
  }

  .nav {
    display: block;
    justify-self: center;
  }
}
```

- [ ] **Step 5: Implementeer MobileNav**

`components/ui/MobileNav/MobileNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useFocusTrap, useScrollLock } from '@/hooks/useFocusTrap'
import { HELP_NAV, isActivePath, type NavItem } from '@/lib/nav'
import styles from './MobileNav.module.css'

export interface MobileNavProps {
  nav: NavItem[]
  open: boolean
  onClose(): void
  currentPath: string
}

/** Full-screen menu below 1024px. Focus is trapped while open; Escape closes it. */
export default function MobileNav({ nav, open, onClose, currentPath }: MobileNavProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, onClose)
  useScrollLock(open)

  return (
    <div
      ref={ref}
      id="mobile-nav"
      className={styles.root}
      data-open={open ? 'true' : 'false'}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      tabIndex={-1}
    >
      <div className={styles.top}>
        <span className={styles.label}>Menu</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <nav aria-label="Mobile">
        <ul className={styles.list}>
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.link}
                onClick={onClose}
                aria-current={isActivePath(item.href, currentPath) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className={styles.secondary}>
        <li>
          <Link href="/account" className={styles.secondaryLink} onClick={onClose}>
            Account
          </Link>
        </li>
        {HELP_NAV.filter((item) => !item.external).map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={styles.secondaryLink} onClick={onClose}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

`components/ui/MobileNav/MobileNav.module.css`:

```css
.root {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  flex-direction: column;
  padding: 0 var(--l-gutter) var(--s-7);
  overflow-y: auto;
  background: var(--c-bg);
  color: var(--c-text);
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity var(--m-base) var(--m-ease), transform var(--m-base) var(--m-ease);
}

.root[data-open='true'] {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}

.root:focus-visible {
  outline: none;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--l-nav);
}

.label {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: calc(var(--s-3) * -1);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin: var(--s-6) 0 0;
  padding: 0;
  list-style: none;
}

.link {
  font-family: var(--f-display);
  font-size: var(--fs-h1);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--c-text);
  text-decoration: none;
}

.link[aria-current='page'] {
  color: var(--c-accent-ink);
}

.secondary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-4) var(--s-5);
  margin: auto 0 0;
  padding: var(--s-6) 0 0;
  list-style: none;
  border-top: 1px solid var(--c-stone);
}

.secondaryLink {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text);
  text-decoration: none;
}

.close:focus-visible,
.link:focus-visible,
.secondaryLink:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .root {
    display: none;
  }
}
```

- [ ] **Step 6: Run de tests, verwacht slagen**

Run: `npm test -- (lib/nav|SiteHeader|MobileNav)`
Expected: PASS, 21 tests.

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen (de componenten zijn nog nergens gemonteerd).

- [ ] **Step 8: Commit**

```bash
git add lib/nav.ts lib/nav.test.ts components/ui/SiteHeader components/ui/MobileNav
git commit -m "feat: add v2 site header, mobile nav and navigation data"
```

---

### Task 5: AnnouncementBar, SiteFooter en de nieuwe AppShell

**Files:**
- Create: `components/ui/AnnouncementBar/AnnouncementBar.tsx`, `components/ui/AnnouncementBar/AnnouncementBar.module.css`
- Test: `components/ui/AnnouncementBar/AnnouncementBar.test.tsx`
- Create: `components/ui/SiteFooter/SiteFooter.tsx`, `components/ui/SiteFooter/SiteFooter.module.css`
- Test: `components/ui/SiteFooter/SiteFooter.test.tsx`
- Modify: `components/AppShell/AppShell.tsx:1-54` (volledig vervangen)
- Create: `components/AppShell/AppShell.module.css`
- Modify: `components/AppShell/AppShell.test.tsx:1-77` (volledig vervangen)

**Interfaces:**
- Consumes: `MAIN_NAV`, `HELP_NAV`, `LEGAL_NAV`, `ANNOUNCEMENTS`, `NavItem` (Task 4); `SiteHeader`, `MobileNav` (Task 4); `useCartStore` (`store/cart.ts`, `itemCount()`, `openCart()`).
- Produces:
  - `export interface AnnouncementBarProps { messages: string[]; href?: string }`; de track draagt `data-announcement-track` (Task 1 zet hem stil onder reduced motion) en de balk heeft een pauzeknop (WCAG 2.2.2 voor bewegende inhoud langer dan 5 s).
  - `export interface SiteFooterProps { nav: NavItem[] }`
  - `AppShell`: vaste chrome (`.chrome`, hoogte `--l-chrome`), skiplink naar `#main`; binnen `.content` is `--nav-height` gelijk aan `--l-chrome`, zodat oude pagina's (die `padding-top: var(--nav-height)` en `top: var(--nav-height)` gebruiken) netjes onder de nieuwe chrome vallen zonder dat de oude tokendefinitie verandert.

- [ ] **Step 1: Schrijf de falende tests**

`components/ui/AnnouncementBar/AnnouncementBar.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import AnnouncementBar from './AnnouncementBar'

const MESSAGES = ['Free shipping on orders over €75', '14-day returns']

describe('AnnouncementBar', () => {
  it('reads each message once and hides the loop copy from assistive tech', () => {
    const { container } = render(<AnnouncementBar messages={MESSAGES} />)
    for (const m of MESSAGES) {
      const copies = screen.getAllByText(m)
      expect(copies).toHaveLength(2)
      expect(copies.filter((el) => el.getAttribute('aria-hidden') === 'true')).toHaveLength(1)
    }
    expect(container.querySelector('[data-announcement-track]')).not.toBeNull()
  })

  it('can be paused and resumed', () => {
    const { container } = render(<AnnouncementBar messages={MESSAGES} />)
    const toggle = screen.getByRole('button', { name: 'Pause announcements' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(container.querySelector('[data-paused="true"]')).not.toBeNull()
  })

  it('wraps the messages in a link when given an href', () => {
    render(<AnnouncementBar messages={MESSAGES} href="/collections/olympn-sport" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/collections/olympn-sport')
  })

  it('renders nothing without messages', () => {
    const { container } = render(<AnnouncementBar messages={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

`components/ui/SiteFooter/SiteFooter.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import SiteFooter from './SiteFooter'
import { MAIN_NAV } from '@/lib/nav'

describe('SiteFooter', () => {
  it('repeats the main navigation', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    const shop = screen.getByRole('navigation', { name: 'Footer shop' })
    for (const item of MAIN_NAV) {
      expect(shop.querySelector(`a[href="${item.href}"]`)).toHaveTextContent(item.label)
    }
  })

  it('links help, contact and the legal pages', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    expect(screen.getByRole('link', { name: 'Size guide' })).toHaveAttribute('href', '/size-guide')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', 'mailto:info@7eno.shop')
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
  })

  it('carries the company line', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    expect(screen.getByText(/KvK 42081073/)).toBeInTheDocument()
  })
})
```

`components/AppShell/AppShell.test.tsx` (volledig vervangen):

```tsx
import { createElement } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import AppShell from './AppShell'

// Hoisted function declarations so the jest.mock factories below can use them.
// jest.mock takes relative paths: SWC rewrites '@/' in imports only.
function mockChrome(testId: string, extra: Record<string, string> = {}) {
  return createElement('div', { 'data-testid': testId, ...extra })
}

interface HeaderMockProps {
  cartCount: number
  currentPath: string
  onMenuOpen(): void
  onCartOpen(): void
}

function mockHeader(p: HeaderMockProps) {
  return createElement(
    'div',
    { 'data-testid': 'site-header', 'data-count': String(p.cartCount), 'data-path': p.currentPath },
    createElement('button', { type: 'button', onClick: p.onMenuOpen }, 'menu'),
    createElement('button', { type: 'button', onClick: p.onCartOpen }, 'cart')
  )
}

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))
jest.mock('../ui/AnnouncementBar/AnnouncementBar', () => ({ __esModule: true, default: () => mockChrome('announcement-bar') }))
jest.mock('../ui/SiteHeader/SiteHeader', () => ({ __esModule: true, default: (p: HeaderMockProps) => mockHeader(p) }))
jest.mock('../ui/MobileNav/MobileNav', () => ({
  __esModule: true,
  default: (p: { open: boolean }) => mockChrome('mobile-nav', { 'data-open': String(p.open) }),
}))
jest.mock('../ui/SiteFooter/SiteFooter', () => ({ __esModule: true, default: () => mockChrome('footer') }))
jest.mock('../CartDrawer/CartDrawer', () => ({ __esModule: true, default: () => mockChrome('cart-drawer') }))
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

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
})

describe('AppShell route chrome', () => {
  it.each(['/', '/shop', '/shop/olympian-tee-sand-unisex', '/account', '/collections/olympn-sport'])(
    'renders the full v2 chrome on %s',
    (path) => {
      renderAt(path)
      for (const id of ['store-hydration', 'cookie-banner', 'announcement-bar', 'site-header', 'mobile-nav', 'cart-drawer', 'footer']) {
        expect(present(id)).toBe(true)
      }
      expect(present('checkout-header')).toBe(false)
      expect(screen.getByTestId('site-header')).toHaveAttribute('data-path', path)
    }
  )

  it('puts the page in #main with a skip link to it', () => {
    renderAt('/shop')
    expect(screen.getByText('page content').parentElement).toHaveAttribute('id', 'main')
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  it.each(['/account/login', '/account/register'])('hides only the footer on %s', (path) => {
    renderAt(path)
    expect(present('site-header')).toBe(true)
    expect(present('footer')).toBe(false)
  })

  it('seals /checkout: hydration and checkout header only', () => {
    renderAt('/checkout')
    expect(present('store-hydration')).toBe(true)
    expect(present('checkout-header')).toBe(true)
    for (const id of ['announcement-bar', 'site-header', 'mobile-nav', 'cart-drawer', 'footer', 'cookie-banner']) {
      expect(present(id)).toBe(false)
    }
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('renders /coming-soon bare, without any chrome or hydration', () => {
    renderAt('/coming-soon')
    for (const id of ['store-hydration', 'site-header', 'cart-drawer', 'footer']) {
      expect(present(id)).toBe(false)
    }
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('passes the cart item count to the header', () => {
    useCartStore.setState({
      items: [
        { provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Sand Unisex', variantName: 'M', price: '45.00', currency: 'EUR', quantity: 2, imageUrl: null },
        { provider: 'printful', variantId: 'v2', productId: 'p2', productName: 'Olympian Tee Ocean Unisex', variantName: 'L', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null },
      ],
    })
    renderAt('/shop')
    expect(screen.getByTestId('site-header')).toHaveAttribute('data-count', '3')
  })

  it('opens the mobile menu from the header', () => {
    renderAt('/')
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'menu' }))
    expect(screen.getByTestId('mobile-nav')).toHaveAttribute('data-open', 'true')
  })

  it('opens the cart drawer from the header', () => {
    renderAt('/')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'cart' }))
    })
    expect(useCartStore.getState().isCartOpen).toBe(true)
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (AnnouncementBar|SiteFooter|AppShell)`
Expected: FAIL, `Cannot find module './AnnouncementBar'`, `'./SiteFooter'`, en in `AppShell.test.tsx` `Cannot find module '../ui/AnnouncementBar/AnnouncementBar'`.

- [ ] **Step 3: Implementeer AnnouncementBar**

`components/ui/AnnouncementBar/AnnouncementBar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './AnnouncementBar.module.css'

export interface AnnouncementBarProps {
  messages: string[]
  href?: string
}

/**
 * Fixed-height USP strip. The messages scroll as a seamless loop (a second,
 * aria-hidden copy follows the first); a pause button keeps it WCAG 2.2.2
 * compliant, and under reduced motion tokens.css stops it entirely.
 */
export default function AnnouncementBar({ messages, href }: AnnouncementBarProps) {
  const [paused, setPaused] = useState(false)
  if (messages.length === 0) return null

  const track = (
    <ul className={styles.track} data-announcement-track="" data-paused={paused ? 'true' : 'false'}>
      {messages.map((m) => (
        <li key={m} className={styles.item}>{m}</li>
      ))}
      {messages.map((m) => (
        <li key={`loop-${m}`} className={styles.item} aria-hidden="true">{m}</li>
      ))}
    </ul>
  )

  return (
    <aside className={styles.bar} aria-label="Announcements">
      <div className={styles.viewport}>
        {href ? <Link href={href} className={styles.link}>{track}</Link> : track}
      </div>
      <button
        type="button"
        className={styles.pause}
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label="Pause announcements"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          {paused ? <path d="M2 1l7 4-7 4z" fill="currentColor" /> : <path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" />}
        </svg>
      </button>
    </aside>
  )
}
```

`components/ui/AnnouncementBar/AnnouncementBar.module.css`:

```css
.bar {
  display: flex;
  align-items: center;
  height: var(--l-announce);
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
}

.viewport {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.link:focus-visible {
  outline: 2px solid var(--c-inverse-text);
  outline-offset: -2px;
}

.track {
  display: flex;
  width: max-content;
  margin: 0;
  padding: 0;
  list-style: none;
  animation: announce 40s linear infinite;
}

.track[data-paused='true'] {
  animation-play-state: paused;
}

.item {
  padding: 0 var(--s-7);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  line-height: var(--l-announce);
  text-transform: uppercase;
  white-space: nowrap;
}

.pause {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--l-announce);
  height: var(--l-announce);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.pause:focus-visible {
  outline: 2px solid var(--c-inverse-text);
  outline-offset: -4px;
}

@keyframes announce {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pause {
    display: none;
  }
}
```

- [ ] **Step 4: Implementeer SiteFooter**

`components/ui/SiteFooter/SiteFooter.tsx`:

```tsx
import Link from 'next/link'
import { HELP_NAV, LEGAL_NAV, type NavItem } from '@/lib/nav'
import styles from './SiteFooter.module.css'

export interface SiteFooterProps {
  nav: NavItem[]
}

function FooterLink({ item }: { item: NavItem }) {
  if (item.external) {
    return <a href={item.href} className={styles.link}>{item.label}</a>
  }
  return <Link href={item.href} className={styles.link}>{item.label}</Link>
}

export default function SiteFooter({ nav }: SiteFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <p className={styles.wordmark}>7ENO</p>
          <p className={styles.tagline}>Numbered editions by Abra Entertainment. Made to order.</p>
        </div>
        <nav className={styles.col} aria-label="Footer shop">
          <p className={styles.colTitle}>Shop</p>
          <ul className={styles.list}>
            {nav.map((item) => (
              <li key={item.href}><FooterLink item={item} /></li>
            ))}
          </ul>
        </nav>
        <nav className={styles.col} aria-label="Footer help">
          <p className={styles.colTitle}>Help</p>
          <ul className={styles.list}>
            {HELP_NAV.map((item) => (
              <li key={item.href}><FooterLink item={item} /></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p className={styles.legal}>© 2026 7ENO · KvK 42081073</p>
        <ul className={styles.legalLinks}>
          {LEGAL_NAV.map((item) => (
            <li key={item.href}><FooterLink item={item} /></li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
```

`components/ui/SiteFooter/SiteFooter.module.css`:

```css
.footer {
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
  font-family: var(--f-body);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--s-7);
  max-width: var(--l-max);
  margin: 0 auto;
  padding: var(--s-8) var(--l-gutter) var(--s-7);
}

.wordmark {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.tagline {
  max-width: 32ch;
  margin: var(--s-3) 0 0;
  font-size: var(--fs-small);
  line-height: 1.5;
}

.colTitle {
  margin: 0 0 var(--s-4);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.list,
.legalLinks {
  display: flex;
  flex-direction: column;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.link {
  color: var(--c-inverse-text);
  font-size: var(--fs-small);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.link:focus-visible {
  outline: 2px solid var(--c-inverse-text);
  outline-offset: 2px;
}

.bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--s-4);
  max-width: var(--l-max);
  margin: 0 auto;
  padding: var(--s-5) var(--l-gutter);
  border-top: 1px solid var(--c-text-muted);
}

.legal {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.legalLinks {
  flex-direction: row;
  gap: var(--s-5);
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: 2fr 1fr 1fr;
  }
}
```

- [ ] **Step 5: Vervang `components/AppShell/AppShell.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import CartDrawer from '@/components/CartDrawer/CartDrawer'
import CheckoutHeader from '@/components/CheckoutHeader/CheckoutHeader'
import StoreHydration from '@/components/StoreHydration/StoreHydration'
import CookieBanner from '@/components/CookieBanner/CookieBanner'
import AnnouncementBar from '@/components/ui/AnnouncementBar/AnnouncementBar'
import SiteHeader from '@/components/ui/SiteHeader/SiteHeader'
import MobileNav from '@/components/ui/MobileNav/MobileNav'
import SiteFooter from '@/components/ui/SiteFooter/SiteFooter'
import { ANNOUNCEMENTS, MAIN_NAV } from '@/lib/nav'
import { useCartStore } from '@/store/cart'
import styles from './AppShell.module.css'

const HIDE_FOOTER = ['/account/login', '/account/register']

/**
 * Route chrome around every page: which header, drawer and footer a route
 * gets. It provides no context; the cart lives in the Zustand store.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const cartCount = useCartStore((s) => s.itemCount())
  const openCart = useCartStore((s) => s.openCart)
  const showFooter = !HIDE_FOOTER.some((p) => pathname.startsWith(p))

  // The coming-soon teaser is a sealed full-screen page (removed in Task 9).
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
      <a href="#main" className={styles.skipLink}>Skip to content</a>
      <div className={styles.chrome}>
        <AnnouncementBar messages={ANNOUNCEMENTS} />
        <SiteHeader
          nav={MAIN_NAV}
          cartCount={cartCount}
          currentPath={pathname}
          menuOpen={menuOpen}
          onMenuOpen={() => setMenuOpen(true)}
          onCartOpen={openCart}
        />
      </div>
      <MobileNav nav={MAIN_NAV} open={menuOpen} onClose={() => setMenuOpen(false)} currentPath={pathname} />
      <CartDrawer />
      <div className={styles.page}>
        <div id="main" className={styles.content}>
          {children}
        </div>
        {showFooter && <SiteFooter nav={MAIN_NAV} />}
      </div>
    </>
  )
}
```

`components/AppShell/AppShell.module.css`:

```css
.chrome {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 300;
}

.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/*
 * Old pages pad and stick against --nav-height (styles/globals.css). Inside
 * the shell it equals the new fixed chrome, so they line up under it without
 * changing the old token definition. New pages use var(--l-chrome) directly.
 */
.content {
  flex: 1;
  --nav-height: var(--l-chrome);
}

.skipLink {
  position: fixed;
  top: var(--s-2);
  left: var(--s-4);
  z-index: 500;
  padding: var(--s-2) var(--s-4);
  background: var(--c-text);
  color: var(--c-inverse-text);
  font-family: var(--f-body);
  font-size: var(--fs-small);
  transform: translateY(-200%);
}

.skipLink:focus-visible {
  transform: none;
  outline: 2px solid var(--c-live);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Run de tests, verwacht slagen**

Run: `npm test -- (AnnouncementBar|SiteFooter|AppShell)`
Expected: PASS, 20 tests.

- [ ] **Step 7: Kwaliteitspoort en visuele check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Daarna `npm run dev` en op `http://localhost:3000/shop` (1440 en 390 breed) controleren: crème header met vijf navigatielinks op desktop, hamburger plus volledig-scherm-menu op mobiel (Tab blijft in het menu, Esc sluit), navy announcement-bar die loopt en te pauzeren is, oude shop-inhoud begint direct onder de chrome. Open geen `/checkout`.

- [ ] **Step 8: Commit**

```bash
git add components/ui/AnnouncementBar components/ui/SiteFooter components/AppShell
git commit -m "feat: mount the v2 chrome in AppShell"
```

---

### Task 6: Dropmodel, preview-cookie en de OLYMPN Sport-lineup

**Files:**
- Create: `scripts/download-drop-mockups.mjs`
- Create: `public/drops/olympn-sport/rose-red.webp`, `pistachio.webp`, `mocha.webp`, `obsidian-oversized.webp`, `dune.webp`, `olive.webp`, `obsidian-relaxed.webp`, `maritime.webp` (gegenereerd door het script)
- Create: `lib/drops.ts`
- Test: `lib/drops.test.ts`
- Create: `lib/preview.ts`, `lib/preview-session.ts`
- Test: `lib/preview.test.ts`, `lib/preview-session.test.ts`
- Modify: `proxy.ts:1-6` (imports, cookienaam), `proxy.ts:68-94` (preview-parameter en bypass)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` (regel 6 en 67: `cookies()` is async; `await cookies()` maakt de route dynamisch, daarom leest `isPreviewSession` hem alleen als preview aan staat).

**Interfaces:**
- Consumes: `NormalizedProduct` (`types/catalog.ts`).
- Produces (`lib/drops.ts`):
  - `export type DropStatus = 'upcoming' | 'live' | 'closed'`, `export type DropId = 'olympian' | 'olympn-sport'`
  - `export interface Drop` (exact de velden uit spec sectie 4)
  - `export interface DropClockOptions { preview?: boolean }`
  - `export const DROPS: readonly Drop[]`
  - `export function currentTimeMs(): number` (voor pagina's; `Date.now()` in een component faalt op `react-hooks/purity`)
  - `export const NEW_IN_MS` (30 dagen: zo lang heet een live drop "New in")
  - `export function getDropStatus(drop: Drop, now?: number, opts?: DropClockOptions): DropStatus`
  - `export function matchDrop(p: Pick<NormalizedProduct, 'id' | 'provider' | 'name'>, drops?: readonly Drop[]): Drop | null`
  - `export function isPurchasable(drop: Drop | null, now?: number, opts?: DropClockOptions): boolean`
  - `export function isVisibleInShop(drop: Drop, now?: number, opts?: DropClockOptions): boolean` (live, of upcoming met `teaser`)
  - `export function isDropListed(drop: Drop, now?: number, opts?: DropClockOptions): boolean` (alles behalve upcoming zonder `teaser`)
  - `export function getDrop(id: string): Drop | null`, `export function getDropBySlug(slug: string): Drop | null`
  - `export function formatEdition(edition: number): string` (`'Edition 02'`)
  - `export function formatDropDate(iso: string): string` (`'1 November 2026 at 12:00 CET'`), `export function formatDropDay(iso: string): string` (`'1 November 2026'`)
  - `export function colourRank(drop: Drop, name: string): number`, `export function colourLabel(drop: Drop, name: string): string | null`, `export function familyKey(drop: Drop, name: string): string`
  - `export interface DropView { id; edition; editionLabel; title; slug; href; status; startsAt; startsAtLabel; startsOnLabel; endsAt; intro; tone; waitlist; teaser; hero }`
  - `export function toDropView(drop: Drop, now?: number, opts?: DropClockOptions): DropView`
  - `export function listDropsNewestFirst(drops?: readonly Drop[]): Drop[]`
  - `export function getNextDrop(now?: number, opts?: DropClockOptions, drops?: readonly Drop[]): Drop | null`
- Produces (`lib/preview.ts`, puur, ook bruikbaar in `proxy.ts` en route handlers): `PREVIEW_COOKIE = 'drop_preview'`, `PREVIEW_COOKIE_MAX_AGE`, `isPreviewEnabled(env?)`, `isPreviewCookieValue(value, env?)`, `previewParamAction(param, env?): 'set' | 'clear' | 'ignore'`.
- Produces (`lib/preview-session.ts`, server components): `export async function isPreviewSession(): Promise<boolean>`.

De cookie bevat de sleutel zelf (httpOnly), niet `'1'` zoals de oude seal: een zelfgemaakte cookie zonder de sleutel doet niets, en dat is nodig omdat de checkout-guard (Task 8) hem ook leest. Preview werkt alleen buiten `VERCEL_ENV=production`, zodat productiepagina's statisch blijven.

- [ ] **Step 1: Schrijf het downloadscript**

`scripts/download-drop-mockups.mjs`:

```js
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
```

Twee kleuren heten Obsidian (Oversized en Relaxed); die krijgen het snit-achtervoegsel, zodat elke bestandsnaam uniek is.

- [ ] **Step 2: Draai het script**

Run: `node scripts/download-drop-mockups.mjs && ls public/drops/olympn-sport`
Expected: acht regels als `rose-red.webp  1000x1000  ...KB`, daarna de acht bestandsnamen. Geen enkele rand boven 1600 px.

- [ ] **Step 3: Schrijf de falende tests**

`lib/drops.test.ts`:

```ts
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  DROPS, colourLabel, colourRank, familyKey, formatDropDate, formatDropDay, formatEdition, getDrop,
  getDropBySlug, getDropStatus, getNextDrop, isDropListed, isPurchasable, isVisibleInShop,
  listDropsNewestFirst, matchDrop, toDropView, type Drop,
} from './drops'

const olympian = getDrop('olympian') as Drop
const sport = getDrop('olympn-sport') as Drop
const at = (iso: string) => Date.parse(iso)
const pf = (name: string, id = '1') => ({ provider: 'printful' as const, id, name })
const publicFile = (src: string) => existsSync(path.join(process.cwd(), 'public', src))

const BEFORE_SPORT = at('2026-10-14T10:00:00Z')
const AFTER_SPORT = at('2026-11-02T10:00:00Z')

describe('drop config', () => {
  it('matches spec section 4 for both editions', () => {
    expect(olympian).toMatchObject({
      edition: 1, title: 'Olympian', slug: 'olympian',
      window: { startsAt: '2026-06-19T19:00:00+02:00', endsAt: null },
      match: { namePrefixes: ['Olympian '] },
      teaser: false, tone: 'light',
    })
    expect(sport).toMatchObject({
      edition: 2, title: 'OLYMPN Sport', slug: 'olympn-sport',
      window: { startsAt: '2026-11-01T12:00:00+01:00', endsAt: null },
      match: { namePrefixes: ['OLYMPN Sport '] },
      teaser: true, waitlist: true, tone: 'dark',
    })
  })

  it('ships all eight OLYMPN Sport mockups as local webp files', () => {
    expect(sport.hero.lineup).toHaveLength(8)
    for (const src of [...sport.hero.lineup, sport.hero.image]) {
      expect(src).toMatch(/^\/drops\/olympn-sport\/[a-z-]+\.webp$/)
      expect(publicFile(src)).toBe(true)
    }
  })

  it('points every Olympian hero asset at a file that exists', () => {
    const assets = [olympian.hero.image, olympian.hero.poster, olympian.hero.video, ...olympian.hero.lineup]
    for (const src of assets) {
      expect(typeof src).toBe('string')
      expect(publicFile(src as string)).toBe(true)
    }
  })

  it('never lets one name prefix swallow another, so no product sits in two drops', () => {
    for (const a of DROPS) {
      for (const b of DROPS) {
        if (a === b) continue
        for (const pa of a.match.namePrefixes) {
          for (const pb of b.match.namePrefixes) {
            expect(pa.toLowerCase().startsWith(pb.toLowerCase())).toBe(false)
          }
        }
      }
    }
  })

  it('has unique ids, slugs and editions', () => {
    for (const key of ['id', 'slug', 'edition'] as const) {
      expect(new Set(DROPS.map((d) => d[key])).size).toBe(DROPS.length)
    }
  })

  it('looks drops up by id and slug', () => {
    expect(getDropBySlug('olympn-sport')).toBe(sport)
    expect(getDropBySlug('og')).toBeNull()
    expect(getDrop('nope')).toBeNull()
  })
})

describe('getDropStatus', () => {
  it.each([
    ['2026-11-01T10:59:59.999Z', 'upcoming'],
    ['2026-11-01T11:00:00.000Z', 'live'],
    ['2026-11-01T12:00:00+01:00', 'live'],
    ['2031-01-01T00:00:00Z', 'live'],
  ])('OLYMPN Sport at %s is %s (12:00 Amsterdam is 11:00 UTC in November)', (iso, status) => {
    expect(getDropStatus(sport, at(iso))).toBe(status)
  })

  it.each([
    ['2026-06-19T16:59:59.999Z', 'upcoming'],
    ['2026-06-19T17:00:00.000Z', 'live'],
  ])('Olympian at %s is %s (19:00 CEST is 17:00 UTC)', (iso, status) => {
    expect(getDropStatus(olympian, at(iso))).toBe(status)
  })

  it('closes a drop exactly at its end date', () => {
    const closing: Drop = { ...sport, window: { startsAt: sport.window.startsAt, endsAt: '2026-12-01T00:00:00+01:00' } }
    expect(getDropStatus(closing, at('2026-11-30T22:59:59.999Z'))).toBe('live')
    expect(getDropStatus(closing, at('2026-11-30T23:00:00.000Z'))).toBe('closed')
  })

  it('treats an upcoming drop as live in preview, but never reopens a closed one', () => {
    expect(getDropStatus(sport, BEFORE_SPORT, { preview: true })).toBe('live')
    const closed: Drop = { ...sport, window: { startsAt: '2026-01-01T00:00:00+01:00', endsAt: '2026-02-01T00:00:00+01:00' } }
    expect(getDropStatus(closed, BEFORE_SPORT, { preview: true })).toBe('closed')
  })
})

describe('matchDrop', () => {
  it.each([
    ['OLYMPN Sport Oversized Hoodie Rose Red', 'olympn-sport'],
    ['olympn sport relaxed hoodie dune', 'olympn-sport'],
    ['  OLYMPN Sport Relaxed Hoodie Olive', 'olympn-sport'],
    ['OLYMPN Sport Oversized Hoodie Mocha', 'olympn-sport'],
    ['OLYMPN  Sport Oversized Hoodie Pistachio', 'olympn-sport'],
    ['Olympian Tee Sand Unisex', 'olympian'],
    ['OLYMPIAN KNITTED TEE OCEAN UNISEX', 'olympian'],
  ])('puts "%s" in %s', (name, id) => {
    expect(matchDrop(pf(name))?.id).toBe(id)
  })

  it.each([
    'Ink/Butter Sport Tee Unisex',
    'X Life4HSP Sport Tee',
    'OLYMPN Sportswear Tee',
    'OLYMPN Sport',
    'Olympian',
    'Olympians Tee',
    '7ENO Ink/Blood Tee Men',
    '',
  ])('leaves "%s" out of every drop', (name) => {
    expect(matchDrop(pf(name))).toBeNull()
  })

  it('never matches a Printify product, whatever its name', () => {
    expect(matchDrop({ provider: 'printify', id: 'abc', name: 'Olympian Tee Sand Unisex' })).toBeNull()
  })

  it('lets an exact sync id win over the name', () => {
    const drops: Drop[] = [olympian, { ...sport, match: { printfulSyncIds: ['424242'], namePrefixes: ['OLYMPN Sport '] } }]
    expect(matchDrop(pf('Olympian Tee Sand Unisex', '424242'), drops)?.id).toBe('olympn-sport')
    expect(matchDrop(pf('Renamed Hoodie', '424242'), drops)?.id).toBe('olympn-sport')
  })
})

describe('purchasability and visibility', () => {
  it('only sells a live drop', () => {
    expect(isPurchasable(null, AFTER_SPORT)).toBe(false)
    expect(isPurchasable(sport, BEFORE_SPORT)).toBe(false)
    expect(isPurchasable(sport, at('2026-11-01T11:00:00Z'))).toBe(true)
    expect(isPurchasable(olympian, BEFORE_SPORT)).toBe(true)
    expect(isPurchasable(sport, BEFORE_SPORT, { preview: true })).toBe(true)
  })

  it('shows a teaser drop before release but keeps a non-teaser drop hidden', () => {
    const quiet: Drop = { ...olympian, window: { startsAt: '2027-03-01T12:00:00+01:00', endsAt: null } }
    expect(isVisibleInShop(sport, BEFORE_SPORT)).toBe(true)
    expect(isVisibleInShop(quiet, BEFORE_SPORT)).toBe(false)
    expect(isDropListed(quiet, BEFORE_SPORT)).toBe(false)
    expect(isDropListed(sport, BEFORE_SPORT)).toBe(true)
  })
})

describe('colour and family', () => {
  it('ranks colours by colourOrder and unknown colours last', () => {
    expect(colourRank(sport, 'OLYMPN Sport Oversized Hoodie Rose Red')).toBe(0)
    expect(colourRank(sport, 'OLYMPN Sport Relaxed Hoodie Maritime')).toBe(6)
    expect(colourRank(sport, 'OLYMPN Sport Relaxed Hoodie Teal')).toBe(sport.colourOrder.length)
  })

  it('labels the colour from the name, not from the Printful garment colour', () => {
    expect(colourLabel(sport, 'OLYMPN Sport Oversized Hoodie Rose Red')).toBe('Rose Red')
    expect(colourLabel(olympian, 'Olympian Tee Sand Unisex')).toBe('Sand')
    expect(colourLabel(sport, 'OLYMPN Sport Relaxed Hoodie Teal')).toBeNull()
  })

  it('strips the colour to find the product family', () => {
    expect(familyKey(sport, 'OLYMPN Sport Oversized Hoodie Rose Red')).toBe('olympn sport oversized hoodie')
    expect(familyKey(olympian, 'Olympian Ocean Backpack 20 L')).toBe('olympian backpack 20 l')
  })
})

describe('labels and views', () => {
  it('formats editions and dates in Amsterdam time, whatever the machine zone', () => {
    expect(formatEdition(2)).toBe('Edition 02')
    expect(formatDropDate(sport.window.startsAt)).toBe('1 November 2026 at 12:00 CET')
    expect(formatDropDate(olympian.window.startsAt)).toBe('19 June 2026 at 19:00 CEST')
    expect(formatDropDay(sport.window.startsAt)).toBe('1 November 2026')
  })

  it('builds a view with status and labels', () => {
    expect(toDropView(sport, BEFORE_SPORT)).toMatchObject({
      id: 'olympn-sport',
      editionLabel: 'Edition 02',
      href: '/collections/olympn-sport',
      status: 'upcoming',
      startsAtLabel: '1 November 2026 at 12:00 CET',
      startsOnLabel: '1 November 2026',
      tone: 'dark',
    })
  })

  it('lists editions newest first', () => {
    expect(listDropsNewestFirst().map((d) => d.id)).toEqual(['olympn-sport', 'olympian'])
  })

  it('picks the next drop: the soonest upcoming one, else the newest live one', () => {
    expect(getNextDrop(BEFORE_SPORT)?.id).toBe('olympn-sport')
    expect(getNextDrop(AFTER_SPORT)?.id).toBe('olympn-sport')
    expect(getNextDrop(at('2026-01-01T00:00:00Z'), {}, [olympian])).toBeNull()
    expect(getNextDrop(at('2026-07-01T00:00:00Z'), {}, [olympian])?.id).toBe('olympian')
  })
})
```

`lib/preview.test.ts`:

```ts
import { PREVIEW_COOKIE, isPreviewCookieValue, isPreviewEnabled, previewParamAction } from './preview'

const PREVIEW = { SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'preview' }
const PRODUCTION = { SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'production' }

describe('preview', () => {
  it('uses its own cookie, not the old seal cookie', () => {
    expect(PREVIEW_COOKIE).toBe('drop_preview')
  })

  it('is enabled with a key outside Vercel production', () => {
    expect(isPreviewEnabled(PREVIEW)).toBe(true)
    expect(isPreviewEnabled({ SITE_PREVIEW_KEY: 'k3y' })).toBe(true)
    expect(isPreviewEnabled(PRODUCTION)).toBe(false)
    expect(isPreviewEnabled({ SITE_PREVIEW_KEY: '' })).toBe(false)
    expect(isPreviewEnabled({})).toBe(false)
  })

  it('accepts only a cookie that carries the key', () => {
    expect(isPreviewCookieValue('k3y', PREVIEW)).toBe(true)
    expect(isPreviewCookieValue('1', PREVIEW)).toBe(false)
    expect(isPreviewCookieValue(undefined, PREVIEW)).toBe(false)
    expect(isPreviewCookieValue('k3y', PRODUCTION)).toBe(false)
  })

  it('maps the ?preview= parameter to an action', () => {
    expect(previewParamAction('off', PREVIEW)).toBe('clear')
    expect(previewParamAction('k3y', PREVIEW)).toBe('set')
    expect(previewParamAction('guess', PREVIEW)).toBe('ignore')
    expect(previewParamAction('k3y', PRODUCTION)).toBe('ignore')
  })
})
```

`lib/preview-session.test.ts`:

```ts
/** @jest-environment node */
import { cookies } from 'next/headers'
import { isPreviewSession } from './preview-session'

jest.mock('next/headers', () => ({ cookies: jest.fn() }))

const ORIGINAL_ENV = { ...process.env }

function withCookie(value: string | undefined) {
  jest.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'drop_preview' && value !== undefined ? { name, value } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
}

beforeEach(() => {
  jest.mocked(cookies).mockReset()
  process.env = { ...ORIGINAL_ENV, SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'preview' }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('isPreviewSession', () => {
  it('never reads cookies when preview is off, so pages stay static', async () => {
    delete process.env.SITE_PREVIEW_KEY
    await expect(isPreviewSession()).resolves.toBe(false)
    expect(cookies).not.toHaveBeenCalled()
  })

  it('is true for the cookie that carries the key', async () => {
    withCookie('k3y')
    await expect(isPreviewSession()).resolves.toBe(true)
  })

  it('is false for a hand-made cookie', async () => {
    withCookie('1')
    await expect(isPreviewSession()).resolves.toBe(false)
  })

  it('is false on Vercel production even with the right cookie', async () => {
    process.env.VERCEL_ENV = 'production'
    withCookie('k3y')
    await expect(isPreviewSession()).resolves.toBe(false)
    expect(cookies).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4: Run de tests, verwacht falen**

Run: `npm test -- lib/(drops|preview)`
Expected: FAIL, `Cannot find module './drops'`, `'./preview'`, `'./preview-session'`.

- [ ] **Step 5: Implementeer `lib/drops.ts`**

```ts
import type { NormalizedProduct } from '@/types/catalog'

export type DropStatus = 'upcoming' | 'live' | 'closed'
export type DropId = 'olympian' | 'olympn-sport'

export interface Drop {
  id: DropId
  /** 1, 2: shown as "Edition 02". */
  edition: number
  /** "OLYMPN Sport" */
  title: string
  /** URL segment under /collections. */
  slug: string
  /** ISO 8601 with an explicit offset, so the moment is the same in every time zone. */
  window: { startsAt: string; endsAt: string | null }
  match: {
    /** Exact Printful sync-product ids; they win over the name. Filled after "Add to store". */
    printfulSyncIds: string[]
    /** Case-insensitive name prefixes, e.g. "OLYMPN Sport ". */
    namePrefixes: string[]
  }
  hero: { image: string; alt: string; video?: string; poster?: string; lineup: string[] }
  intro: string
  waitlist: boolean
  /** Products are visible, but not buyable, before the release. */
  teaser: boolean
  /** Landing surface: cream (light) or navy (dark). */
  tone: 'light' | 'dark'
  /** Lowercase colour names in display order within a product family. */
  colourOrder: string[]
  /** "Model is 1,85 m and wears L" */
  modelNote?: string
}

export interface DropClockOptions {
  /** A valid SITE_PREVIEW_KEY cookie: an upcoming drop counts as live (QA only). */
  preview?: boolean
}

/**
 * The editions, oldest first. The OG range is not an edition: it left the
 * site with the v2 rebrand (spec section 5, Archive).
 */
export const DROPS: readonly Drop[] = [
  {
    id: 'olympian',
    edition: 1,
    title: 'Olympian',
    slug: 'olympian',
    window: { startsAt: '2026-06-19T19:00:00+02:00', endsAt: null },
    match: { printfulSyncIds: [], namePrefixes: ['Olympian '] },
    hero: {
      image: '/olympian/olympian-teal-model.jpg',
      alt: 'Model wearing the Olympian knitted tee in Ocean',
      video: '/olympian-trailer.mp4',
      poster: '/olympian/hero-poster.jpg',
      lineup: [
        '/olympian/olympian-teal-model.jpg',
        '/olympian/olympian-clay-model.jpg',
        '/olympian/olympian-wheat-model.jpg',
        '/olympian/olympian-rosa-model.jpg',
      ],
    },
    intro:
      'Ringer tees, knitted tees and backpacks in four colourways: Ocean, Coconut, Sand and Flamingo. Made to order.',
    waitlist: false,
    teaser: false,
    tone: 'light',
    colourOrder: ['ocean', 'coconut', 'sand', 'flamingo'],
  },
  {
    id: 'olympn-sport',
    edition: 2,
    title: 'OLYMPN Sport',
    slug: 'olympn-sport',
    window: { startsAt: '2026-11-01T12:00:00+01:00', endsAt: null },
    match: { printfulSyncIds: [], namePrefixes: ['OLYMPN Sport '] },
    hero: {
      image: '/drops/olympn-sport/dune.webp',
      alt: 'OLYMPN Sport Relaxed Hoodie in Dune',
      lineup: [
        '/drops/olympn-sport/rose-red.webp',
        '/drops/olympn-sport/pistachio.webp',
        '/drops/olympn-sport/mocha.webp',
        '/drops/olympn-sport/obsidian-oversized.webp',
        '/drops/olympn-sport/dune.webp',
        '/drops/olympn-sport/olive.webp',
        '/drops/olympn-sport/obsidian-relaxed.webp',
        '/drops/olympn-sport/maritime.webp',
      ],
    },
    intro:
      'Oversized heavyweight and relaxed hoodies, eight pieces, finished with the OLYMPN SPORT gradient print. Made to order.',
    waitlist: true,
    teaser: true,
    tone: 'dark',
    colourOrder: ['rose red', 'pistachio', 'mocha', 'obsidian', 'dune', 'olive', 'maritime'],
  },
]

/**
 * The current time for pages. React's purity lint rule forbids Date.now() in
 * a component body; reading it through this helper keeps that rule happy and
 * gives tests one place to fake the clock.
 */
export function currentTimeMs(): number {
  return Date.now()
}

/** A live drop counts as "New in" for its first 30 days (tiles and the drop block). */
export const NEW_IN_MS = 30 * 24 * 60 * 60 * 1000

/** Same whitespace (also non-breaking), no leading space, lowercase. */
function comparable(value: string): string {
  return value.replace(/\s+/g, ' ').trimStart().toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function getDropStatus(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): DropStatus {
  const endsAt = drop.window.endsAt === null ? null : Date.parse(drop.window.endsAt)
  if (endsAt !== null && now >= endsAt) return 'closed'
  if (now < Date.parse(drop.window.startsAt)) return opts.preview ? 'live' : 'upcoming'
  return 'live'
}

/**
 * The drop a product belongs to: an exact sync id first, then the name
 * prefix. Printful only; anything else (Printify, OG, unplanned products)
 * belongs to no drop and so never reaches the shop.
 */
export function matchDrop(
  p: Pick<NormalizedProduct, 'id' | 'provider' | 'name'>,
  drops: readonly Drop[] = DROPS
): Drop | null {
  if (p.provider !== 'printful') return null
  const byId = drops.find((d) => d.match.printfulSyncIds.includes(p.id))
  if (byId) return byId
  const name = comparable(p.name)
  return drops.find((d) => d.match.namePrefixes.some((prefix) => name.startsWith(comparable(prefix)))) ?? null
}

export function isPurchasable(drop: Drop | null, now: number = Date.now(), opts: DropClockOptions = {}): boolean {
  return drop !== null && getDropStatus(drop, now, opts) === 'live'
}

/** Products show in the shop when the drop is live, or upcoming with a teaser. */
export function isVisibleInShop(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): boolean {
  const status = getDropStatus(drop, now, opts)
  return status === 'live' || (status === 'upcoming' && drop.teaser)
}

/** Landing, archive and sitemap: every drop except an upcoming one without a teaser. */
export function isDropListed(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): boolean {
  return getDropStatus(drop, now, opts) !== 'upcoming' || drop.teaser
}

export function getDrop(id: string): Drop | null {
  return DROPS.find((d) => d.id === id) ?? null
}

export function getDropBySlug(slug: string): Drop | null {
  return DROPS.find((d) => d.slug === slug) ?? null
}

export function formatEdition(edition: number): string {
  return `Edition ${String(edition).padStart(2, '0')}`
}

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'short',
})

const DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** "1 November 2026 at 12:00 CET": the static text next to every countdown. */
export function formatDropDate(iso: string): string {
  return DATE_TIME.format(new Date(iso))
}

/** "1 November 2026" */
export function formatDropDay(iso: string): string {
  return DAY.format(new Date(iso))
}

function colourIndex(drop: Drop, name: string): number {
  const n = comparable(name)
  return drop.colourOrder.findIndex((c) => new RegExp(`\\b${escapeRegExp(c)}\\b`).test(n))
}

/** Position in colourOrder; unknown colours sort after the known ones. */
export function colourRank(drop: Drop, name: string): number {
  const i = colourIndex(drop, name)
  return i === -1 ? drop.colourOrder.length : i
}

/** "Rose Red" from "OLYMPN Sport Oversized Hoodie Rose Red"; null when no known colour is in the name. */
export function colourLabel(drop: Drop, name: string): string | null {
  const i = colourIndex(drop, name)
  if (i === -1) return null
  return drop.colourOrder[i]
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** The name without its colour: colours of one product share a family. */
export function familyKey(drop: Drop, name: string): string {
  let n = comparable(name)
  for (const c of drop.colourOrder) {
    n = n.replace(new RegExp(`\\b${escapeRegExp(c)}\\b`, 'g'), ' ')
  }
  return n.replace(/\s+/g, ' ').trim()
}

/** What the UI needs about a drop, computed once on the server. */
export interface DropView {
  id: DropId
  edition: number
  editionLabel: string
  title: string
  slug: string
  href: string
  status: DropStatus
  startsAt: string
  startsAtLabel: string
  startsOnLabel: string
  endsAt: string | null
  intro: string
  tone: 'light' | 'dark'
  waitlist: boolean
  teaser: boolean
  hero: Drop['hero']
}

export function toDropView(drop: Drop, now: number = Date.now(), opts: DropClockOptions = {}): DropView {
  return {
    id: drop.id,
    edition: drop.edition,
    editionLabel: formatEdition(drop.edition),
    title: drop.title,
    slug: drop.slug,
    href: `/collections/${drop.slug}`,
    status: getDropStatus(drop, now, opts),
    startsAt: drop.window.startsAt,
    startsAtLabel: formatDropDate(drop.window.startsAt),
    startsOnLabel: formatDropDay(drop.window.startsAt),
    endsAt: drop.window.endsAt,
    intro: drop.intro,
    tone: drop.tone,
    waitlist: drop.waitlist,
    teaser: drop.teaser,
    hero: drop.hero,
  }
}

export function listDropsNewestFirst(drops: readonly Drop[] = DROPS): Drop[] {
  return [...drops].sort((a, b) => b.edition - a.edition)
}

/** Home hero: the soonest upcoming listed drop, otherwise the newest live one. */
export function getNextDrop(
  now: number = Date.now(),
  opts: DropClockOptions = {},
  drops: readonly Drop[] = DROPS
): Drop | null {
  const listed = drops.filter((d) => isDropListed(d, now, opts))
  const upcoming = listed
    .filter((d) => getDropStatus(d, now, opts) === 'upcoming')
    .sort((a, b) => Date.parse(a.window.startsAt) - Date.parse(b.window.startsAt))
  if (upcoming.length > 0) return upcoming[0]
  return listDropsNewestFirst(listed.filter((d) => getDropStatus(d, now, opts) === 'live'))[0] ?? null
}
```

- [ ] **Step 6: Implementeer de preview-modules**

`lib/preview.ts`:

```ts
/**
 * QA preview for upcoming drops (spec section 4). `?preview=<SITE_PREVIEW_KEY>`
 * stores the key in an httpOnly cookie (proxy.ts); with that cookie an
 * upcoming drop counts as live. The cookie carries the key itself, so a
 * hand-made cookie does nothing, and preview is never honoured on Vercel
 * production, where pages must stay static and the drop clock is the law.
 */
export const PREVIEW_COOKIE = 'drop_preview'
export const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

type Env = Record<string, string | undefined>

export function isPreviewEnabled(env: Env = process.env): boolean {
  return Boolean(env.SITE_PREVIEW_KEY) && env.VERCEL_ENV !== 'production'
}

export function isPreviewCookieValue(value: string | undefined, env: Env = process.env): boolean {
  return isPreviewEnabled(env) && value !== undefined && value === env.SITE_PREVIEW_KEY
}

export type PreviewParamAction = 'set' | 'clear' | 'ignore'

export function previewParamAction(param: string, env: Env = process.env): PreviewParamAction {
  if (param === 'off') return 'clear'
  if (isPreviewEnabled(env) && param === env.SITE_PREVIEW_KEY) return 'set'
  return 'ignore'
}
```

`lib/preview-session.ts`:

```ts
import { cookies } from 'next/headers'
import { PREVIEW_COOKIE, isPreviewCookieValue, isPreviewEnabled } from '@/lib/preview'

/**
 * Whether this request carries a valid preview cookie. Reads cookies() only
 * when preview is enabled: cookies() opts the route into dynamic rendering,
 * which production (preview disabled) never pays for.
 */
export async function isPreviewSession(): Promise<boolean> {
  if (!isPreviewEnabled()) return false
  const store = await cookies()
  return isPreviewCookieValue(store.get(PREVIEW_COOKIE)?.value)
}
```

- [ ] **Step 7: `proxy.ts` zet de nieuwe cookie**

Vervang regel 1-6:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isShopLocked } from '@/lib/release'
import { PREVIEW_COOKIE, PREVIEW_COOKIE_MAX_AGE, isPreviewCookieValue, previewParamAction } from '@/lib/preview'
```

Vervang regel 68-94 (van `export async function proxy` tot en met `const hasBypass = ...`):

```ts
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Preview cookie ──────────────────────────────────────────────────────
  // `?preview=<SITE_PREVIEW_KEY>` stores the key in an httpOnly cookie so an
  // upcoming drop shows as live for QA (lib/preview.ts), then redirects to the
  // clean URL. `?preview=off` clears it. Ignored on Vercel production.
  const previewParam = request.nextUrl.searchParams.get('preview')
  if (previewParam !== null) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('preview')
    const res = NextResponse.redirect(cleanUrl)
    const action = previewParamAction(previewParam)
    if (action === 'clear') {
      res.cookies.delete({ name: PREVIEW_COOKIE, path: '/' })
    } else if (action === 'set') {
      res.cookies.set(PREVIEW_COOKIE, process.env.SITE_PREVIEW_KEY ?? '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: PREVIEW_COOKIE_MAX_AGE,
      })
    }
    return res
  }

  const hasBypass = isPreviewCookieValue(request.cookies.get(PREVIEW_COOKIE)?.value)
```

De seal eronder (regel 96-106) blijft tot Task 9 staan; hij is sinds 19-06-2026 inactief.

- [ ] **Step 8: Run de tests, verwacht slagen**

Run: `npm test -- lib/(drops|preview)`
Expected: PASS, 48 tests.

- [ ] **Step 9: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 10: Commit**

```bash
git add scripts/download-drop-mockups.mjs public/drops/olympn-sport lib/drops.ts lib/drops.test.ts lib/preview.ts lib/preview.test.ts lib/preview-session.ts lib/preview-session.test.ts proxy.ts
git commit -m "feat: add drop model, preview cookie and OLYMPN Sport lineup"
```

---

### Task 7: `getShopProducts` en de catalogusafnemers

**Files:**
- Modify: `lib/catalog.ts:1-68` (volledig vervangen)
- Test: `lib/catalog.test.ts:1-3` (imports), plus twee nieuwe `describe`-blokken onderaan
- Modify: `lib/bundles.ts:25-105` (lege lijst, lijst als parameter)
- Test: `lib/bundles.test.ts:1-57` (volledig vervangen, fixtures)
- Modify: `app/page.tsx:4`, `app/page.tsx:118-124`
- Modify: `app/shop/page.tsx:4`, `app/shop/page.tsx:139-144`, `app/shop/page.tsx:232-236`
- Modify: `app/shop/[slug]/page.tsx:4`, `app/shop/[slug]/page.tsx:21-33`, `app/shop/[slug]/page.tsx:58-76`
- Modify: `app/size-guide/page.tsx:3`, `app/size-guide/page.tsx:87`, `app/size-guide/page.tsx:112-117`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/permanentRedirect.md` (regel 11: buiten een server action geeft `permanentRedirect` een 308; regel 50: de aanroep gooit `NEXT_REDIRECT`, dus niet in een `try` zetten).

**Interfaces:**
- Consumes: `matchDrop`, `getDropStatus`, `isVisibleInShop`, `familyKey`, `colourRank`, `currentTimeMs`, `Drop`, `DropStatus`, `DropClockOptions` (Task 6); `isPreviewSession` (Task 6).
- Produces:
  - `export interface ShopProduct extends NormalizedProduct { slug: string; drop: Drop; status: DropStatus; purchasable: boolean; soldOut: boolean }`
  - `export function toShopProducts(products: NormalizedProduct[], now?: number, opts?: DropClockOptions): ShopProduct[]` (puur: allow-list, status, sortering)
  - `export function compareShopProducts(a: ShopProduct, b: ShopProduct): number` (editie aflopend, familie, `colourOrder`)
  - `export async function getShopProducts(now?: number, opts?: DropClockOptions): Promise<ShopProduct[]>` (alleen Printful, met varianten geladen; Printify wordt niet opgehaald)
  - `export async function isRetiredProductSlug(slug: string): Promise<boolean>` (bestaat in de ruwe catalogus van beide providers, maar in geen zichtbare drop)
  - `export function findBySlug<T extends NormalizedProduct>(products: T[], slug: string): T | null`
  - `lib/bundles.ts`: `getBundles(list?)`, `getBundle(id, list?)`, `getBundleBySlug(slug, list?)`, `getBundlesForProduct(ref, list?)`, `assertUniqueBundleProducts(list)`; de live lijst is leeg.

`getCatalogProducts()` blijft bestaan als ruwe lijst (Printful plus Printify) en wordt alleen nog gebruikt door `isRetiredProductSlug`, de sitemap, de feed en `/olympian` tot die in Task 9 en 10 overstappen.

- [ ] **Step 1: Schrijf de falende tests**

In `lib/catalog.test.ts` vervang regel 1-3:

```ts
import type { NormalizedProduct } from '@/types/catalog'
import type { PrintfulProductDetail } from '@/types/printful'
import * as printful from '@/lib/printful'
import * as printify from '@/lib/printify'
```

Voeg onderaan het bestand toe:

```ts
describe('getShopProducts', () => {
  const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')
  const SPORT_RELEASE = Date.parse('2026-11-01T11:00:00Z')

  const listing = (id: number, name: string) => ({
    id, name, thumbnail_url: `https://files.cdn.printful.com/${id}.png`, variants: 2, synced: 2,
  })
  const detail = (id: number, name: string, stock: boolean[] = [true, true]): PrintfulProductDetail => ({
    sync_product: listing(id, name),
    sync_variants: stock.map((inStock, i) => ({
      id: id * 10 + i, sync_product_id: id, variant_id: 4000 + i, name: `${name} / ${['M', 'L', 'XL'][i]}`,
      retail_price: '45.00', currency: 'EUR', is_ignored: false, sku: `${id}-${i}`, files: [],
      size: ['M', 'L', 'XL'][i], color: 'White', color_code: '#ffffff', color_code2: null, in_stock: inStock,
    })),
  })

  // Provider order on purpose: OG first, Olympian and OLYMPN Sport mixed.
  const CATALOGUE: [number, string][] = [
    [1, 'Ink/Butter Sport Tee Unisex'],
    [2, 'Olympian Tee Sand Unisex'],
    [3, 'Olympian Knitted Tee Ocean Unisex'],
    [4, 'OLYMPN Sport Oversized Hoodie Mocha'],
    [5, 'OLYMPN Sport Relaxed Hoodie Dune'],
    [6, 'Olympian Tee Ocean Unisex'],
  ]
  let details: Map<string, PrintfulProductDetail>

  beforeEach(() => {
    details = new Map(CATALOGUE.map(([id, name]) => [String(id), detail(id, name)]))
    jest.mocked(printful.getProducts).mockReset().mockResolvedValue(CATALOGUE.map(([id, name]) => listing(id, name)))
    jest.mocked(printful.getProduct).mockReset().mockImplementation(async (id: string) => {
      const d = details.get(id)
      if (!d) throw new Error(`no detail for ${id}`)
      return d
    })
    jest.mocked(printify.getProducts).mockReset()
  })

  it('keeps only drop products, sorted by edition, family and colour', async () => {
    const { getShopProducts } = await import('./catalog')
    const names = (await getShopProducts(BEFORE_SPORT)).map((p) => p.name)
    expect(names).toEqual([
      'OLYMPN Sport Oversized Hoodie Mocha',
      'OLYMPN Sport Relaxed Hoodie Dune',
      'Olympian Knitted Tee Ocean Unisex',
      'Olympian Tee Ocean Unisex',
      'Olympian Tee Sand Unisex',
    ])
  })

  it('never fetches Printify', async () => {
    const { getShopProducts } = await import('./catalog')
    await getShopProducts(BEFORE_SPORT)
    expect(printify.getProducts).not.toHaveBeenCalled()
  })

  it('shows teaser products before the release, but not for sale', async () => {
    const { getShopProducts } = await import('./catalog')
    const products = await getShopProducts(BEFORE_SPORT)
    const sport = products.filter((p) => p.drop.id === 'olympn-sport')
    expect(sport).toHaveLength(2)
    expect(sport.every((p) => p.status === 'upcoming' && !p.purchasable)).toBe(true)
    expect(products.filter((p) => p.drop.id === 'olympian').every((p) => p.purchasable)).toBe(true)
  })

  it('sells teaser products from the release millisecond', async () => {
    const { getShopProducts } = await import('./catalog')
    const sport = (await getShopProducts(SPORT_RELEASE)).filter((p) => p.drop.id === 'olympn-sport')
    expect(sport.every((p) => p.status === 'live' && p.purchasable)).toBe(true)
  })

  it('sells an upcoming drop in preview', async () => {
    const { getShopProducts } = await import('./catalog')
    const sport = (await getShopProducts(BEFORE_SPORT, { preview: true })).filter((p) => p.drop.id === 'olympn-sport')
    expect(sport.every((p) => p.purchasable)).toBe(true)
  })

  it('marks a product with every variant out of stock as sold out instead of hiding it', async () => {
    details.set('2', detail(2, 'Olympian Tee Sand Unisex', [false, false]))
    const { getShopProducts } = await import('./catalog')
    const sand = (await getShopProducts(BEFORE_SPORT)).find((p) => p.id === '2')
    expect(sand?.soldOut).toBe(true)
    expect(sand?.slug).toBe('olympian-tee-sand-unisex')
  })

  it('loads variants and price from the product detail', async () => {
    const { getShopProducts } = await import('./catalog')
    const ocean = (await getShopProducts(BEFORE_SPORT)).find((p) => p.id === '6')
    expect(ocean?.variants).toHaveLength(2)
    expect(ocean?.priceCents).toBe(4500)
    expect(ocean?.soldOut).toBe(false)
  })

  it('keeps a product whose detail fails, without claiming it is sold out', async () => {
    details.delete('3')
    const { getShopProducts } = await import('./catalog')
    const knit = (await getShopProducts(BEFORE_SPORT)).find((p) => p.id === '3')
    expect(knit?.variants).toEqual([])
    expect(knit?.soldOut).toBe(false)
  })

  it('returns an empty shop when Printful is down', async () => {
    jest.mocked(printful.getProducts).mockRejectedValue(new Error('printful down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getShopProducts } = await import('./catalog')
    await expect(getShopProducts(BEFORE_SPORT)).resolves.toEqual([])
    errorSpy.mockRestore()
  })
})

describe('isRetiredProductSlug', () => {
  beforeEach(() => {
    jest.mocked(printful.getProducts).mockReset().mockResolvedValue([
      { id: 433345476, name: 'Ink/Butter Sport Tee Unisex', thumbnail_url: null, variants: 5, synced: 5 },
    ])
    jest.mocked(printify.getProducts).mockReset().mockResolvedValue([pi])
  })

  it('recognises an OG or Printify product that left the shop', async () => {
    const { isRetiredProductSlug } = await import('./catalog')
    await expect(isRetiredProductSlug('ink-butter-sport-tee-unisex')).resolves.toBe(true)
    await expect(isRetiredProductSlug('olympus-tee')).resolves.toBe(true)
  })

  it('is false for a slug that never existed', async () => {
    const { isRetiredProductSlug } = await import('./catalog')
    await expect(isRetiredProductSlug('no-such-product')).resolves.toBe(false)
  })
})
```

`lib/bundles.test.ts` (volledig vervangen):

```ts
import {
  assertUniqueBundleProducts, computeBundlePricing, getBundle, getBundleBySlug, getBundles, getBundlesForProduct,
  type Bundle,
} from './bundles'

// Fixtures: the live list is empty since the OG sets left with the rebrand.
const SETS: Bundle[] = [
  {
    id: 'tee-shorts-set',
    title: 'Tee and Shorts Set',
    discountCents: 500,
    products: [
      { provider: 'printful', productId: '101', slug: 'test-tee' },
      { provider: 'printful', productId: '102', slug: 'test-shorts' },
    ],
  },
  {
    id: 'tee-cap-set',
    title: 'Tee and Cap Set',
    discountCents: 300,
    products: [
      { provider: 'printful', productId: '101', slug: 'test-tee' },
      { provider: 'printful', productId: '201', slug: 'test-cap' },
    ],
  },
]

describe('computeBundlePricing', () => {
  it('subtracts the discount from the summed price', () => {
    expect(computeBundlePricing(5000, 705)).toEqual({ sumCents: 5000, discountCents: 705, setCents: 4295 })
  })
  it('clamps the discount so the set price never goes negative', () => {
    expect(computeBundlePricing(500, 705)).toEqual({ sumCents: 500, discountCents: 500, setCents: 0 })
  })
  it('treats a negative discount as zero', () => {
    expect(computeBundlePricing(5000, -100)).toEqual({ sumCents: 5000, discountCents: 0, setCents: 5000 })
  })
})

describe('live bundles', () => {
  it('has no live sets: every set was OG and OG left the shop', () => {
    expect(getBundles()).toEqual([])
    expect(getBundle('ink-butter-sport-set')).toBeNull()
    expect(getBundlesForProduct({ productId: '433345476' })).toEqual([])
  })
})

describe('bundle lookups', () => {
  it('returns a copy of the list', () => {
    const list = getBundles(SETS)
    expect(list).toEqual(SETS)
    expect(list).not.toBe(SETS)
  })
  it('finds a bundle by id and the same one by slug', () => {
    expect(getBundle('tee-cap-set', SETS)).toBe(SETS[1])
    expect(getBundleBySlug('tee-cap-set', SETS)).toBe(SETS[1])
  })
  it('returns null for an unknown id', () => {
    expect(getBundle('does-not-exist', SETS)).toBeNull()
    expect(getBundleBySlug('does-not-exist', SETS)).toBeNull()
  })
})

describe('getBundlesForProduct', () => {
  it('finds every set that contains a product, by id or by slug', () => {
    expect(getBundlesForProduct({ productId: '101' }, SETS)).toEqual(SETS)
    expect(getBundlesForProduct({ slug: 'test-cap' }, SETS)).toEqual([SETS[1]])
  })
  it('returns an empty array when no set contains the product', () => {
    expect(getBundlesForProduct({ slug: 'definitely-not-a-product' }, SETS)).toEqual([])
    expect(getBundlesForProduct({}, SETS)).toEqual([])
  })
})

describe('assertUniqueBundleProducts', () => {
  it('rejects a set that lists the same product twice', () => {
    const broken: Bundle = { ...SETS[0], products: [SETS[0].products[0], SETS[0].products[0]] }
    expect(() => assertUniqueBundleProducts([broken])).toThrow('Bundle "tee-shorts-set" contains duplicate productIds')
    expect(() => assertUniqueBundleProducts(SETS)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- lib/(catalog|bundles)`
Expected: FAIL: `getShopProducts is not a function`, `isRetiredProductSlug is not a function`, `assertUniqueBundleProducts is not a function` en `expect(getBundles()).toEqual([])` krijgt vier sets.

- [ ] **Step 3: Vervang `lib/catalog.ts`**

```ts
import type { NormalizedProduct, Provider } from '@/types/catalog'
import { productSlug } from '@/lib/slug'
import * as printful from '@/lib/printful'
import { normalizePrintfulProduct, normalizePrintfulDetail } from '@/lib/printful-normalize'
import * as printify from '@/lib/printify'
import { isUnreleasedProductName } from '@/lib/unreleased'
import {
  colourRank, currentTimeMs, familyKey, getDropStatus, isVisibleInShop, matchDrop,
  type Drop, type DropClockOptions, type DropStatus,
} from '@/lib/drops'

/**
 * Combine two providers' results. Each is a settled promise so one provider
 * failing never blanks the list (it returns the other's products instead of an
 * empty list, avoiding a cached empty page on partial failure).
 */
export function mergeCatalogs(
  pf: PromiseSettledResult<NormalizedProduct[]>,
  pi: PromiseSettledResult<NormalizedProduct[]>
): NormalizedProduct[] {
  const out: NormalizedProduct[] = []
  if (pf.status === 'fulfilled') out.push(...pf.value)
  else console.error('[Catalog] Printful fetch failed:', pf.reason)
  if (pi.status === 'fulfilled') out.push(...pi.value)
  else console.error('[Catalog] Printify fetch failed:', pi.reason)
  return out
}

/**
 * Whether a product has at least one variant in stock. A product whose
 * variants are not loaded yet (list-level Printful) counts as in stock, so it
 * is never marked sold out on missing data.
 */
export function isInStock(product: NormalizedProduct): boolean {
  if (product.variants.length === 0) return true
  return product.variants.some((v) => v.inStock !== false)
}

/** Find a product in a list by its name-based slug. */
export function findBySlug<T extends NormalizedProduct>(products: T[], slug: string): T | null {
  const matches = products.filter((p) => productSlug(p.name) === slug)
  if (matches.length === 0) return null
  if (matches.length > 1) {
    console.warn(`[Catalog] slug "${slug}" matches ${matches.length} products across providers`)
  }
  return matches[0]
}

/**
 * The raw catalogue of both providers (list level). Never render this: the
 * shop shows getShopProducts. Only used to recognise retired product URLs.
 */
export async function getCatalogProducts(): Promise<NormalizedProduct[]> {
  const [pf, pi] = await Promise.allSettled([
    printful.getProducts().then((ps) => ps.map(normalizePrintfulProduct)),
    printify.getProducts(),
  ])
  return mergeCatalogs(pf, pi).filter((p) => !isUnreleasedProductName(p.name))
}

/** A single product with full variants, fetched from the right provider. */
export async function getCatalogProduct(
  provider: Provider,
  id: string
): Promise<NormalizedProduct> {
  if (provider === 'printify') return printify.getProduct(id)
  const detail = await printful.getProduct(id)
  return normalizePrintfulDetail(detail)
}

/** A catalogue product that belongs to a drop the shop shows right now. */
export interface ShopProduct extends NormalizedProduct {
  slug: string
  drop: Drop
  /** Status on the drop clock, preview included. */
  status: DropStatus
  purchasable: boolean
  /** Every variant out of stock: shown with a badge, never hidden. */
  soldOut: boolean
}

/** Spec section 4: edition descending, then product family, then colourOrder. */
export function compareShopProducts(a: ShopProduct, b: ShopProduct): number {
  return (
    b.drop.edition - a.drop.edition ||
    familyKey(a.drop, a.name).localeCompare(familyKey(b.drop, b.name)) ||
    colourRank(a.drop, a.name) - colourRank(b.drop, b.name)
  )
}

/**
 * The allow-list: only products of a drop that is live (or upcoming with a
 * teaser) survive. OG, Printify and any unplanned product stay invisible.
 */
export function toShopProducts(
  products: NormalizedProduct[],
  now: number = currentTimeMs(),
  opts: DropClockOptions = {}
): ShopProduct[] {
  const out: ShopProduct[] = []
  for (const p of products) {
    const drop = matchDrop(p)
    if (!drop || !isVisibleInShop(drop, now, opts)) continue
    const status = getDropStatus(drop, now, opts)
    out.push({ ...p, slug: productSlug(p.name), drop, status, purchasable: status === 'live', soldOut: !isInStock(p) })
  }
  return out.sort(compareShopProducts)
}

/**
 * Everything the shop shows, with variants loaded so price and sold-out
 * state are real. Printify is not fetched: no drop matches it.
 */
export async function getShopProducts(
  now: number = currentTimeMs(),
  opts: DropClockOptions = {}
): Promise<ShopProduct[]> {
  let listed: NormalizedProduct[]
  try {
    listed = (await printful.getProducts()).map(normalizePrintfulProduct)
  } catch (err) {
    console.error('[Catalog] Printful fetch failed:', err)
    return []
  }
  return Promise.all(
    toShopProducts(listed, now, opts).map(async (p) => {
      if (p.variants.length > 0) return p
      try {
        const detail = await getCatalogProduct(p.provider, p.id)
        return { ...p, ...detail, slug: p.slug, soldOut: !isInStock(detail) }
      } catch {
        return p
      }
    })
  )
}

/** A product URL that existed but is no longer in any visible drop (OG, Printify). */
export async function isRetiredProductSlug(slug: string): Promise<boolean> {
  try {
    return findBySlug(await getCatalogProducts(), slug) !== null
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Bundels uit**

In `lib/bundles.ts` vervang regel 25-105 (van de kop `// Live bundles` tot en met `getBundlesForProduct`):

```ts
// ─────────────────────────────────────────────────────────────────────────────
// No live sets. Every set was built from OG products, and OG left the shop with
// the v2 rebrand (spec section 1). The pricing and discount logic stays for
// future sets; add them here with real Printful sync-product ids.
// ─────────────────────────────────────────────────────────────────────────────
const BUNDLES: Bundle[] = []

/** A set must not list the same product twice (the discount check assumes one item per product). */
export function assertUniqueBundleProducts(list: readonly Bundle[]): void {
  for (const b of list) {
    const ids = b.products.map((p) => p.productId)
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Bundle "${b.id}" contains duplicate productIds`)
    }
  }
}

if (process.env.NODE_ENV !== 'production') assertUniqueBundleProducts(BUNDLES)

export function getBundles(list: readonly Bundle[] = BUNDLES): Bundle[] {
  return [...list]
}

export function getBundle(id: string, list: readonly Bundle[] = BUNDLES): Bundle | null {
  return list.find((b) => b.id === id) ?? null
}

/** The URL slug for a bundle is its id. */
export function getBundleBySlug(slug: string, list: readonly Bundle[] = BUNDLES): Bundle | null {
  return getBundle(slug, list)
}

/** Bundles that contain the given product, matched by productId or slug. */
export function getBundlesForProduct(
  ref: { productId?: string; slug?: string },
  list: readonly Bundle[] = BUNDLES
): Bundle[] {
  return list.filter((b) =>
    b.products.some(
      (p) =>
        (ref.productId !== undefined && p.productId === ref.productId) ||
        (ref.slug !== undefined && p.slug === ref.slug),
    ),
  )
}
```

`getBundle` blijft bruikbaar als callback `(id: string) => Bundle | null` in `resolveBundleDiscountCents` en `useCartTotals`: die roepen hem met één argument aan.

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- lib/(catalog|bundles)`
Expected: PASS (de bestaande `mergeCatalogs`, `findBySlug`, `isInStock` en `getCatalogProducts`-tests blijven groen).

- [ ] **Step 6: Home leest de winkel**

In `app/page.tsx` vervang regel 4:

```ts
import { getShopProducts, getCatalogProduct, isInStock } from '@/lib/catalog'
import { currentTimeMs } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
```

Vervang regel 118-124:

```tsx
export default async function HomePage() {
  let products: NormalizedProduct[] = []
  try {
    // Only pieces that can be bought now: a teaser in the quick-add carousel
    // would offer an add-to-cart that the checkout refuses.
    const shop = await getShopProducts(currentTimeMs(), { preview: await isPreviewSession() })
    products = shop.filter((p) => p.purchasable)
  } catch (err) {
    console.error('[Catalog] getShopProducts failed:', err)
  }
```

- [ ] **Step 7: De oude shoppagina leest de winkel**

In `app/shop/page.tsx` vervang regel 4:

```ts
import { getShopProducts, getCatalogProduct, isInStock, type ShopProduct } from '@/lib/catalog'
import { currentTimeMs } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
```

Vervang regel 139-144:

```tsx
  let allProducts: ShopProduct[] = []
  try {
    allProducts = await getShopProducts(currentTimeMs(), { preview: await isPreviewSession() })
  } catch (err) {
    console.error('[Catalog] getShopProducts failed:', err)
  }
```

Vervang regel 232-236:

```tsx
  // Sold-out products stay visible (spec section 4); the v2 tile marks them.
  const visibleCards = products.map((p, i) => ({ product: p, bgUrl: bgRemovedUrls[i] }))
```

De rest van de pagina (filters `gender`/`line`, `ProductCard`) blijft tot Task 14 staan.

- [ ] **Step 8: De PDP leest de winkel en stuurt vervallen producten door**

In `app/shop/[slug]/page.tsx` vervang regel 4:

```ts
import { getShopProducts, getCatalogProduct, findBySlug, isRetiredProductSlug, type ShopProduct } from '@/lib/catalog'
import { currentTimeMs } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
```

Vervang regel 21-33 (`generateStaticParams` tot en met de `match`-regel in `generateMetadata`):

```tsx
export async function generateStaticParams() {
  try {
    const products = await getShopProducts()
    return products.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const products = await getShopProducts(currentTimeMs(), { preview: await isPreviewSession() }).catch(
    () => [] as ShopProduct[]
  )
  const match = findBySlug(products, slug)
```

Vervang regel 58-76 (van `export default async function ProductPage` tot en met `if (!match) notFound()`):

```tsx
export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(currentTimeMs(), { preview: await isPreviewSession() })
  } catch {
    products = []
  }

  // Back-compat: old numeric-id Printful URLs (/shop/433351254) redirect to slug.
  if (/^\d+$/.test(slug)) {
    const byId = products.find((p) => p.provider === 'printful' && p.id === slug)
    if (byId) permanentRedirect(`/shop/${byId.slug}`)
    notFound()
  }

  const match = findBySlug(products, slug)
  if (!match) {
    // A retired product (OG, Printify) keeps its old URL working as a 308 to
    // the shop (spec section 3), so old links and search results still land.
    if (await isRetiredProductSlug(slug)) permanentRedirect('/shop')
    notFound()
  }
```

- [ ] **Step 9: De size guide leest de winkel**

In `app/size-guide/page.tsx` vervang regel 3:

```ts
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
```

Vervang regel 87:

```ts
  products: ShopProduct[],
```

Vervang regel 112-117:

```tsx
  let products: ShopProduct[] = []
  try {
    products = await getShopProducts()
  } catch {
    // fall through: page renders without the tables
  }
```

- [ ] **Step 10: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `npm run dev`: `/shop` toont alleen Olympian (en OLYMPN Sport zodra die in de store staat); `/shop/ink-butter-sport-tee-unisex` geeft een 308 naar `/shop` (`curl -sI http://localhost:3000/shop/ink-butter-sport-tee-unisex | grep -i -E '^(HTTP|location)'`).

- [ ] **Step 11: Commit**

```bash
git add lib/catalog.ts lib/catalog.test.ts lib/bundles.ts lib/bundles.test.ts app/page.tsx app/shop/page.tsx "app/shop/[slug]/page.tsx" app/size-guide/page.tsx
git commit -m "feat: serve the shop from the drop allow-list and retire OG bundles"
```

---

### Task 8: Checkout-guard met `isPurchasable`

**Files:**
- Modify: `app/api/checkout/route.ts:10` (import), `app/api/checkout/route.ts:87` (klok en preview), `app/api/checkout/route.ts:101-109` (guard)
- Test: `app/api/checkout/route.test.ts:1-105` (volledig vervangen)
- Modify: `lib/catalog.ts` (na Task 7: de `isUnreleasedProductName`-import en `.filter(...)` in `getCatalogProducts`)
- Test: `lib/catalog.test.ts:62-102` (`getCatalogProducts`-blok vervangen)
- Delete: `lib/unreleased.ts`, `lib/unreleased.test.ts`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` (regel 64: de handler krijgt een `NextRequest`; regel 183-190: cookies van de request lezen via `request.cookies`).

**Interfaces:**
- Consumes: `matchDrop`, `isPurchasable`, `currentTimeMs` (Task 6); `PREVIEW_COOKIE`, `isPreviewCookieValue` (Task 6).
- Produces: `POST /api/checkout` antwoordt `409 { error: 'One or more products are not available' }` zodra één regel niet koopbaar is (OG, Printify, ongepland product, teaser vóór release), vóór er een Stripe-sessie wordt gemaakt. Alles verder ongewijzigd.

Gedragswijziging die Joep moet weten: een oude winkelwagen met OG- of Printify-producten kan na de merge niet meer afrekenen (409). Dat volgt uit spec sectie 1 en 4 (OG verdwijnt volledig).

- [ ] **Step 1: Schrijf de falende test**

`app/api/checkout/route.test.ts` (volledig vervangen):

```ts
/** @jest-environment node */
import { NextRequest } from 'next/server'
import type { NormalizedProduct } from '@/types/catalog'
import { POST } from './route'

const mockCreateSession = jest.fn()
const mockGetPrintfulProduct = jest.fn()
const mockPrintifyLookup = jest.fn()

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
jest.mock('../../../lib/printify', () => ({
  buildVariantLookup: (...args: unknown[]) => mockPrintifyLookup(...args),
}))
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
        color: 'White', colorCode: '#ffffff', priceCents: 4500, currency: 'EUR',
        inStock: true, imageUrl: null,
      },
    ],
  }
}

const CATALOG: Record<string, NormalizedProduct> = {
  '1': product('1', 'Olympian Tee Sand Unisex'),
  '2': product('2', 'OLYMPN Sport Oversized Hoodie Rose Red'),
  '3': product('3', 'olympn sport relaxed hoodie dune'),
  '4': product('4', 'Ink/Butter Sport Tee Unisex'),
}

function line(productId: string, provider: 'printful' | 'printify' = 'printful') {
  return {
    provider, productId, variantId: `v${productId}`,
    // The client-side name is deliberately harmless: the guard must use the
    // server-resolved product name, not what the browser sends.
    productName: 'Anything', variantName: 'M', price: '1.00', currency: 'EUR',
    quantity: 1, imageUrl: null,
  }
}

function checkoutRequest(lines: ReturnType<typeof line>[], cookie?: string) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({
      items: lines,
      address: { name: 'Test Klant', line1: 'Coolsingel 1', city: 'Rotterdam', postalCode: '3011AA', country: 'NL' },
    }),
  })
}

const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')
const SPORT_RELEASE = Date.parse('2026-11-01T11:00:00Z')
const ORIGINAL_ENV = { ...process.env }
const REFUSED = { error: 'One or more products are not available' }

beforeEach(() => {
  mockCreateSession.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
  mockGetPrintfulProduct.mockReset().mockImplementation(async (id: string) => CATALOG[id])
  mockPrintifyLookup.mockReset().mockResolvedValue(new Map())
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE_SPORT)
  process.env = { ...ORIGINAL_ENV, SITE_PREVIEW_KEY: 'k3y', VERCEL_ENV: 'preview' }
})

afterEach(() => {
  jest.restoreAllMocks()
  process.env = { ...ORIGINAL_ENV }
})

describe('POST /api/checkout purchasability guard', () => {
  it('sells a product of a live drop', async () => {
    const res = await POST(checkoutRequest([line('1')]))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.test/s/1' })
    expect(mockCreateSession).toHaveBeenCalledTimes(1)
  })

  it('refuses a teaser product before the release with 409 and no Stripe session', async () => {
    const res = await POST(checkoutRequest([line('2')]))
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual(REFUSED)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('matches the drop prefix case-insensitively', async () => {
    const res = await POST(checkoutRequest([line('3')]))
    expect(res.status).toBe(409)
  })

  it('refuses a retired OG product', async () => {
    const res = await POST(checkoutRequest([line('4')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('refuses a mixed cart when any line is not for sale', async () => {
    const res = await POST(checkoutRequest([line('1'), line('2')]))
    expect(res.status).toBe(409)
    expect(mockCreateSession).not.toHaveBeenCalled()
  })

  it('refuses a Printify line, whatever its name', async () => {
    mockPrintifyLookup.mockResolvedValue(
      new Map([['vpi1', { productName: 'Olympian Tee Sand Unisex', variant: { ...CATALOG['1'].variants[0], provider: 'printify', id: 'vpi1' } }]])
    )
    const res = await POST(checkoutRequest([line('pi1', 'printify')]))
    expect(res.status).toBe(409)
  })

  it('flips on the exact release millisecond (12:00 Amsterdam, 11:00 UTC)', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(SPORT_RELEASE - 1)
    expect((await POST(checkoutRequest([line('2')]))).status).toBe(409)
    jest.spyOn(Date, 'now').mockReturnValue(SPORT_RELEASE)
    expect((await POST(checkoutRequest([line('2')]))).status).toBe(200)
  })

  it('sells an upcoming drop with the preview cookie', async () => {
    const res = await POST(checkoutRequest([line('2')], 'drop_preview=k3y'))
    expect(res.status).toBe(200)
  })

  it('ignores a hand-made preview cookie', async () => {
    const res = await POST(checkoutRequest([line('2')], 'drop_preview=1'))
    expect(res.status).toBe(409)
  })

  it('ignores the preview cookie on Vercel production', async () => {
    process.env.VERCEL_ENV = 'production'
    const res = await POST(checkoutRequest([line('2')], 'drop_preview=k3y'))
    expect(res.status).toBe(409)
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- app/api/checkout`
Expected: FAIL: `sells a product of a live drop` slaagt, maar `refuses a retired OG product`, `refuses a Printify line` en `sells an upcoming drop with the preview cookie` falen (de prefixguard kent geen drops en geen preview), en de 409-teksten wijken af.

- [ ] **Step 3: Implementeer de guard**

In `app/api/checkout/route.ts` vervang regel 10:

```ts
import { currentTimeMs, isPurchasable, matchDrop } from '@/lib/drops'
import { PREVIEW_COOKIE, isPreviewCookieValue } from '@/lib/preview'
```

Voeg direct na `let currency = 'eur'` (regel 87) toe:

```ts
  // One clock for the whole cart, so every line is judged at the same moment.
  const now = currentTimeMs()
  const preview = isPreviewCookieValue(req.cookies.get(PREVIEW_COOKIE)?.value)
```

Vervang regel 101-109 (het `Fase 0`-commentaar en de `isUnreleasedProductName`-check):

```ts
    // Only products of a live drop are for sale (spec section 4): OG, Printify,
    // unplanned products and teasers before release are refused. Judged on the
    // server-resolved name and id, so a stale cart or a crafted request cannot
    // buy early.
    const drop = matchDrop({ id: item.productId, provider: item.provider, name: found.productName })
    if (!isPurchasable(drop, now, { preview })) {
      return NextResponse.json(
        { error: 'One or more products are not available' },
        { status: 409 }
      )
    }
```

- [ ] **Step 4: De prefixguard verdwijnt**

In `lib/catalog.ts` verwijder de regel `import { isUnreleasedProductName } from '@/lib/unreleased'` en vervang in `getCatalogProducts`:

```ts
  return mergeCatalogs(pf, pi).filter((p) => !isUnreleasedProductName(p.name))
```

door:

```ts
  return mergeCatalogs(pf, pi)
```

In `lib/catalog.test.ts` vervang het blok `describe('getCatalogProducts', ...)` (regel 62-102) door:

```ts
describe('getCatalogProducts', () => {
  const syncProduct = (id: number, name: string) => ({ id, name, thumbnail_url: null, variants: 5, synced: 5 })

  beforeEach(() => {
    jest.mocked(printful.getProducts).mockReset()
    jest.mocked(printify.getProducts).mockReset()
  })

  it('returns the raw catalogue of both providers, unfiltered', async () => {
    jest.mocked(printful.getProducts).mockResolvedValue([
      syncProduct(1, 'Olympian Hoodie Teal'),
      syncProduct(2, 'OLYMPN Sport Oversized Hoodie Rose Red'),
    ])
    jest.mocked(printify.getProducts).mockResolvedValue([pi])
    const { getCatalogProducts } = await import('./catalog')
    expect((await getCatalogProducts()).map((p) => p.name)).toEqual([
      'Olympian Hoodie Teal',
      'OLYMPN Sport Oversized Hoodie Rose Red',
      'Olympus Tee',
    ])
  })

  it('still returns the surviving provider when the other one fails', async () => {
    jest.mocked(printful.getProducts).mockRejectedValue(new Error('printful down'))
    jest.mocked(printify.getProducts).mockResolvedValue([pi])
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getCatalogProducts } = await import('./catalog')
    expect((await getCatalogProducts()).map((p) => p.id)).toEqual(['abc'])
    errorSpy.mockRestore()
  })
})
```

Verwijder de fase 0-module:

```bash
git rm lib/unreleased.ts lib/unreleased.test.ts
git grep -n "unreleased" -- '*.ts' '*.tsx'
```

Expected: de grep geeft niets.

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (app/api/checkout|lib/catalog)`
Expected: PASS. Er wordt geen echte Stripe-sessie gemaakt: `lib/stripe` is gemockt.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Niet handmatig afrekenen: `.env.local` heeft een live Stripe-sleutel.

- [ ] **Step 7: Commit**

```bash
git add app/api/checkout/route.ts app/api/checkout/route.test.ts lib/catalog.ts lib/catalog.test.ts
git commit -m "feat: refuse checkout lines outside a live drop with 409"
```

---

### Task 9: Redirects, de seal weg en vervallen routes

**Files:**
- Modify: `next.config.ts:39-40` (`redirects()` tussen `images` en `headers()`)
- Test: `next.config.test.ts`
- Create: `lib/legacy-redirects.ts`
- Test: `lib/legacy-redirects.test.ts`
- Modify: `proxy.ts:1-121` (volledig vervangen; Task 6 had regel 1-6 en 68-94 al aangepast)
- Modify: `components/AppShell/AppShell.tsx` (na Task 5: het `/coming-soon`-blok), `components/AppShell/AppShell.test.tsx` (na Task 5: de test `renders /coming-soon bare`)
- Modify: `app/faq/page.tsx:117`, `app/robots.ts:10`, `.env.example:41-45`
- Delete: `lib/release.ts`, `app/coming-soon/page.tsx`, `app/coming-soon/Countdown.tsx`, `app/coming-soon/coming-soon.module.css`, `app/olympian/page.tsx`, `app/deals/page.tsx`, `app/deals/deals.module.css`, `app/deals/[slug]/page.tsx` (`app/deals/[slug]/BundleConfigurator.tsx` en `configurator.module.css` blijven ongebruikt staan, spec sectie 5)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md` (regel 26-30: `permanent: true` geeft 308; regel 43-56: de query van de request gaat mee naar de bestemming; regel 134-160: `has` met `type: 'query'`, `key`, `value`). `node_modules/next/dist/shared/lib/router/utils/prepare-destination.js:277-284`: de query wordt samengevoegd met voorrang voor de bestemming, dus een `has`-redirect van `/shop?line=og` naar `/shop` zou zichzelf blijven matchen. `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:200-211`: `redirects` uit `next.config` lopen vóór de proxy.

**Interfaces:**
- Consumes: `PREVIEW_COOKIE`, `PREVIEW_COOKIE_MAX_AGE`, `previewParamAction` (Task 6).
- Produces:
  - 308-redirects uit Global Constraints.
  - `export function legacyShopRedirect(url: { pathname: string; searchParams: URLSearchParams; href: string }): URL | null`
  - `proxy.ts` zonder seal: preview-parameter, `?line=`-redirect, account-auth.

- [ ] **Step 1: Schrijf de falende tests**

`lib/legacy-redirects.test.ts`:

```ts
import { legacyShopRedirect } from './legacy-redirects'

const go = (path: string) => {
  const target = legacyShopRedirect(new URL(path, 'https://www.7eno.shop'))
  return target ? `${target.pathname}${target.search}` : null
}

describe('legacyShopRedirect', () => {
  it.each([
    ['/shop?line=og', '/shop'],
    ['/shop?line=OG', '/shop'],
    ['/shop?line=', '/shop'],
    ['/shop?line=og&category=tees&utm_source=ig', '/shop?category=tees&utm_source=ig'],
    ['/shop?utm_source=ig&line=og', '/shop?utm_source=ig'],
    ['/shop?line=Olympian&utm_source=ig', '/collections/olympian?utm_source=ig'],
  ])('%s goes to %s', (from, to) => {
    expect(go(from)).toBe(to)
  })

  it.each(['/shop', '/shop?category=tees', '/shop/olympian-tee-sand-unisex?line=og', '/collections/olympian?line=og'])(
    'leaves %s alone',
    (path) => {
      expect(go(path)).toBeNull()
    }
  )

  it('never produces a URL that redirects again', () => {
    for (const from of ['/shop?line=og', '/shop?line=og&line=og&sort=price-asc', '/shop?line=olympian']) {
      const target = legacyShopRedirect(new URL(from, 'https://www.7eno.shop'))
      expect(target).not.toBeNull()
      expect(legacyShopRedirect(target as URL)).toBeNull()
    }
  })
})
```

`next.config.test.ts`:

```ts
/** @jest-environment node */
import nextConfig from './next.config'

async function redirects() {
  return (await nextConfig.redirects?.()) ?? []
}

describe('next.config redirects', () => {
  it('sends the retired v1 routes permanently to their v2 homes', async () => {
    expect(await redirects()).toEqual(
      expect.arrayContaining([
        { source: '/olympian', destination: '/collections/olympian', permanent: true },
        { source: '/deals', destination: '/shop', permanent: true },
        { source: '/deals/:slug', destination: '/shop', permanent: true },
        { source: '/coming-soon', destination: '/', permanent: true },
        {
          source: '/shop',
          has: [{ type: 'query', key: 'line', value: 'olympian' }],
          destination: '/collections/olympian',
          permanent: true,
        },
      ])
    )
  })

  it('never redirects /shop to itself: the passed-through query would loop', async () => {
    for (const r of await redirects()) {
      expect(r.source === '/shop' && r.destination === '/shop').toBe(false)
    }
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (legacy-redirects|next.config)`
Expected: FAIL, `Cannot find module './legacy-redirects'` en in `next.config.test.ts` een lege lijst tegen `arrayContaining`.

- [ ] **Step 3: Implementeer `lib/legacy-redirects.ts`**

```ts
/**
 * `/shop?line=...` from the v1 filters (spec section 3). next.config.ts sends
 * `?line=olympian` to the collection; every other value lands here (via
 * proxy.ts): `line` is dropped, every other parameter (category, sort, UTM)
 * is kept. A has-redirect in next.config cannot do this for `?line=og`: its
 * destination is /shop itself and the passed-through query would loop.
 */
export function legacyShopRedirect(url: { pathname: string; searchParams: URLSearchParams; href: string }): URL | null {
  if (url.pathname !== '/shop' || !url.searchParams.has('line')) return null
  const line = (url.searchParams.get('line') ?? '').trim().toLowerCase()
  const target = new URL(url.href)
  target.searchParams.delete('line')
  if (line === 'olympian') target.pathname = '/collections/olympian'
  return target
}
```

- [ ] **Step 4: Redirects in `next.config.ts`**

Voeg na het `images`-blok (na regel 39, vóór `async headers()`) toe:

```ts
  // Retired v1 routes (spec section 3). The request query is passed through
  // to the destination, so UTM tags survive and the canonical absorbs them.
  // `/shop?line=og` is handled in proxy.ts (lib/legacy-redirects.ts): a
  // has-redirect to /shop itself would keep matching its own query.
  async redirects() {
    return [
      { source: '/olympian', destination: '/collections/olympian', permanent: true },
      { source: '/deals', destination: '/shop', permanent: true },
      { source: '/deals/:slug', destination: '/shop', permanent: true },
      { source: '/coming-soon', destination: '/', permanent: true },
      {
        source: '/shop',
        has: [{ type: 'query', key: 'line', value: 'olympian' }],
        destination: '/collections/olympian',
        permanent: true,
      },
    ]
  },
```

- [ ] **Step 5: Vervang `proxy.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { legacyShopRedirect } from '@/lib/legacy-redirects'
import { PREVIEW_COOKIE, PREVIEW_COOKIE_MAX_AGE, previewParamAction } from '@/lib/preview'

// Account auth (unchanged behaviour): protect /account/* behind a session and
// bounce already-logged-in users away from the login/register screens.
async function handleAccountAuth(request: NextRequest, pathname: string) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = pathname === '/account/login' || pathname === '/account/register'
  const isProtectedRoute = !isAuthRoute

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/account/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/account/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Preview cookie ──────────────────────────────────────────────────────
  // `?preview=<SITE_PREVIEW_KEY>` stores the key in an httpOnly cookie so an
  // upcoming drop shows as live for QA (lib/preview.ts), then redirects to the
  // clean URL. `?preview=off` clears it. Ignored on Vercel production.
  const previewParam = request.nextUrl.searchParams.get('preview')
  if (previewParam !== null) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('preview')
    const res = NextResponse.redirect(cleanUrl)
    const action = previewParamAction(previewParam)
    if (action === 'clear') {
      res.cookies.delete({ name: PREVIEW_COOKIE, path: '/' })
    } else if (action === 'set') {
      res.cookies.set(PREVIEW_COOKIE, process.env.SITE_PREVIEW_KEY ?? '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: PREVIEW_COOKIE_MAX_AGE,
      })
    }
    return res
  }

  // ── Retired /shop?line= filters (spec section 3) ────────────────────────
  const legacy = legacyShopRedirect(request.nextUrl)
  if (legacy) return NextResponse.redirect(legacy, 308)

  // ── Account auth ────────────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    return handleAccountAuth(request, pathname)
  }

  return NextResponse.next({ request })
}

export const config = {
  // Run on every page request except API routes, Next internals and static
  // files (any path containing a dot).
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
```

- [ ] **Step 6: Vervallen routes en de seal weg**

```bash
git rm lib/release.ts app/coming-soon/page.tsx app/coming-soon/Countdown.tsx app/coming-soon/coming-soon.module.css
git rm app/olympian/page.tsx app/deals/page.tsx app/deals/deals.module.css "app/deals/[slug]/page.tsx"
```

In `components/AppShell/AppShell.tsx` verwijder het blok:

```tsx
  // The coming-soon teaser is a sealed full-screen page (removed in Task 9).
  if (pathname === '/coming-soon') {
    return <>{children}</>
  }

```

In `components/AppShell/AppShell.test.tsx` verwijder de test `it('renders /coming-soon bare, without any chrome or hydration', ...)` volledig.

In `app/faq/page.tsx` vervang regel 117:

```tsx
        link: { href: '/collections/olympian', label: 'See Olympian' },
```

In `app/robots.ts` vervang regel 10:

```ts
      disallow: ['/account/', '/api/', '/auth/', '/checkout', '/success'],
```

In `.env.example` vervang regel 41-45:

```bash
# Drop preview key (lib/preview.ts). Visiting any URL with ?preview=THIS_VALUE
# stores it in an httpOnly cookie, and an upcoming drop then shows as live and
# is purchasable, for QA on the Preview. ?preview=off clears it. Never honoured
# when VERCEL_ENV=production. Leave unset to disable preview entirely.
SITE_PREVIEW_KEY=
```

Controle:

```bash
git grep -n -E "lib/release|isShopLocked|seal_bypass|coming-soon|/olympian['\"]|href=\"/deals|'/deals'" -- app components lib proxy.ts
```

Expected: alleen treffers in `components/Footer/Footer.tsx`, `components/Nav/Nav.tsx`, `app/page.tsx` en `app/shop/page.tsx` (oude markup; de redirects vangen die links op, Task 14 en 18 en fase 5 ruimen ze op).

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (legacy-redirects|next.config|AppShell)`
Expected: PASS.

- [ ] **Step 8: Kwaliteitspoort en redirects op een productiebuild**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; in de build-output staan `/olympian`, `/deals` en `/coming-soon` niet meer als route.

Daarna (de server leest `.env.local`, maar er wordt niets betaald):

```bash
npx next start -p 3100 &
sleep 5
for u in "/olympian?utm_source=ig" "/deals" "/deals/ink-butter-sport-set" "/coming-soon" "/shop?line=olympian" "/shop?line=og&category=tees&utm_source=ig" "/shop?line=OG"; do
  printf '%s -> ' "$u"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://localhost:3100$u"
done
kill %1
```

Expected, in volgorde: `308 .../collections/olympian?utm_source=ig`, `308 .../shop`, `308 .../shop`, `308 .../`, `308 .../collections/olympian?line=olympian`, `308 .../shop?category=tees&utm_source=ig`, `308 .../shop`. Geen enkele URL geeft een tweede 308 (controleer de laatste twee met `curl -sIL`).

- [ ] **Step 9: Commit**

```bash
git add next.config.ts next.config.test.ts lib/legacy-redirects.ts lib/legacy-redirects.test.ts proxy.ts components/AppShell app/faq/page.tsx app/robots.ts .env.example
git commit -m "feat: redirect retired v1 routes and remove the launch seal"
```

---

### Task 10: Productsoorten, feed en sitemap alleen met live drops

**Files:**
- Modify: `lib/product-classify.ts:15-27` (interface), `lib/product-classify.ts:65-87` (`classify`)
- Test: `lib/product-classify.test.ts` (nieuw `describe`-blok onderaan)
- Modify: `lib/merchant-feed.ts:37-90` (categorie, draagbaar, type; `genderFor` vervalt)
- Test: `lib/merchant-feed.test.ts:1-4` (imports), `lib/merchant-feed.test.ts:51-99` (mapping-blokken vervangen)
- Modify: `app/product-feed.xml/route.ts:1-109` (volledig vervangen)
- Test: `app/product-feed.xml/route.test.ts`
- Modify: `app/sitemap.ts:1-60` (volledig vervangen)
- Test: `app/sitemap.test.ts`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md` (vorm van `MetadataRoute.Sitemap`, `images`).

**Interfaces:**
- Consumes: `getShopProducts`, `ShopProduct` (Task 7); `DROPS`, `isDropListed`, `getDropStatus`, `colourLabel`, `currentTimeMs` (Task 6).
- Produces:
  - `Classification` krijgt `isKnit`, `isHoodie`, `isBag` erbij (de oude velden blijven tot Task 14, want de oude shoppagina gebruikt ze nog).
  - `export function googleCategoryFor(c: Classification): string`, `export function isWearable(c: Classification): boolean`, `export function productTypeFor(c: Classification, collection: string): string`.
  - `product-feed.xml` en `sitemap.xml` tonen alleen producten met `status === 'live'` (zonder preview); de sitemap krijgt `/archive` en `/collections/<slug>` voor elke gelijste drop en verliest `/deals*`, `/olympian`, `?line=*`, `?gender=*`.

`/archive` en `/collections/*` bestaan pas na Task 17; op de Preview is dat geen probleem (Deployment Protection, niet geïndexeerd).

- [ ] **Step 1: Schrijf de falende tests**

Voeg onderaan `lib/product-classify.test.ts` toe:

```ts
describe('product kinds', () => {
  it.each([
    ['Olympian Knitted Tee Ocean Unisex', { isKnit: true, isHoodie: false, isBag: false }],
    ['OLYMPN Sport Oversized Hoodie Rose Red', { isKnit: false, isHoodie: true, isBag: false }],
    ['OLYMPN Sport Relaxed Hoodie Dune', { isKnit: false, isHoodie: true, isBag: false }],
    ['Olympian Ocean Backpack 20 L', { isKnit: false, isHoodie: false, isBag: true }],
    ['Olympian Tee Sand Unisex', { isTee: true, isKnit: false, isHoodie: false, isBag: false }],
  ])('classifies %s', (name, expected) => {
    expect(classify(name)).toMatchObject(expected)
  })
})
```

In `lib/merchant-feed.test.ts` vervang regel 1-4:

```ts
import {
  buildTitle, escapeXml, googleCategoryFor, isWearable, productTypeFor, renderFeedXml, type FeedItem,
} from './merchant-feed'
import { classify } from './product-classify'
```

Vervang regel 51-99 (de blokken `category and gender mapping` en `isWearable`):

```ts
describe('category and type mapping', () => {
  it.each([
    ['Olympian Tee Sand Unisex', 'Olympian', 'Apparel & Accessories > Clothing > Shirts & Tops', '7ENO > Olympian > Tees'],
    ['Olympian Knitted Tee Ocean Unisex', 'Olympian', 'Apparel & Accessories > Clothing > Shirts & Tops', '7ENO > Olympian > Knits'],
    ['OLYMPN Sport Oversized Hoodie Rose Red', 'OLYMPN Sport', 'Apparel & Accessories > Clothing > Shirts & Tops', '7ENO > OLYMPN Sport > Hoodies'],
    ['Olympian Ocean Backpack 20 L', 'Olympian', 'Luggage & Bags > Backpacks', '7ENO > Olympian > Bags'],
  ])('maps %s', (name, collection, category, type) => {
    const c = classify(name)
    expect(googleCategoryFor(c)).toBe(category)
    expect(productTypeFor(c, collection)).toBe(type)
  })
})

describe('isWearable', () => {
  it('is true for hoodies, tees and knits', () => {
    for (const n of ['OLYMPN Sport Relaxed Hoodie Dune', 'Olympian Tee Sand Unisex', 'Olympian Knitted Tee Ocean Unisex']) {
      expect(isWearable(classify(n))).toBe(true)
    }
  })
  it('is false for a backpack, which has no gender', () => {
    expect(isWearable(classify('Olympian Ocean Backpack 20 L'))).toBe(false)
  })
})
```

`app/product-feed.xml/route.test.ts`:

```ts
/** @jest-environment node */
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop, type DropStatus } from '@/lib/drops'
import { GET } from './route'

const mockGetShopProducts = jest.fn()
jest.mock('../../lib/catalog', () => ({
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
}))

const [olympian, sport] = DROPS

function shopProduct(id: string, name: string, slug: string, drop: Drop, status: DropStatus): ShopProduct {
  const variant = (size: string) => ({
    provider: 'printful' as const, productId: id, id: `${id}-${size}`, name: `${name} / ${size}`, size,
    color: 'Maroon', colorCode: '#621926', priceCents: 4500, currency: 'EUR', inStock: true,
    imageUrl: 'https://files.cdn.printful.com/variant.png',
  })
  return {
    provider: 'printful', id, name, slug, thumbnailUrl: 'https://files.cdn.printful.com/thumb.png',
    colors: [], currency: 'EUR', priceCents: 4500, variants: [variant('M'), variant('4XL')],
    drop, status, purchasable: status === 'live', soldOut: false,
  }
}

const sand = shopProduct('1', 'Olympian Tee Sand Unisex', 'olympian-tee-sand-unisex', olympian, 'live')
const roseRed = (status: DropStatus) =>
  shopProduct('2', 'OLYMPN Sport Oversized Hoodie Rose Red', 'olympn-sport-oversized-hoodie-rose-red', sport, status)

async function feed(): Promise<string> {
  return (await GET()).text()
}

beforeEach(() => mockGetShopProducts.mockReset())

describe('GET /product-feed.xml', () => {
  it('lists live drop products only: a teaser never reaches Merchant Center', async () => {
    mockGetShopProducts.mockResolvedValue([sand, roseRed('upcoming')])
    const xml = await feed()
    expect(xml).toContain('/shop/olympian-tee-sand-unisex</link>')
    expect(xml).not.toContain('olympn-sport-oversized-hoodie-rose-red')
  })

  it('asks the catalogue without preview, so a QA cookie can never leak a teaser', async () => {
    mockGetShopProducts.mockResolvedValue([])
    await feed()
    expect(mockGetShopProducts).toHaveBeenCalledWith(expect.any(Number))
  })

  it('names the colour from the product, not from the Printful garment colour', async () => {
    mockGetShopProducts.mockResolvedValue([roseRed('live')])
    const xml = await feed()
    expect(xml).toContain('<g:color>Rose Red</g:color>')
    expect(xml).not.toContain('<g:color>Maroon</g:color>')
    expect(xml).toContain('<g:product_type>7ENO &gt; OLYMPN Sport &gt; Hoodies</g:product_type>')
    expect(xml).toContain('<g:gender>unisex</g:gender>')
  })

  it('skips the sizes the storefront hides', async () => {
    mockGetShopProducts.mockResolvedValue([sand])
    const xml = await feed()
    expect(xml).toContain('<g:size>M</g:size>')
    expect(xml).not.toContain('<g:size>4XL</g:size>')
  })
})
```

`app/sitemap.test.ts`:

```ts
/** @jest-environment node */
import type { ShopProduct } from '@/lib/catalog'
import { DROPS } from '@/lib/drops'
import sitemap from './sitemap'

const mockGetShopProducts = jest.fn()
jest.mock('../lib/catalog', () => ({
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
}))

const [olympian, sport] = DROPS
const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')

const base = { provider: 'printful' as const, colors: [], currency: 'EUR', variants: [], soldOut: false }
const live: ShopProduct = {
  ...base, id: '1', name: 'Olympian Tee Sand Unisex', slug: 'olympian-tee-sand-unisex',
  thumbnailUrl: 'https://files.cdn.printful.com/sand.png', drop: olympian, status: 'live', purchasable: true,
}
const teaser: ShopProduct = {
  ...base, id: '2', name: 'OLYMPN Sport Oversized Hoodie Mocha', slug: 'olympn-sport-oversized-hoodie-mocha',
  thumbnailUrl: null, drop: sport, status: 'upcoming', purchasable: false,
}

async function paths(): Promise<string[]> {
  return (await sitemap()).map((entry) => entry.url.replace(/^https?:\/\/[^/]+/, '') || '/')
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE_SPORT)
  mockGetShopProducts.mockReset().mockResolvedValue([live, teaser])
})

afterEach(() => jest.restoreAllMocks())

describe('sitemap', () => {
  it('lists the v2 pages and both collection landings', async () => {
    expect(await paths()).toEqual(
      expect.arrayContaining(['/', '/shop', '/archive', '/collections/olympian', '/collections/olympn-sport', '/about', '/faq'])
    )
  })

  it('drops every retired v1 URL', async () => {
    for (const p of await paths()) {
      expect(p).not.toMatch(/\/deals|^\/olympian|\?line=|\?gender=|coming-soon/)
    }
  })

  it('lists live drop products only: a teaser product page stays out', async () => {
    const list = await paths()
    expect(list).toContain('/shop/olympian-tee-sand-unisex')
    expect(list).not.toContain('/shop/olympn-sport-oversized-hoodie-mocha')
    expect(mockGetShopProducts).toHaveBeenCalledWith(BEFORE_SPORT)
  })

  it('attaches the product image for Google Images', async () => {
    const entry = (await sitemap()).find((e) => e.url.endsWith('/shop/olympian-tee-sand-unisex'))
    expect(entry?.images).toEqual(['https://files.cdn.printful.com/sand.png'])
  })

  it('keeps the static pages when the catalogue fails', async () => {
    mockGetShopProducts.mockRejectedValue(new Error('printful down'))
    expect(await paths()).toEqual(expect.arrayContaining(['/', '/shop', '/archive']))
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (product-classify|merchant-feed|product-feed|sitemap)`
Expected: FAIL: `isKnit` ontbreekt, `productTypeFor` verwacht nog geen collectie, de feed en sitemap roepen `getCatalogProducts` aan (dat bestaat niet in de mock).

- [ ] **Step 3: Soorten in `lib/product-classify.ts`**

Voeg in de interface (regel 15-27) vóór de sluitende `}` toe:

```ts
  /** v2 kinds (spec section 4): the shop categories tees, knits, hoodies, bags. */
  isKnit: boolean
  isHoodie: boolean
  isBag: boolean
```

Vervang in `classify` de laatste regel (`return { isWomen, ... isOlympian }`, regel 86) door:

```ts
  const isKnit = /\bknit(ted)?\b/.test(n)
  const isHoodie = /\bhood(ie|y)\b/.test(n)
  const isBag = /\b(backpack|bag|tote)\b/.test(n)
  return {
    isWomen, isMen, isUnisex, isTee, isShorts, isSwim, isTowel, isAccessory, isClothing, isSport, isOlympian,
    isKnit, isHoodie, isBag,
  }
```

- [ ] **Step 4: Feed-mapping in `lib/merchant-feed.ts`**

Vervang regel 37-90 (van de `googleCategoryFor`-doc tot en met `genderFor`):

```ts
/**
 * Google's product taxonomy, as text paths (accepted alongside numeric ids).
 * Every v2 piece is a hoodie, a tee, a knitted tee or a backpack.
 */
export function googleCategoryFor(c: Classification): string {
  if (c.isBag) return 'Luggage & Bags > Backpacks'
  if (c.isHoodie || c.isKnit || c.isTee) return 'Apparel & Accessories > Clothing > Shirts & Tops'
  return 'Apparel & Accessories'
}

/** Whether the item is worn. Only these carry gender and age group in the feed. */
export function isWearable(c: Classification): boolean {
  return !c.isBag
}

/** Our own breadcrumb taxonomy, e.g. "7ENO > OLYMPN Sport > Hoodies", shown in Merchant Center reporting. */
export function productTypeFor(c: Classification, collection: string): string {
  const kind = c.isHoodie ? 'Hoodies' : c.isKnit ? 'Knits' : c.isTee ? 'Tees' : c.isBag ? 'Bags' : 'Apparel'
  return `7ENO > ${collection} > ${kind}`
}
```

- [ ] **Step 5: Vervang `app/product-feed.xml/route.ts`**

```ts
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { classify, HIDDEN_SIZES } from '@/lib/product-classify'
import { colourLabel, currentTimeMs } from '@/lib/drops'
import { absoluteUrl, BASE_URL, BRAND } from '@/lib/seo'
import { ALLOWED_COUNTRIES, FLAT_SHIPPING_RATE } from '@/lib/shipping'
import {
  buildTitle, googleCategoryFor, isWearable, productTypeFor, renderFeedXml, type FeedItem,
} from '@/lib/merchant-feed'

// Merchant Center fetches a feed at most once a day, so an hourly window is
// plenty and keeps the provider detail calls off the hot path.
export const revalidate = 3600

const SHIPPING = ALLOWED_COUNTRIES.map((country) => ({
  country,
  price: `${FLAT_SHIPPING_RATE.toFixed(2)} EUR`,
}))

function describe(product: ShopProduct): string {
  return (
    `${product.name} from the 7ENO (Zeno) ${product.drop.title} collection by ${BRAND.parent}. ` +
    'Premium streetwear, printed on demand. Free shipping over €75 and 14-day returns.'
  )
}

function itemsForProduct(product: ShopProduct): FeedItem[] {
  const c = classify(product.name)
  const link = absoluteUrl(`/shop/${product.slug}`)
  const collection = product.drop.title
  const description = describe(product)
  // Each colourway is its own product, so the colour a shopper searches for
  // is the one in the name ("Rose Red"), not Printful's garment colour.
  const colour = colourLabel(product.drop, product.name)

  return product.variants
    .filter((v) => v.priceCents > 0 && !HIDDEN_SIZES.has(v.size))
    .map((v) => ({
      id: `${product.provider}-${v.id}`,
      itemGroupId: `${product.provider}-${product.id}`,
      title: buildTitle(product.name, colour ?? v.color, v.size),
      description,
      link,
      imageLink: v.imageUrl ?? product.thumbnailUrl ?? '',
      additionalImageLinks:
        product.thumbnailUrl && product.thumbnailUrl !== v.imageUrl ? [product.thumbnailUrl] : [],
      availability: v.inStock === false ? ('out_of_stock' as const) : ('in_stock' as const),
      price: `${(v.priceCents / 100).toFixed(2)} ${v.currency || 'EUR'}`,
      brand: BRAND.name,
      condition: 'new' as const,
      mpn: `${product.provider}-${product.id}-${v.id}`,
      googleProductCategory: googleCategoryFor(c),
      productType: productTypeFor(c, collection),
      // Every v2 piece is unisex. Gender and age only on wearables.
      ...(isWearable(c) ? { gender: 'unisex' as const, ageGroup: 'adult' as const } : {}),
      color: colour ?? v.color,
      size: v.size,
      shipping: SHIPPING,
    }))
    // An item without an image is rejected by Merchant Center.
    .filter((item) => item.imageLink !== '')
}

export async function GET() {
  let products: ShopProduct[] = []
  try {
    // No preview options: the feed only ever shows what anyone can buy now.
    products = await getShopProducts(currentTimeMs())
  } catch (err) {
    console.error('[MerchantFeed] getShopProducts failed:', err)
  }

  const items = products.filter((p) => p.status === 'live').flatMap(itemsForProduct)

  const xml = renderFeedXml(items, {
    title: '7ENO (Zeno) · Premium Streetwear',
    link: BASE_URL,
    description:
      'Product feed for 7ENO (pronounced "Zeno"), the official streetwear store by Abra Entertainment.',
  })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
```

- [ ] **Step 6: Vervang `app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { DROPS, currentTimeMs, getDropStatus, isDropListed } from '@/lib/drops'
import { BASE_URL } from '@/lib/seo'

// Refresh hourly so products added in Printful appear without a redeploy, and
// a teaser product joins the sitemap within the hour after its release.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nowMs = currentTimeMs()
  const now = new Date(nowMs)

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/archive`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/size-guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/returns`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Collection landings rank for "Olympian" and "OLYMPN Sport", also before
  // a teaser drop is out (the landing carries the countdown and waitlist).
  const collectionPages: MetadataRoute.Sitemap = DROPS.filter((d) => isDropListed(d, nowMs)).map((d) => ({
    url: `${BASE_URL}/collections/${d.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: getDropStatus(d, nowMs) === 'live' ? 0.9 : 0.85,
  }))

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(nowMs)
  } catch {
    // Catalogue unavailable: still serve the static pages.
  }

  // Product pages of live drops only. A teaser page is noindex and stays out.
  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.status === 'live')
    .map((p) => ({
      url: `${BASE_URL}/shop/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(p.thumbnailUrl ? { images: [p.thumbnailUrl] } : {}),
    }))

  return [...staticPages, ...collectionPages, ...productPages]
}
```

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (product-classify|merchant-feed|product-feed|sitemap)`
Expected: PASS.

- [ ] **Step 8: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `git grep -n "getCatalogProducts" -- app lib` toont alleen nog `lib/catalog.ts` en `lib/catalog.test.ts`.

- [ ] **Step 9: Commit**

```bash
git add lib/product-classify.ts lib/product-classify.test.ts lib/merchant-feed.ts lib/merchant-feed.test.ts app/product-feed.xml/route.ts app/product-feed.xml/route.test.ts app/sitemap.ts app/sitemap.test.ts
git commit -m "feat: list only live drops in the sitemap and merchant feed"
```

---

### Checkpoint fase 1

- [ ] **Step 1: Hele branch groen**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 2: Push voor de Preview (alleen `redesign/v2`)**

```bash
git push origin redesign/v2
```

Vercel bouwt een Preview (productie deployt alleen vanaf `master`). Zet in Vercel, scope Preview en branch `redesign/v2`, `SITE_PREVIEW_KEY` als die er nog niet staat (spec sectie 7). Controleer op de Preview-URL: header, announcement-bar en footer nieuw; `/shop` toont alleen Olympian; `/olympian`, `/deals`, `/coming-soon`, `/shop?line=og` geven 308; `/sitemap.xml` bevat geen `/deals`, `/olympian`, `?line=` of `?gender=`; `/product-feed.xml` bevat alleen Olympian. Meld afwijkingen aan Joep vóór fase 2.

---

### Task 11: ProductTile en tegeldata

**Files:**
- Create: `lib/tiles.ts`
- Test: `lib/tiles.test.ts`
- Create: `components/ui/ProductTile/ProductTile.tsx`, `components/ui/ProductTile/ProductTile.module.css`
- Test: `components/ui/ProductTile/ProductTile.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (`fill` vraagt een gepositioneerde ouder; `sizes`; `loading`).

**Interfaces:**
- Consumes: `ShopProduct` (Task 7); `formatDropDate`, `NEW_IN_MS` (Task 6); `BadgeKind`, `Badge` (Task 2); `resolveCardImage` (`lib/card-image.ts`, bestaand: lokale voorkant of remove.bg-uitsnede uit de Supabase-cache).
- Produces:
  - `export interface TileProduct { slug: string; href: string; name: string; image: string | null; imageAlt: string; price: string | null; badges: BadgeKind[]; note: string | null }`
  - `export function tileBadges(p: Pick<ShopProduct, 'status' | 'soldOut' | 'drop'>, now: number): BadgeKind[]`
  - `export function formatPrice(cents: number | undefined, currency: string): string | null`
  - `export function toTile(p: ShopProduct, image: string | null, now: number): TileProduct`
  - `export async function toTiles(products: ShopProduct[], now: number): Promise<TileProduct[]>`
  - `export interface ProductTileProps { product: TileProduct; density: 1 | 2 | 4; eager?: boolean }`

"New in" staat niet gedefinieerd in de spec; hier: een live drop is de eerste 30 dagen na `startsAt` nieuw. Een tegel draagt hooguit één badge: Coming soon gaat voor Sold out, Sold out gaat voor New in.

- [ ] **Step 1: Schrijf de falende tests**

`lib/tiles.test.ts`:

```ts
import type { ShopProduct } from './catalog'
import { DROPS, NEW_IN_MS } from './drops'
import { resolveCardImage } from './card-image'
import { formatPrice, tileBadges, toTiles } from './tiles'

jest.mock('./card-image', () => ({ resolveCardImage: jest.fn() }))

const [olympian, sport] = DROPS
const SPORT_START = Date.parse(sport.window.startsAt)

function product(overrides: Partial<ShopProduct>): ShopProduct {
  return {
    provider: 'printful', id: '1', name: 'OLYMPN Sport Oversized Hoodie Mocha', slug: 'olympn-sport-oversized-hoodie-mocha',
    thumbnailUrl: 'https://files.cdn.printful.com/mocha.png', variants: [], colors: [], currency: 'EUR', priceCents: 6495,
    drop: sport, status: 'live', purchasable: true, soldOut: false,
    ...overrides,
  }
}

describe('tileBadges', () => {
  it('marks a teaser as coming soon, whatever its stock', () => {
    expect(tileBadges(product({ status: 'upcoming', soldOut: true }), SPORT_START - 1)).toEqual(['coming'])
  })
  it('marks a sold-out live product', () => {
    expect(tileBadges(product({ soldOut: true }), SPORT_START + 1000)).toEqual(['sold-out'])
  })
  it('calls a live drop new for its first 30 days only', () => {
    expect(tileBadges(product({}), SPORT_START)).toEqual(['new'])
    expect(tileBadges(product({}), SPORT_START + NEW_IN_MS - 1)).toEqual(['new'])
    expect(tileBadges(product({}), SPORT_START + NEW_IN_MS)).toEqual([])
  })
  it('calls a previewed drop new before its release', () => {
    expect(tileBadges(product({ status: 'live' }), SPORT_START - 60_000)).toEqual(['new'])
  })
  it('does not call Olympian new months after its release', () => {
    expect(tileBadges(product({ drop: olympian }), SPORT_START)).toEqual([])
  })
})

describe('formatPrice', () => {
  it('formats cents with the currency symbol', () => {
    expect(formatPrice(6495, 'EUR')).toBe('€64.95')
    expect(formatPrice(6495, 'SEK')).toBe('SEK 64.95')
  })
  it('shows no price instead of a wrong one', () => {
    expect(formatPrice(undefined, 'EUR')).toBeNull()
    expect(formatPrice(0, 'EUR')).toBeNull()
  })
})

describe('toTiles', () => {
  it('builds tiles with the card image, falling back to the thumbnail when the cut-out fails', async () => {
    jest.mocked(resolveCardImage)
      .mockResolvedValueOnce('https://example.supabase.co/storage/mocha.png')
      .mockRejectedValueOnce(new Error('remove.bg down'))
    const teaser = product({ status: 'upcoming', purchasable: false })
    const dune = product({ id: '2', name: 'OLYMPN Sport Relaxed Hoodie Dune', slug: 'olympn-sport-relaxed-hoodie-dune', thumbnailUrl: 'https://files.cdn.printful.com/dune.png', status: 'upcoming', purchasable: false })
    const tiles = await toTiles([teaser, dune], SPORT_START - 1)
    expect(tiles[0]).toEqual({
      slug: 'olympn-sport-oversized-hoodie-mocha',
      href: '/shop/olympn-sport-oversized-hoodie-mocha',
      name: 'OLYMPN Sport Oversized Hoodie Mocha',
      image: 'https://example.supabase.co/storage/mocha.png',
      imageAlt: 'OLYMPN Sport Oversized Hoodie Mocha',
      price: '€64.95',
      badges: ['coming'],
      note: 'Drops 1 November 2026 at 12:00 CET',
    })
    expect(tiles[1].image).toBe('https://files.cdn.printful.com/dune.png')
  })
})
```

`components/ui/ProductTile/ProductTile.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import ProductTile from './ProductTile'
import type { TileProduct } from '@/lib/tiles'

const tile: TileProduct = {
  slug: 'olympn-sport-oversized-hoodie-mocha',
  href: '/shop/olympn-sport-oversized-hoodie-mocha',
  name: 'OLYMPN Sport Oversized Hoodie Mocha',
  image: '/drops/olympn-sport/mocha.webp',
  imageAlt: 'OLYMPN Sport Oversized Hoodie Mocha',
  price: '€64.95',
  badges: ['coming'],
  note: 'Drops 1 November 2026 at 12:00 CET',
}

describe('ProductTile', () => {
  it('links the whole tile to the product page', () => {
    render(<ProductTile product={tile} density={4} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-mocha')
    expect(screen.getByRole('heading', { name: 'OLYMPN Sport Oversized Hoodie Mocha' })).toBeInTheDocument()
  })

  it('lazy-loads the image by default and eagerly in the first row', () => {
    const { rerender } = render(<ProductTile product={tile} density={4} />)
    expect(screen.getByRole('img', { name: tile.imageAlt })).toHaveAttribute('loading', 'lazy')
    rerender(<ProductTile product={tile} density={4} eager />)
    expect(screen.getByRole('img', { name: tile.imageAlt })).toHaveAttribute('loading', 'eager')
  })

  it('shows price, badge and release note', () => {
    render(<ProductTile product={tile} density={2} />)
    expect(screen.getByText('€64.95')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
  })

  it('keeps the 4:5 frame with a placeholder when there is no image', () => {
    const { container } = render(<ProductTile product={{ ...tile, image: null }} density={2} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(container.querySelector('.placeholder')).not.toBeNull()
  })

  it('exposes the density to the stylesheet', () => {
    const { container } = render(<ProductTile product={tile} density={1} />)
    expect(container.querySelector('article')).toHaveAttribute('data-density', '1')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (lib/tiles|ProductTile)`
Expected: FAIL, `Cannot find module './tiles'` en `'./ProductTile'`.

- [ ] **Step 3: Implementeer `lib/tiles.ts`**

```ts
import type { BadgeKind } from '@/components/ui/Badge/Badge'
import type { ShopProduct } from '@/lib/catalog'
import { resolveCardImage } from '@/lib/card-image'
import { NEW_IN_MS, formatDropDate } from '@/lib/drops'

/** Everything a product tile shows, resolved on the server. */
export interface TileProduct {
  slug: string
  href: string
  name: string
  image: string | null
  imageAlt: string
  price: string | null
  badges: BadgeKind[]
  /** "Drops 1 November 2026 at 12:00 CET" on a teaser tile. */
  note: string | null
}

/** At most one badge: Coming soon before Sold out before New in. */
export function tileBadges(p: Pick<ShopProduct, 'status' | 'soldOut' | 'drop'>, now: number): BadgeKind[] {
  if (p.status === 'upcoming') return ['coming']
  if (p.soldOut) return ['sold-out']
  return now - Date.parse(p.drop.window.startsAt) < NEW_IN_MS ? ['new'] : []
}

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }

export function formatPrice(cents: number | undefined, currency: string): string | null {
  if (cents === undefined || !Number.isFinite(cents) || cents <= 0) return null
  return `${SYMBOLS[currency] ?? `${currency} `}${(cents / 100).toFixed(2)}`
}

export function toTile(p: ShopProduct, image: string | null, now: number): TileProduct {
  return {
    slug: p.slug,
    href: `/shop/${p.slug}`,
    name: p.name,
    image,
    imageAlt: p.name,
    price: formatPrice(p.priceCents, p.currency),
    badges: tileBadges(p, now),
    note: p.status === 'upcoming' ? `Drops ${formatDropDate(p.drop.window.startsAt)}` : null,
  }
}

/** Tiles with the same background-removed card image as before (Supabase cache, no extra remove.bg calls). */
export async function toTiles(products: ShopProduct[], now: number): Promise<TileProduct[]> {
  const images = await Promise.all(
    products.map((p) =>
      resolveCardImage({ slug: p.slug, thumbnailUrl: p.thumbnailUrl }).catch(() => p.thumbnailUrl)
    )
  )
  return products.map((p, i) => toTile(p, images[i], now))
}
```

- [ ] **Step 4: Implementeer ProductTile**

`components/ui/ProductTile/ProductTile.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import type { TileProduct } from '@/lib/tiles'
import styles from './ProductTile.module.css'

export interface ProductTileProps {
  product: TileProduct
  /** Tiles per row on desktop: drives the `sizes` hint and spacing. */
  density: 1 | 2 | 4
  /** First row: load eagerly so the largest image is not lazy (LCP). */
  eager?: boolean
}

export default function ProductTile({ product, density, eager = false }: ProductTileProps) {
  const sizes = `(min-width: 768px) ${Math.round(100 / density)}vw, 100vw`
  return (
    <article className={styles.tile} data-density={density}>
      <Link href={product.href} className={styles.link}>
        <div className={styles.media}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              sizes={sizes}
              loading={eager ? 'eager' : 'lazy'}
              className={styles.image}
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true" />
          )}
          {product.badges.length > 0 && (
            <div className={styles.badges}>
              {product.badges.map((kind) => (
                <Badge key={kind} kind={kind} />
              ))}
            </div>
          )}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{product.name}</h3>
          {product.price && <p className={styles.price}>{product.price}</p>}
          {product.note && <p className={styles.note}>{product.note}</p>}
        </div>
      </Link>
    </article>
  )
}
```

`components/ui/ProductTile/ProductTile.module.css`:

```css
.tile {
  height: 100%;
  background: var(--c-surface);
}

.link {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--c-text);
  text-decoration: none;
}

.link:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: -2px;
}

.media {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: var(--c-surface);
}

.image {
  object-fit: contain;
  transition: transform var(--m-slow) var(--m-ease-out);
}

.link:hover .image {
  transform: scale(1.02);
}

.placeholder {
  position: absolute;
  inset: 0;
  background: var(--c-stone);
  opacity: 0.35;
}

.badges {
  position: absolute;
  top: var(--s-3);
  left: var(--s-3);
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
}

.info {
  display: grid;
  gap: var(--s-1);
  padding: var(--s-3) var(--s-3) var(--s-5);
}

.tile[data-density='1'] .info {
  padding-inline: var(--l-gutter);
}

.name {
  margin: 0;
  font-family: var(--f-body);
  font-size: var(--fs-small);
  font-weight: 500;
  line-height: 1.3;
}

.price {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.note {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (lib/tiles|ProductTile)`
Expected: PASS, 13 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add lib/tiles.ts lib/tiles.test.ts components/ui/ProductTile
git commit -m "feat: add ProductTile and tile data"
```

---

### Task 12: Griddichtheid

**Files:**
- Create: `hooks/useGridDensity.ts`
- Test: `hooks/useGridDensity.test.tsx`
- Create: `components/ui/GridDensityToggle/GridDensityToggle.tsx`, `components/ui/GridDensityToggle/GridDensityToggle.module.css`
- Test: `components/ui/GridDensityToggle/GridDensityToggle.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 1).
- Produces:
  - `export interface GridDensity { mobile: 1 | 2; desktop: 2 | 4 }`, `export const DEFAULT_DENSITY: GridDensity` (`{ mobile: 2, desktop: 4 }`), `export const DENSITY_STORAGE_KEY = '7eno:grid-density'`
  - `export function readDensity(): GridDensity` (nooit een throw)
  - `export function useGridDensity(): [GridDensity, (patch: Partial<GridDensity>) => void]`
  - `export interface GridDensityToggleProps { value: number; options: number[]; onChange(value: number): void; label?: string }` (radiogroep met roving tabindex en pijltjestoetsen)

- [ ] **Step 1: Schrijf de falende tests**

`hooks/useGridDensity.test.tsx`:

```tsx
import { renderHook, act } from '@testing-library/react'
import { DEFAULT_DENSITY, DENSITY_STORAGE_KEY, useGridDensity } from './useGridDensity'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  jest.restoreAllMocks()
})

/** Make every read of window.localStorage throw, like a browser with storage blocked. */
function blockStorageAccessor(): () => void {
  const own = Object.getOwnPropertyDescriptor(window, 'localStorage')
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  })
  return () => {
    if (own) Object.defineProperty(window, 'localStorage', own)
    else delete (window as unknown as Record<string, unknown>).localStorage
  }
}

describe('useGridDensity', () => {
  it('starts at 2 per row on mobile and 4 on desktop', () => {
    const { result } = renderHook(() => useGridDensity())
    expect(result.current[0]).toEqual(DEFAULT_DENSITY)
    expect(DEFAULT_DENSITY).toEqual({ mobile: 2, desktop: 4 })
  })

  it('restores a stored choice after mount', () => {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, JSON.stringify({ mobile: 1, desktop: 2 }))
    const { result } = renderHook(() => useGridDensity())
    expect(result.current[0]).toEqual({ mobile: 1, desktop: 2 })
  })

  it('remembers a change', () => {
    const { result } = renderHook(() => useGridDensity())
    act(() => result.current[1]({ desktop: 2 }))
    expect(result.current[0]).toEqual({ mobile: 2, desktop: 2 })
    expect(JSON.parse(window.localStorage.getItem(DENSITY_STORAGE_KEY) ?? '{}')).toEqual({ mobile: 2, desktop: 2 })
  })

  it.each(['not json', '{"mobile":3,"desktop":5}', 'null', '7', '[]'])(
    'falls back to the defaults for a stored %s',
    (stored) => {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, stored)
      const { result } = renderHook(() => useGridDensity())
      expect(result.current[0]).toEqual(DEFAULT_DENSITY)
    }
  )

  it('keeps working when the storage accessor itself throws', () => {
    const restore = blockStorageAccessor()
    try {
      const { result } = renderHook(() => useGridDensity())
      expect(result.current[0]).toEqual(DEFAULT_DENSITY)
      act(() => result.current[1]({ mobile: 1 }))
      expect(result.current[0]).toEqual({ mobile: 1, desktop: 4 })
    } finally {
      restore()
    }
  })

  it('keeps the new density when writing fails', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useGridDensity())
    act(() => result.current[1]({ desktop: 2 }))
    expect(result.current[0]).toEqual({ mobile: 2, desktop: 2 })
  })
})
```

`components/ui/GridDensityToggle/GridDensityToggle.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import GridDensityToggle from './GridDensityToggle'

describe('GridDensityToggle', () => {
  it('is a labelled radio group with the current value checked', () => {
    render(<GridDensityToggle value={4} options={[2, 4]} onChange={jest.fn()} />)
    expect(screen.getByRole('radiogroup', { name: 'Products per row' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '4 per row' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '2 per row' })).toHaveAttribute('aria-checked', 'false')
  })

  it('reports a click', () => {
    const onChange = jest.fn()
    render(<GridDensityToggle value={4} options={[2, 4]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '2 per row' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('moves the choice and focus with the arrow keys, wrapping around', () => {
    const onChange = jest.fn()
    render(<GridDensityToggle value={4} options={[2, 4]} onChange={onChange} />)
    const four = screen.getByRole('radio', { name: '4 per row' })
    four.focus()
    fireEvent.keyDown(four, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(screen.getByRole('radio', { name: '2 per row' })).toHaveFocus()
  })

  it('has exactly one tab stop, on the checked option', () => {
    render(<GridDensityToggle value={2} options={[1, 2]} onChange={jest.fn()} label="Products per row (mobile)" />)
    expect(screen.getByRole('radio', { name: '2 per row' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: '1 per row' })).toHaveAttribute('tabindex', '-1')
  })

  it('keeps the first option reachable when the value is not an option', () => {
    render(<GridDensityToggle value={4} options={[1, 2]} onChange={jest.fn()} />)
    expect(screen.getByRole('radio', { name: '1 per row' })).toHaveAttribute('tabindex', '0')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (useGridDensity|GridDensityToggle)`
Expected: FAIL, `Cannot find module './useGridDensity'` en `'./GridDensityToggle'`.

- [ ] **Step 3: Implementeer de hook**

`hooks/useGridDensity.ts`:

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'

export interface GridDensity {
  mobile: 1 | 2
  desktop: 2 | 4
}

export const DEFAULT_DENSITY: GridDensity = { mobile: 2, desktop: 4 }
export const DENSITY_STORAGE_KEY = '7eno:grid-density'

/** localStorage, or null when the browser blocks it (private mode, blocked site data). */
function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The stored density; any missing, blocked or malformed value gives the defaults. */
export function readDensity(): GridDensity {
  try {
    const raw = storage()?.getItem(DENSITY_STORAGE_KEY)
    if (!raw) return DEFAULT_DENSITY
    const parsed: unknown = JSON.parse(raw)
    const value = (parsed !== null && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>
    return { mobile: value.mobile === 1 ? 1 : 2, desktop: value.desktop === 2 ? 2 : 4 }
  } catch {
    return DEFAULT_DENSITY
  }
}

function writeDensity(density: GridDensity): void {
  try {
    storage()?.setItem(DENSITY_STORAGE_KEY, JSON.stringify(density))
  } catch {
    // Blocked or full: the choice still applies, it just is not remembered.
  }
}

/** Products per row, remembered per browser. A convenience: it may silently forget. */
export function useGridDensity(): [GridDensity, (patch: Partial<GridDensity>) => void] {
  const [density, setDensity] = useState<GridDensity>(DEFAULT_DENSITY)

  useEffect(() => {
    // Read after mount: the server has no storage, so the first client render
    // must match the server (the defaults) before the stored choice applies.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDensity(readDensity())
  }, [])

  const update = useCallback((patch: Partial<GridDensity>) => {
    setDensity((prev) => {
      const next = { ...prev, ...patch }
      writeDensity(next)
      return next
    })
  }, [])

  return [density, update]
}
```

- [ ] **Step 4: Implementeer de schakelaar**

`components/ui/GridDensityToggle/GridDensityToggle.tsx`:

```tsx
'use client'

import { useRef, type KeyboardEvent } from 'react'
import styles from './GridDensityToggle.module.css'

export interface GridDensityToggleProps {
  value: number
  options: number[]
  onChange(value: number): void
  label?: string
}

function DensityIcon({ columns }: { columns: number }) {
  const size = 16
  const gap = 2
  const width = (size - gap * (columns - 1)) / columns
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <rect key={i} x={i * (width + gap)} y="0" width={width} height={size} fill="currentColor" />
      ))}
    </svg>
  )
}

/** Products per row as a radio group: one tab stop, arrows move the choice. */
export default function GridDensityToggle({ value, options, onChange, label = 'Products per row' }: GridDensityToggleProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = Math.max(0, options.indexOf(value))

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1
      : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next])
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className={styles.toggle}>
      {options.map((option, i) => (
        <button
          key={option}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={option === value}
          aria-label={`${option} per row`}
          tabIndex={i === activeIndex ? 0 : -1}
          className={styles.option}
          onClick={() => onChange(option)}
          onKeyDown={(event) => onKeyDown(event, i)}
        >
          <DensityIcon columns={option} />
        </button>
      ))}
    </div>
  )
}
```

`components/ui/GridDensityToggle/GridDensityToggle.module.css`:

```css
.toggle {
  display: inline-flex;
  gap: var(--s-1);
}

.option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: var(--r-1);
  background: transparent;
  color: var(--c-text-muted);
  cursor: pointer;
}

.option[aria-checked='true'] {
  border-color: var(--c-border-strong);
  color: var(--c-text);
}

.option:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (useGridDensity|GridDensityToggle)`
Expected: PASS, 15 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add hooks/useGridDensity.ts hooks/useGridDensity.test.tsx components/ui/GridDensityToggle
git commit -m "feat: add grid density toggle remembered in localStorage"
```

---

### Task 13: Shopquery en FilterBar

**Files:**
- Create: `lib/shop-query.ts`
- Test: `lib/shop-query.test.ts`
- Create: `components/ui/FilterBar/FilterBar.tsx`, `components/ui/FilterBar/FilterBar.module.css`
- Test: `components/ui/FilterBar/FilterBar.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` (`router.push(href, { scroll: false })`).

**Interfaces:**
- Consumes: `ShopProduct` (Task 7); `DROPS`, `listDropsNewestFirst`, `Drop`, `DropId` (Task 6); `classify` met `isKnit`/`isHoodie`/`isBag` (Task 10); `Drawer` (Task 3); `Button` (Task 2); `FilterGroup`/`FilterItem` uit `components/ShopFilters/ShopFilters.tsx` (bestaande URL-state-typen: `ShopFilters` levert de URL-state aan `FilterBar`, spec sectie 5).
- Produces:
  - `export type RawSearchParams = Record<string, string | string[] | undefined>`
  - `export const CATEGORIES`, `export type Category = 'tees' | 'knits' | 'hoodies' | 'bags'`
  - `export const SORTS`, `export type SortKey = 'featured' | 'price-asc' | 'price-desc'`
  - `export interface ShopQuery { collection: DropId | null; category: Category | null; sort: SortKey }`
  - `export interface SortOption { value: SortKey; label: string; href: string }`
  - `parseShopQuery(params: RawSearchParams): ShopQuery`, `matchesCategory(name: string, category: Category): boolean`, `applyShopQuery(products: ShopProduct[], query: ShopQuery): ShopProduct[]`, `shopHref(query: ShopQuery): string`, `buildFilterGroups(query: ShopQuery, drops?: readonly Drop[]): FilterGroup[]`, `buildSortOptions(query: ShopQuery): SortOption[]`, `describeShopQuery(query: ShopQuery): { title: string; description: string }`
  - `export interface FilterBarProps { filters: FilterGroup[]; sort: string; sortOptions?: SortOption[]; controls?: ReactNode; resultCount?: number }`

- [ ] **Step 1: Schrijf de falende tests**

`lib/shop-query.test.ts`:

```ts
import type { ShopProduct } from './catalog'
import { DROPS, type Drop } from './drops'
import {
  applyShopQuery, buildFilterGroups, buildSortOptions, describeShopQuery, parseShopQuery, shopHref, type ShopQuery,
} from './shop-query'

const [olympian, sport] = DROPS

function product(slug: string, name: string, drop: Drop, priceCents?: number): ShopProduct {
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    priceCents, drop, status: 'live', purchasable: true, soldOut: false,
  }
}

// Catalogue order as getShopProducts returns it.
const LIST = [
  product('hoodie', 'OLYMPN Sport Oversized Hoodie Mocha', sport, 6495),
  product('knit', 'Olympian Knitted Tee Ocean Unisex', olympian, 5495),
  product('tee', 'Olympian Tee Sand Unisex', olympian, 3495),
  product('bag', 'Olympian Ocean Backpack 20 L', olympian),
]
const ALL: ShopQuery = { collection: null, category: null, sort: 'featured' }
const slugs = (list: ShopProduct[]) => list.map((p) => p.slug)

describe('parseShopQuery', () => {
  it('reads the v2 parameters', () => {
    expect(parseShopQuery({ collection: 'olympn-sport', category: 'hoodies', sort: 'price-asc' })).toEqual({
      collection: 'olympn-sport', category: 'hoodies', sort: 'price-asc',
    })
  })

  it('ignores unknown values and the retired gender and line filters', () => {
    expect(parseShopQuery({ collection: 'og', category: 'shorts', sort: 'cheapest', gender: 'men', line: 'olympian' })).toEqual(ALL)
  })

  it('takes the first of repeated parameters, case-insensitively, and survives empty arrays', () => {
    expect(parseShopQuery({ collection: ['Olympian', 'olympn-sport'], category: [] })).toEqual({ ...ALL, collection: 'olympian' })
  })
})

describe('applyShopQuery', () => {
  it('keeps the catalogue order for featured', () => {
    expect(slugs(applyShopQuery(LIST, ALL))).toEqual(['hoodie', 'knit', 'tee', 'bag'])
  })

  it('filters by collection', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, collection: 'olympn-sport' }))).toEqual(['hoodie'])
  })

  it('keeps knitted tees out of tees and in knits', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'tees' }))).toEqual(['tee'])
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'knits' }))).toEqual(['knit'])
  })

  it('filters hoodies and bags', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'hoodies' }))).toEqual(['hoodie'])
    expect(slugs(applyShopQuery(LIST, { ...ALL, category: 'bags' }))).toEqual(['bag'])
  })

  it('sorts by price both ways, with an unknown price always last', () => {
    expect(slugs(applyShopQuery(LIST, { ...ALL, sort: 'price-asc' }))).toEqual(['tee', 'knit', 'hoodie', 'bag'])
    expect(slugs(applyShopQuery(LIST, { ...ALL, sort: 'price-desc' }))).toEqual(['hoodie', 'knit', 'tee', 'bag'])
  })
})

describe('links', () => {
  it('builds clean shop URLs in a fixed order', () => {
    expect(shopHref(ALL)).toBe('/shop')
    expect(shopHref({ collection: 'olympian', category: 'tees', sort: 'price-desc' })).toBe(
      '/shop?collection=olympian&category=tees&sort=price-desc'
    )
  })

  it('builds filter chips that keep the other choices', () => {
    const [collection, category] = buildFilterGroups({ ...ALL, category: 'hoodies', sort: 'price-asc' })
    expect(collection.label).toBe('Collection')
    expect(collection.items.map((i) => i.label)).toEqual(['All', 'OLYMPN Sport', 'Olympian'])
    expect(collection.items[1].href).toBe('/shop?collection=olympn-sport&category=hoodies&sort=price-asc')
    expect(collection.items[0].active).toBe(true)
    expect(category.items.find((i) => i.active)?.label).toBe('Hoodies')
    expect(category.items[0].href).toBe('/shop?sort=price-asc')
  })

  it('offers only the drops it is given as collection chips', () => {
    expect(buildFilterGroups(ALL, [olympian])[0].items.map((i) => i.label)).toEqual(['All', 'Olympian'])
  })

  it('links every sort option, keeping the filters', () => {
    expect(buildSortOptions({ ...ALL, collection: 'olympian' }).map((o) => o.href)).toEqual([
      '/shop?collection=olympian',
      '/shop?collection=olympian&sort=price-asc',
      '/shop?collection=olympian&sort=price-desc',
    ])
  })
})

describe('describeShopQuery', () => {
  it('titles the listing after the filters', () => {
    expect(describeShopQuery(ALL).title).toBe('Shop all')
    expect(describeShopQuery({ ...ALL, collection: 'olympn-sport', category: 'hoodies' }).title).toBe('OLYMPN Sport Hoodies')
    expect(describeShopQuery({ ...ALL, category: 'knits' }).title).toBe('Knits')
  })
})
```

`components/ui/FilterBar/FilterBar.test.tsx`:

```tsx
import type { ReactNode } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import FilterBar from './FilterBar'
import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'
import type { SortOption } from '@/lib/shop-query'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

// next/link navigates through the mounted app router, which a unit test does
// not have. A plain anchor that cancels the navigation is enough to test our
// own click handlers.
jest.mock('next/link', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react')
  return {
    __esModule: true,
    default: (props: { href: string; className?: string; onClick?: () => void; children?: ReactNode; 'aria-current'?: 'page' | 'true' }) =>
      createElement(
        'a',
        {
          href: props.href,
          className: props.className,
          'aria-current': props['aria-current'],
          onClick: (event: { preventDefault(): void }) => {
            event.preventDefault()
            props.onClick?.()
          },
        },
        props.children
      ),
  }
})

const push = jest.fn()

const FILTERS: FilterGroup[] = [
  {
    label: 'Collection',
    items: [
      { label: 'All', href: '/shop?category=hoodies', active: false },
      { label: 'OLYMPN Sport', href: '/shop?collection=olympn-sport&category=hoodies', active: true },
      { label: 'Olympian', href: '/shop?collection=olympian&category=hoodies', active: false },
    ],
  },
  {
    label: 'Category',
    items: [
      { label: 'All', href: '/shop?collection=olympn-sport', active: false },
      { label: 'Hoodies', href: '/shop?collection=olympn-sport&category=hoodies', active: true },
    ],
  },
]

const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Featured', href: '/shop?collection=olympn-sport&category=hoodies' },
  { value: 'price-asc', label: 'Price, low to high', href: '/shop?collection=olympn-sport&category=hoodies&sort=price-asc' },
]

beforeEach(() => {
  push.mockReset()
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
})

describe('FilterBar', () => {
  it('shows every filter as a chip link and marks the active ones', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} />)
    const bar = screen.getByRole('navigation', { name: 'Filters' })
    const sport = within(bar).getByRole('link', { name: 'OLYMPN Sport' })
    expect(sport).toHaveAttribute('href', '/shop?collection=olympn-sport&category=hoodies')
    expect(sport).toHaveAttribute('aria-current', 'true')
    expect(within(bar).getByRole('link', { name: 'Olympian' })).not.toHaveAttribute('aria-current')
  })

  it('navigates when the sort changes, without jumping to the top', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} />)
    const [select] = screen.getAllByRole('combobox', { name: 'Sort' })
    fireEvent.change(select, { target: { value: 'price-asc' } })
    expect(push).toHaveBeenCalledWith('/shop?collection=olympn-sport&category=hoodies&sort=price-asc', { scroll: false })
  })

  it('opens a filter drawer that shows the active count and closes after a choice', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} resultCount={4} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filters (2)' }))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog.closest('[data-open]')).toHaveAttribute('data-open', 'true')
    expect(within(dialog).getByRole('button', { name: 'Show 4 results' })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('link', { name: 'Olympian' }))
    expect(dialog.closest('[data-open]')).toHaveAttribute('data-open', 'false')
  })

  it('renders only the extra controls when there are no filters or sorts', () => {
    render(<FilterBar filters={[]} sort="featured" controls={<button type="button">density</button>} />)
    expect(screen.getByRole('button', { name: 'density' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Filters/ })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (shop-query|FilterBar)`
Expected: FAIL, `Cannot find module './shop-query'` en `'./FilterBar'`.

- [ ] **Step 3: Implementeer `lib/shop-query.ts`**

```ts
import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, listDropsNewestFirst, type Drop, type DropId } from '@/lib/drops'
import { classify } from '@/lib/product-classify'

export type RawSearchParams = Record<string, string | string[] | undefined>

export const CATEGORIES = [
  { value: 'tees', label: 'Tees' },
  { value: 'knits', label: 'Knits' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'bags', label: 'Bags' },
] as const
export type Category = (typeof CATEGORIES)[number]['value']

export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
] as const
export type SortKey = (typeof SORTS)[number]['value']

export interface ShopQuery {
  collection: DropId | null
  category: Category | null
  sort: SortKey
}

export interface SortOption {
  value: SortKey
  label: string
  href: string
}

function first(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return (raw ?? '').trim().toLowerCase()
}

/** Only the v2 parameters; ?gender and ?line are ignored (spec section 3). */
export function parseShopQuery(params: RawSearchParams): ShopQuery {
  const collection = first(params.collection)
  const category = first(params.category)
  const sort = first(params.sort)
  return {
    collection: DROPS.find((d) => d.id === collection)?.id ?? null,
    category: CATEGORIES.find((c) => c.value === category)?.value ?? null,
    sort: SORTS.find((s) => s.value === sort)?.value ?? 'featured',
  }
}

/** Every piece sits in exactly one category: a knitted tee is a knit, not a tee. */
export function matchesCategory(name: string, category: Category): boolean {
  const kind = classify(name)
  switch (category) {
    case 'tees':
      return kind.isTee && !kind.isKnit
    case 'knits':
      return kind.isKnit
    case 'hoodies':
      return kind.isHoodie
    case 'bags':
      return kind.isBag
  }
}

function priceOf(p: ShopProduct): number | null {
  return typeof p.priceCents === 'number' && p.priceCents > 0 ? p.priceCents : null
}

export function applyShopQuery(products: ShopProduct[], query: ShopQuery): ShopProduct[] {
  const filtered = products.filter(
    (p) =>
      (query.collection === null || p.drop.id === query.collection) &&
      (query.category === null || matchesCategory(p.name, query.category))
  )
  if (query.sort === 'featured') return filtered
  const direction = query.sort === 'price-asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    const pa = priceOf(a)
    const pb = priceOf(b)
    if (pa === null && pb === null) return 0
    if (pa === null) return 1
    if (pb === null) return -1
    return (pa - pb) * direction
  })
}

export function shopHref(query: ShopQuery): string {
  const params = new URLSearchParams()
  if (query.collection) params.set('collection', query.collection)
  if (query.category) params.set('category', query.category)
  if (query.sort !== 'featured') params.set('sort', query.sort)
  const search = params.toString()
  return search ? `/shop?${search}` : '/shop'
}

/** Chips for the FilterBar, in the URL-state shape ShopFilters already uses. */
export function buildFilterGroups(query: ShopQuery, drops: readonly Drop[] = DROPS): FilterGroup[] {
  return [
    {
      label: 'Collection',
      items: [
        { label: 'All', href: shopHref({ ...query, collection: null }), active: query.collection === null },
        ...listDropsNewestFirst(drops).map((d) => ({
          label: d.title,
          href: shopHref({ ...query, collection: d.id }),
          active: query.collection === d.id,
        })),
      ],
    },
    {
      label: 'Category',
      items: [
        { label: 'All', href: shopHref({ ...query, category: null }), active: query.category === null },
        ...CATEGORIES.map((c) => ({
          label: c.label,
          href: shopHref({ ...query, category: c.value }),
          active: query.category === c.value,
        })),
      ],
    },
  ]
}

export function buildSortOptions(query: ShopQuery): SortOption[] {
  return SORTS.map((s) => ({ value: s.value, label: s.label, href: shopHref({ ...query, sort: s.value }) }))
}

export function describeShopQuery(query: ShopQuery): { title: string; description: string } {
  const collection = DROPS.find((d) => d.id === query.collection)?.title
  const category = CATEGORIES.find((c) => c.value === query.category)?.label
  if (!collection && !category) {
    return {
      title: 'Shop all',
      description:
        'Shop every live 7ENO (Zeno) edition, Olympian and OLYMPN Sport, by Abra Entertainment. Free shipping over €75.',
    }
  }
  const label = [collection, category].filter(Boolean).join(' ')
  return {
    title: label,
    description: `Shop ${label} from 7ENO (Zeno), the official streetwear store by Abra Entertainment. Free shipping over €75.`,
  }
}
```

- [ ] **Step 4: Implementeer FilterBar**

`components/ui/FilterBar/FilterBar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import Button from '@/components/ui/Button/Button'
import Drawer from '@/components/ui/Drawer/Drawer'
import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'
import type { SortOption } from '@/lib/shop-query'
import styles from './FilterBar.module.css'

export interface FilterBarProps {
  filters: FilterGroup[]
  sort: string
  sortOptions?: SortOption[]
  /** Extra controls on the right, e.g. the grid density toggle. */
  controls?: ReactNode
  resultCount?: number
}

/** Sticky filter and sort bar under the header; below 1024px the chips live in a Drawer. */
export default function FilterBar({ filters, sort, sortOptions = [], controls, resultCount }: FilterBarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  // A group counts as filtered when its active option is not the first ("All").
  const activeCount = filters.filter((g) => g.items.findIndex((i) => i.active) > 0).length

  const onSort = (value: string) => {
    const option = sortOptions.find((o) => o.value === value)
    if (option) router.push(option.href, { scroll: false })
  }

  const sortControl = (id: string) =>
    sortOptions.length > 0 ? (
      <div className={styles.sort}>
        <label htmlFor={id} className={styles.sortLabel}>Sort</label>
        <select id={id} className={styles.select} value={sort} onChange={(e) => onSort(e.target.value)}>
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    ) : null

  const chipGroups = (onNavigate?: () => void) =>
    filters.map((group) => (
      <div key={group.label} className={styles.group} role="group" aria-label={group.label}>
        <span className={styles.groupLabel} aria-hidden="true">{group.label}</span>
        <ul className={styles.chips}>
          {group.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                scroll={false}
                className={styles.chip}
                aria-current={item.active ? 'true' : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ))

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {filters.length > 0 && (
          <button
            type="button"
            className={styles.filtersButton}
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="filter-drawer"
          >
            {`Filters${activeCount > 0 ? ` (${activeCount})` : ''}`}
          </button>
        )}
        {filters.length > 0 && (
          <nav className={styles.groups} aria-label="Filters">
            {chipGroups()}
          </nav>
        )}
        <div className={styles.tools}>
          <div className={styles.desktopSort}>{sortControl('sort-desktop')}</div>
          {controls}
        </div>
      </div>

      {filters.length > 0 && (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          side="left"
          title="Filters"
          id="filter-drawer"
          footer={
            <Button size="lg" className={styles.showResults} onClick={() => setOpen(false)}>
              {typeof resultCount === 'number'
                ? `Show ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`
                : 'Done'}
            </Button>
          }
        >
          <div className={styles.drawerGroups}>{chipGroups(() => setOpen(false))}</div>
          {sortControl('sort-mobile')}
        </Drawer>
      )}
    </div>
  )
}
```

`components/ui/FilterBar/FilterBar.module.css`:

```css
.bar {
  position: sticky;
  top: var(--l-chrome);
  z-index: 100;
  background: var(--c-bg);
  border-bottom: 1px solid var(--c-stone);
}

.inner {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  min-height: 52px;
  max-width: var(--l-max);
  margin: 0 auto;
  padding: var(--s-2) var(--l-gutter);
}

.filtersButton {
  min-height: 36px;
  padding: 0 var(--s-4);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  background: transparent;
  color: var(--c-text);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.groups {
  display: none;
}

.group {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.groupLabel,
.sortLabel {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-small);
  text-decoration: none;
}

/* Periwinkle behind small navy text is below 4.5:1, so the active chip is
   navy with cream text and carries the accent as a bar (spec section 2: the
   accent marks active chips, text is always navy or cream). */
.chip[aria-current='true'] {
  border-color: var(--c-text);
  background: var(--c-text);
  color: var(--c-inverse-text);
  box-shadow: inset 0 -3px 0 var(--c-accent);
}

.tools {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  margin-left: auto;
}

.desktopSort {
  display: none;
}

.sort {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}

.select {
  min-height: 36px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-small);
}

.drawerGroups {
  display: grid;
  gap: var(--s-6);
  margin-bottom: var(--s-6);
}

.drawerGroups .group {
  flex-direction: column;
  align-items: flex-start;
}

.showResults {
  width: 100%;
}

.filtersButton:focus-visible,
.chip:focus-visible,
.select:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

@media (min-width: 1024px) {
  .filtersButton {
    display: none;
  }

  .groups {
    display: flex;
    gap: var(--s-6);
  }

  .desktopSort {
    display: block;
  }
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (shop-query|FilterBar)`
Expected: PASS, 17 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add lib/shop-query.ts lib/shop-query.test.ts components/ui/FilterBar
git commit -m "feat: add shop query model and sticky FilterBar"
```

---

### Task 14: De PLP `/shop`

**Files:**
- Create: `components/ui/ShopView/ShopView.tsx`, `components/ui/ShopView/ShopView.module.css`
- Test: `components/ui/ShopView/ShopView.test.tsx`
- Modify: `app/shop/page.tsx:1-347` (volledig vervangen; Task 7 had regel 4, 139-144 en 232-236 al aangepast)
- Modify: `app/shop/shop.module.css` (volledig vervangen)
- Modify: `lib/product-classify.ts:1-87` (volledig vervangen: alleen nog soorten)
- Test: `lib/product-classify.test.ts:1-76` plus het blok uit Task 10 (volledig vervangen)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (`alternates.canonical`; `searchParams` is een Promise).

**Interfaces:**
- Consumes: `FilterBar`, `parseShopQuery`, `applyShopQuery`, `buildFilterGroups`, `buildSortOptions`, `describeShopQuery`, `RawSearchParams`, `SortOption` (Task 13); `GridDensityToggle`, `useGridDensity` (Task 12); `ProductTile`, `toTiles`, `TileProduct` (Task 11); `getShopProducts` (Task 7); `DROPS`, `isDropListed`, `currentTimeMs` (Task 6); `isPreviewSession` (Task 6).
- Produces:
  - `export interface ShopViewProps { filters: FilterGroup[]; sort: string; sortOptions: SortOption[]; tiles: TileProduct[]; emptyMessage?: string }` (Task 17 gebruikt hem voor het drop-grid met `filters={[]}`)
  - `export interface Classification { isTee: boolean; isKnit: boolean; isHoodie: boolean; isBag: boolean }` (de oude velden en `olympianSortRank` verdwijnen; dit is de laatste afnemer)

- [ ] **Step 1: Schrijf de falende tests**

`components/ui/ShopView/ShopView.test.tsx`:

```tsx
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ShopView from './ShopView'
import type { TileProduct } from '@/lib/tiles'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

function tile(n: number): TileProduct {
  return {
    slug: `piece-${n}`, href: `/shop/piece-${n}`, name: `Piece ${n}`, image: '/drops/olympn-sport/mocha.webp',
    imageAlt: `Piece ${n}`, price: '€64.95', badges: [], note: null,
  }
}

const TILES = [1, 2, 3, 4, 5, 6].map(tile)

beforeEach(() => {
  window.localStorage.clear()
  jest.mocked(useRouter).mockReturnValue({ push: jest.fn() } as unknown as ReturnType<typeof useRouter>)
})

describe('ShopView', () => {
  it('renders one tile per product, the first desktop row eager', () => {
    render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(6)
    expect(images.slice(0, 4).every((img) => img.getAttribute('loading') === 'eager')).toBe(true)
    expect(images[4]).toHaveAttribute('loading', 'lazy')
  })

  it('switches the desktop grid to two per row', () => {
    const { container } = render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    const grid = container.querySelector('ul[data-desktop]')
    expect(grid).toHaveAttribute('data-desktop', '4')
    const desktop = screen.getByRole('radiogroup', { name: 'Products per row' })
    fireEvent.click(within(desktop).getByRole('radio', { name: '2 per row' }))
    expect(grid).toHaveAttribute('data-desktop', '2')
  })

  it('switches the mobile grid to one per row', () => {
    const { container } = render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={TILES} />)
    const mobile = screen.getByRole('radiogroup', { name: 'Products per row (mobile)' })
    fireEvent.click(within(mobile).getByRole('radio', { name: '1 per row' }))
    expect(container.querySelector('ul[data-mobile]')).toHaveAttribute('data-mobile', '1')
  })

  it('shows the empty message instead of an empty grid', () => {
    render(<ShopView filters={[]} sort="featured" sortOptions={[]} tiles={[]} emptyMessage="No pieces match these filters yet." />)
    expect(screen.getByText('No pieces match these filters yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
```

Vervang `lib/product-classify.test.ts` volledig:

```ts
import { classify, HIDDEN_SIZES } from './product-classify'

describe('classify', () => {
  it.each([
    ['Olympian Tee Sand Unisex', { isTee: true, isKnit: false, isHoodie: false, isBag: false }],
    ['Olympian Knitted Tee Ocean Unisex', { isTee: false, isKnit: true, isHoodie: false, isBag: false }],
    ['OLYMPN Sport Oversized Hoodie Rose Red', { isTee: false, isKnit: false, isHoodie: true, isBag: false }],
    ['OLYMPN Sport Relaxed Hoodie Dune', { isTee: false, isKnit: false, isHoodie: true, isBag: false }],
    ['Olympian Ocean Backpack 20 L', { isTee: false, isKnit: false, isHoodie: false, isBag: true }],
  ])('classifies %s', (name, expected) => {
    expect(classify(name)).toEqual(expected)
  })

  it('puts every v2 piece in exactly one kind', () => {
    const names = [
      'Olympian Tee Coconut Unisex', 'Olympian Knitted Tee Flamingo Unisex', 'Olympian Sand Backpack 20 L',
      'OLYMPN Sport Oversized Hoodie Pistachio', 'OLYMPN Sport Relaxed Hoodie Maritime',
    ]
    for (const name of names) {
      expect(Object.values(classify(name)).filter(Boolean)).toHaveLength(1)
    }
  })
})

describe('HIDDEN_SIZES', () => {
  it('hides the sizes the storefront hides', () => {
    expect(HIDDEN_SIZES.has('4XL')).toBe(true)
    expect(HIDDEN_SIZES.has('XL')).toBe(false)
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (ShopView|product-classify)`
Expected: FAIL: `Cannot find module './ShopView'`; `classify` geeft nog de oude velden terug (`toEqual` faalt) en een knitted tee is nog ook een tee.

- [ ] **Step 3: Implementeer ShopView**

`components/ui/ShopView/ShopView.tsx`:

```tsx
'use client'

import FilterBar from '@/components/ui/FilterBar/FilterBar'
import GridDensityToggle from '@/components/ui/GridDensityToggle/GridDensityToggle'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import { useGridDensity } from '@/hooks/useGridDensity'
import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'
import type { SortOption } from '@/lib/shop-query'
import type { TileProduct } from '@/lib/tiles'
import styles from './ShopView.module.css'

export interface ShopViewProps {
  filters: FilterGroup[]
  sort: string
  sortOptions: SortOption[]
  tiles: TileProduct[]
  emptyMessage?: string
}

/** FilterBar plus the 2px-gap grid; owns the grid density (desktop 2/4, mobile 1/2). */
export default function ShopView({ filters, sort, sortOptions, tiles, emptyMessage = 'Nothing here yet.' }: ShopViewProps) {
  const [density, setDensity] = useGridDensity()

  const controls = (
    <>
      <div className={styles.mobileOnly}>
        <GridDensityToggle
          label="Products per row (mobile)"
          value={density.mobile}
          options={[1, 2]}
          onChange={(v) => setDensity({ mobile: v === 1 ? 1 : 2 })}
        />
      </div>
      <div className={styles.desktopOnly}>
        <GridDensityToggle
          value={density.desktop}
          options={[2, 4]}
          onChange={(v) => setDensity({ desktop: v === 2 ? 2 : 4 })}
        />
      </div>
    </>
  )

  return (
    <>
      <FilterBar filters={filters} sort={sort} sortOptions={sortOptions} controls={controls} resultCount={tiles.length} />
      {tiles.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.grid} data-mobile={density.mobile} data-desktop={density.desktop}>
          {tiles.map((tile, i) => (
            <li key={tile.slug} className={styles.cell}>
              <ProductTile product={tile} density={density.desktop} eager={i < density.desktop} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
```

`components/ui/ShopView/ShopView.module.css`:

```css
/* The stone background shows through the 2px gaps as hairlines between tiles. */
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--l-grid-gap);
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--c-stone);
}

.grid[data-mobile='1'] {
  grid-template-columns: minmax(0, 1fr);
}

.cell {
  min-width: 0;
}

.empty {
  margin: 0;
  padding: var(--s-9) var(--l-gutter);
  font-family: var(--f-body);
  font-size: var(--fs-body);
  color: var(--c-text-muted);
  text-align: center;
}

.mobileOnly {
  display: block;
}

.desktopOnly {
  display: none;
}

@media (min-width: 768px) {
  .grid[data-desktop='4'] {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .grid[data-desktop='2'] {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mobileOnly {
    display: none;
  }

  .desktopOnly {
    display: block;
  }
}
```

- [ ] **Step 4: Vervang `app/shop/page.tsx`**

```tsx
import type { Metadata } from 'next'
import ShopView from '@/components/ui/ShopView/ShopView'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { DROPS, currentTimeMs, isDropListed } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import {
  applyShopQuery, buildFilterGroups, buildSortOptions, describeShopQuery, parseShopQuery, type RawSearchParams,
} from '@/lib/shop-query'
import { toTiles } from '@/lib/tiles'
import { BASE_URL, BRAND_KEYWORDS, absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
import styles from './shop.module.css'

interface Props {
  searchParams: Promise<RawSearchParams>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { title, description } = describeShopQuery(parseShopQuery(await searchParams))
  return {
    title,
    description,
    keywords: BRAND_KEYWORDS,
    // Every filter combination is the same listing; collections have their own
    // landing pages under /collections, so the shop has one canonical.
    alternates: { canonical: '/shop' },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description, url: absoluteUrl('/shop'), type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · 7ENO (Zeno)`, description },
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const query = parseShopQuery(await searchParams)
  const now = currentTimeMs()
  const preview = await isPreviewSession()

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, { preview })
  } catch (err) {
    console.error('[Catalog] getShopProducts failed:', err)
  }

  const visible = applyShopQuery(products, query)
  const tiles = await toTiles(visible, now)
  const { title, description } = describeShopQuery(query)
  const drops = DROPS.filter((d) => isDropListed(d, now, { preview }))

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${title} · 7ENO (Zeno)`,
    description,
    url: absoluteUrl('/shop'),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: visible.length,
      itemListElement: visible.slice(0, 50).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: absoluteUrl(`/shop/${p.slug}`),
      })),
    },
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
  ])

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <header className={styles.header}>
        <p className={styles.label}>Shop</p>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <ShopView
        filters={buildFilterGroups(query, drops)}
        sort={query.sort}
        sortOptions={buildSortOptions(query)}
        tiles={tiles}
        emptyMessage="No pieces match these filters yet."
      />
    </main>
  )
}
```

- [ ] **Step 5: Vervang `app/shop/shop.module.css`**

```css
.page {
  min-height: 100vh;
  padding-top: var(--l-chrome);
  background: var(--c-bg);
  color: var(--c-text);
}

.header {
  max-width: var(--l-max);
  margin: 0 auto;
  padding: var(--s-7) var(--l-gutter) var(--s-5);
}

.label {
  margin: 0 0 var(--s-2);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.title {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h1);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}
```

- [ ] **Step 6: Vervang `lib/product-classify.ts`**

```ts
/**
 * Product kind from the name (spec section 4): drives the shop categories and
 * the Merchant Center taxonomy. Collections come from lib/drops.ts, never from
 * keywords here.
 */

/**
 * Sizes the storefront hides (see ProductDetail / QuickAddCard). The Merchant
 * Center feed skips them too: advertising a size a shopper can't then pick on
 * the product page is both a bad landing and a Merchant Center policy risk.
 */
export const HIDDEN_SIZES = new Set(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])

export interface Classification {
  isTee: boolean
  isKnit: boolean
  isHoodie: boolean
  isBag: boolean
}

export function classify(name: string): Classification {
  const n = name.toLowerCase()
  const isKnit = /\bknit(ted)?\b/.test(n)
  const isHoodie = /\bhood(ie|y)\b/.test(n)
  const isBag = /\b(backpack|bag|tote)\b/.test(n)
  // A knitted tee is a knit, not a tee: each piece sits in exactly one category.
  const isTee = !isKnit && !isHoodie && /\b(tee|t-shirt|shirt)\b/.test(n)
  return { isTee, isKnit, isHoodie, isBag }
}
```

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (ShopView|product-classify|shop-query|merchant-feed|product-feed)`
Expected: PASS. `git grep -n -E "isOlympian|olympianSortRank|isWomen|isAccessory" -- app lib components` geeft niets.

- [ ] **Step 8: Kwaliteitspoort en visuele check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `npm run dev`, dan op 1440 en 390 breed: `/shop` toont de Olympian-tegels (4:5, wit vlak, 2px stenen lijnen), chips Collection en Category, sortering, schakelaar 2/4 (desktop) en 1/2 (mobiel) die een herlaad overleeft; in een privévenster met geblokkeerde sitedata werkt de schakelaar nog. `/shop?category=knits` toont alleen knitted tees; `/shop?gender=men` toont gewoon alles (genegeerd).

- [ ] **Step 9: Commit**

```bash
git add components/ui/ShopView app/shop/page.tsx app/shop/shop.module.css lib/product-classify.ts lib/product-classify.test.ts
git commit -m "feat: rebuild /shop on the drop catalogue with filters and grid density"
```

---

### Task 15: Waitlist (validatie, Resend-contact, route, formulier)

**Files:**
- Create: `lib/waitlist.ts`
- Test: `lib/waitlist.test.ts`
- Create: `lib/waitlist-resend.ts`
- Test: `lib/waitlist-resend.test.ts`
- Create: `app/api/waitlist/route.ts`
- Test: `app/api/waitlist/route.test.ts`
- Create: `components/ui/WaitlistForm/WaitlistForm.tsx`, `components/ui/WaitlistForm/WaitlistForm.module.css`
- Test: `components/ui/WaitlistForm/WaitlistForm.test.tsx`
- Modify: `components/ui/SiteFooter/SiteFooter.tsx`, `SiteFooter.module.css`, `SiteFooter.test.tsx` (na Task 5: kolom "Drop alerts")

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` (`POST(request: NextRequest)`, `request.json()`, headers lezen). Resend: `node_modules/resend/dist/index.d.mts:1053-1065` (`LegacyCreateContactOptions`: `audienceId`, `email`, `unsubscribed`, `properties`; audiences zijn deprecated ten gunste van segments, maar de spec kiest een audience en de SDK accepteert hem nog).

**Interfaces:**
- Consumes: `DROPS` (Task 6); `Button` (Task 2).
- Produces:
  - `export interface WaitlistSignup { email: string; dropId: string | null; productSlug: string | null }`
  - `export type WaitlistParse = { ok: true; signup: WaitlistSignup } | { ok: false; reason: 'honeypot' } | { ok: false; reason: 'invalid'; error: string }`
  - `export const HONEYPOT_FIELD = 'company'`
  - `export function parseWaitlistBody(body: unknown): WaitlistParse`
  - `export function createRateLimiter(opts: { limit: number; windowMs: number }): { check(key: string, now?: number): boolean }`
  - `export function clientIp(headers: Headers): string`
  - `export type WaitlistResult = 'added' | 'unconfigured' | 'failed'`, `export async function addWaitlistContact(signup: WaitlistSignup): Promise<WaitlistResult>`
  - `POST /api/waitlist`: 200 `{ ok: true }` (ook bij honeypot en bij een bestaand contact), 400 ongeldig, 429 te vaak (5 per 10 minuten per IP, per serverinstantie), 502 Resend-fout, 503 niet geconfigureerd.
  - `export interface WaitlistFormProps { dropId?: string; productSlug?: string; compact?: boolean }`

Handmatige voorbereiding voor de Preview (Joep, eenmalig, staat niet in code): in Resend een test-audience aanmaken en het id als `RESEND_WAITLIST_AUDIENCE_ID` in de Preview-env zetten; onder Contacts de properties `drop_id` en `product_slug` (type string) aanmaken, anders weigert Resend het contact.

- [ ] **Step 1: Schrijf de falende tests**

`lib/waitlist.test.ts`:

```ts
import { HONEYPOT_FIELD, clientIp, createRateLimiter, parseWaitlistBody } from './waitlist'

describe('parseWaitlistBody', () => {
  it('accepts an email with a known drop and normalises the address', () => {
    expect(parseWaitlistBody({ email: '  Joep@Example.NL ', dropId: 'olympn-sport' })).toEqual({
      ok: true,
      signup: { email: 'joep@example.nl', dropId: 'olympn-sport', productSlug: null },
    })
  })

  it('accepts a product slug and no drop', () => {
    expect(parseWaitlistBody({ email: 'a@b.nl', productSlug: 'olympn-sport-oversized-hoodie-mocha' })).toEqual({
      ok: true,
      signup: { email: 'a@b.nl', dropId: null, productSlug: 'olympn-sport-oversized-hoodie-mocha' },
    })
  })

  it.each([
    [{}, 'Enter a valid email address.'],
    [{ email: 'not-an-email' }, 'Enter a valid email address.'],
    [{ email: 'a@b' }, 'Enter a valid email address.'],
    [{ email: `${'a'.repeat(250)}@b.nl` }, 'Enter a valid email address.'],
    [{ email: 'a@b.nl', dropId: 'og' }, 'Unknown drop.'],
    [{ email: 'a@b.nl', productSlug: '../etc/passwd' }, 'Unknown product.'],
  ])('rejects %j', (body, error) => {
    expect(parseWaitlistBody(body)).toEqual({ ok: false, reason: 'invalid', error })
  })

  it('rejects something that is not an object', () => {
    expect(parseWaitlistBody('a@b.nl')).toEqual({ ok: false, reason: 'invalid', error: 'Invalid request' })
    expect(parseWaitlistBody(null)).toEqual({ ok: false, reason: 'invalid', error: 'Invalid request' })
  })

  it('flags a filled honeypot before anything else', () => {
    expect(parseWaitlistBody({ email: 'bot@spam.io', [HONEYPOT_FIELD]: 'ACME Ltd' })).toEqual({ ok: false, reason: 'honeypot' })
    expect(parseWaitlistBody({ email: 'a@b.nl', [HONEYPOT_FIELD]: '' }).ok).toBe(true)
  })
})

describe('createRateLimiter', () => {
  it('allows `limit` hits per window per key', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(limiter.check('1.1.1.1', 0)).toBe(true)
    expect(limiter.check('1.1.1.1', 10)).toBe(true)
    expect(limiter.check('1.1.1.1', 20)).toBe(false)
    expect(limiter.check('2.2.2.2', 20)).toBe(true)
    expect(limiter.check('1.1.1.1', 1001)).toBe(true)
  })
})

describe('clientIp', () => {
  it('takes the first forwarded address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7')
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
```

`lib/waitlist-resend.test.ts`:

```ts
/** @jest-environment node */
import { addWaitlistContact } from './waitlist-resend'

const mockCreate = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ contacts: { create: (...args: unknown[]) => mockCreate(...args) } })),
}))

const ORIGINAL_ENV = { ...process.env }
const SIGNUP = { email: 'a@b.nl', dropId: 'olympn-sport', productSlug: null }

beforeEach(() => {
  mockCreate.mockReset().mockResolvedValue({ data: { id: 'c_1', object: 'contact' }, error: null })
  process.env = { ...ORIGINAL_ENV, RESEND_API_KEY: 're_test', RESEND_WAITLIST_AUDIENCE_ID: 'aud_test' }
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

describe('addWaitlistContact', () => {
  it('adds the contact to the waitlist audience with the drop as a property', async () => {
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('added')
    expect(mockCreate).toHaveBeenCalledWith({
      audienceId: 'aud_test',
      email: 'a@b.nl',
      unsubscribed: false,
      properties: { drop_id: 'olympn-sport' },
    })
  })

  it('sends no properties when there are none', async () => {
    await addWaitlistContact({ email: 'a@b.nl', dropId: null, productSlug: null })
    expect(mockCreate).toHaveBeenCalledWith({ audienceId: 'aud_test', email: 'a@b.nl', unsubscribed: false })
  })

  it('treats an address that is already on the list as added', async () => {
    mockCreate.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'Contact already exists', statusCode: 409 } })
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('added')
  })

  it('reports other Resend errors and network failures as failed', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockCreate.mockResolvedValueOnce({ data: null, error: { name: 'rate_limit_exceeded', message: 'Too many requests', statusCode: 429 } })
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('failed')
    mockCreate.mockRejectedValueOnce(new Error('socket hang up'))
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('failed')
    errorSpy.mockRestore()
  })

  it('does nothing without a key or audience', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    delete process.env.RESEND_WAITLIST_AUDIENCE_ID
    await expect(addWaitlistContact(SIGNUP)).resolves.toBe('unconfigured')
    expect(mockCreate).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
```

`app/api/waitlist/route.test.ts`:

```ts
/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST } from './route'

const mockAdd = jest.fn()
jest.mock('../../../lib/waitlist-resend', () => ({
  addWaitlistContact: (...args: unknown[]) => mockAdd(...args),
}))

// The limiter lives in the module, so every test uses its own address.
function request(body: unknown, ip: string) {
  return new NextRequest('http://localhost/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  mockAdd.mockReset().mockResolvedValue('added')
})

describe('POST /api/waitlist', () => {
  it('adds a valid signup', async () => {
    const res = await POST(request({ email: 'A@B.nl', dropId: 'olympn-sport', company: '' }, '10.0.0.1'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockAdd).toHaveBeenCalledWith({ email: 'a@b.nl', dropId: 'olympn-sport', productSlug: null })
  })

  it('answers a bot that filled the honeypot like a person, without storing it', async () => {
    const res = await POST(request({ email: 'bot@spam.io', company: 'ACME' }, '10.0.0.2'))
    expect(res.status).toBe(200)
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('rejects an invalid address and broken JSON with 400', async () => {
    expect((await POST(request({ email: 'nope' }, '10.0.0.3'))).status).toBe(400)
    expect((await POST(request('{not json', '10.0.0.3'))).status).toBe(400)
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('maps Resend outcomes to 503 and 502', async () => {
    mockAdd.mockResolvedValueOnce('unconfigured')
    expect((await POST(request({ email: 'a@b.nl' }, '10.0.0.4'))).status).toBe(503)
    mockAdd.mockResolvedValueOnce('failed')
    expect((await POST(request({ email: 'a@b.nl' }, '10.0.0.4'))).status).toBe(502)
  })

  it('limits one address to five attempts per window, not its neighbours', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await POST(request({ email: `a${i}@b.nl` }, '10.0.0.5'))).status).toBe(200)
    }
    expect((await POST(request({ email: 'a5@b.nl' }, '10.0.0.5'))).status).toBe(429)
    expect((await POST(request({ email: 'a6@b.nl' }, '10.0.0.6'))).status).toBe(200)
  })
})
```

`components/ui/WaitlistForm/WaitlistForm.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import WaitlistForm from './WaitlistForm'

const mockFetch = jest.fn()

function okResponse() {
  return { ok: true, json: async () => ({ ok: true }) }
}

beforeEach(() => {
  mockFetch.mockReset()
  global.fetch = mockFetch as unknown as typeof fetch
})

function fillAndSubmit(value = 'a@b.nl') {
  const input = screen.getByLabelText('Get notified when it drops')
  fireEvent.change(input, { target: { value } })
  const form = input.closest('form') as HTMLFormElement
  fireEvent.submit(form)
  return form
}

describe('WaitlistForm', () => {
  it('posts the address with the drop and confirms', async () => {
    mockFetch.mockResolvedValue(okResponse())
    render(<WaitlistForm dropId="olympn-sport" />)
    fillAndSubmit()
    expect(await screen.findByText("You're on the list. We'll email you when it drops.")).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledWith('/api/waitlist', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ email: 'a@b.nl', dropId: 'olympn-sport', company: '' })
    expect(screen.getByLabelText('Get notified when it drops')).toBeDisabled()
  })

  it('sends one request when submitted twice while the first is in flight', async () => {
    let resolve: (value: unknown) => void = () => {}
    mockFetch.mockReturnValue(new Promise((r) => { resolve = r }))
    render(<WaitlistForm dropId="olympn-sport" />)
    const form = fillAndSubmit()
    fireEvent.submit(form)
    fireEvent.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolve(okResponse())
    })
    expect(await screen.findByText(/on the list/)).toBeInTheDocument()
  })

  it('shows the server message on a rejected address', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Enter a valid email address.' }) })
    render(<WaitlistForm />)
    fillAndSubmit('nope')
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).not.toBeDisabled()
  })

  it('survives a network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<WaitlistForm />)
    fillAndSubmit()
    expect(await screen.findByText('Network error. Please try again.')).toBeInTheDocument()
  })

  it('announces the outcome politely', () => {
    render(<WaitlistForm />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('uses a short label in compact mode', () => {
    render(<WaitlistForm compact />)
    expect(screen.getByLabelText('Email for drop alerts')).toBeInTheDocument()
  })
})
```

Voeg in `components/ui/SiteFooter/SiteFooter.test.tsx` toe (binnen `describe('SiteFooter')`):

```tsx
  it('offers drop alerts', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    expect(screen.getByLabelText('Email for drop alerts')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (lib/waitlist|api/waitlist|WaitlistForm|SiteFooter)`
Expected: FAIL, `Cannot find module './waitlist'`, `'./waitlist-resend'`, `'./route'`, `'./WaitlistForm'`; SiteFooter mist het veld.

- [ ] **Step 3: Implementeer `lib/waitlist.ts`**

```ts
import { DROPS } from '@/lib/drops'

export interface WaitlistSignup {
  email: string
  dropId: string | null
  productSlug: string | null
}

export type WaitlistParse =
  | { ok: true; signup: WaitlistSignup }
  | { ok: false; reason: 'honeypot' }
  | { ok: false; reason: 'invalid'; error: string }

/** A field people never see or fill; bots that fill every input do. */
export const HONEYPOT_FIELD = 'company'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

export function parseWaitlistBody(body: unknown): WaitlistParse {
  if (body === null || typeof body !== 'object') {
    return { ok: false, reason: 'invalid', error: 'Invalid request' }
  }
  const input = body as Record<string, unknown>

  const trap = input[HONEYPOT_FIELD]
  if (typeof trap === 'string' && trap.trim() !== '') return { ok: false, reason: 'honeypot' }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (email.length === 0 || email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, reason: 'invalid', error: 'Enter a valid email address.' }
  }

  const rawDrop = input.dropId
  let dropId: string | null = null
  if (!isBlank(rawDrop)) {
    if (typeof rawDrop !== 'string' || !DROPS.some((d) => d.id === rawDrop)) {
      return { ok: false, reason: 'invalid', error: 'Unknown drop.' }
    }
    dropId = rawDrop
  }

  const rawSlug = input.productSlug
  let productSlug: string | null = null
  if (!isBlank(rawSlug)) {
    if (typeof rawSlug !== 'string' || rawSlug.length > 120 || !SLUG.test(rawSlug)) {
      return { ok: false, reason: 'invalid', error: 'Unknown product.' }
    }
    productSlug = rawSlug
  }

  return { ok: true, signup: { email, dropId, productSlug } }
}

export interface RateLimiter {
  check(key: string, now?: number): boolean
}

/**
 * In-memory sliding window per key. Per server instance: on serverless there
 * are several, so this is a brake on one client hammering the form, not a wall.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    check(key: string, now: number = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      hits.set(key, recent)
      if (hits.size > 5000) {
        for (const [k, times] of hits) {
          if (times.every((t) => now - t >= windowMs)) hits.delete(k)
        }
      }
      return true
    },
  }
}

/** The client address as Vercel forwards it. */
export function clientIp(headers: Headers): string {
  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (first) return first
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
```

- [ ] **Step 4: Implementeer `lib/waitlist-resend.ts`**

```ts
import type { WaitlistSignup } from '@/lib/waitlist'

export type WaitlistResult = 'added' | 'unconfigured' | 'failed'

/**
 * Adds the address to the Resend audience in RESEND_WAITLIST_AUDIENCE_ID,
 * with the drop or product as a contact property. No Supabase involved
 * (spec section 4). Resend is imported lazily so tests and builds without
 * a key never load the SDK.
 */
export async function addWaitlistContact(signup: WaitlistSignup): Promise<WaitlistResult> {
  const apiKey = process.env.RESEND_API_KEY
  const audienceId = process.env.RESEND_WAITLIST_AUDIENCE_ID
  if (!apiKey || !audienceId) {
    console.warn('[Waitlist] Skipped: missing %s', !apiKey ? 'RESEND_API_KEY' : 'RESEND_WAITLIST_AUDIENCE_ID')
    return 'unconfigured'
  }

  const properties: Record<string, string> = {}
  if (signup.dropId) properties.drop_id = signup.dropId
  if (signup.productSlug) properties.product_slug = signup.productSlug

  try {
    const { Resend } = await import('resend')
    const client = new Resend(apiKey)
    const { error } = await client.contacts.create({
      audienceId,
      email: signup.email,
      unsubscribed: false,
      ...(Object.keys(properties).length > 0 ? { properties } : {}),
    })
    if (!error) return 'added'
    // Signing up twice is not an error for the visitor: they are on the list.
    if (/already exist/i.test(error.message)) return 'added'
    console.error('[Waitlist] Resend rejected the contact:', error.name, error.message)
    return 'failed'
  } catch (err) {
    console.error('[Waitlist] Resend request failed:', err)
    return 'failed'
  }
}
```

- [ ] **Step 5: Implementeer de route**

`app/api/waitlist/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { clientIp, createRateLimiter, parseWaitlistBody } from '@/lib/waitlist'
import { addWaitlistContact } from '@/lib/waitlist-resend'

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 })

export async function POST(req: NextRequest) {
  if (!limiter.check(clientIp(req.headers))) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = parseWaitlistBody(body)
  // A bot that filled the honeypot gets the same answer as a person, so it learns nothing.
  if (!parsed.ok && parsed.reason === 'honeypot') return NextResponse.json({ ok: true })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = await addWaitlistContact(parsed.signup)
  if (result === 'unconfigured') {
    return NextResponse.json({ error: 'The waitlist is not open right now.' }, { status: 503 })
  }
  if (result === 'failed') {
    return NextResponse.json({ error: 'Could not join the waitlist. Please try again.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Implementeer WaitlistForm**

`components/ui/WaitlistForm/WaitlistForm.tsx`:

```tsx
'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button/Button'
import { HONEYPOT_FIELD } from '@/lib/waitlist'
import styles from './WaitlistForm.module.css'

export interface WaitlistFormProps {
  dropId?: string
  productSlug?: string
  compact?: boolean
}

type Status = 'idle' | 'sending' | 'done' | 'error'

/** Email signup for a drop or product. Colours follow the surrounding surface. */
export default function WaitlistForm({ dropId, productSlug, compact = false }: WaitlistFormProps) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  // Flips synchronously, before React re-renders the disabled button, so a
  // second click or Enter during the request is ignored.
  const inFlight = useRef(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || status === 'done') return
    inFlight.current = true
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dropId, productSlug, [HONEYPOT_FIELD]: trap }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        setStatus('done')
        setMessage("You're on the list. We'll email you when it drops.")
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Could not join the waitlist. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    } finally {
      inFlight.current = false
    }
  }

  return (
    <form className={styles.form} data-compact={compact ? 'true' : 'false'} onSubmit={onSubmit}>
      <label htmlFor={`${id}-email`} className={styles.label}>
        {compact ? 'Email for drop alerts' : 'Get notified when it drops'}
      </label>
      <div className={styles.row}>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'done'}
          aria-describedby={`${id}-status`}
          aria-invalid={status === 'error' ? true : undefined}
        />
        <Button type="submit" variant="accent" loading={status === 'sending'} disabled={status === 'done'}>
          Notify me
        </Button>
      </div>
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-trap`}>Company</label>
        <input
          id={`${id}-trap`}
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>
      <p id={`${id}-status`} className={styles.status} role="status" aria-live="polite" data-status={status}>
        {message}
      </p>
    </form>
  )
}
```

`components/ui/WaitlistForm/WaitlistForm.module.css`:

```css
.form {
  display: grid;
  gap: var(--s-2);
  width: 100%;
  color: inherit;
}

.label {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.input {
  flex: 1 1 220px;
  min-width: 0;
  min-height: 44px;
  padding: 0 var(--s-3);
  border: 1px solid currentColor;
  border-radius: var(--r-1);
  background: transparent;
  color: inherit;
  font-family: var(--f-body);
  font-size: var(--fs-body);
}

.input::placeholder {
  color: inherit;
  opacity: 0.7;
}

.input:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.input[aria-invalid='true'] {
  border-width: 2px;
}

.form[data-compact='true'] .row {
  flex-direction: column;
}

/* Off-screen, not display:none: some bots skip hidden inputs. */
.trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.status {
  min-height: 1.5em;
  margin: 0;
  font-family: var(--f-body);
  font-size: var(--fs-small);
  line-height: 1.5;
}
```

- [ ] **Step 7: Drop alerts in de footer**

In `components/ui/SiteFooter/SiteFooter.tsx` voeg de import toe:

```tsx
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
```

en voeg direct na de `<nav className={styles.col} aria-label="Footer help">...</nav>` (vóór de sluitende `</div>` van `.grid`) toe:

```tsx
        <div className={styles.col}>
          <p className={styles.colTitle}>Drop alerts</p>
          <WaitlistForm compact />
        </div>
```

In `components/ui/SiteFooter/SiteFooter.module.css` vervang in `@media (min-width: 768px)` de regel `grid-template-columns: 2fr 1fr 1fr;` door:

```css
    grid-template-columns: 2fr 1fr 1fr 2fr;
```

- [ ] **Step 8: Run de tests, verwacht slagen**

Run: `npm test -- (lib/waitlist|api/waitlist|WaitlistForm|SiteFooter)`
Expected: PASS. Geen echte Resend-call: `resend` en `lib/waitlist-resend` zijn gemockt.

- [ ] **Step 9: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Lokaal zonder `RESEND_WAITLIST_AUDIENCE_ID` geeft het formulier in de footer "The waitlist is not open right now." (503); dat is verwacht.

- [ ] **Step 10: Commit**

```bash
git add lib/waitlist.ts lib/waitlist.test.ts lib/waitlist-resend.ts lib/waitlist-resend.test.ts app/api/waitlist components/ui/WaitlistForm components/ui/SiteFooter
git commit -m "feat: add drop waitlist via a Resend audience"
```

---

### Task 16: Countdown en DropBlock

**Files:**
- Create: `components/ui/Countdown/Countdown.tsx`, `components/ui/Countdown/Countdown.module.css`
- Test: `components/ui/Countdown/Countdown.test.tsx`
- Create: `components/ui/DropBlock/DropBlock.tsx`, `components/ui/DropBlock/DropBlock.module.css`
- Test: `components/ui/DropBlock/DropBlock.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` (`router.refresh()` haalt de server-render opnieuw op zonder de clientstate te verliezen).

**Interfaces:**
- Consumes: `DropView`, `NEW_IN_MS`, `formatDropDate` (Task 6); `WaitlistForm` (Task 15); `Badge`, `buttonClasses` (Task 2).
- Produces:
  - `export interface CountdownProps { target: string; label?: string }` (`label` is de server-geformatteerde datum, zodat server- en client-render dezelfde tekst hebben); `export function splitRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number }`
  - `export interface DropBlockProps { drop: DropView; now: number; as?: 'h1' | 'h2'; withIntro?: boolean; withLink?: boolean }`

De klok rendert op de server `--` in elk vak plus de datum als tekst; na mount telt hij per seconde. De cijfers zijn `aria-hidden` (geen aria-live-geratel); de statische datum met tijdzone is het tekstalternatief (spec sectie 9). Op nul roept hij één keer `router.refresh()`, zodat een pagina die vóór de release is gerenderd de live-versie ophaalt.

- [ ] **Step 1: Schrijf de falende tests**

`components/ui/Countdown/Countdown.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import Countdown, { splitRemaining } from './Countdown'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const TARGET = '2026-11-01T12:00:00+01:00'
const refresh = jest.fn()

function digits(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.value')).map((el) => el.textContent ?? '')
}

beforeEach(() => {
  jest.useFakeTimers()
  refresh.mockReset()
  jest.mocked(useRouter).mockReturnValue({ refresh } as unknown as ReturnType<typeof useRouter>)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('splitRemaining', () => {
  it('splits milliseconds into days, hours, minutes and seconds', () => {
    expect(splitRemaining(90_061_000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
  })
  it('never goes below zero', () => {
    expect(splitRemaining(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('Countdown', () => {
  it('always carries the date, time and zone as text', () => {
    jest.setSystemTime(new Date('2026-10-31T11:00:00Z'))
    render(<Countdown target={TARGET} />)
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toHaveAttribute('datetime', TARGET)
  })

  it('prefers the label the server formatted', () => {
    jest.setSystemTime(new Date('2026-10-31T11:00:00Z'))
    render(<Countdown target={TARGET} label="1 November 2026 at 12:00 CET (server)" />)
    expect(screen.getByText('1 November 2026 at 12:00 CET (server)')).toBeInTheDocument()
  })

  it('keeps the ticking digits away from screen readers', () => {
    jest.setSystemTime(new Date('2026-10-31T11:00:00Z'))
    const { container } = render(<Countdown target={TARGET} />)
    const clock = container.querySelector('.clock')
    expect(clock).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[aria-live]')).toBeNull()
  })

  it('counts down every second', () => {
    jest.setSystemTime(new Date('2026-11-01T10:59:57Z'))
    const { container } = render(<Countdown target={TARGET} />)
    expect(digits(container)).toEqual(['00', '00', '00', '03'])
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(digits(container)).toEqual(['00', '00', '00', '02'])
  })

  it('shows Live now at the release second and refreshes the page exactly once', () => {
    jest.setSystemTime(new Date('2026-11-01T10:59:59Z'))
    render(<Countdown target={TARGET} />)
    expect(screen.queryByText('Live now')).toBeNull()
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText('Live now')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
```

`components/ui/DropBlock/DropBlock.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import DropBlock from './DropBlock'
import { getDrop, toDropView, type Drop } from '@/lib/drops'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const sport = getDrop('olympn-sport') as Drop
const olympian = getDrop('olympian') as Drop
const BEFORE = Date.parse('2026-10-14T10:00:00Z')
const AFTER = Date.parse('2026-11-02T10:00:00Z')

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ refresh: jest.fn() } as unknown as ReturnType<typeof useRouter>)
})

describe('DropBlock', () => {
  it('shows edition, title, countdown and waitlist before the release', () => {
    render(<DropBlock drop={toDropView(sport, BEFORE)} now={BEFORE} />)
    expect(screen.getByText('Edition 02')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('Something is coming.')).toBeInTheDocument()
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Shop the drop' })).toBeNull()
  })

  it('shows Live now and a link to the drop once it is out', () => {
    render(<DropBlock drop={toDropView(sport, AFTER)} now={AFTER} />)
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(screen.getByText('New in')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop the drop' })).toHaveAttribute('href', '/collections/olympn-sport')
    expect(screen.queryByText('Something is coming.')).toBeNull()
  })

  it('drops the New in badge once the drop is older than 30 days', () => {
    render(<DropBlock drop={toDropView(olympian, AFTER)} now={AFTER} />)
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(screen.queryByText('New in')).toBeNull()
  })

  it('can be the page heading with the intro and without the self-link', () => {
    render(<DropBlock drop={toDropView(olympian, AFTER)} now={AFTER} as="h1" withIntro withLink={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Olympian' })).toBeInTheDocument()
    expect(screen.getByText(olympian.intro)).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('carries the tone for the stylesheet', () => {
    const { container } = render(<DropBlock drop={toDropView(sport, BEFORE)} now={BEFORE} />)
    expect(container.querySelector('section')).toHaveAttribute('data-tone', 'dark')
  })

  it('says a closed edition is closed', () => {
    const closed: Drop = { ...olympian, window: { startsAt: olympian.window.startsAt, endsAt: '2026-09-01T00:00:00+02:00' } }
    render(<DropBlock drop={toDropView(closed, AFTER)} now={AFTER} />)
    expect(screen.getByText('Released 19 June 2026. This edition is closed.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (Countdown|DropBlock)`
Expected: FAIL, `Cannot find module './Countdown'` en `'./DropBlock'`.

- [ ] **Step 3: Implementeer Countdown**

`components/ui/Countdown/Countdown.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { formatDropDate } from '@/lib/drops'
import styles from './Countdown.module.css'

export interface CountdownProps {
  /** ISO 8601 with offset, e.g. "2026-11-01T12:00:00+01:00". */
  target: string
  /** The date as the server formatted it, so server and client render the same text. */
  label?: string
}

export function splitRemaining(ms: number): { days: number; hours: number; minutes: number; seconds: number } {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function Countdown({ target, label }: CountdownProps) {
  const router = useRouter()
  const targetMs = Date.parse(target)
  // Null on the server and in the first client render: the time is only
  // known in the browser, and the placeholders keep both renders equal.
  const [now, setNow] = useState<number | null>(null)
  const refreshed = useRef(false)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const remaining = now === null ? null : targetMs - now
  const done = remaining !== null && remaining <= 0

  useEffect(() => {
    // The page was rendered before the release: fetch the live version once.
    if (done && !refreshed.current) {
      refreshed.current = true
      router.refresh()
    }
  }, [done, router])

  const parts = remaining === null ? null : splitRemaining(remaining)
  const units: [string, number | undefined][] = [
    ['Days', parts?.days],
    ['Hrs', parts?.hours],
    ['Min', parts?.minutes],
    ['Sec', parts?.seconds],
  ]

  return (
    <div className={styles.countdown}>
      <p className={styles.date}>
        Drops <time dateTime={target}>{label ?? formatDropDate(target)}</time>
      </p>
      <div className={styles.clock} aria-hidden="true">
        {units.map(([unit, value]) => (
          <div key={unit} className={styles.unit}>
            <span className={styles.value}>{value === undefined ? '--' : pad(value)}</span>
            <span className={styles.unitLabel}>{unit}</span>
          </div>
        ))}
      </div>
      {done && <p className={styles.live}>Live now</p>}
    </div>
  )
}
```

`components/ui/Countdown/Countdown.module.css`:

```css
.countdown {
  display: grid;
  gap: var(--s-3);
}

.date {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.clock {
  display: flex;
  gap: var(--s-4);
}

.unit {
  display: grid;
  justify-items: start;
  gap: var(--s-1);
  min-width: 3ch;
}

.value {
  font-family: var(--f-mono);
  font-size: var(--fs-h1);
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.unitLabel {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Orange digits only on navy (spec section 2: never orange text on cream). */
:global([data-tone='dark']) .value {
  color: var(--c-live);
}

.live {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Implementeer DropBlock**

`components/ui/DropBlock/DropBlock.tsx`:

```tsx
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import { buttonClasses } from '@/components/ui/Button/Button'
import Countdown from '@/components/ui/Countdown/Countdown'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
import { NEW_IN_MS, type DropView } from '@/lib/drops'
import styles from './DropBlock.module.css'

export interface DropBlockProps {
  drop: DropView
  /** Server time of this render, for the New in badge. */
  now: number
  /** h1 on a landing whose main subject is the drop. */
  as?: 'h1' | 'h2'
  withIntro?: boolean
  /** Hide "Shop the drop" on the collection page itself. */
  withLink?: boolean
}

/** Edition, title and the drop state: countdown and waitlist, or Live now. */
export default function DropBlock({ drop, now, as: Heading = 'h2', withIntro = false, withLink = true }: DropBlockProps) {
  const titleId = `drop-${drop.id}-title`
  const isNew = drop.status === 'live' && now - Date.parse(drop.startsAt) < NEW_IN_MS

  return (
    <section className={styles.block} data-tone={drop.tone} aria-labelledby={titleId}>
      <div className={styles.inner}>
        <p className={styles.edition}>{drop.editionLabel}</p>
        <Heading id={titleId} className={styles.title}>{drop.title}</Heading>
        {withIntro && <p className={styles.intro}>{drop.intro}</p>}

        {drop.status === 'upcoming' && (
          <div className={styles.state}>
            <p className={styles.teaser}>Something is coming.</p>
            <Countdown target={drop.startsAt} label={drop.startsAtLabel} />
            {drop.waitlist && <WaitlistForm dropId={drop.id} />}
          </div>
        )}

        {drop.status === 'live' && (
          <div className={styles.state}>
            <p className={styles.live}>
              <span className={styles.dot} aria-hidden="true" />
              Live now
              {isNew && <Badge kind="new" />}
            </p>
            {withLink && (
              <Link href={drop.href} className={buttonClasses('accent', 'lg')}>
                Shop the drop
              </Link>
            )}
          </div>
        )}

        {drop.status === 'closed' && (
          <p className={styles.closed}>Released {drop.startsOnLabel}. This edition is closed.</p>
        )}
      </div>
    </section>
  )
}
```

`components/ui/DropBlock/DropBlock.module.css`:

```css
.block {
  background: var(--c-bg);
  color: var(--c-text);
}

.block[data-tone='dark'] {
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
}

.block[data-tone='dark'] :focus-visible {
  outline-color: var(--c-inverse-text);
}

.inner {
  display: grid;
  justify-items: start;
  gap: var(--s-4);
  max-width: var(--l-max);
  margin: 0 auto;
  padding: var(--s-8) var(--l-gutter);
}

.edition,
.teaser,
.live {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-display);
  font-style: italic;
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

/* Large periwinkle headings on navy (spec section 2). */
.block[data-tone='dark'] .title {
  color: var(--c-accent);
}

.intro {
  max-width: var(--l-text-max);
  margin: 0;
  font-family: var(--f-body);
  font-size: var(--fs-body);
  line-height: 1.5;
}

.state {
  display: grid;
  justify-items: start;
  gap: var(--s-5);
  width: 100%;
  max-width: 560px;
  margin-top: var(--s-4);
}

.live {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}

/* Orange text only on navy; on cream the dot carries the colour. */
.block[data-tone='dark'] .live {
  color: var(--c-live);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-live);
}

.closed {
  margin: 0;
  font-family: var(--f-body);
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (Countdown|DropBlock)`
Expected: PASS, 13 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add components/ui/Countdown components/ui/DropBlock
git commit -m "feat: add Countdown and DropBlock"
```

---

### Task 17: Collectiepagina's en Archive

**Files:**
- Create: `components/ui/EditionCard/EditionCard.tsx`, `components/ui/EditionCard/EditionCard.module.css`
- Test: `components/ui/EditionCard/EditionCard.test.tsx`
- Create: `app/collections/[slug]/page.tsx`, `app/collections/[slug]/collection.module.css`
- Test: `app/collections/[slug]/page.test.tsx`
- Create: `app/archive/page.tsx`, `app/archive/archive.module.css`
- Test: `app/archive/page.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` (vooraf renderen per slug), `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md` (`notFound()` gooit en is `never`), `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md` (`export const revalidate`).

**Interfaces:**
- Consumes: `DropBlock` (Task 16); `ShopView` (Task 14); `toTiles` (Task 11); `getShopProducts`, `ShopProduct` (Task 7); `DROPS`, `getDropBySlug`, `isDropListed`, `toDropView`, `listDropsNewestFirst`, `formatEdition`, `currentTimeMs`, `DropView` (Task 6); `isPreviewSession` (Task 6); `Badge` (Task 2).
- Produces:
  - `export default function EditionCard({ drop }: { drop: DropView })`
  - Routes `/collections/olympian`, `/collections/olympn-sport` (statisch per slug, `revalidate = 60`), `/archive` (`revalidate = 60`). Een onbekende slug of een upcoming drop zonder teaser geeft 404.

Zonder sync-producten (OLYMPN Sport vóór "Add to store") toont de landing de acht lineup-mockups; zodra er producten zijn, het grid met `GridDensityToggle` (spec sectie 4 en 5). `revalidate = 60` plus de `router.refresh()` van de klok zorgen dat de release zonder deploy kantelt.

- [ ] **Step 1: Schrijf de falende tests**

`components/ui/EditionCard/EditionCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import EditionCard from './EditionCard'
import { getDrop, toDropView, type Drop } from '@/lib/drops'

const sport = getDrop('olympn-sport') as Drop
const olympian = getDrop('olympian') as Drop
const BEFORE = Date.parse('2026-10-14T10:00:00Z')

describe('EditionCard', () => {
  it('shows edition, title, release window and status, linking to the collection', () => {
    render(<EditionCard drop={toDropView(sport, BEFORE)} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/collections/olympn-sport')
    expect(screen.getByText('Edition 02')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('shows a released edition as live', () => {
    render(<EditionCard drop={toDropView(olympian, BEFORE)} />)
    expect(screen.getByText('Released 19 June 2026')).toBeInTheDocument()
    expect(screen.getByText('Live now')).toBeInTheDocument()
  })

  it('shows a strip of four images from the line-up', () => {
    const { container } = render(<EditionCard drop={toDropView(sport, BEFORE)} />)
    expect(container.querySelectorAll('img')).toHaveLength(4)
  })
})
```

`app/collections/[slug]/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS } from '@/lib/drops'
import type { TileProduct } from '@/lib/tiles'
import CollectionPage, { generateMetadata, generateStaticParams } from './page'

const mockGetShopProducts = jest.fn()
const mockToTiles = jest.fn()
const mockIsPreviewSession = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))
jest.mock('../../../lib/catalog', () => ({ getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args) }))
jest.mock('../../../lib/tiles', () => ({ toTiles: (...args: unknown[]) => mockToTiles(...args) }))
jest.mock('../../../lib/preview-session', () => ({ isPreviewSession: () => mockIsPreviewSession() }))

const [olympian, sport] = DROPS
const BEFORE = Date.parse('2026-10-14T10:00:00Z')

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

function product(id: string, name: string, drop = olympian): ShopProduct {
  return {
    provider: 'printful', id, name, slug: id, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status: 'live', purchasable: true, soldOut: false,
  }
}

const TILE: TileProduct = {
  slug: 'olympian-tee-sand-unisex', href: '/shop/olympian-tee-sand-unisex', name: 'Olympian Tee Sand Unisex',
  image: '/olympian/olympian-wheat-model.jpg', imageAlt: 'Olympian Tee Sand Unisex', price: '€34.95', badges: [], note: null,
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE)
  jest.mocked(useRouter).mockReturnValue({ refresh: jest.fn(), push: jest.fn() } as unknown as ReturnType<typeof useRouter>)
  mockIsPreviewSession.mockReset().mockResolvedValue(false)
  mockGetShopProducts.mockReset().mockResolvedValue([])
  mockToTiles.mockReset().mockResolvedValue([])
})

afterEach(() => jest.restoreAllMocks())

describe('/collections/[slug]', () => {
  it('pre-renders one page per drop', () => {
    expect(generateStaticParams()).toEqual([{ slug: 'olympian' }, { slug: 'olympn-sport' }])
  })

  it('gives every collection its own title and canonical', async () => {
    const meta = await generateMetadata(params('olympn-sport'))
    expect(meta.title).toBe('OLYMPN Sport · Edition 02')
    expect(meta.description).toBe(sport.intro)
    expect(meta.alternates?.canonical).toBe('/collections/olympn-sport')
  })

  it('is a 404 for a slug that is not a drop', async () => {
    await expect(CollectionPage(params('og'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('shows the countdown, the waitlist and the line-up of a teaser drop without products', async () => {
    render(await CollectionPage(params('olympn-sport')))
    expect(screen.getByRole('heading', { level: 1, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: /OLYMPN Sport line-up/ })).toHaveLength(8)
  })

  it('shows the grid of the drop, and only that drop, once it has products', async () => {
    mockGetShopProducts.mockResolvedValue([product('1', 'Olympian Tee Sand Unisex'), product('2', 'OLYMPN Sport Oversized Hoodie Mocha', sport)])
    mockToTiles.mockResolvedValue([TILE])
    render(await CollectionPage(params('olympian')))
    expect(mockToTiles.mock.calls[0][0].map((p: ShopProduct) => p.drop.id)).toEqual(['olympian'])
    expect(screen.getByRole('link', { name: /Olympian Tee Sand Unisex/ })).toHaveAttribute('href', '/shop/olympian-tee-sand-unisex')
    expect(screen.getByRole('radiogroup', { name: 'Products per row' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /line-up/ })).toBeNull()
  })

  it('treats the drop as live in preview', async () => {
    mockIsPreviewSession.mockResolvedValue(true)
    render(await CollectionPage(params('olympn-sport')))
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(mockGetShopProducts).toHaveBeenCalledWith(BEFORE, { preview: true })
  })
})
```

`app/archive/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import ArchivePage from './page'

const mockIsPreviewSession = jest.fn()
jest.mock('../../lib/preview-session', () => ({ isPreviewSession: () => mockIsPreviewSession() }))

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-14T10:00:00Z'))
  mockIsPreviewSession.mockReset().mockResolvedValue(false)
})

afterEach(() => jest.restoreAllMocks())

describe('/archive', () => {
  it('lists every edition, newest first, each linking to its collection', async () => {
    render(await ArchivePage())
    expect(screen.getByRole('heading', { level: 1, name: 'Every edition' })).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['OLYMPN Sport', 'Olympian'])
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/collections/olympn-sport', '/collections/olympian'])
  })

  it('never lists the OG range, which is not an edition', async () => {
    render(await ArchivePage())
    expect(screen.queryByText(/\bOG\b/)).toBeNull()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (EditionCard|collections|archive)`
Expected: FAIL, `Cannot find module './EditionCard'` en `'./page'`.

- [ ] **Step 3: Implementeer EditionCard**

`components/ui/EditionCard/EditionCard.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import Badge from '@/components/ui/Badge/Badge'
import type { DropView } from '@/lib/drops'
import styles from './EditionCard.module.css'

function windowLabel(drop: DropView): string {
  if (drop.status === 'upcoming') return `Drops ${drop.startsAtLabel}`
  if (drop.status === 'closed') return `Released ${drop.startsOnLabel}, now closed`
  return `Released ${drop.startsOnLabel}`
}

/** One archive row: edition, title, window, status and an image strip. */
export default function EditionCard({ drop }: { drop: DropView }) {
  return (
    <article className={styles.card} data-tone={drop.tone}>
      <Link href={drop.href} className={styles.link}>
        <div className={styles.head}>
          <Badge kind="edition">{drop.editionLabel}</Badge>
          <h2 className={styles.title}>{drop.title}</h2>
          <p className={styles.window}>{windowLabel(drop)}</p>
          <div className={styles.status}>
            {drop.status === 'upcoming' ? <Badge kind="coming" /> : <span>{drop.status === 'live' ? 'Live now' : 'Closed'}</span>}
          </div>
        </div>
        <ul className={styles.strip} aria-hidden="true">
          {drop.hero.lineup.slice(0, 4).map((src) => (
            <li key={src} className={styles.frame}>
              <Image src={src} alt="" fill sizes="(min-width: 768px) 15vw, 25vw" className={styles.image} />
            </li>
          ))}
        </ul>
      </Link>
    </article>
  )
}
```

`components/ui/EditionCard/EditionCard.module.css`:

```css
.card {
  border-top: 1px solid var(--c-stone);
  background: var(--c-bg);
  color: var(--c-text);
}

.card[data-tone='dark'] {
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
}

.link {
  display: grid;
  gap: var(--s-5);
  padding: var(--s-6) var(--l-gutter);
  color: inherit;
  text-decoration: none;
}

.link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -4px;
}

.head {
  display: grid;
  justify-items: start;
  gap: var(--s-2);
}

.title {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h1);
  font-style: italic;
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.card[data-tone='dark'] .title {
  color: var(--c-accent);
}

.window,
.status {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--l-grid-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.frame {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--c-surface);
}

.image {
  object-fit: contain;
}

@media (min-width: 768px) {
  .link {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: end;
  }
}
```

- [ ] **Step 4: Implementeer `/collections/[slug]`**

`app/collections/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import DropBlock from '@/components/ui/DropBlock/DropBlock'
import ShopView from '@/components/ui/ShopView/ShopView'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { DROPS, currentTimeMs, formatEdition, getDropBySlug, isDropListed, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { toTiles } from '@/lib/tiles'
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
import styles from './collection.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

// The drop clock decides what this page shows. Re-render at least every
// minute so a release flips without a deploy; the countdown also refreshes
// the page itself when it reaches zero.
export const revalidate = 60

export function generateStaticParams() {
  return DROPS.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const drop = getDropBySlug(slug)
  if (!drop) return { title: 'Collection not found' }
  const title = `${drop.title} · ${formatEdition(drop.edition)}`
  const url = `/collections/${drop.slug}`
  return {
    title,
    description: drop.intro,
    alternates: { canonical: url },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description: drop.intro, url: absoluteUrl(url), type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · 7ENO (Zeno)`, description: drop.intro },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const drop = getDropBySlug(slug)
  if (!drop) notFound()

  const now = currentTimeMs()
  const preview = await isPreviewSession()
  // A drop without a teaser stays fully hidden until its release (spec section 4).
  if (!isDropListed(drop, now, { preview })) notFound()

  const view = toDropView(drop, now, { preview })
  let products: ShopProduct[] = []
  try {
    products = (await getShopProducts(now, { preview })).filter((p) => p.drop.id === drop.id)
  } catch (err) {
    console.error('[Collection] getShopProducts failed:', err)
  }
  const tiles = await toTiles(products, now)

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: drop.title, path: `/collections/${drop.slug}` },
  ])

  return (
    <main className={styles.page} data-tone={drop.tone}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <DropBlock drop={view} now={now} as="h1" withIntro withLink={false} />
      {tiles.length > 0 ? (
        <ShopView filters={[]} sort="featured" sortOptions={[]} tiles={tiles} />
      ) : (
        <section className={styles.lineup} aria-label={`${drop.title} line-up`}>
          <ul className={styles.lineupGrid}>
            {drop.hero.lineup.map((src, i) => (
              <li key={src} className={styles.lineupItem}>
                <Image
                  src={src}
                  alt={`${drop.title} line-up, piece ${i + 1} of ${drop.hero.lineup.length}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  loading={i < 4 ? 'eager' : 'lazy'}
                  className={styles.lineupImage}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
```

`app/collections/[slug]/collection.module.css`:

```css
.page {
  min-height: 100vh;
  padding-top: var(--l-chrome);
  background: var(--c-bg);
  color: var(--c-text);
}

.page[data-tone='dark'] {
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
}

.lineup {
  max-width: var(--l-max);
  margin: 0 auto;
  padding-bottom: var(--s-9);
}

.lineupGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--l-grid-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.lineupItem {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--c-surface);
}

.lineupImage {
  object-fit: contain;
}

@media (min-width: 768px) {
  .lineupGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

- [ ] **Step 5: Implementeer `/archive`**

`app/archive/page.tsx`:

```tsx
import type { Metadata } from 'next'
import EditionCard from '@/components/ui/EditionCard/EditionCard'
import { currentTimeMs, isDropListed, listDropsNewestFirst, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { absoluteUrl } from '@/lib/seo'
import styles from './archive.module.css'

const DESCRIPTION =
  'Every 7ENO (Zeno) edition, newest first: release window, status and the pieces of each drop.'

export const metadata: Metadata = {
  title: 'Archive',
  description: DESCRIPTION,
  alternates: { canonical: '/archive' },
  openGraph: { title: 'Archive · 7ENO (Zeno)', description: DESCRIPTION, url: absoluteUrl('/archive'), type: 'website' },
}

// Status labels follow the drop clock.
export const revalidate = 60

export default async function ArchivePage() {
  const now = currentTimeMs()
  const preview = await isPreviewSession()
  // Closed editions stay listed; only an upcoming drop without a teaser is hidden.
  const editions = listDropsNewestFirst()
    .filter((d) => isDropListed(d, now, { preview }))
    .map((d) => toDropView(d, now, { preview }))

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.label}>Archive</p>
        <h1 className={styles.title}>Every edition</h1>
      </header>
      <ol className={styles.list}>
        {editions.map((drop) => (
          <li key={drop.id}>
            <EditionCard drop={drop} />
          </li>
        ))}
      </ol>
    </main>
  )
}
```

`app/archive/archive.module.css`:

```css
.page {
  min-height: 100vh;
  padding-top: var(--l-chrome);
  background: var(--c-bg);
  color: var(--c-text);
}

.header {
  max-width: var(--l-max);
  margin: 0 auto;
  padding: var(--s-7) var(--l-gutter) var(--s-6);
}

.label {
  margin: 0 0 var(--s-2);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.title {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h1);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.list {
  max-width: var(--l-max);
  margin: 0 auto;
  padding: 0 0 var(--s-9);
  list-style: none;
}
```

- [ ] **Step 6: Run de tests, verwacht slagen**

Run: `npm test -- (EditionCard|collections|archive)`
Expected: PASS, 11 tests.

- [ ] **Step 7: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; de build-output toont `/collections/olympian`, `/collections/olympn-sport` (SSG, revalidate 1m) en `/archive`. `npm run dev`: `/collections/olympn-sport` is navy met periwinkle cursieve titel, oranje klokcijfers, waitlist en de acht mockups; `/collections/olympian` crème met het Olympian-grid; `/archive` toont twee edities, OLYMPN Sport eerst. Met `?preview=<SITE_PREVIEW_KEY>` (lokaal in `.env.local` zetten) toont OLYMPN Sport "Live now"; `?preview=off` zet het terug. Navigatielinks in de header werken nu allemaal.

- [ ] **Step 8: Commit**

```bash
git add components/ui/EditionCard app/collections app/archive
git commit -m "feat: add collection landings and the archive"
```

---

### Task 18: Home-hero met de volgende drop en de teaser-PDP

**Files:**
- Modify: `app/page.tsx:1-309` (volledig vervangen; Task 7 had regel 4 en 118-124 al aangepast)
- Modify: `app/page.module.css` (volledig vervangen)
- Test: `app/page.test.tsx`
- Modify: `app/shop/[slug]/page.tsx` (na Task 7: drops-import, `revalidate`, metadata regel 35-38, `collectionName` regel 212, `offers` regel 245, breadcrumb regel 268, `ProductDetail`-props regel 299)
- Test: `app/shop/[slug]/page.test.tsx`
- Modify: `app/shop/[slug]/ProductDetail.tsx:3-13` (imports), `:55` (props), `:75` (defaults), `:336-337` (maten), `:363-374` (CTA)
- Modify: `app/shop/[slug]/detail.module.css:569` (twee klassen erachter)
- Test: `app/shop/[slug]/ProductDetail.test.tsx` (één test erbij)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:551-575` (`robots: { index, follow, googleBot }`; een pagina-`robots` vervangt het object uit de layout volledig).

**Interfaces:**
- Consumes: `DropBlock` (Task 16); `ProductTile`, `toTiles` (Task 11); `WaitlistForm` (Task 15); `Badge` (Task 2); `getShopProducts`, `ShopProduct`, `findBySlug` (Task 7); `getNextDrop`, `listDropsNewestFirst`, `isDropListed`, `toDropView`, `formatDropDate`, `currentTimeMs` (Task 6); `isPreviewSession` (Task 6); `productSlug` (`lib/slug.ts`).
- Produces:
  - Home: hero = `DropBlock` van `getNextDrop`, daarna per gelijste drop een rij van vier tegels (of vier lineup-mockups zolang de drop geen producten heeft). Het hardcoded lookbook, de categoriestrook, de quick-add-carousel en de deals-band verdwijnen.
  - `ProductDetail` krijgt `purchasable?: boolean` (default `true`) en `releaseLabel?: string`; bij `purchasable={false}` geen maatkeuze en geen koopknop, wel "Coming soon", de releasedatum en `WaitlistForm` met `productSlug`.
  - Teaser-PDP: `robots: { index: false, follow: true }`, geen `offers` in de Product-JSON-LD; breadcrumb en beschrijving noemen de drop.

De volledige home (Olympian-fotoband, waitlist-strook, video) en de volledige PDP-ombouw zijn fase 4 en fase 3.

- [ ] **Step 1: Schrijf de falende tests**

`app/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS } from '@/lib/drops'
import type { TileProduct } from '@/lib/tiles'
import HomePage from './page'

const mockGetShopProducts = jest.fn()
const mockIsPreviewSession = jest.fn()

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('../lib/catalog', () => ({ getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args) }))
jest.mock('../lib/preview-session', () => ({ isPreviewSession: () => mockIsPreviewSession() }))
jest.mock('../lib/tiles', () => ({
  toTiles: async (products: { slug: string; name: string }[]): Promise<TileProduct[]> =>
    products.map((p) => ({
      slug: p.slug, href: `/shop/${p.slug}`, name: p.name, image: null, imageAlt: p.name,
      price: '€34.95', badges: [], note: null,
    })),
}))

const [olympian] = DROPS
const BEFORE = Date.parse('2026-10-14T10:00:00Z')
const AFTER = Date.parse('2026-11-02T10:00:00Z')

function product(slug: string, name: string): ShopProduct {
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop: olympian, status: 'live', purchasable: true, soldOut: false,
  }
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(BEFORE)
  jest.mocked(useRouter).mockReturnValue({ refresh: jest.fn() } as unknown as ReturnType<typeof useRouter>)
  mockIsPreviewSession.mockReset().mockResolvedValue(false)
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('olympian-tee-ocean-unisex', 'Olympian Tee Ocean Unisex'),
    product('olympian-tee-sand-unisex', 'Olympian Tee Sand Unisex'),
  ])
})

afterEach(() => jest.restoreAllMocks())

describe('home', () => {
  it('leads with the next drop: countdown and waitlist before the release', async () => {
    render(await HomePage())
    expect(screen.getByRole('heading', { level: 1, name: 'OLYMPN Sport' })).toBeInTheDocument()
    expect(screen.getByText('1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
  })

  it('shows Shop the drop once it is live', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(AFTER)
    render(await HomePage())
    expect(screen.getByRole('link', { name: 'Shop the drop' })).toHaveAttribute('href', '/collections/olympn-sport')
  })

  it('has one row per edition, newest first, with tiles or the line-up', async () => {
    render(await HomePage())
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['OLYMPN Sport', 'Olympian'])
    expect(screen.getAllByRole('img', { name: /OLYMPN Sport line-up/ })).toHaveLength(4)
    expect(screen.getByRole('link', { name: /Olympian Tee Sand Unisex/ })).toHaveAttribute('href', '/shop/olympian-tee-sand-unisex')
    expect(screen.getAllByRole('link', { name: 'View the collection' }).map((a) => a.getAttribute('href'))).toEqual([
      '/collections/olympn-sport',
      '/collections/olympian',
    ])
  })

  it('no longer shows deals or the old lookbook', async () => {
    render(await HomePage())
    expect(screen.queryByText(/Deals/)).toBeNull()
    expect(document.querySelector('a[href^="/deals"]')).toBeNull()
  })

  it('treats the next drop as live in preview', async () => {
    mockIsPreviewSession.mockResolvedValue(true)
    render(await HomePage())
    expect(mockGetShopProducts).toHaveBeenCalledWith(BEFORE, { preview: true })
    expect(screen.getByRole('link', { name: 'Shop the drop' })).toBeInTheDocument()
  })
})
```

`app/shop/[slug]/page.test.tsx`:

```tsx
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop, type DropStatus } from '@/lib/drops'
import { generateMetadata } from './page'

const mockGetShopProducts = jest.fn()
jest.mock('../../../lib/catalog', () => ({
  ...jest.requireActual('../../../lib/catalog'),
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
}))
jest.mock('../../../lib/preview-session', () => ({ isPreviewSession: async () => false }))

const [olympian, sport] = DROPS

function product(name: string, slug: string, drop: Drop, status: DropStatus): ShopProduct {
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status, purchasable: status === 'live', soldOut: false,
  }
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

beforeEach(() => {
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('OLYMPN Sport Oversized Hoodie Mocha', 'olympn-sport-oversized-hoodie-mocha', sport, 'upcoming'),
    product('Olympian Tee Sand Unisex', 'olympian-tee-sand-unisex', olympian, 'live'),
  ])
})

describe('product page metadata', () => {
  it('keeps a teaser product page out of the index and names its drop', async () => {
    const meta = await generateMetadata(params('olympn-sport-oversized-hoodie-mocha'))
    expect(meta.robots).toEqual({ index: false, follow: true, googleBot: { index: false, follow: true } })
    expect(meta.description).toContain('OLYMPN Sport collection')
  })

  it('leaves a live product page indexable', async () => {
    const meta = await generateMetadata(params('olympian-tee-sand-unisex'))
    expect(meta.robots).toBeUndefined()
    expect(meta.description).toContain('Olympian collection')
  })
})
```

Voeg in `app/shop/[slug]/ProductDetail.test.tsx` onderaan toe:

```tsx
describe('ProductDetail teaser', () => {
  it('offers a waitlist instead of sizes and add-to-cart before the release', () => {
    render(
      <ProductDetail
        provider="printful"
        productId="p1"
        productName="OLYMPN Sport Oversized Hoodie Mocha"
        variants={twoColours}
        purchasable={false}
        releaseLabel="1 November 2026 at 12:00 CET"
      />
    )
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'M' })).toBeNull()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (app/page.test|slug\]/page|ProductDetail)`
Expected: FAIL: de home rendert nog de oude `Hero` en deals; de metadata heeft geen `robots`; `ProductDetail` kent `purchasable` niet.

- [ ] **Step 3: Vervang `app/page.tsx`**

```tsx
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import DropBlock from '@/components/ui/DropBlock/DropBlock'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import { currentTimeMs, getNextDrop, isDropListed, listDropsNewestFirst, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { absoluteUrl } from '@/lib/seo'
import { toTiles } from '@/lib/tiles'
import styles from './page.module.css'

const HOME_DESCRIPTION =
  '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the Olympian and OLYMPN Sport editions, with free shipping over €75 and 14-day returns.'

export const metadata: Metadata = {
  // `absolute` overrides the layout template: the homepage carries the full
  // brand phrase itself rather than the template suffix twice.
  title: { absolute: '7ENO (Zeno) · Premium Streetwear by Abra Entertainment' },
  description: HOME_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
    url: absoluteUrl('/'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '7ENO (Zeno) · Premium Streetwear',
    description: HOME_DESCRIPTION,
  },
}

// The hero follows the drop clock: re-render at least every minute, and the
// countdown refreshes the page itself at zero.
export const revalidate = 60

/** Tiles per drop row. */
const ROW_SIZE = 4

export default async function HomePage() {
  const now = currentTimeMs()
  const preview = await isPreviewSession()
  const next = getNextDrop(now, { preview })

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, { preview })
  } catch (err) {
    console.error('[Home] getShopProducts failed:', err)
  }

  const rows = await Promise.all(
    listDropsNewestFirst()
      .filter((drop) => isDropListed(drop, now, { preview }))
      .map(async (drop) => ({
        view: toDropView(drop, now, { preview }),
        tiles: await toTiles(products.filter((p) => p.drop.id === drop.id).slice(0, ROW_SIZE), now),
      }))
  )

  return (
    <main className={styles.page}>
      {next && <DropBlock drop={toDropView(next, now, { preview })} now={now} as="h1" withIntro />}

      {rows.map(({ view, tiles }, rowIndex) => (
        <section key={view.id} className={styles.row} aria-labelledby={`row-${view.id}`}>
          <div className={styles.rowHead}>
            <p className={styles.rowLabel}>{view.editionLabel}</p>
            <h2 id={`row-${view.id}`} className={styles.rowTitle}>{view.title}</h2>
            <Link href={view.href} className={styles.rowLink}>View the collection</Link>
          </div>
          <ul className={styles.rowGrid}>
            {tiles.length > 0
              ? tiles.map((tile) => (
                  <li key={tile.slug}>
                    <ProductTile product={tile} density={4} eager={rowIndex === 0} />
                  </li>
                ))
              : view.hero.lineup.slice(0, ROW_SIZE).map((src, i) => (
                  <li key={src} className={styles.lineupItem}>
                    <Image
                      src={src}
                      alt={`${view.title} line-up, piece ${i + 1}`}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      loading={rowIndex === 0 ? 'eager' : 'lazy'}
                      className={styles.lineupImage}
                    />
                  </li>
                ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
```

- [ ] **Step 4: Vervang `app/page.module.css`**

```css
.page {
  min-height: 100vh;
  padding-top: var(--l-chrome);
  padding-bottom: var(--s-9);
  background: var(--c-bg);
  color: var(--c-text);
}

.row {
  max-width: var(--l-max);
  margin: 0 auto;
  padding-top: var(--s-8);
}

.rowHead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2) var(--s-4);
  padding: 0 var(--l-gutter) var(--s-4);
}

.rowLabel {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.rowTitle {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-style: italic;
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.rowLink {
  margin-left: auto;
  font-family: var(--f-body);
  font-size: var(--fs-small);
  color: var(--c-accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.rowLink:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.rowGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--l-grid-gap);
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--c-stone);
}

.lineupItem {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--c-surface);
}

.lineupImage {
  object-fit: contain;
}

@media (min-width: 768px) {
  .rowGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

- [ ] **Step 5: Teaser-guard op de PDP-pagina**

In `app/shop/[slug]/page.tsx` (stand na Task 7):

Vervang `import { currentTimeMs } from '@/lib/drops'` door:

```ts
import { currentTimeMs, formatDropDate } from '@/lib/drops'
```

Voeg direct na het `interface Props { ... }`-blok toe:

```ts

// Teaser to live flips on the drop clock: re-render at least every minute.
export const revalidate = 60
```

Vervang in `generateMetadata` de regel `const collection = /olympian/i.test(match.name) ? 'Olympian' : 'OG'` en de `const description = ...`-regel direct eronder (oorspronkelijk regel 35-36) door:

```ts
  const collection = match.drop.title
  const description = `Buy the ${match.name} from the 7ENO (Zeno) ${collection} collection. Official streetwear by Abra Entertainment, with free shipping over €75 and 14-day returns.`
```

Voeg in hetzelfde `return`-object direct na `    title: match.name,` toe:

```ts
    // A teaser is not for sale yet: keep it out of the index until the release (spec section 4).
    ...(match.status === 'upcoming'
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
```

Vervang `const collectionName = /olympian/i.test(detail!.name) ? 'Olympian' : 'OG'` door:

```ts
  const collectionName = match.drop.title
```

Vervang in `productJsonLd`:

```ts
    ...(priceCents.length > 0
```

door:

```ts
    // No Offer for a teaser: it is not for sale yet (spec section 4).
    ...(match.purchasable && priceCents.length > 0
```

Vervang in `breadcrumbs`:

```ts
    { name: `${collectionName} collection`, path: `/shop?line=${collectionName.toLowerCase()}` },
```

door:

```ts
    { name: collectionName, path: `/collections/${match.drop.slug}` },
```

Voeg in de `<ProductDetail ... />`-props direct na `colorwaySiblings={colorwaySiblings}` toe:

```tsx
        purchasable={match.purchasable}
        releaseLabel={match.status === 'upcoming' ? formatDropDate(match.drop.window.startsAt) : undefined}
```

- [ ] **Step 6: Teaser-staat in `ProductDetail`**

In `app/shop/[slug]/ProductDetail.tsx` voeg na regel 12 (`import { FREE_SHIPPING_THRESHOLD, ... } from '@/lib/shipping'`) toe:

```tsx
import { productSlug } from '@/lib/slug'
import Badge from '@/components/ui/Badge/Badge'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
```

Voeg in `ProductDetailProps` na de regel `colorwaySiblings?: { name: string; hex: string; slug: string; current: boolean }[]` (regel 55) toe:

```tsx
  /** False for a teaser: no size picker or add-to-cart, a waitlist instead. Defaults to true. */
  purchasable?: boolean
  /** "1 November 2026 at 12:00 CET", shown on a teaser. */
  releaseLabel?: string
```

Vervang regel 75 (`  colorwaySiblings = [],`) door:

```tsx
  colorwaySiblings = [],
  purchasable = true,
  releaseLabel,
```

Vervang regel 336-337:

```tsx
        {/* Sizes */}
        {uniqueSizes.length > 1 && (
```

door:

```tsx
        {/* Sizes */}
        {purchasable && uniqueSizes.length > 1 && (
```

Vervang regel 363-374 (het CTA-blok):

```tsx
        {/* CTA */}
        <button
          className={[styles.addBtn, added ? styles.added : ''].join(' ')}
          onClick={handleAddToCart}
          disabled={!selectedVariantId && uniqueSizes.length > 1}
        >
          {added
            ? '✓ Added to cart'
            : !selectedVariantId && uniqueSizes.length > 1
            ? 'Select a size'
            : 'Add to cart'}
        </button>
```

door:

```tsx
        {/* CTA; a teaser gets the waitlist instead (spec section 4) */}
        {purchasable ? (
          <button
            className={[styles.addBtn, added ? styles.added : ''].join(' ')}
            onClick={handleAddToCart}
            disabled={!selectedVariantId && uniqueSizes.length > 1}
          >
            {added
              ? '✓ Added to cart'
              : !selectedVariantId && uniqueSizes.length > 1
              ? 'Select a size'
              : 'Add to cart'}
          </button>
        ) : (
          <div className={styles.comingSoon}>
            <Badge kind="coming" />
            {releaseLabel && <p className={styles.comingSoonDate}>Drops {releaseLabel}</p>}
            <WaitlistForm productSlug={productSlug(productName)} />
          </div>
        )}
```

Voeg onderaan `app/shop/[slug]/detail.module.css` (na regel 569) toe:

```css

/* v2 teaser state (new tokens only; the rest of this file is rebuilt in phase 3). */
.comingSoon {
  display: grid;
  justify-items: start;
  gap: var(--s-3);
  margin: var(--s-5) 0;
  padding: var(--s-5);
  border: 1px solid var(--c-stone);
  background: var(--c-surface);
  color: var(--c-text);
}

.comingSoonDate {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (app/page.test|slug\]/page|ProductDetail)`
Expected: PASS (de bestaande `ProductDetail`-tests blijven groen: `purchasable` staat standaard aan).

- [ ] **Step 8: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `git grep -n -E "components/Hero/Hero|BundleCover|ProductCarousel" -- app` geeft niets (de componenten zelf blijven tot fase 5). `npm run dev`: `/` toont de OLYMPN Sport-hero (navy, klok, waitlist) met daaronder de rijen OLYMPN Sport (mockups) en Olympian (tegels). Met de preview-cookie toont de hero "Live now" en "Shop the drop". Een teaser-PDP is pas te zien zodra Joep de templates in de store heeft gezet; controleer dan met preview uit: geen maatknoppen, wel de waitlist, `<meta name="robots" content="noindex, follow">` en geen `"offers"` in de JSON-LD (`curl -s http://localhost:3000/shop/<slug> | grep -c '"offers"'` geeft `0`).

- [ ] **Step 9: Commit**

```bash
git add app/page.tsx app/page.module.css app/page.test.tsx "app/shop/[slug]/page.tsx" "app/shop/[slug]/page.test.tsx" "app/shop/[slug]/ProductDetail.tsx" "app/shop/[slug]/ProductDetail.test.tsx" "app/shop/[slug]/detail.module.css"
git commit -m "feat: lead the home page with the next drop and guard teaser product pages"
```

---

### Checkpoint fase 2

- [ ] **Step 1: Hele branch groen**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 2: Push en controle op de Preview**

```bash
git push origin redesign/v2
```

Zet in Vercel (scope Preview) `RESEND_WAITLIST_AUDIENCE_ID` op de test-audience (spec sectie 7) en maak in Resend de contact-properties `drop_id` en `product_slug` aan. Controleer op de Preview-URL, op 1440 en 390 breed:

1. `/`: OLYMPN Sport-hero met klok (cijfers tellen, datum "1 November 2026 at 12:00 CET" als tekst), waitlist; rijen OLYMPN Sport (mockups) en Olympian (tegels).
2. Waitlist met een eigen testadres: "You're on the list."; het contact staat in de test-audience met `drop_id = olympn-sport`. Nog eens hetzelfde adres: weer "You're on the list.".
3. `/shop`: chips, sortering, griddichtheid 2/4 en 1/2 (blijft na herladen), sticky FilterBar onder de header, filterlade op mobiel met focus-trap en Esc.
4. `/collections/olympn-sport` (navy) en `/collections/olympian` (crème), `/archive` met twee edities.
5. `?preview=<SITE_PREVIEW_KEY>`: OLYMPN Sport "Live now"; `?preview=off` zet het terug.
6. Toetsenbord: skiplink, focusring overal zichtbaar (op navy crème), mobiel menu sluit met Esc.

Geen testbestelling: de checkout verandert pas in fase 3. Meld de bevindingen aan Joep; hij beslist over fase 3.

---

## Spec-dekking

| Spec | Taak |
|---|---|
| 2 Tokens, typografie, maatvoering, motion, reduced motion | 1 (tokens, fonts), 2 tot en met 5 (gebruik), 5 (announcement stil) |
| 2 Lenis en `PageTransition` vervallen | 1 |
| 3 Navigatie Shop, Olympian, OLYMPN Sport, Archive, About, account, cart | 4, 5 |
| 3 Redirects `/olympian`, `/deals*`, `/coming-soon`, `?line=` | 9 |
| 3 PDP zonder drop: `permanentRedirect('/shop')` | 7 |
| 3 Sitemap en feed alleen live drops, `/collections/*` en `/archive` erin | 10 |
| 3 `/shop?collection=&category=&sort=`, `?gender`/`?line` vervallen | 13, 14 |
| 4 `lib/drops.ts` (types, functies, beide edities, lineup) | 6 |
| 4 `getShopProducts`, allow-list, `soldOut`, geen Printify, sortering | 7 |
| 4 `product-classify` alleen soorten | 10 (uitbreiden), 14 (opruimen) |
| 4 `BUNDLES = []` | 7 |
| 4 Teaser zichtbaar, niet koopbaar; teaser-PDP noindex, geen Offer | 7, 8, 10, 18 |
| 4 Checkout-guard 409, `lib/release.ts` en seal weg | 8, 9 |
| 4 Preview-cookie `SITE_PREVIEW_KEY` | 6, 8, 9 |
| 4 Waitlist (Resend-audience, honeypot, rate-limit, validatie) | 15 |
| 5 `AnnouncementBar`, `SiteHeader`, `MobileNav`, `Drawer`, `Button`, `Badge`, `SiteFooter` | 2 tot en met 5, 15 |
| 5 PLP: `FilterBar`, `GridDensityToggle`, 2px-grid, `ProductTile` met badges | 11 tot en met 14 |
| 5 Collectiepagina, `DropBlock`, `Countdown`, `WaitlistForm`, Archive, `EditionCard` | 15, 16, 17 |
| 5 Home: hero van de eerstvolgende drop, rij per drop, lookbook weg | 18 |
| 9 Nieuwe tests (drops, catalog, waitlist, guard, Countdown, GridDensityToggle) | 6, 7, 8, 12, 15, 16 |

Bewust niet in dit plan (latere fasen volgens spec sectie 10): PDP-ombouw (`Gallery`, `BuyPanel`, `SizeSelector`, `SizeGuideDialog`, `ColourSiblings`, `Accordion`, sold-out-notify) en cart-drawer, checkout-shell en success (fase 3); home-fotoband, video, content- en accountpagina's, 404, e-mail, SEO-teksten, OG-image, favicon, manifest en logo's (fase 4); oude tokens, `.oly-theme`, Cormorant/Space Mono en vervallen componenten (`Nav`, `Footer`, `Hero`, `ProductCard`, `ProductCarousel`, `ShopDropdown`, `BundleCover`) opruimen (fase 5).

