# Fase 4 en 5: content, merk en afronding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Op `redesign/v2` de rest van de site in het v2-merk zetten (home met fotoband, videoband en waitlist-strook, tekstpagina's, account, 404, e-mail, SEO, OG-images, favicon, manifest en logo's) en daarna alle v1-resten opruimen, met Lighthouse, een axe-scan, een go-live-checklist en bijgewerkte README en `.env.example`, zodat de Preview na elke taak bouwt en te demonstreren is.

**Architecture:** Eén merkregister `lib/brand.ts` (kleuren, logo's, iconen, video's, met afmetingen uit het gegenereerde `lib/brand-assets.json`) voedt elke plek buiten CSS: `Logo`, e-mail, manifest, favicon, OG-images en de home. `scripts/build-brand-assets.mjs` maakt de PNG's in `public/brand/` deterministisch uit de bronnen in `docs/brand/`, tot Joep SVG's levert. Fase 5 haalt de v1-laag weg en zet twee repo-brede poorten neer (`scripts/repo-gates.test.ts`: geen v1-tokens, geen lange streepjes) plus twee QA-scripts (axe via Playwright, Lighthouse) die hun resultaat in `docs/qa/` vastleggen.

**Tech Stack:** Next.js 16.2.6 (App Router, `next/og` `ImageResponse`, metadata-bestanden `opengraph-image`, `icon`, `apple-icon`, `manifest`, root `not-found`), React 19.2, TypeScript 5 (strict), CSS Modules, sharp 0.34.5, Jest 30 via `next/jest` (jsdom, SWC), @testing-library/react 16, ESLint 9 (`eslint-config-next` 16.2.6), Playwright 1.63.0 met @axe-core/playwright 4.13.0, Lighthouse 13.5.0.

**Spec:** `docs/superpowers/specs/2026-10-13-rebrand-v2-design.md` (sectie 2, 5, 7, 8, 9 en 10, rijen 4 en 5). Interfaces van eerdere fasen: `docs/superpowers/plans/2026-10-14-phase-1-2-foundation-and-drops.md` (Task 1, 2, 4, 5, 6, 11, 15, 16, 17, 18) en `docs/superpowers/plans/2026-10-14-phase-3-buying.md` (Task 2, 8, 9, 10, 11).

## Global Constraints

- Alles op branch `redesign/v2` in `/Users/joep/Documents/Persoonlijk/7eno-shop-master`. Nooit `master` aanraken, nooit mergen, nooit `git stash` (gedeeld over worktrees), nooit pushen. Een push van `redesign/v2` (door Joep of de controller) geeft alleen een Preview.
- `.env.local` bevat een **live** Stripe-sleutel. Geen enkele taak start een echte checkout, opent `/checkout` met betaalgegevens of klikt op "Pay with Stripe". Unit-tests mocken `stripe`, `printful`, `printify`, `supabase` en `resend` altijd volledig. De axe-scan van `/checkout` (Task 14) blokkeert `/api/checkout`, `/api/promo/*` en Stripe op netwerkniveau.
- Checkout, Stripe, promo-codes, verzendregels, Printful/Printify-orderflow en het Supabase-schema blijven functioneel gelijk (spec sectie 1). Accountpagina's: alleen markup en CSS, logica ongewijzigd.
- Kwaliteitspoort na elke taak: `npx tsc --noEmit && npm test && npm run lint && npm run build`. In Next 16 bestaat `next lint` niet; `npm run lint` is `eslint .`.
- Jest: tests staan naast de bron. `jest.mock()` krijgt een **relatief** pad (geen `@/`, want `next/jest` heeft geen `moduleNameMapper` voor `@/`). Het padargument van `npm test -- <arg>` is een regex. Route handlers, scripts en server-only modules krijgen `/** @jest-environment node */`. Componenten met Testing Library (`render`, `screen`, `fireEvent`, `act`, `within`). `next/navigation` wordt gemockt waar `useRouter`/`useSearchParams` gebruikt wordt.
- TS strict. CSS Modules in `components/ui/*` en in elke omgebouwde pagina gebruiken **alleen** de nieuwe tokens (`--c-`, `--f-`, `--fs-`, `--s-`, `--r-`, `--l-`, `--m-`). Oude tokens (`--ink`, `--bone`, `--gutter`, `--font-sans`, `.oly-theme`) blijven tot Task 12 staan en verdwijnen daar.
- Lint-regel `react-hooks/purity` verbiedt `Date.now()` in een component (ook in async server components en `not-found.tsx`). Pagina's halen de tijd via `currentTimeMs()` uit `lib/drops.ts`. `react-hooks/set-state-in-effect` verbiedt `setState` direct in een effect; mediaqueries lezen via `useSyncExternalStore`.
- Geen em-dashes en geen en-dashes, niet in proza, code, commentaar, UI-tekst of commitberichten (lege tabelcellen krijgen `-`, getalbereiken `86-94`). In shell-stappen die een bestaand lang streepje vervangen staat het teken als escape (`\x{2014}`, `\x{2013}`). Commits: conventional commits in het Engels (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`).
- Kleuren (spec sectie 2): `--c-bg #F7F1DA`, `--c-surface #FFFFFF`, `--c-stone #C4C4B5`, `--c-text #2D3A4F`, `--c-text-muted #5B5A58`, `--c-border-strong #8A897F`, `--c-accent #7995C7`, `--c-accent-ink #3E5A8F`, `--c-live #FEAB27`, `--c-sage #BACCB1`, `--c-rose #E8697D`, `--c-peach #F5C190`, `--c-inverse-bg #2D3A4F`, `--c-inverse-text #F7F1DA`, `--c-success #3E5A2E`, `--c-error #A32020`, `--c-focus #2D3A4F`. Pastels, `--c-accent` en `--c-live` nooit als tekst op crème; tekst is altijd navy.
- Type: `--f-display` Archivo (variabel, `wght` 900, `wdth` 125, cursief voor drop-titels), `--f-body` Instrument Sans, `--f-mono` IBM Plex Mono; `--fs-display clamp(2.75rem, 8vw, 7.5rem)`, `--fs-h1 clamp(2rem, 5vw, 4rem)`, `--fs-h2 clamp(1.5rem, 3vw, 2.25rem)`, `--fs-h3 1.25rem`, `--fs-body 1rem`, `--fs-small 0.875rem`, `--fs-label 0.75rem` (labels uppercase, `letter-spacing: 0.08em`). Koppen uppercase, `line-height: 0.95`; body `line-height: 1.5`; klok en prijs `font-variant-numeric: tabular-nums`.
- Maat: `--s-1` tot `--s-10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px; `--r-0 0`, `--r-1 2px`; `--l-gutter` 16/24/32px; `--l-grid-gap 2px`; `--l-max 1600px`; `--l-text-max 68ch`; `--l-nav` 56/64px; `--l-announce 32px`; `--l-chrome` = announce + nav.
- Motion: alleen `transform` en `opacity` animeren, duren uit `--m-*`; onder `prefers-reduced-motion: reduce` niets automatisch laten bewegen (ook geen autoplay-video).
- Focus: 2px solide `--c-focus` met 2px offset; op donkere vlakken `--c-inverse-text`.
- Merkpalet buiten CSS (e-mail, OG-image, manifest, favicon): het **officiële** palet, niet de waarden uit spec sectie 8 (`INK #0E0B0B`, `BONE #F4EEE3`, `#621926`, `#CFC4AD`, manifest `#F4EEE3`/`#0E0B0B`, `themeColor #0E0B0B`). Die tekst dateert van vóór het palet van 13-10. Gebruikt worden: INK `#2D3A4F`, BONE `#F7F1DA`, accent `#7995C7` (alleen vlakken en lijnen), rand `#C4C4B5`, plus `#3E5A8F` voor accenttekst (spec sectie 2: accent-ink voor tekst op crème).
- Logo's: PNG uit `public/brand/` tot Joep de SVG-exports levert (spec sectie 8 en 10). Bronnen staan in `docs/brand/`; `public/brand/*` komt uit `scripts/build-brand-assets.mjs` of is een kopie van de door de controller voorbereide media.
- Video: alleen met poster, `preload="none"`, `muted`, `playsInline`, geen autoplay op mobiel (onder 768px) en niet bij reduced motion (spec sectie 2 en 9).
- E-mail: koppen `'Arial Black', Arial, sans-serif`, tekst `Arial, Helvetica, sans-serif`, mono blijft `'Courier New', Courier, monospace` (spec sectie 8).

## Review Focus

1. **Het OG-fontbestand ontbreekt, is woff2 in vermomming of komt niet mee in de serverless-functie** (iemand draait het downloadscript met een browser-user-agent, `app/_fonts/` wordt niet getraced voor `/collections/[slug]/opengraph-image`): de build of de test faalt luid, nooit een stille fallback naar een systeemfont of een 500 op Facebook. Test: `lib/og.test.tsx` (Task 10, magische bytes `00 01 00 00`, grootte) plus de `.nft.json`-controle in Task 10 Step 9.
2. **Manifest-iconen die liegen over hun maat** (`sizes: '512x512'` terwijl het bestand 500 px is, een maskable icoon waarvan het merk buiten de veilige zone valt, `sizes: 'any'` op een PNG): Chrome weigert installatie of snijdt het merk af. Test: `app/manifest.test.ts` (Task 9, leest de echte pixels) en `lib/brand.test.ts` (Task 1).
3. **Een productnaam met `&`, aanhalingstekens of `<` in een orderbevestiging** (`Tee & Towel "Set"`): in de HTML precies één keer ge-escaped (`&amp;`, nooit `&amp;amp;`), in de tekstversie leesbaar zonder entiteiten. Test: `lib/email/order-confirmation.test.ts` (Task 8).
4. **De 404 terwijl geen enkele drop live is** (vóór 1-11 met alleen een teaser, of een toekomstige stand waarin geen editie gelist is): de pagina heeft altijd minstens Shop en Archive, nooit een lege navigatie, en een upcoming editie zonder teaser lekt niet. Test: `lib/not-found.test.ts` (Task 7).
5. **Lighthouse tegen een koude Printful-cache** (eerste aanvraag na `next start`, ISR-pagina die op de achtergrond hervalideert, PDP-slug die niet meer bestaat): elke URL wordt eerst twee keer opgevraagd, de statuscodes van die warming staan in het rapport, en de PDP komt uit de sitemap (alleen live producten), zodat een meting nooit een 308 of een koude render meet. Test: `scripts/lib/lighthouse-report.test.ts` (Task 14).

---

## File Structure

**Fase 4: content en merk**
- `scripts/lib/brand-pixels.mjs` (+ test), `scripts/build-brand-assets.mjs`, `lib/brand-assets.json` (gegenereerd), `lib/brand.ts` (+ test), `public/brand/*`, `app/apple-icon.png`, `docs/brand/source/beeldmerk.png`: het merkregister en de bestanden.
- `components/Logo/Logo.tsx` (+ test): woordmerk en beeldmerk uit `public/brand`; header, footer en checkout-header gebruiken het.
- `components/ui/AutoplayVideo/*`: video met poster die alleen op brede schermen zonder reduced motion speelt.
- `app/page.tsx`, `app/page.module.css` (+ test): de volledige home.
- `test-utils/css-module-classes.ts`: helper die controleert dat een component alleen klassen gebruikt die zijn CSS-module definieert, en dat die module alleen v2-tokens leest.
- `components/ui/TextPage/TextPage.module.css` (+ test): de gedeelde tekstkolom voor About, FAQ, Size guide, Returns, Terms en Privacy.
- `app/about`, `app/faq` (+ test), `app/size-guide` (+ test): nieuwe teksten zonder OG, FAQ met `Accordion`.
- `app/account/**` (+ tests): vijf CSS-modules in v2, labels gekoppeld aan velden.
- `lib/not-found.ts` (+ test), `app/not-found.tsx`, `app/not-found.module.css` (+ test).
- `lib/email/brand.ts` (+ test), `lib/email/order-confirmation.ts`, `lib/email/order-shipped.ts` (+ tests).
- `lib/seo.ts` (+ test), `app/layout.tsx`, `app/manifest.ts` (+ test), `app/icon.tsx`, `app/collections/[slug]/page.tsx` (+ test).
- `scripts/fetch-og-font.mjs`, `app/_fonts/*`, `lib/og.tsx` (+ test), `app/opengraph-image.tsx`, `app/collections/[slug]/opengraph-image.tsx`, `next.config.ts`.

**Fase 5: afronding**
- Verwijderd: de v1-componenten, `app/deals`, `app/landing.module.css`, `public/logos`, `public/categories` en de create-next-app-restanten in `public/`. `lib/filter-types.ts` neemt de typen van `ShopFilters` over. `lib/public-assets.test.ts` bewaakt dat elk publiek pad in de code bestaat.
- `styles/globals.css` zonder v1-laag, `app/layout.tsx` zonder Cormorant en Space Mono, `scripts/repo-gates.test.ts` (v1-tokens en lange streepjes).
- `README.md`, `.env.example` (+ `lib/env-example.test.ts`), `docs/qa/go-live-checklist.md`.
- `playwright.config.ts`, `e2e/a11y.spec.ts`, `scripts/lib/lighthouse-report.mjs` (+ test), `scripts/lighthouse-report.mjs`, `docs/qa/a11y-<datum>.md`, `docs/qa/lighthouse-<datum>.md`.

Regelnummers in de Modify-regels gelden voor de huidige `redesign/v2` (commit `80559c9`, fase 1-2 tot en met Task 8 uitgevoerd). Raakt een eerdere taak of fase hetzelfde bestand, dan staat dat erbij ("fase 1-2 Task 18", "fase 3 Task 9"); de Edit-stappen ankeren dan op exacte tekst die die taak oplevert, of zeggen "lees het bestand eerst" als de tekst een lang streepje bevat.

---

### Voorbereiding

- [ ] **Step 1: Schone branch, eerdere fasen klaar, media aanwezig**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git switch redesign/v2
git status --short
test -f components/ui/DropBlock/DropBlock.tsx && test -f components/ui/WaitlistForm/WaitlistForm.tsx \
  && test -f app/collections/\[slug\]/page.tsx && test -f components/ui/Accordion/Accordion.tsx \
  && test -f app/shop/\[slug\]/ProductView.tsx && echo "phases 1-3 present"
ls -l /Users/joep/Documents/Persoonlijk/7eno-shop-media-prepared/
npm ci
npm test
```

Expected: `git status --short` is leeg; `phases 1-3 present`; de media-map toont `model-dune.webp`, `instagram-logo-nieuw.webp`, `something-is-coming.webp`, `olympn-sport-wordmark-orange.png`, `olympn-badge-orange.png`, `ad-dune.mp4` (ongeveer 1,1 MB), `ad-pistachio.mp4` (ongeveer 0,6 MB), `ad-dune-poster.jpg`, `ad-pistachio-poster.jpg`; alle suites groen. Is de tree niet schoon, ontbreekt een fase of is de media-map weg (hij staat in een tijdelijke sessiemap), stop dan en vraag de controller om de media opnieuw klaar te zetten. Geen `git stash`.

---

### Task 1: Merkregister en de bestanden in `public/brand`

**Files:**
- Create: `public/brand/model-dune.webp`, `instagram-logo-nieuw.webp`, `something-is-coming.webp`, `olympn-sport-wordmark-orange.png`, `olympn-badge-orange.png`, `ad-dune.mp4`, `ad-pistachio.mp4`, `ad-dune-poster.jpg`, `ad-pistachio-poster.jpg` (kopieën van de voorbereide media), `public/brand/life4hsp.png` (kopie van `public/logos/life4hsp.png`)
- Create: `docs/brand/source/beeldmerk.png` (kopie van `public/logos/beeldmerk-zwart.png`, zodat `public/logos` in Task 11 weg kan)
- Create: `scripts/lib/brand-pixels.mjs`
- Test: `scripts/lib/brand-pixels.test.ts`
- Create: `scripts/build-brand-assets.mjs`
- Create (gegenereerd): `public/brand/7eno-wordmark-navy.png`, `7eno-wordmark-cream.png`, `beeldmerk-navy.png`, `beeldmerk-cream.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `app/apple-icon.png`, `lib/brand-assets.json`
- Create: `lib/brand.ts`
- Test: `lib/brand.test.ts`
- Modify: `package.json:5-13` (script `brand:assets`), `package.json:24-38` (devDependency `sharp`), `package-lock.json`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md:49-68` (`apple-icon.png` in `app/` geeft zelf de `<link rel="apple-touch-icon">` met `sizes` uit het bestand).

**Interfaces:**
- Consumes: niets uit eerdere taken.
- Produces (`lib/brand.ts`):
  - `export const BRAND_COLOURS: { navy: '#2D3A4F'; cream: '#F7F1DA'; periwinkle: '#7995C7'; orange: '#FEAB27' }`
  - `export type BrandTone = 'navy' | 'cream'`
  - `export interface BrandImage { src: string; width: number; height: number }`, `export interface BrandIcon extends BrandImage { purpose: 'any' | 'maskable' }`, `export interface BrandVideo extends BrandImage { poster: string; label: string }`
  - `export const WORDMARK: Record<BrandTone, BrandImage>` (7ENO-woordmerk, transparant), `export const BEELDMERK: Record<BrandTone, BrandImage>` (de 7 met bliksem, transparant)
  - `export const APP_ICONS: BrandIcon[]` (192 any, 512 any, 512 maskable; crème merk op navy)
  - `export const OLYMPN_SPORT_WORDMARK`, `OLYMPN_BADGE`, `SOMETHING_IS_COMING`, `MODEL_DUNE`, `SEVENO_TILE: BrandImage`
  - `export const SPORT_ADS: BrandVideo[]` (Dune en Pistachio, 720x1280, met poster)
  - `export function heightAt(image: BrandImage, width: number): number`, `export function widthAt(image: BrandImage, height: number): number`
- Produces (`scripts/lib/brand-pixels.mjs`): `hexToRgb(hex)`, `brightestPixel(data, channels)`, `knockout(data, channels, bg, fg, target)`, `recolour(rgba, target)`, `alphaBounds(rgba, width, height, threshold?)`.

Het 7ENO-woordmerk bestaat alleen als vierkante tegel (periwinkle op navy, 750x750). Het script tilt het lettermerk van de tegel: elke pixel wordt geprojecteerd op de lijn van tegelkleur naar logokleur, zodat de randen hun anti-aliasing houden, en daarna bijgesneden. Gemeten op de bron: tegel `[45, 58, 79]`, logo `[155, 170, 201]`, woordmerk 444x342 px (verhouding 1,30).

- [ ] **Step 1: Kopieer de media en de bronnen**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
MEDIA=/Users/joep/Documents/Persoonlijk/7eno-shop-media-prepared
mkdir -p public/brand docs/brand/source
for f in model-dune.webp instagram-logo-nieuw.webp something-is-coming.webp \
  olympn-sport-wordmark-orange.png olympn-badge-orange.png \
  ad-dune.mp4 ad-pistachio.mp4 ad-dune-poster.jpg ad-pistachio-poster.jpg; do
  cp "$MEDIA/$f" "public/brand/$f"
done
cp public/logos/life4hsp.png public/brand/life4hsp.png
cp public/logos/beeldmerk-zwart.png docs/brand/source/beeldmerk.png
ls -l public/brand docs/brand/source
```

Expected: tien bestanden in `public/brand`, geen enkele van 0 bytes (de `.webm`-bestanden in de media-map zijn leeg en worden bewust niet gekopieerd), en `docs/brand/source/beeldmerk.png`.

- [ ] **Step 2: Neem sharp expliciet op als devDependency**

```bash
npm install --save-dev --save-exact sharp@0.34.5
```

Expected: `package.json` krijgt `"sharp": "0.34.5"` onder `devDependencies`; er wordt niets nieuws gedownload (sharp 0.34.5 zit al in `node_modules` via Next).

- [ ] **Step 3: Schrijf de falende pixeltest**

`scripts/lib/brand-pixels.test.ts`:

```ts
/** @jest-environment node */
import { alphaBounds, brightestPixel, hexToRgb, knockout, recolour } from './brand-pixels.mjs'

const NAVY = [45, 58, 79]
const PERIWINKLE = [155, 170, 201]
const CREAM = [247, 241, 218]

describe('hexToRgb', () => {
  it('parses with and without the hash', () => {
    expect(hexToRgb('#2D3A4F')).toEqual([45, 58, 79])
    expect(hexToRgb('f7f1da')).toEqual([247, 241, 218])
  })

  it('rejects anything that is not six hex digits', () => {
    expect(() => hexToRgb('#2D3A4')).toThrow('Not a hex colour: #2D3A4')
  })
})

describe('brightestPixel', () => {
  it('finds the logo colour on a dark tile', () => {
    const rgb = Buffer.from([...NAVY, ...PERIWINKLE, ...NAVY])
    expect(brightestPixel(rgb, 3)).toEqual(PERIWINKLE)
  })
})

describe('knockout', () => {
  it('makes the tile transparent and the logo opaque in the target colour', () => {
    const rgb = Buffer.from([...NAVY, ...PERIWINKLE])
    expect([...knockout(rgb, 3, NAVY, PERIWINKLE, CREAM)]).toEqual([...CREAM, 0, ...CREAM, 255])
  })

  it('keeps an anti-aliased edge half transparent', () => {
    const edge = Buffer.from(NAVY.map((c, i) => Math.round((c + PERIWINKLE[i]) / 2)))
    const alpha = knockout(edge, 3, NAVY, PERIWINKLE, CREAM)[3]
    expect(alpha).toBeGreaterThanOrEqual(124)
    expect(alpha).toBeLessThanOrEqual(132)
  })

  it('clamps colours beyond either end of the line', () => {
    const rgb = Buffer.from([0, 0, 0, 255, 255, 255])
    const out = knockout(rgb, 3, NAVY, PERIWINKLE, CREAM)
    expect(out[3]).toBe(0)
    expect(out[7]).toBe(255)
  })

  it('reads RGBA input by skipping the alpha byte', () => {
    const rgba = Buffer.from([...PERIWINKLE, 17])
    expect([...knockout(rgba, 4, NAVY, PERIWINKLE, CREAM)]).toEqual([...CREAM, 255])
  })
})

describe('recolour', () => {
  it('sets every pixel to the target and keeps its alpha', () => {
    const rgba = Buffer.from([17, 17, 17, 255, 255, 255, 255, 0, 10, 10, 10, 90])
    expect([...recolour(rgba, NAVY)]).toEqual([...NAVY, 255, ...NAVY, 0, ...NAVY, 90])
  })
})

describe('alphaBounds', () => {
  it('returns the box around the visible pixels', () => {
    // 4x3 image, visible pixels at (1,0) and (2,2)
    const rgba = Buffer.alloc(4 * 3 * 4)
    rgba[(0 * 4 + 1) * 4 + 3] = 255
    rgba[(2 * 4 + 2) * 4 + 3] = 200
    expect(alphaBounds(rgba, 4, 3)).toEqual({ left: 1, top: 0, width: 2, height: 3 })
  })

  it('ignores faint noise under the threshold', () => {
    const rgba = Buffer.alloc(2 * 1 * 4)
    rgba[3] = 5
    rgba[7] = 255
    expect(alphaBounds(rgba, 2, 1)).toEqual({ left: 1, top: 0, width: 1, height: 1 })
  })

  it('refuses a fully transparent image', () => {
    expect(() => alphaBounds(Buffer.alloc(16), 2, 2)).toThrow('Image is fully transparent')
  })
})
```

- [ ] **Step 4: Run de test, verwacht falen**

Run: `npm test -- scripts/lib/brand-pixels`
Expected: FAIL met `Cannot find module './brand-pixels.mjs'`.

- [ ] **Step 5: Implementeer de pixelhelpers**

`scripts/lib/brand-pixels.mjs`:

```js
/**
 * Pixel helpers for scripts/build-brand-assets.mjs. Pure functions on raw
 * buffers, so they are unit tested without sharp.
 */

/** '#2D3A4F' to [45, 58, 79]. */
export function hexToRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`Not a hex colour: ${hex}`)
  const n = parseInt(match[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** The pixel with the highest channel sum: the logo colour on a dark tile. */
export function brightestPixel(data, channels) {
  let best = -1
  let colour = [0, 0, 0]
  for (let i = 0; i < data.length; i += channels) {
    const sum = data[i] + data[i + 1] + data[i + 2]
    if (sum > best) {
      best = sum
      colour = [data[i], data[i + 1], data[i + 2]]
    }
  }
  return colour
}

/**
 * Lifts a flat two-colour logo off its tile. Every pixel is projected on the
 * line from `bg` to `fg`: the tile becomes transparent, the logo opaque, and
 * anti-aliased edges keep their partial alpha. Output is RGBA in `target`.
 */
export function knockout(data, channels, bg, fg, target) {
  const pixels = data.length / channels
  const out = Buffer.alloc(pixels * 4)
  const d = [fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]]
  const length2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]
  for (let p = 0; p < pixels; p += 1) {
    const i = p * channels
    const t = ((data[i] - bg[0]) * d[0] + (data[i + 1] - bg[1]) * d[1] + (data[i + 2] - bg[2]) * d[2]) / length2
    const o = p * 4
    out[o] = target[0]
    out[o + 1] = target[1]
    out[o + 2] = target[2]
    out[o + 3] = Math.round(Math.min(1, Math.max(0, t)) * 255)
  }
  return out
}

/** Recolours an RGBA image to `target`, keeping its alpha channel. */
export function recolour(rgba, target) {
  const out = Buffer.from(rgba)
  for (let o = 0; o < out.length; o += 4) {
    out[o] = target[0]
    out[o + 1] = target[1]
    out[o + 2] = target[2]
  }
  return out
}

/** Bounding box of the pixels whose alpha exceeds `threshold` (RGBA input). */
export function alphaBounds(rgba, width, height, threshold = 8) {
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] <= threshold) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (right < 0) throw new Error('Image is fully transparent')
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}
```

- [ ] **Step 6: Run de test, verwacht groen**

Run: `npm test -- scripts/lib/brand-pixels`
Expected: PASS, 11 tests.

- [ ] **Step 7: Schrijf het bouwscript**

`scripts/build-brand-assets.mjs`:

```js
// Builds the v2 brand files in public/brand (and app/apple-icon.png) from the
// sources in docs/brand (spec section 8). Deterministic: run it again after a
// source changes, with `npm run brand:assets`. PNG until Joep delivers the SVG
// exports; then the wordmark and mark files are replaced and this script goes.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { alphaBounds, brightestPixel, hexToRgb, knockout, recolour } from './lib/brand-pixels.mjs'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public/brand')
const NAVY_HEX = '#2D3A4F'
const TONES = { navy: hexToRgb(NAVY_HEX), cream: hexToRgb('#F7F1DA') }
const TILE = path.join(ROOT, 'docs/brand/olympn-marketing-3/instagram logo nieuw.png')
const MARK = path.join(ROOT, 'docs/brand/source/beeldmerk.png')

/** File name to pixel size, written to lib/brand-assets.json for lib/brand.ts. */
const sizes = {}

async function save(name, pipeline) {
  const info = await pipeline.png({ compressionLevel: 9 }).toFile(path.join(OUT, name))
  sizes[name] = { width: info.width, height: info.height }
}

/** The 7ENO wordmark, lifted off its periwinkle-on-navy tile. */
async function wordmarks() {
  const { data, info } = await sharp(TILE).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const tile = [data[0], data[1], data[2]]
  const logo = brightestPixel(data, info.channels)
  for (const [tone, rgb] of Object.entries(TONES)) {
    const rgba = knockout(data, info.channels, tile, logo, rgb)
    const box = alphaBounds(rgba, info.width, info.height)
    const raw = { raw: { width: info.width, height: info.height, channels: 4 } }
    await save(`7eno-wordmark-${tone}.png`, sharp(rgba, raw).extract(box))
  }
}

/** The 7 with the lightning bolt, black on transparent in the source. */
async function marks() {
  const { data, info } = await sharp(MARK).ensureAlpha().resize({ width: 512 }).raw().toBuffer({ resolveWithObject: true })
  for (const [tone, rgb] of Object.entries(TONES)) {
    const raw = { raw: { width: info.width, height: info.height, channels: 4 } }
    await save(`beeldmerk-${tone}.png`, sharp(recolour(data, rgb), raw))
  }
}

/** Cream mark centred on a navy square; `share` is the mark height over the side. */
async function icon(file, size, share) {
  const mark = await sharp(path.join(OUT, 'beeldmerk-cream.png'))
    .resize({ height: Math.round(size * share) })
    .png()
    .toBuffer()
  const info = await sharp({ create: { width: size, height: size, channels: 4, background: NAVY_HEX } })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(file)
  return { width: info.width, height: info.height }
}

await mkdir(OUT, { recursive: true })
await wordmarks()
await marks()
sizes['icon-192.png'] = await icon(path.join(OUT, 'icon-192.png'), 192, 0.62)
sizes['icon-512.png'] = await icon(path.join(OUT, 'icon-512.png'), 512, 0.62)
// Maskable icons are cropped to a circle of 80% of the side: keep the mark at half.
sizes['icon-maskable-512.png'] = await icon(path.join(OUT, 'icon-maskable-512.png'), 512, 0.5)
await icon(path.join(ROOT, 'app/apple-icon.png'), 180, 0.62)

const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(path.join(ROOT, 'lib/brand-assets.json'), `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`Wrote ${Object.keys(sorted).length} files to public/brand, app/apple-icon.png and lib/brand-assets.json`)
```

Voeg in `package.json` na de regel `"test:coverage": "jest --coverage"` toe (zet een komma achter die regel):

```json
    "brand:assets": "node scripts/build-brand-assets.mjs"
```

- [ ] **Step 8: Draai het script**

Run: `npm run brand:assets && cat lib/brand-assets.json`
Expected: `Wrote 7 files to public/brand, app/apple-icon.png and lib/brand-assets.json`; in de JSON staat `7eno-wordmark-navy.png` en `7eno-wordmark-cream.png` met ongeveer `"width": 444, "height": 342` (een pixel verschil door de afronding van de alfadrempel is in orde), `beeldmerk-*.png` met `512` bij `528`, en de drie iconen met 192 of 512 in beide richtingen.

- [ ] **Step 9: Schrijf de falende registertest**

`lib/brand.test.ts`:

```ts
/** @jest-environment node */
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import generated from './brand-assets.json'
import {
  APP_ICONS, BEELDMERK, BRAND_COLOURS, MODEL_DUNE, OLYMPN_BADGE, OLYMPN_SPORT_WORDMARK, SEVENO_TILE,
  SOMETHING_IS_COMING, SPORT_ADS, WORDMARK, heightAt, widthAt, type BrandImage,
} from './brand'

const file = (src: string) => path.join(process.cwd(), 'public', src)

async function rgba(src: string) {
  const { data, info } = await sharp(file(src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

const IMAGES: BrandImage[] = [
  WORDMARK.navy, WORDMARK.cream, BEELDMERK.navy, BEELDMERK.cream, ...APP_ICONS,
  OLYMPN_SPORT_WORDMARK, OLYMPN_BADGE, SOMETHING_IS_COMING, MODEL_DUNE, SEVENO_TILE,
]

describe('brand register', () => {
  it('uses the official palette', () => {
    expect(BRAND_COLOURS).toEqual({ navy: '#2D3A4F', cream: '#F7F1DA', periwinkle: '#7995C7', orange: '#FEAB27' })
  })

  it.each(IMAGES.map((image) => [image.src, image] as const))('%s exists at the size the code assumes', async (_src, image) => {
    const meta = await sharp(file(image.src)).metadata()
    expect([meta.width, meta.height]).toEqual([image.width, image.height])
  })

  it('lists every generated file', () => {
    for (const name of Object.keys(generated)) expect(existsSync(file(`/brand/${name}`))).toBe(true)
  })

  it.each(['navy', 'cream'] as const)('lifts the %s wordmark cleanly off its tile', async (tone) => {
    const { data } = await rgba(WORDMARK[tone].src)
    const pixels = data.length / 4
    let clear = 0
    let solid = 0
    let wrongColour = 0
    const target = tone === 'navy' ? [45, 58, 79] : [247, 241, 218]
    for (let o = 0; o < data.length; o += 4) {
      if (data[o + 3] === 0) clear += 1
      if (data[o + 3] === 255) {
        solid += 1
        if (data[o] !== target[0] || data[o + 1] !== target[1] || data[o + 2] !== target[2]) wrongColour += 1
      }
    }
    expect(clear / pixels).toBeGreaterThan(0.3)
    expect(solid / pixels).toBeGreaterThan(0.2)
    expect(wrongColour).toBe(0)
  })

  it('makes square app icons of exactly 192, 512 and 512 px, cream on navy', async () => {
    expect(APP_ICONS.map((i) => [i.width, i.height, i.purpose])).toEqual([
      [192, 192, 'any'], [512, 512, 'any'], [512, 512, 'maskable'],
    ])
    for (const icon of APP_ICONS) {
      const { data } = await rgba(icon.src)
      expect([...data.subarray(0, 4)]).toEqual([45, 58, 79, 255])
    }
  })

  it('keeps the maskable mark inside the safe zone', async () => {
    const icon = APP_ICONS[2]
    const { data, width } = await rgba(icon.src)
    const y = Math.round(icon.height / 2)
    for (const x of [Math.round(width * 0.12), Math.round(width * 0.88)]) {
      const o = (y * width + x) * 4
      expect([...data.subarray(o, o + 3)]).toEqual([45, 58, 79])
    }
  })

  it('ships the apple touch icon at 180 px', async () => {
    const meta = await sharp(path.join(process.cwd(), 'app/apple-icon.png')).metadata()
    expect([meta.width, meta.height]).toEqual([180, 180])
  })

  it.each(SPORT_ADS.map((ad) => [ad.src, ad] as const))('%s is a real video with a portrait poster', async (_src, ad) => {
    expect(statSync(file(ad.src)).size).toBeGreaterThan(100_000)
    const meta = await sharp(file(ad.poster)).metadata()
    expect([meta.width, meta.height]).toEqual([ad.width, ad.height])
  })

  it('scales by the natural ratio', () => {
    expect(heightAt({ src: '', width: 444, height: 342 }, 120)).toBe(92)
    expect(widthAt({ src: '', width: 444, height: 342 }, 32)).toBe(42)
  })
})
```

- [ ] **Step 10: Run de test, verwacht falen**

Run: `npm test -- lib/brand.test`
Expected: FAIL met `Cannot find module './brand'`.

- [ ] **Step 11: Implementeer het register**

`lib/brand.ts`:

```ts
/**
 * The v2 brand outside CSS: palette values and the files in public/brand, with
 * their pixel sizes. Mail, the manifest, the favicon, the OG images and the
 * logo component read from here, so a new export from Joep changes one place.
 * Generated sizes come from scripts/build-brand-assets.mjs.
 */
import generated from './brand-assets.json'

export const BRAND_COLOURS = {
  navy: '#2D3A4F',
  cream: '#F7F1DA',
  periwinkle: '#7995C7',
  orange: '#FEAB27',
} as const

export type BrandTone = 'navy' | 'cream'

export interface BrandImage {
  src: string
  width: number
  height: number
}

export interface BrandIcon extends BrandImage {
  purpose: 'any' | 'maskable'
}

export interface BrandVideo extends BrandImage {
  poster: string
  label: string
}

function generatedImage(name: keyof typeof generated): BrandImage {
  return { src: `/brand/${name}`, width: generated[name].width, height: generated[name].height }
}

/** The 7ENO wordmark on a transparent ground: navy on cream, cream on navy. */
export const WORDMARK: Record<BrandTone, BrandImage> = {
  navy: generatedImage('7eno-wordmark-navy.png'),
  cream: generatedImage('7eno-wordmark-cream.png'),
}

/** The 7 with the lightning bolt, the favicon and footer mark. */
export const BEELDMERK: Record<BrandTone, BrandImage> = {
  navy: generatedImage('beeldmerk-navy.png'),
  cream: generatedImage('beeldmerk-cream.png'),
}

export const APP_ICONS: BrandIcon[] = [
  { ...generatedImage('icon-192.png'), purpose: 'any' },
  { ...generatedImage('icon-512.png'), purpose: 'any' },
  { ...generatedImage('icon-maskable-512.png'), purpose: 'maskable' },
]

export const OLYMPN_SPORT_WORDMARK: BrandImage = { src: '/brand/olympn-sport-wordmark-orange.png', width: 1600, height: 519 }
export const OLYMPN_BADGE: BrandImage = { src: '/brand/olympn-badge-orange.png', width: 800, height: 238 }
export const SOMETHING_IS_COMING: BrandImage = { src: '/brand/something-is-coming.webp', width: 1080, height: 1080 }
export const MODEL_DUNE: BrandImage = { src: '/brand/model-dune.webp', width: 1381, height: 2000 }
/** Square 7ENO tile (periwinkle on navy): the schema.org organisation logo. */
export const SEVENO_TILE: BrandImage = { src: '/brand/instagram-logo-nieuw.webp', width: 750, height: 750 }

export const SPORT_ADS: BrandVideo[] = [
  { src: '/brand/ad-dune.mp4', poster: '/brand/ad-dune-poster.jpg', width: 720, height: 1280, label: 'OLYMPN Sport ad in Dune' },
  { src: '/brand/ad-pistachio.mp4', poster: '/brand/ad-pistachio-poster.jpg', width: 720, height: 1280, label: 'OLYMPN Sport ad in Pistachio' },
]

/** Height of `image` drawn `width` wide, keeping its ratio. */
export function heightAt(image: BrandImage, width: number): number {
  return Math.round((width * image.height) / image.width)
}

/** Width of `image` drawn `height` tall, keeping its ratio. */
export function widthAt(image: BrandImage, height: number): number {
  return Math.round((height * image.width) / image.height)
}
```

- [ ] **Step 12: Run de tests, verwacht groen**

Run: `npm test -- (lib/brand.test|brand-pixels)`
Expected: PASS.

- [ ] **Step 13: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Op de Preview staat `/brand/7eno-wordmark-navy.png` direct op te vragen; `/apple-icon.png` geeft het navy icoon.

- [ ] **Step 14: Commit**

```bash
git add public/brand app/apple-icon.png docs/brand/source scripts/lib/brand-pixels.mjs scripts/lib/brand-pixels.test.ts \
  scripts/build-brand-assets.mjs lib/brand-assets.json lib/brand.ts lib/brand.test.ts package.json package-lock.json
git commit -m "feat: add v2 brand register and generated logo and icon files"
```

---

### Task 2: Het nieuwe woordmerk in header, footer en checkout-header

**Files:**
- Modify: `components/Logo/Logo.tsx:1-63` (volledig vervangen)
- Test: `components/Logo/Logo.test.tsx`
- Modify: `components/ui/SiteHeader/SiteHeader.tsx:38` (gemaakt in fase 1-2 Task 4), `components/ui/SiteHeader/SiteHeader.module.css:37-41`
- Test: `components/ui/SiteHeader/SiteHeader.test.tsx` (één test erbij)
- Modify: `components/ui/SiteFooter/SiteFooter.tsx:1-3`, `:21` (fase 1-2 Task 15 heeft er een waitlist-kolom bij gezet; anker op tekst), `components/ui/SiteFooter/SiteFooter.module.css:16-24`
- Test: `components/ui/SiteFooter/SiteFooter.test.tsx` (één test erbij)
- Modify: `components/CheckoutHeader/CheckoutHeader.tsx` (volledig vervangen in fase 3 Task 9; alleen de `LogoWordmark`-regel)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:265-293` (`priority` is in Next 16 vervangen; gebruik `loading="eager"` of `fetchPriority="high"`).

**Interfaces:**
- Consumes: `WORDMARK`, `BEELDMERK`, `widthAt`, `BrandTone` (Task 1).
- Produces:
  - `export type LogoVariant = BrandTone | 'wit' | 'zwart' | 'butter' | 'ink' | 'blood' | 'stone'` (de v1-namen blijven tot Task 11 geldig: `wit`, `butter` worden crème, de rest navy)
  - `export function toneFor(variant: LogoVariant): BrandTone`
  - `export function LogoWordmark({ variant?, height?, priority?, align? })`, `export function LogoBadge({ variant?, size?, priority? })`, `export default function Logo(...)`; zelfde props als nu, standaard `variant` is nu `'navy'`.

- [ ] **Step 1: Schrijf de falende tests**

`components/Logo/Logo.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { BEELDMERK, WORDMARK, widthAt } from '@/lib/brand'
import Logo, { LogoBadge, LogoWordmark, toneFor } from './Logo'

const src = (img: HTMLElement) => decodeURIComponent(img.getAttribute('src') ?? '')

describe('Logo', () => {
  it('renders the navy v2 wordmark by default', () => {
    render(<LogoWordmark />)
    expect(src(screen.getByRole('img', { name: '7ENO' }))).toContain('/brand/7eno-wordmark-navy.png')
  })

  it('sizes the box from the natural ratio of the file', () => {
    const { container } = render(<LogoWordmark height={40} />)
    expect((container.firstChild as HTMLElement).style.width).toBe(`${widthAt(WORDMARK.navy, 40)}px`)
  })

  it('uses the cream wordmark on dark surfaces', () => {
    render(<LogoWordmark variant="cream" />)
    expect(src(screen.getByRole('img', { name: '7ENO' }))).toContain('/brand/7eno-wordmark-cream.png')
  })

  it('maps the v1 colour names onto the two tones', () => {
    expect(['wit', 'butter', 'cream'].map((v) => toneFor(v as 'wit'))).toEqual(['cream', 'cream', 'cream'])
    expect(['ink', 'zwart', 'blood', 'stone', 'navy'].map((v) => toneFor(v as 'ink'))).toEqual(['navy', 'navy', 'navy', 'navy', 'navy'])
  })

  it('loads eagerly when it is above the fold', () => {
    render(<LogoWordmark priority />)
    const img = screen.getByRole('img', { name: '7ENO' })
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
  })

  it('renders the mark as decoration', () => {
    const { container } = render(<LogoBadge variant="navy" size={48} />)
    const img = container.querySelector('img') as HTMLImageElement
    expect(img).toHaveAttribute('alt', '')
    expect(src(img)).toContain(BEELDMERK.navy.src)
  })

  it('keeps the default export as a wordmark', () => {
    render(<Logo />)
    expect(screen.getByRole('img', { name: '7ENO' })).toBeInTheDocument()
  })
})
```

Voeg in `components/ui/SiteHeader/SiteHeader.test.tsx` binnen `describe('SiteHeader', ...)` als laatste test toe:

```tsx
  it('shows the navy v2 wordmark as the home link', () => {
    renderHeader()
    const img = screen.getByRole('link', { name: '7ENO home' }).querySelector('img') as HTMLImageElement
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('/brand/7eno-wordmark-navy.png')
  })
```

Voeg in `components/ui/SiteFooter/SiteFooter.test.tsx` binnen `describe('SiteFooter', ...)` als laatste test toe:

```tsx
  it('carries the cream v2 wordmark on the navy footer', () => {
    render(<SiteFooter nav={MAIN_NAV} />)
    const img = screen.getByRole('img', { name: '7ENO' })
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('/brand/7eno-wordmark-cream.png')
  })
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (Logo|SiteHeader|SiteFooter)`
Expected: FAIL: `toneFor` bestaat niet, het `src` bevat `/logos/woordmerk-ink.png`, de footer heeft geen afbeelding.

- [ ] **Step 3: Vervang `components/Logo/Logo.tsx`**

```tsx
import Image from 'next/image'
import { BEELDMERK, WORDMARK, widthAt, type BrandTone } from '@/lib/brand'
import styles from './Logo.module.css'

/** v1 colour names, accepted until the last v1 caller is gone (phase 5). */
type LegacyVariant = 'wit' | 'zwart' | 'butter' | 'ink' | 'blood' | 'stone'
export type LogoVariant = BrandTone | LegacyVariant

/** Light variants sit on navy surfaces, everything else on cream. */
export function toneFor(variant: LogoVariant): BrandTone {
  return variant === 'cream' || variant === 'wit' || variant === 'butter' ? 'cream' : 'navy'
}

interface BadgeProps {
  variant?: LogoVariant
  size?: number
  priority?: boolean
}

interface WordmarkProps {
  variant?: LogoVariant
  height?: number
  priority?: boolean
  align?: 'left' | 'center'
}

function eager(priority: boolean) {
  return priority ? ({ loading: 'eager', fetchPriority: 'high' } as const) : {}
}

export function LogoBadge({ variant = 'navy', size = 64, priority = false }: BadgeProps) {
  const mark = BEELDMERK[toneFor(variant)]
  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <Image
        src={mark.src}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        {...eager(priority)}
      />
    </div>
  )
}

export function LogoWordmark({ variant = 'navy', height = 36, priority = false, align = 'left' }: WordmarkProps) {
  const mark = WORDMARK[toneFor(variant)]
  const width = widthAt(mark, height)
  // Width plus aspect-ratio with max-width 100%: on a narrow cell the mark
  // shrinks with its ratio instead of spilling over the layout.
  return (
    <div
      className={styles.wrap}
      style={{
        width,
        maxWidth: '100%',
        aspectRatio: `${mark.width} / ${mark.height}`,
        marginInline: align === 'center' ? 'auto' : undefined,
      }}
    >
      <Image
        src={mark.src}
        alt="7ENO"
        fill
        sizes={`${width}px`}
        style={{ objectFit: 'contain', objectPosition: align === 'center' ? 'center' : 'left center' }}
        {...eager(priority)}
      />
    </div>
  )
}

export default function Logo({ variant = 'navy', height = 32 }: WordmarkProps) {
  return <LogoWordmark variant={variant} height={height} />
}
```

- [ ] **Step 4: Header, footer en checkout-header**

In `components/ui/SiteHeader/SiteHeader.tsx` vervang:

```tsx
          <LogoWordmark variant="ink" height={28} />
```

door:

```tsx
          <LogoWordmark variant="navy" height={32} priority />
```

In `components/ui/SiteHeader/SiteHeader.module.css` vervang het blok op regel 37-41:

```css
.logo {
  justify-self: center;
  display: block;
  width: 98px;
}
```

door:

```css
.logo {
  justify-self: center;
  display: block;
  width: auto;
}
```

In `components/ui/SiteFooter/SiteFooter.tsx` vervang regel 1-2:

```tsx
import Link from 'next/link'
import { HELP_NAV, LEGAL_NAV, type NavItem } from '@/lib/nav'
```

door:

```tsx
import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import { HELP_NAV, LEGAL_NAV, type NavItem } from '@/lib/nav'
```

en vervang:

```tsx
          <p className={styles.wordmark}>7ENO</p>
```

door:

```tsx
          <div className={styles.wordmark}>
            <LogoWordmark variant="cream" height={48} />
          </div>
```

In `components/ui/SiteFooter/SiteFooter.module.css` vervang het blok op regel 16-24 (`.wordmark { ... text-transform: uppercase; }`) door:

```css
.wordmark {
  display: block;
  margin: 0;
}
```

In `components/CheckoutHeader/CheckoutHeader.tsx` (stand na fase 3 Task 9) vervang:

```tsx
        <LogoWordmark variant="ink" height={28} align="center" priority />
```

door:

```tsx
        <LogoWordmark variant="navy" height={28} align="center" priority />
```

- [ ] **Step 5: Run de tests, verwacht groen**

Run: `npm test -- (Logo|SiteHeader|SiteFooter|CheckoutHeader)`
Expected: PASS. De test van `CheckoutHeader` uit fase 3 blijft groen (`alt="7ENO"` is ongewijzigd).

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Preview: header met het navy 7ENO-woordmerk, footer met het crème woordmerk op navy, `/checkout` met het navy woordmerk gecentreerd.

- [ ] **Step 7: Commit**

```bash
git add components/Logo components/ui/SiteHeader components/ui/SiteFooter components/CheckoutHeader/CheckoutHeader.tsx
git commit -m "feat: swap header, footer and checkout logos to the v2 wordmark"
```

---

### Task 3: De volledige home

**Files:**
- Create: `components/ui/AutoplayVideo/AutoplayVideo.tsx`, `components/ui/AutoplayVideo/AutoplayVideo.module.css`
- Test: `components/ui/AutoplayVideo/AutoplayVideo.test.tsx`
- Modify: `lib/drops.ts:78-80` (hero van OLYMPN Sport; bestand uit fase 1-2 Task 6)
- Test: `lib/drops.test.ts:34-40` (de lineup-test splitsen)
- Modify: `app/page.tsx` (volledig vervangen; de huidige versie is die van fase 1-2 Task 18)
- Modify: `app/page.module.css` (volledig vervangen; idem)
- Test: `app/page.test.tsx` (volledig vervangen; de vijf tests uit fase 1-2 Task 18 blijven, één met een smallere selector)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:115-136` (`fill` vraagt een gepositioneerde ouder), `:265-293` (`loading="eager"` en `fetchPriority="high"` voor het LCP-beeld).

**Interfaces:**
- Consumes: `DropBlock` (fase 1-2 Task 16, `{ drop, now, as, withIntro }`); `ProductTile` (fase 1-2 Task 11); `WaitlistForm` (fase 1-2 Task 15, `compact` geeft het label "Email for drop alerts"); `buttonClasses` (fase 1-2 Task 2); `getShopProducts` (fase 1-2 Task 7); `currentTimeMs`, `getDrop`, `getNextDrop`, `isDropListed`, `listDropsNewestFirst`, `toDropView`, `DropView` (fase 1-2 Task 6); `isPreviewSession`; `toTiles`; `OLYMPN_SPORT_WORDMARK`, `SOMETHING_IS_COMING`, `SPORT_ADS`, `MODEL_DUNE` (Task 1).
- Produces:
  - `export const AUTOPLAY_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'`
  - `export interface AutoplayVideoProps { src: string; poster: string; label: string; width: number; height: number }`, `export default function AutoplayVideo(props)`: altijd `preload="none"`, `muted`, `loop`, `playsInline`, poster; speelt alleen als `AUTOPLAY_QUERY` matcht, anders `controls`.
  - Home: hero (DropBlock plus de foto van de volgende drop), per gelijste drop een tegelrij, Olympian-fotoband, OLYMPN Sport-videoband, waitlist-strook.

Het hardcoded lookbook, de categoriestrook, de quick-add-carousel en de deals-band zijn al weg sinds fase 1-2 Task 18; de test "no longer shows deals or the old lookbook" blijft dat bewaken.

- [ ] **Step 1: Schrijf de falende videotest**

`components/ui/AutoplayVideo/AutoplayVideo.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import AutoplayVideo, { AUTOPLAY_QUERY } from './AutoplayVideo'

const props = {
  src: '/brand/ad-dune.mp4',
  poster: '/brand/ad-dune-poster.jpg',
  label: 'OLYMPN Sport ad in Dune',
  width: 720,
  height: 1280,
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query === AUTOPLAY_QUERY ? matches : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia
}

let play: jest.SpyInstance

beforeEach(() => {
  play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
  delete (window as { matchMedia?: unknown }).matchMedia
})

const video = (container: HTMLElement) => container.querySelector('video') as HTMLVideoElement

describe('AutoplayVideo', () => {
  it('never preloads and always shows its poster', () => {
    mockMatchMedia(false)
    const { container } = render(<AutoplayVideo {...props} />)
    const v = video(container)
    expect(v).toHaveAttribute('preload', 'none')
    expect(v).toHaveAttribute('poster', props.poster)
    expect(v).toHaveAttribute('playsinline')
    expect(v.muted).toBe(true)
    expect(v).toHaveAttribute('aria-label', props.label)
    expect(v.querySelector('source')).toHaveAttribute('src', props.src)
  })

  it('does not autoplay on a phone and offers controls instead', () => {
    mockMatchMedia(false)
    const { container } = render(<AutoplayVideo {...props} />)
    expect(play).not.toHaveBeenCalled()
    expect(video(container)).toHaveAttribute('controls')
  })

  it('plays muted on a wide screen without reduced motion', () => {
    mockMatchMedia(true)
    const { container } = render(<AutoplayVideo {...props} />)
    expect(play).toHaveBeenCalledTimes(1)
    expect(video(container)).not.toHaveAttribute('controls')
  })

  it('stays still where matchMedia does not exist', () => {
    render(<AutoplayVideo {...props} />)
    expect(play).not.toHaveBeenCalled()
  })

  it('swallows a refused autoplay', async () => {
    mockMatchMedia(true)
    play.mockRejectedValue(new Error('NotAllowedError'))
    const { container } = render(<AutoplayVideo {...props} />)
    await Promise.resolve()
    expect(video(container)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- AutoplayVideo`
Expected: FAIL met `Cannot find module './AutoplayVideo'`.

- [ ] **Step 3: Implementeer AutoplayVideo**

`components/ui/AutoplayVideo/AutoplayVideo.tsx`:

```tsx
'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import styles from './AutoplayVideo.module.css'

/** Autoplay only where it costs nothing: wide screens without reduced motion (spec section 2 and 9). */
export const AUTOPLAY_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(AUTOPLAY_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function canAutoplay(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(AUTOPLAY_QUERY).matches
}

/** The server never autoplays: the poster is the first paint everywhere. */
function serverSnapshot(): boolean {
  return false
}

export interface AutoplayVideoProps {
  src: string
  poster: string
  label: string
  width: number
  height: number
}

export default function AutoplayVideo({ src, poster, label, width, height }: AutoplayVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const autoplay = useSyncExternalStore(subscribe, canAutoplay, serverSnapshot)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (!autoplay) {
      if (!video.paused) video.pause()
      return
    }
    // A browser may still refuse (data saver, low power): the poster stays.
    video.play()?.catch(() => undefined)
  }, [autoplay])

  return (
    <video
      ref={ref}
      className={styles.video}
      width={width}
      height={height}
      poster={poster}
      preload="none"
      muted
      loop
      playsInline
      controls={!autoplay}
      aria-label={label}
    >
      <source src={src} type="video/mp4" />
    </video>
  )
}
```

`components/ui/AutoplayVideo/AutoplayVideo.module.css`:

```css
.video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--c-inverse-bg);
}

.video:focus-visible {
  outline: 2px solid var(--c-inverse-text);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run de test, verwacht groen**

Run: `npm test -- AutoplayVideo`
Expected: PASS, 5 tests.

- [ ] **Step 5: Hero van OLYMPN Sport naar de modelfoto en de ad**

In `lib/drops.ts` vervang (regel 78-80):

```ts
    hero: {
      image: '/drops/olympn-sport/dune.webp',
      alt: 'OLYMPN Sport Relaxed Hoodie in Dune',
```

door:

```ts
    hero: {
      image: '/brand/model-dune.webp',
      alt: 'Model wearing the OLYMPN Sport Relaxed Hoodie in Dune',
      video: '/brand/ad-dune.mp4',
      poster: '/brand/ad-dune-poster.jpg',
```

In `lib/drops.test.ts` vervang de test op regel 34-40:

```ts
  it('ships all eight OLYMPN Sport mockups as local webp files', () => {
    expect(sport.hero.lineup).toHaveLength(8)
    for (const src of [...sport.hero.lineup, sport.hero.image]) {
      expect(src).toMatch(/^\/drops\/olympn-sport\/[a-z-]+\.webp$/)
      expect(publicFile(src)).toBe(true)
    }
  })
```

door:

```ts
  it('ships all eight OLYMPN Sport mockups as local webp files', () => {
    expect(sport.hero.lineup).toHaveLength(8)
    for (const src of sport.hero.lineup) {
      expect(src).toMatch(/^\/drops\/olympn-sport\/[a-z-]+\.webp$/)
      expect(publicFile(src)).toBe(true)
    }
  })

  it('points the OLYMPN Sport hero at the model photo and the ad, with a poster', () => {
    const assets = [sport.hero.image, sport.hero.video, sport.hero.poster]
    expect(assets).toEqual(['/brand/model-dune.webp', '/brand/ad-dune.mp4', '/brand/ad-dune-poster.jpg'])
    for (const src of assets) expect(publicFile(src as string)).toBe(true)
  })
```

- [ ] **Step 6: Schrijf de falende hometests**

Vervang `app/page.test.tsx` volledig:

```tsx
import { render, screen, within } from '@testing-library/react'
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

const [olympian, sport] = DROPS
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
    expect([...document.querySelectorAll('[id^="row-"]')].map((h) => h.textContent)).toEqual(['OLYMPN Sport', 'Olympian'])
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

  it('puts the photo of the next drop in the hero and loads it first', async () => {
    render(await HomePage())
    const photo = screen.getByRole('img', { name: sport.hero.alt })
    expect(photo).toHaveAttribute('loading', 'eager')
    expect(photo).toHaveAttribute('fetchpriority', 'high')
  })

  it('has an Olympian photo band with the campaign still and four model photos', async () => {
    render(await HomePage())
    const band = screen.getByRole('region', { name: 'Olympian in four colours' })
    expect(within(band).getByRole('img', { name: 'Olympian campaign still' })).toBeInTheDocument()
    expect(within(band).getAllByRole('img', { name: /^Olympian model photo/ })).toHaveLength(4)
    expect(within(band).getByRole('link', { name: 'Shop Olympian' })).toHaveAttribute('href', '/collections/olympian')
  })

  it('has an OLYMPN Sport band with two ads that never preload', async () => {
    render(await HomePage())
    // The hero and the tile row are also named "OLYMPN Sport", so select the band by its data attribute.
    const band = document.querySelector('[data-band="sport"]') as HTMLElement
    const videos = band.querySelectorAll('video')
    expect(videos).toHaveLength(2)
    for (const video of videos) {
      expect(video).toHaveAttribute('preload', 'none')
      expect(video.getAttribute('poster')).toMatch(/^\/brand\/ad-[a-z]+-poster\.jpg$/)
    }
    expect(within(band).getByText('Edition 02 · Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(within(band).getByRole('link', { name: 'Explore OLYMPN Sport' })).toHaveAttribute('href', '/collections/olympn-sport')
  })

  it('teases the OLYMPN Sport band only before the release', async () => {
    render(await HomePage())
    expect(screen.getByRole('img', { name: 'Something is coming.' })).toBeInTheDocument()
    jest.spyOn(Date, 'now').mockReturnValue(AFTER)
    const { container } = render(await HomePage())
    expect(within(container).queryByRole('img', { name: 'Something is coming.' })).toBeNull()
    expect(within(container).getByText('Edition 02 · Live now')).toBeInTheDocument()
  })

  it('ends with a waitlist strip for every future edition', async () => {
    render(await HomePage())
    const strip = screen.getByRole('region', { name: 'Never miss an edition' })
    expect(within(strip).getByLabelText('Email for drop alerts')).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run de tests, verwacht falen**

Run: `npm test -- (app/page.test|lib/drops.test)`
Expected: FAIL: de hero heeft geen foto, de banden en de strook ontbreken. `lib/drops.test.ts` is al groen.

- [ ] **Step 8: Vervang `app/page.tsx`**

```tsx
import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import AutoplayVideo from '@/components/ui/AutoplayVideo/AutoplayVideo'
import { buttonClasses } from '@/components/ui/Button/Button'
import DropBlock from '@/components/ui/DropBlock/DropBlock'
import ProductTile from '@/components/ui/ProductTile/ProductTile'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
import { OLYMPN_SPORT_WORDMARK, SOMETHING_IS_COMING, SPORT_ADS } from '@/lib/brand'
import { getShopProducts, type ShopProduct } from '@/lib/catalog'
import {
  currentTimeMs, getDrop, getNextDrop, isDropListed, listDropsNewestFirst, toDropView, type DropView,
} from '@/lib/drops'
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

/** The Olympian model photos in public/olympian (939x1400), one per colourway. */
const OLYMPIAN_MODELS = [
  { src: '/olympian/olympian-teal-model.jpg', colour: 'teal' },
  { src: '/olympian/olympian-clay-model.jpg', colour: 'clay' },
  { src: '/olympian/olympian-wheat-model.jpg', colour: 'wheat' },
  { src: '/olympian/olympian-rosa-model.jpg', colour: 'rosa' },
]

function statusLine(view: DropView): string {
  if (view.status === 'upcoming') return `${view.editionLabel} · Drops ${view.startsAtLabel}`
  if (view.status === 'live') return `${view.editionLabel} · Live now`
  return `${view.editionLabel} · Released ${view.startsOnLabel}`
}

export default async function HomePage() {
  const now = currentTimeMs()
  const preview = await isPreviewSession()
  const clock = { preview }
  const next = getNextDrop(now, clock)
  const nextView = next ? toDropView(next, now, clock) : null

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, clock)
  } catch (err) {
    console.error('[Home] getShopProducts failed:', err)
  }

  const rows = await Promise.all(
    listDropsNewestFirst()
      .filter((drop) => isDropListed(drop, now, clock))
      .map(async (drop) => ({
        view: toDropView(drop, now, clock),
        tiles: await toTiles(products.filter((p) => p.drop.id === drop.id).slice(0, ROW_SIZE), now),
      }))
  )

  const olympian = getDrop('olympian')
  const olympianView = olympian && isDropListed(olympian, now, clock) ? toDropView(olympian, now, clock) : null
  const sport = getDrop('olympn-sport')
  const sportView = sport && isDropListed(sport, now, clock) ? toDropView(sport, now, clock) : null
  const sportTiles = sportView ? (sportView.status === 'upcoming' ? 1 : 0) + SPORT_ADS.length : 0

  return (
    <main className={styles.page}>
      {nextView && (
        <div className={styles.hero} data-tone={nextView.tone}>
          <div className={styles.heroCopy}>
            <DropBlock drop={nextView} now={now} as="h1" withIntro />
          </div>
          <div className={styles.heroMedia}>
            <Image
              src={nextView.hero.image}
              alt={nextView.hero.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="eager"
              fetchPriority="high"
              className={styles.heroImage}
            />
          </div>
        </div>
      )}

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

      {olympian && olympianView && (
        <section className={styles.olyBand} aria-labelledby="olympian-band-title">
          <div className={styles.olyLead}>
            <div className={styles.olyPoster}>
              <Image
                src={olympian.hero.poster ?? olympian.hero.image}
                alt="Olympian campaign still"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className={styles.cover}
              />
            </div>
            <div className={styles.olyText}>
              <p className={styles.rowLabel}>{olympianView.editionLabel}</p>
              <h2 id="olympian-band-title" className={styles.bandTitle}>Olympian in four colours</h2>
              <p className={styles.bandText}>{olympianView.intro}</p>
              <Link href={olympianView.href} className={styles.rowLink}>Shop Olympian</Link>
            </div>
          </div>
          <ul className={styles.olyModels}>
            {OLYMPIAN_MODELS.map((model) => (
              <li key={model.src} className={styles.olyModel}>
                <Image
                  src={model.src}
                  alt={`Olympian model photo, ${model.colour} colourway`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className={styles.cover}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sportView && (
        <section className={styles.sportBand} data-band="sport" aria-labelledby="sport-band-title">
          <div className={styles.sportInner}>
            <div className={styles.sportHead}>
              <h2 id="sport-band-title" className={styles.sportTitle}>
                <Image
                  src={OLYMPN_SPORT_WORDMARK.src}
                  alt="OLYMPN Sport"
                  width={OLYMPN_SPORT_WORDMARK.width}
                  height={OLYMPN_SPORT_WORDMARK.height}
                  sizes="(min-width: 1024px) 560px, 90vw"
                  className={styles.sportWordmark}
                />
              </h2>
              <p className={styles.sportMeta}>{statusLine(sportView)}</p>
              <Link href={sportView.href} className={buttonClasses('accent', 'lg')}>Explore OLYMPN Sport</Link>
            </div>
            <ul className={styles.sportMedia} style={{ '--tiles': sportTiles } as CSSProperties}>
              {sportView.status === 'upcoming' && (
                <li className={styles.sportTile} data-teaser="true">
                  <Image
                    src={SOMETHING_IS_COMING.src}
                    alt="Something is coming."
                    fill
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className={styles.contain}
                  />
                </li>
              )}
              {SPORT_ADS.map((ad) => (
                <li key={ad.src} className={styles.sportTile}>
                  <AutoplayVideo src={ad.src} poster={ad.poster} label={ad.label} width={ad.width} height={ad.height} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className={styles.waitlist} aria-labelledby="waitlist-title">
        <div className={styles.waitlistInner}>
          <p className={styles.waitlistLabel}>Drop alerts</p>
          <h2 id="waitlist-title" className={styles.bandTitle}>Never miss an edition</h2>
          <p className={styles.bandText}>One email when a new edition opens. No newsletter, no spam.</p>
          <WaitlistForm compact />
        </div>
      </section>
    </main>
  )
}
```

De hero-foto krijgt `fetchPriority="high"` (het LCP-beeld); de eerste tegelrij blijft `eager` zonder hoge prioriteit, zoals spec sectie 9 vraagt.

- [ ] **Step 9: Vervang `app/page.module.css`**

```css
.page {
  min-height: 100vh;
  padding-top: var(--l-chrome);
  background: var(--c-bg);
  color: var(--c-text);
}

/* Hero: the next drop's block beside its photo, on the drop's own tone. */
.hero {
  display: grid;
  background: var(--c-bg);
}

.hero[data-tone='dark'] {
  background: var(--c-inverse-bg);
}

.heroCopy {
  display: grid;
  align-content: center;
}

.heroMedia {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--c-accent);
}

.heroImage {
  object-fit: contain;
  object-position: center bottom;
}

/* Drop rows */
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

.rowTitle,
.bandTitle {
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

.olyText .rowLink {
  margin-left: 0;
}

.rowLink:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.rowGrid,
.olyModels {
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

.lineupImage,
.contain {
  object-fit: contain;
}

.cover {
  object-fit: cover;
}

/* Olympian photo band */
.olyBand {
  max-width: var(--l-max);
  margin: 0 auto;
  padding-top: var(--s-9);
}

.olyLead {
  display: grid;
  gap: var(--s-6);
  padding: 0 var(--l-gutter) var(--s-6);
}

.olyPoster {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--c-stone);
}

.olyText {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: var(--s-3);
}

.bandText {
  margin: 0;
  max-width: var(--l-text-max);
}

.olyModel {
  position: relative;
  aspect-ratio: 939 / 1400;
  background: var(--c-surface);
}

/* OLYMPN Sport video band */
.sportBand {
  margin-top: var(--s-9);
  padding: var(--s-9) var(--l-gutter);
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
}

.sportBand :focus-visible {
  outline-color: var(--c-inverse-text);
}

.sportInner {
  display: grid;
  gap: var(--s-7);
  max-width: var(--l-max);
  margin: 0 auto;
}

.sportHead {
  display: grid;
  justify-items: start;
  gap: var(--s-4);
}

.sportTitle {
  margin: 0;
  width: min(100%, 560px);
}

.sportWordmark {
  display: block;
  width: 100%;
  height: auto;
}

.sportMeta {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

.sportMedia {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--l-grid-gap);
  max-width: 1080px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sportTile {
  position: relative;
  aspect-ratio: 9 / 16;
  overflow: hidden;
  background: var(--c-inverse-bg);
}

.sportTile[data-teaser='true'] {
  grid-column: 1 / -1;
  aspect-ratio: 1 / 1;
  background: var(--c-sage);
}

/* Waitlist strip */
.waitlist {
  padding: var(--s-9) var(--l-gutter);
  background: var(--c-sage);
  color: var(--c-text);
}

.waitlistInner {
  display: grid;
  gap: var(--s-3);
  max-width: var(--l-text-max);
  margin: 0 auto;
}

.waitlistLabel {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text);
}

@media (min-width: 768px) {
  .rowGrid,
  .olyModels {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .sportMedia {
    grid-template-columns: repeat(var(--tiles, 2), minmax(0, 1fr));
  }

  .sportTile[data-teaser='true'] {
    grid-column: auto;
    aspect-ratio: 9 / 16;
  }
}

@media (min-width: 1024px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: calc(100vh - var(--l-chrome));
  }

  .heroMedia {
    aspect-ratio: auto;
    min-height: 100%;
  }

  .olyLead {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}
```

De muted-tekstkleur staat niet op de salie-strook: `#5B5A58` op `#BACCB1` haalt geen 4,5:1, daarom heeft de strook een eigen navy label (`.waitlistLabel`).

- [ ] **Step 10: Run de tests, verwacht groen**

Run: `npm test -- (app/page.test|lib/drops.test|AutoplayVideo)`
Expected: PASS.

- [ ] **Step 11: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Preview: hero met de Dune-modelfoto op periwinkle naast de klok, twee tegelrijen, de Olympian-band, de navy OLYMPN Sport-band met het oranje woordmerk, de teaser-tegel en twee ad-video's (desktop speelt, telefoon toont poster met bediening), salie waitlist-strook.

- [ ] **Step 12: Commit**

```bash
git add components/ui/AutoplayVideo lib/drops.ts lib/drops.test.ts app/page.tsx app/page.module.css app/page.test.tsx
git commit -m "feat: complete the home with photo band, OLYMPN Sport ads and waitlist strip"
```

---

### Task 4: Gedeelde tekstkolom voor About, FAQ, Size guide en legal

**Files:**
- Create: `test-utils/css-module-classes.ts`
- Create: `components/ui/TextPage/TextPage.module.css`
- Test: `components/ui/TextPage/TextPage.test.ts`
- Modify: `app/about/page.tsx:4`, `:46`
- Modify: `app/faq/page.tsx:4`, `:136` (fase 1-2 Task 9 wijzigde regel 117)
- Modify: `app/size-guide/page.tsx:10`, `:139` (fase 1-2 Task 7 wijzigde regel 3, 87, 112-117)
- Modify: `app/returns/page.tsx:3`, `:6`; Delete: `app/returns/returns.module.css`
- Modify: `app/terms/page.tsx:2`, `:5`, `:43`; Delete: `app/terms/terms.module.css`
- Modify: `app/privacy/page.tsx:2`, `:5`; Delete: `app/privacy/privacy.module.css`

**Interfaces:**
- Consumes: tokens (fase 1-2 Task 1).
- Produces:
  - `test-utils/css-module-classes.ts`: `classesUsed(file: string): string[]`, `classesDefined(cssFile: string): Set<string>`, `missingClasses(component: string, cssModule: string): string[]`, `stylesImport(file: string): string | null`, `nonV2Vars(cssFile: string): string[]` (paden relatief aan de repo-root).
  - `components/ui/TextPage/TextPage.module.css`: de klassen `page`, `inner`, `hero`, `eyebrow`, `title`, `lead`, `intro`, `meta`, `section`, `h2`, `heading`, `body`, `list`, `legal`, `link`, `ctaRow`, `cta`, `ctaGhost`, `facts`, `fact`, `factKey`, `factVal`, `related`, `relatedCard`, `relatedTitle`, `relatedNote`, `steps`, `step`, `stepNum`, `stepBody`, `stepText`, `stepTitle`, `tableWrap`, `table`, `faqGroup`, `faqItem`, `faqQuestion`, `faqAnswer`.

Dit is bewust een stijlwissel zonder tekstwijziging: de zes pagina's houden hun markup en klassenamen en krijgen één v2-stylesheet. Task 5 herschrijft daarna de inhoud van About, FAQ en Size guide.

- [ ] **Step 1: Schrijf de helper**

`test-utils/css-module-classes.ts`:

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'

const read = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8')

/** Every `styles.foo` a component reads. */
export function classesUsed(file: string): string[] {
  const names = [...read(file).matchAll(/\bstyles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1])
  return [...new Set(names)].sort()
}

/** Every `.foo` class selector a CSS module defines (comments ignored). */
export function classesDefined(cssFile: string): Set<string> {
  const css = read(cssFile).replace(/\/\*[\s\S]*?\*\//g, '')
  return new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]))
}

/** Classes a component reads that its CSS module does not define. */
export function missingClasses(component: string, cssModule: string): string[] {
  const defined = classesDefined(cssModule)
  return classesUsed(component).filter((name) => !defined.has(name))
}

/** The module path a file imports as `styles`, or null. */
export function stylesImport(file: string): string | null {
  const match = /import styles from '([^']+)'/.exec(read(file))
  return match ? match[1] : null
}

/** Custom properties a stylesheet reads that are not v2 tokens. */
export function nonV2Vars(cssFile: string): string[] {
  const names = [...read(cssFile).matchAll(/var\((--[A-Za-z0-9-]+)/g)].map((m) => m[1])
  return [...new Set(names)].filter((name) => !/^--(c|f|fs|s|r|l|m)-/.test(name))
}
```

- [ ] **Step 2: Schrijf de falende test**

`components/ui/TextPage/TextPage.test.ts`:

```ts
/** @jest-environment node */
import { existsSync, readFileSync } from 'node:fs'
import { missingClasses, nonV2Vars, stylesImport } from '../../../test-utils/css-module-classes'

const MODULE = 'components/ui/TextPage/TextPage.module.css'
const PAGES = [
  'app/about/page.tsx',
  'app/faq/page.tsx',
  'app/size-guide/page.tsx',
  'app/returns/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
]

describe.each(PAGES)('%s', (page) => {
  it('uses the shared text page stylesheet', () => {
    expect(stylesImport(page)).toBe('@/components/ui/TextPage/TextPage.module.css')
  })

  it('only uses classes that stylesheet defines', () => {
    expect(missingClasses(page, MODULE)).toEqual([])
  })

  it('no longer carries the v1 theme class', () => {
    expect(readFileSync(page, 'utf8')).not.toContain('oly-theme')
  })
})

describe('TextPage stylesheet', () => {
  it('reads v2 tokens only', () => {
    expect(nonV2Vars(MODULE)).toEqual([])
  })

  it('replaces the three legal stylesheets', () => {
    for (const file of ['app/returns/returns.module.css', 'app/terms/terms.module.css', 'app/privacy/privacy.module.css']) {
      expect(existsSync(file)).toBe(false)
    }
  })
})
```

- [ ] **Step 3: Run de test, verwacht falen**

Run: `npm test -- TextPage`
Expected: FAIL: `stylesImport` geeft `'../landing.module.css'` of `'./returns.module.css'`, de stylesheet bestaat niet.

- [ ] **Step 4: Schrijf de stylesheet**

`components/ui/TextPage/TextPage.module.css`:

```css
/* Text pages (About, FAQ, Size guide, Returns, Terms, Privacy): one text
   column under a big heading, v2 tokens only (spec section 5, Content). */

.page {
  padding: calc(var(--l-chrome) + var(--s-8)) var(--l-gutter) var(--s-9);
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-body);
  line-height: 1.5;
}

.inner {
  max-width: var(--l-text-max);
  margin: 0 auto;
}

.hero {
  display: grid;
  gap: var(--s-4);
  padding-bottom: var(--s-7);
  border-bottom: 1px solid var(--c-stone);
}

.eyebrow,
.meta,
.factKey {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.meta {
  margin-top: var(--s-3);
}

.title {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h1);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.lead,
.intro {
  margin: 0;
  font-size: 1.125rem;
}

.intro {
  margin-top: var(--s-6);
}

.section {
  display: grid;
  gap: var(--s-4);
  padding-top: var(--s-7);
}

.section p {
  margin: 0;
}

.h2,
.heading {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h3);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.body {
  margin: 0;
}

.list {
  display: grid;
  gap: var(--s-1);
  margin: 0;
  padding-left: var(--s-5);
}

.legal {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.link {
  color: var(--c-accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.link:focus-visible,
.cta:focus-visible,
.ctaGhost:focus-visible,
.relatedCard:focus-visible,
.faqQuestion:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.ctaRow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
}

.cta,
.ctaGhost {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--s-5);
  border: 1px solid var(--c-text);
  border-radius: var(--r-0);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  transition: opacity var(--m-fast) var(--m-ease);
}

.cta {
  background: var(--c-text);
  color: var(--c-inverse-text);
}

.ctaGhost {
  background: transparent;
  color: var(--c-text);
}

.cta:hover,
.ctaGhost:hover {
  opacity: 0.85;
}

.facts {
  display: grid;
}

.fact {
  display: grid;
  gap: var(--s-1);
  padding: var(--s-3) 0;
  border-top: 1px solid var(--c-stone);
}

.factVal {
  overflow-wrap: anywhere;
}

.related {
  display: grid;
  gap: var(--l-grid-gap);
  background: var(--c-stone);
}

.relatedCard {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-5);
  background: var(--c-surface);
  color: var(--c-text);
  text-decoration: none;
}

.relatedTitle {
  font-family: var(--f-display);
  font-size: var(--fs-h3);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.relatedNote {
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.steps {
  display: grid;
  gap: var(--s-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: grid;
  grid-template-columns: var(--s-7) minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
}

.stepNum {
  display: grid;
  place-items: center;
  width: var(--s-7);
  height: var(--s-7);
  border: 1px solid var(--c-text);
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.stepBody,
.stepText {
  display: grid;
  gap: var(--s-1);
}

.stepTitle {
  font-weight: 600;
}

.tableWrap {
  overflow-x: auto;
  border: 1px solid var(--c-stone);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.table caption {
  padding: var(--s-3);
  caption-side: top;
  text-align: left;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.table th,
.table td {
  padding: var(--s-2) var(--s-3);
  border-top: 1px solid var(--c-stone);
  text-align: left;
  white-space: nowrap;
}

.table thead th {
  font-family: var(--f-mono);
  font-weight: 500;
}

.faqGroup {
  border-top: 1px solid var(--c-stone);
}

.faqItem {
  border-bottom: 1px solid var(--c-stone);
}

.faqQuestion {
  padding: var(--s-4) 0;
  font-weight: 600;
  cursor: pointer;
}

.faqAnswer {
  display: grid;
  gap: var(--s-2);
  padding-bottom: var(--s-4);
}

@media (min-width: 768px) {
  .related {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

- [ ] **Step 5: Zet de zes pagina's om**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
perl -pi -e 's#^import styles from \x27\.\./landing\.module\.css\x27$#import styles from \x27\@/components/ui/TextPage/TextPage.module.css\x27#' app/about/page.tsx app/faq/page.tsx app/size-guide/page.tsx
perl -pi -e 's#^import styles from \x27\./(returns|terms|privacy)\.module\.css\x27$#import styles from \x27\@/components/ui/TextPage/TextPage.module.css\x27#' app/returns/page.tsx app/terms/page.tsx app/privacy/page.tsx
perl -pi -e 's#<main className=\{`\$\{styles\.page\} oly-theme`\}>#<main className={styles.page}>#' app/about/page.tsx app/faq/page.tsx app/size-guide/page.tsx
perl -CSD -pi -e "s/title: 'Returns \x{2014} 7ENO',/title: 'Returns',/" app/returns/page.tsx
perl -CSD -pi -e "s/title: 'Terms & Conditions \x{2014} 7ENO',/title: 'Terms & Conditions',/; s/5\x{2013}10 business days/5 to 10 business days/" app/terms/page.tsx
perl -CSD -pi -e "s/title: 'Privacy Policy \x{2014} 7ENO',/title: 'Privacy Policy',/" app/privacy/page.tsx
git rm -q app/returns/returns.module.css app/terms/terms.module.css app/privacy/privacy.module.css
grep -n "import styles\|<main" app/about/page.tsx app/faq/page.tsx app/size-guide/page.tsx app/returns/page.tsx app/terms/page.tsx app/privacy/page.tsx
grep -n "title: '" app/returns/page.tsx app/terms/page.tsx app/privacy/page.tsx | head -3
```

Expected: zes regels `import styles from '@/components/ui/TextPage/TextPage.module.css'` en zes keer `<main className={styles.page}>`; de drie legal-titels zonder "· 7ENO" (de layout-template voegt het merk al toe: `'%s · 7ENO (Zeno)'`).

- [ ] **Step 6: Run de test, verwacht groen**

Run: `npm test -- TextPage`
Expected: PASS, 20 tests.

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Preview: `/about`, `/faq`, `/size-guide`, `/returns`, `/terms`, `/privacy` op crème in Instrument Sans met een grote Archivo-kop en één tekstkolom.

- [ ] **Step 8: Commit**

```bash
git add test-utils components/ui/TextPage app/about/page.tsx app/faq/page.tsx app/size-guide/page.tsx \
  app/returns app/terms app/privacy
git commit -m "feat: move the text and legal pages onto one v2 text column"
```

---

### Task 5: About, FAQ en Size guide zonder OG

**Files:**
- Modify: `app/about/page.tsx:6-7`, `:10`, `:61`, `:80-93`, `:104`, `:108-117`, `:143-147` (na Task 4)
- Modify: `app/faq/page.tsx:1-4`, `:10`, `:49`, `:115-117`, `:150`, `:155-175` (na Task 4)
- Test: `app/faq/page.test.tsx`
- Modify: `app/size-guide/page.tsx:12-13`, `:16`, `:39`, `:59-76`, `:148`, `:182`, `:196`, `:217-231`, `:237` (na Task 4)
- Test: `app/size-guide/page.test.tsx`
- Modify: `components/ui/TextPage/TextPage.module.css` (de regels voor `.faqItem`, `.faqQuestion`, `.faqAnswer` en hun focusregel eruit)

**Interfaces:**
- Consumes: `Accordion` (fase 3 Task 2: `export default function Accordion({ items }: { items: { title: string; content: ReactNode }[]; defaultOpen?: number })`, één `details` per item); `getShopProducts`, `ShopProduct` (fase 1-2 Task 7); `getProduct`, `getCatalogProductId`, `getSizeGuide`, `SizeGuide` (`lib/printful.ts`).
- Produces: nieuwe inhoud, geen nieuwe exports.

Werk per bestand van onder naar boven: dan blijven de regelnummers van de nog te doen stappen kloppen. Regels met een lang streepje vervang je met de Edit-tool na het bestand eerst te lezen (de oude tekst bevat het teken), of met de `perl`-regel die erbij staat.

- [ ] **Step 1: Schrijf de falende tests**

`app/faq/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import FaqPage from './page'

describe('FAQ', () => {
  it('answers in accordions, one details element per question', () => {
    render(<FaqPage />)
    const question = screen.getByText('Which payment methods can I use?')
    expect(question.closest('summary')).not.toBeNull()
    expect(question.closest('details')).not.toBeNull()
  })

  it('keeps every structured-data answer visible on the page', () => {
    const { container } = render(<FaqPage />)
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')]
    const faq = scripts.map((s) => JSON.parse(s.textContent ?? '{}')).find((d) => d['@type'] === 'FAQPage')
    expect(faq.mainEntity.length).toBeGreaterThan(5)
    for (const entry of faq.mainEntity) {
      expect(screen.getByText(entry.acceptedAnswer.text)).toBeInTheDocument()
    }
  })

  it('explains the two editions and never mentions OG', () => {
    const { container } = render(<FaqPage />)
    expect(screen.getByText('What is the difference between Olympian and OLYMPN Sport?')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\bOG\b/)
    expect(container.textContent).not.toMatch(/[\u2013\u2014]/)
  })
})
```

`app/size-guide/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop } from '@/lib/drops'
import SizeGuidePage from './page'

const mockGetShopProducts = jest.fn()
jest.mock('../../lib/catalog', () => ({ getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args) }))
jest.mock('../../lib/printful', () => ({
  getProduct: async (id: string) => ({ sync_variants: [{ variant_id: Number(id.length), size: 'M' }] }),
  getCatalogProductId: async (variantId: number) => variantId,
  getSizeGuide: async (catalogId: number) => ({
    unit: 'cm',
    sizes: ['M', 'L'],
    rows: [{ label: 'Chest', values: { M: `${100 + catalogId}`, L: '' } }],
  }),
}))

const [olympian, sport] = DROPS

function product(name: string, drop: Drop): ShopProduct {
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  return {
    provider: 'printful', id: slug, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status: 'live', purchasable: true, soldOut: false,
  }
}

beforeEach(() => {
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('Olympian Tee Ocean Unisex', olympian),
    product('OLYMPN Sport Oversized Hoodie Mocha', sport),
    product('OLYMPN Sport Relaxed Hoodie Dune Long', sport),
  ])
})

describe('size guide', () => {
  it('shows a table per OLYMPN Sport cut and none for the retired OG range', async () => {
    render(await SizeGuidePage())
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport oversized hoodie' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'OLYMPN Sport relaxed hoodie' })).toBeInTheDocument()
    expect(screen.queryByText(/OG tee/)).toBeNull()
  })

  it('captions tables with a colon and marks empty cells with a hyphen', async () => {
    render(await SizeGuidePage())
    expect(screen.getByText('OLYMPN Sport oversized hoodie: body measurements (cm)')).toBeInTheDocument()
    expect(screen.getAllByRole('cell', { name: '-' }).length).toBeGreaterThan(0)
  })

  it('contains no long dashes', async () => {
    const { container } = render(await SizeGuidePage())
    expect(container.textContent).not.toMatch(/[\u2013\u2014]/)
  })
})
```

De printful-mock geeft per product een andere `catalogId` (de lengte van de slug), zodat de pagina geen tabellen samenvoegt die toevallig gelijk zijn.

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (app/faq|app/size-guide)`
Expected: FAIL: de FAQ rendert nog eigen `details` met "→" en noemt OG; de size guide kent geen hoodies en zet een lang streepje in caption en lege cellen.

- [ ] **Step 3: About**

In `app/about/page.tsx`, van onder naar boven:

Vervang regel 143-147:

```tsx
            <Link href="/olympian" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Olympian &rsquo;26</span>
              <span className={styles.relatedNote}>The four-colourway capsule and where it came from.</span>
            </Link>
```

door:

```tsx
            <Link href="/archive" className={styles.relatedCard}>
              <span className={styles.relatedTitle}>Archive</span>
              <span className={styles.relatedNote}>Every edition, its release window and its status.</span>
            </Link>
```

Verwijder regel 108-117 (de hele sectie "A tee that gives something back" van `<section className={styles.section}>` tot en met `</section>` plus de lege regel erna): het Life4HSP-shirt is een OG-product en staat niet meer in de winkel.

Regel 104 (lang streepje):

```bash
perl -CSD -pi -e 's/handed over \x{2014} instead of shipping/handed over, instead of shipping/' app/about/page.tsx
```

Vervang regel 80-93:

```tsx
        <section className={styles.section}>
          <h2 className={styles.h2}>Two collections, two moods</h2>
          <p className={styles.body}>
            <strong>OG</strong> is the original range and the darker one: ink, blood red and butter,
            with the 7ENO beeldmerk used as a mark rather than a slogan. It covers tees, sport tees
            and shorts, caps and accessories.
          </p>
          <p className={styles.body}>
            <strong>Olympian &rsquo;26</strong> is the newer capsule and the warmer one, built
            around four dusty colourways and a rounded early-2000s wordmark. Read more on the{' '}
            <Link href="/olympian" className={styles.link}>Olympian collection page</Link>, or shop{' '}
            <Link href="/shop?line=og" className={styles.link}>OG</Link> directly.
          </p>
        </section>
```

door:

```tsx
        <section className={styles.section}>
          <h2 className={styles.h2}>Numbered editions</h2>
          <p className={styles.body}>
            7ENO releases in editions. Each one has a number, a release window and its own look,
            and stays in the archive once it closes.
          </p>
          <p className={styles.body}>
            <strong>Olympian</strong> is edition 01: ringer tees, knitted tees and backpacks in four
            dusty colourways. <strong>OLYMPN Sport</strong> is edition 02: oversized and relaxed
            hoodies, released as a timed drop. See{' '}
            <Link href="/collections/olympian" className={styles.link}>Olympian</Link>,{' '}
            <Link href="/collections/olympn-sport" className={styles.link}>OLYMPN Sport</Link> or the{' '}
            <Link href="/archive" className={styles.link}>archive</Link>.
          </p>
        </section>
```

Vervang regel 61:

```tsx
            <Link href="/olympian" className={styles.ctaGhost}>See Olympian &rsquo;26</Link>
```

door:

```tsx
            <Link href="/archive" className={styles.ctaGhost}>See every edition</Link>
```

Regel 10 (lang streepje) en regel 6-7:

```bash
perl -CSD -pi -e "s/title: 'About 7ENO \x{2014} pronounced \"Zeno\"',/title: 'About 7ENO, pronounced \"Zeno\"',/" app/about/page.tsx
perl -pi -e 's/made to order in two collections: OG and Olympian\./made to order in numbered editions: Olympian and OLYMPN Sport./' app/about/page.tsx
grep -nE "OG|olympian'|Life4HSP" app/about/page.tsx
```

Expected: de laatste `grep` geeft niets.

- [ ] **Step 4: FAQ met Accordion**

In `app/faq/page.tsx`, van onder naar boven. Vervang het `GROUPS.map`-blok (regel 155-175, na Task 4):

```tsx
        {GROUPS.map((group) => (
          <section key={group.title} className={styles.section}>
            <h2 className={styles.h2}>{group.title}</h2>
            <div className={styles.faqGroup}>
              {group.items.map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>{item.q}</summary>
                  <div className={styles.faqAnswer}>
                    <p>{item.a}</p>
                    {item.link && (
                      <p style={{ marginTop: 10 }}>
                        <Link href={item.link.href} className={styles.link}>{item.link.label} →</Link>
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
```

door:

```tsx
        {GROUPS.map((group) => (
          <section key={group.title} className={styles.section}>
            <h2 className={styles.h2}>{group.title}</h2>
            <div className={styles.faqGroup}>
              <Accordion
                items={group.items.map((item) => ({
                  title: item.q,
                  content: (
                    <>
                      <p>{item.a}</p>
                      {item.link && (
                        <p>
                          <Link href={item.link.href} className={styles.link}>{item.link.label}</Link>
                        </p>
                      )}
                    </>
                  ),
                }))}
              />
            </div>
          </section>
        ))}
```

Vervang de vraag over de collecties (regel 115-117) met:

```bash
perl -0pi -e "s{q: 'What is the difference between the OG and Olympian collections\?',\n\s+a: '[^\n]*',\n\s+link: \{ href: '/collections/olympian', label: 'See Olympian' \},}{q: 'What is the difference between Olympian and OLYMPN Sport?',\n        a: 'They are two numbered editions. Olympian (edition 01) is ringer tees, knitted tees and backpacks in four colourways: Coconut, Ocean, Sand and Flamingo. OLYMPN Sport (edition 02) is oversized and relaxed hoodies with the OLYMPN SPORT print, released as a timed drop.',\n        link: { href: '/archive', label: 'See every edition' },}" app/faq/page.tsx
```

Regel 150, 49 en 10 (lange streepjes):

```bash
perl -CSD -pi -e 's/returns and sizing \x{2014} the things worth knowing/returns and sizing: the things worth knowing/; s/production can start quickly \x{2014} once it has, the order/production can start quickly. Once it has, the order/; s/title: \x27FAQ \x{2014} ordering, delivery and returns\x27,/title: \x27FAQ: ordering, delivery and returns\x27,/' app/faq/page.tsx
```

Voeg de import toe: vervang regel 2

```tsx
import Link from 'next/link'
```

door:

```tsx
import Link from 'next/link'
import Accordion from '@/components/ui/Accordion/Accordion'
```

Haal in `components/ui/TextPage/TextPage.module.css` de blokken `.faqItem { ... }`, `.faqQuestion { ... }` en `.faqAnswer { ... }` weg, en de regel `.faqQuestion:focus-visible` uit de gedeelde focusregel (de vorige regel `.relatedCard:focus-visible,` eindigt dan op een komma; maak er `.relatedCard:focus-visible {` van). `Accordion` heeft zijn eigen stijl uit fase 3.

```bash
grep -nE "\bOG\b|→|faqItem|faqQuestion|faqAnswer" app/faq/page.tsx components/ui/TextPage/TextPage.module.css
```

Expected: niets.

- [ ] **Step 5: Size guide**

In `app/size-guide/page.tsx`, van onder naar boven.

Regel 237 en 196, 182, 148 (lange streepjes):

```bash
perl -CSD -pi -e 's/Order the size you think is right \x{2014} you have/Order the size you think is right: you have/; s/\{row\.values\[s\] \?\? \x27\x{2014}\x27\}/{row.values[s] || \x27-\x27}/; s/\{g\.label\} \x{2014} body measurements/{g.label}: body measurements/; s/in centimetres \x{2014} the size that matches/in centimetres: the size that matches/' app/size-guide/page.tsx
```

`|| '-'` in plaats van `?? '-'`: Printful levert soms een lege string voor een maat, en die moet ook een streepje krijgen.

Vervang de sectie "How the fits run" (regel 217-231: van `<section className={styles.section}>` direct boven `<h2 className={styles.h2}>How the fits run</h2>` tot en met de bijbehorende `</section>`; lees het bestand eerst, de oude tekst bevat een lang streepje) door:

```tsx
        <section className={styles.section}>
          <h2 className={styles.h2}>How the fits run</h2>
          <p className={styles.body}>
            The Olympian ringer tee is a heavyweight, garment-dyed blank with a boxy body: it sits
            wide rather than long. If you want the relaxed look it is drawn for, stay at your
            normal size; size up only if you want it clearly oversized.
          </p>
          <p className={styles.body}>
            The knitted tee is the heavier of the two and has less give, so if you are between
            sizes there, take the larger one.
          </p>
          <p className={styles.body}>
            The OLYMPN Sport hoodies come in two cuts, oversized and relaxed, each with its own
            table above. Compare your chest measurement with the table of the cut you want.
          </p>
          <p className={styles.body}>
            Unisex sizing is cut to the men&rsquo;s measurements. If you usually wear a women&rsquo;s
            size and want a fitted look, taking one size down is normally the safer choice.
          </p>
        </section>
```

Vervang `TARGETS` (regel 59-76):

```ts
const TARGETS: GuideTarget[] = [
  {
    label: 'Olympian ringer tee',
    match: (n) => n.includes('olympian') && n.includes('tee') && !n.includes('knitted'),
  },
  {
    label: 'Olympian knitted tee',
    match: (n) => n.includes('olympian') && n.includes('knitted'),
  },
  {
    label: 'OG tee',
    match: (n) => !n.includes('olympian') && n.includes('tee') && !n.includes('sport'),
  },
  {
    label: 'Sport tee',
    match: (n) => n.includes('sport') && n.includes('tee'),
  },
]
```

door:

```ts
const TARGETS: GuideTarget[] = [
  {
    label: 'Olympian ringer tee',
    match: (n) => n.startsWith('olympian ') && n.includes('tee') && !n.includes('knitted'),
  },
  {
    label: 'Olympian knitted tee',
    match: (n) => n.startsWith('olympian ') && n.includes('knitted'),
  },
  {
    label: 'OLYMPN Sport oversized hoodie',
    match: (n) => n.startsWith('olympn sport ') && n.includes('oversized'),
  },
  {
    label: 'OLYMPN Sport relaxed hoodie',
    match: (n) => n.startsWith('olympn sport ') && n.includes('relaxed'),
  },
]
```

Regel 39 en 16 (lange streepjes) en regel 12-13:

```bash
perl -CSD -pi -e 's/Breathe normally \x{2014} do not pull it tight\./Breathe normally and do not pull it tight./; s/title: \x27Size guide \x{2014} find your fit\x27,/title: \x27Size guide: find your fit\x27,/; s/body measurements in centimetres for the tees, how to measure yourself/body measurements in centimetres for the tees and hoodies, how to measure yourself/' app/size-guide/page.tsx
grep -nP "[\x{2013}\x{2014}]|OG tee|Sport tee" app/size-guide/page.tsx app/about/page.tsx app/faq/page.tsx
```

Expected: de `grep` geeft niets.

- [ ] **Step 6: Run de tests, verwacht groen**

Run: `npm test -- (app/faq|app/size-guide|TextPage)`
Expected: PASS.

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Preview: About noemt de twee edities en linkt naar Archive; FAQ klapt open per vraag; de size guide toont de hoodietabellen zodra de OLYMPN Sport-producten in de store staan (vóór "Add to store" alleen de Olympian-tabellen).

- [ ] **Step 8: Commit**

```bash
git add app/about/page.tsx app/faq app/size-guide components/ui/TextPage/TextPage.module.css
git commit -m "feat: rewrite About, FAQ and size guide for the two editions, FAQ in accordions"
```

---

### Task 6: Accountpagina's in één smalle kolom

**Files:**
- Modify: `app/account/(protected)/account.layout.module.css:1-116` (volledig vervangen)
- Modify: `app/account/login/login.module.css:1-165` (volledig vervangen)
- Modify: `app/account/(protected)/dashboard/dashboard.module.css:1-137` (volledig vervangen)
- Modify: `app/account/(protected)/profile/profile.module.css:1-131` (volledig vervangen)
- Modify: `app/account/(protected)/orders/orders.module.css:1-247` (volledig vervangen)
- Modify: `app/account/login/page.tsx:55-56`, `:66-67` (labels koppelen)
- Modify: `app/account/register/page.tsx:49` (inline v1-stijl), `:74-75`, `:85-86`, `:96-97` (labels)
- Modify: `app/account/(protected)/profile/page.tsx:105-106`, `:112-113`, `:116-117`, `:123-124`, `:127-128`, `:134-135` (labels)
- Test: `app/account/account-styles.test.ts`, `app/account/login/page.test.tsx`, `app/account/register/page.test.tsx`

**Interfaces:**
- Consumes: `missingClasses`, `nonV2Vars` (Task 4).
- Produces: geen nieuwe exports. Logica (Supabase-auth, redirects, formulieracties) blijft ongewijzigd; alleen CSS, `htmlFor`/`id`-paren en één `className` in plaats van een inline stijl.

- [ ] **Step 1: Schrijf de falende tests**

`app/account/account-styles.test.ts`:

```ts
/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { missingClasses, nonV2Vars } from '../../test-utils/css-module-classes'

const LAYOUT_CSS = 'app/account/(protected)/account.layout.module.css'
const LOGIN_CSS = 'app/account/login/login.module.css'
const PAIRS: [string, string][] = [
  ['app/account/(protected)/layout.tsx', LAYOUT_CSS],
  ['app/account/(protected)/AccountLogout.tsx', LAYOUT_CSS],
  ['app/account/login/page.tsx', LOGIN_CSS],
  ['app/account/register/page.tsx', LOGIN_CSS],
  ['app/account/(protected)/dashboard/page.tsx', 'app/account/(protected)/dashboard/dashboard.module.css'],
  ['app/account/(protected)/profile/page.tsx', 'app/account/(protected)/profile/profile.module.css'],
  ['app/account/(protected)/orders/page.tsx', 'app/account/(protected)/orders/orders.module.css'],
]

describe('account styles', () => {
  it.each(PAIRS)('%s only uses classes its module defines', (component, css) => {
    expect(missingClasses(component, css)).toEqual([])
  })

  it.each([...new Set(PAIRS.map(([, css]) => css))])('%s reads v2 tokens only', (css) => {
    expect(nonV2Vars(css)).toEqual([])
  })

  it('register no longer inlines v1 tokens', () => {
    expect(readFileSync('app/account/register/page.tsx', 'utf8')).not.toMatch(/var\(--(font-sans|stone)\)/)
  })

  it('ties every profile label to its field', () => {
    const source = readFileSync('app/account/(protected)/profile/page.tsx', 'utf8')
    const labels = [...source.matchAll(/<label htmlFor="([a-z-]+)"/g)].map((m) => m[1])
    expect(labels).toEqual(['profile-name', 'profile-line1', 'profile-line2', 'profile-postal', 'profile-city', 'profile-country'])
    for (const id of labels) expect(source).toContain(`id="${id}"`)
  })
})
```

`app/account/login/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import LoginPage from './page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('../../../lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword: jest.fn(), getUser: jest.fn() } }),
}))
jest.mock('../../../components/GoogleSignIn/GoogleSignIn', () => ({ __esModule: true, default: () => null }))

describe('login', () => {
  it('labels every field so it can be found by its label', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })
})
```

`app/account/register/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import RegisterPage from './page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
jest.mock('../../../lib/supabase/client', () => ({
  createClient: () => ({ auth: { signUp: jest.fn(), getUser: jest.fn() } }),
}))
jest.mock('../../../components/GoogleSignIn/GoogleSignIn', () => ({ __esModule: true, default: () => null }))

describe('register', () => {
  it('labels every field so it can be found by its label', () => {
    render(<RegisterPage />)
    expect(screen.getByLabelText('Full name')).toHaveAttribute('autocomplete', 'name')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- app/account`
Expected: FAIL: `nonV2Vars` vindt `--bone`, `--ink`, `--font-mono` en meer; `getByLabelText` vindt geen gekoppeld veld; de profieltest vindt geen `htmlFor`.

- [ ] **Step 3: Koppel de labels**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
perl -0pi -e 's{<label className=\{styles\.fieldLabel\}>Email address</label>\n(\s+)<input\n}{<label htmlFor="login-email" className={styles.fieldLabel}>Email address</label>\n$1<input\n$1  id="login-email"\n}; s{<label className=\{styles\.fieldLabel\}>Password</label>\n(\s+)<input\n}{<label htmlFor="login-password" className={styles.fieldLabel}>Password</label>\n$1<input\n$1  id="login-password"\n}' app/account/login/page.tsx
perl -0pi -e 's{<label className=\{styles\.fieldLabel\}>Full name</label>\n(\s+)<input\n}{<label htmlFor="register-name" className={styles.fieldLabel}>Full name</label>\n$1<input\n$1  id="register-name"\n}; s{<label className=\{styles\.fieldLabel\}>Email address</label>\n(\s+)<input\n}{<label htmlFor="register-email" className={styles.fieldLabel}>Email address</label>\n$1<input\n$1  id="register-email"\n}; s{<label className=\{styles\.fieldLabel\}>Password</label>\n(\s+)<input\n}{<label htmlFor="register-password" className={styles.fieldLabel}>Password</label>\n$1<input\n$1  id="register-password"\n}' app/account/register/page.tsx
perl -0pi -e 's{<p style=\{\{ fontFamily: \x27var\(--font-sans\)\x27, fontSize: \x271rem\x27, color: \x27var\(--stone\)\x27, lineHeight: 1\.6 \}\}>}{<p className={styles.note}>}' app/account/register/page.tsx
P='app/account/(protected)/profile/page.tsx'
perl -0pi -e 's{<label className=\{styles\.fieldLabel\}>Full name</label>\n(\s+)<input className}{<label htmlFor="profile-name" className={styles.fieldLabel}>Full name</label>\n$1<input id="profile-name" className}; s{<label className=\{styles\.fieldLabel\}>Street address</label>\n(\s+)<input className}{<label htmlFor="profile-line1" className={styles.fieldLabel}>Street address</label>\n$1<input id="profile-line1" className}; s{<label className=\{styles\.fieldLabel\}>Apartment, suite, etc\. \(optional\)</label>\n(\s+)<input className}{<label htmlFor="profile-line2" className={styles.fieldLabel}>Apartment, suite, etc. (optional)</label>\n$1<input id="profile-line2" className}; s{<label className=\{styles\.fieldLabel\}>Postal code</label>\n(\s+)<input className}{<label htmlFor="profile-postal" className={styles.fieldLabel}>Postal code</label>\n$1<input id="profile-postal" className}; s{<label className=\{styles\.fieldLabel\}>City</label>\n(\s+)<input className}{<label htmlFor="profile-city" className={styles.fieldLabel}>City</label>\n$1<input id="profile-city" className}; s{<label className=\{styles\.fieldLabel\}>Country</label>\n(\s+)<select className}{<label htmlFor="profile-country" className={styles.fieldLabel}>Country</label>\n$1<select id="profile-country" className}' "$P"
grep -c 'htmlFor=' app/account/login/page.tsx app/account/register/page.tsx "$P"
```

Expected: `2`, `3`, `6`.

- [ ] **Step 4: Vervang de vijf CSS-modules**

`app/account/(protected)/account.layout.module.css`:

```css
/* Account: one narrow column with mono labels (spec section 5). */
.wrapper {
  display: grid;
  gap: var(--s-7);
  max-width: 34rem;
  margin: 0 auto;
  padding: calc(var(--l-chrome) + var(--s-7)) var(--l-gutter) var(--s-9);
  color: var(--c-text);
}

.sidebar {
  display: grid;
  gap: var(--s-4);
  padding-bottom: var(--s-5);
  border-bottom: 1px solid var(--c-stone);
}

.sidebarTop {
  display: grid;
  gap: var(--s-1);
}

.sidebarLabel {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.sidebarName {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.sidebarEmail {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-text-muted);
  overflow-wrap: anywhere;
}

.sidebarNav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.navLink {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: opacity var(--m-fast) var(--m-ease);
}

.navLink:hover {
  opacity: 0.75;
}

.logoutBtn {
  justify-self: start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.navLink:focus-visible,
.logoutBtn:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.content {
  min-width: 0;
}
```

`app/account/login/login.module.css`:

```css
/* Sign in and register: one narrow column with mono labels (spec section 5). */
.page {
  min-height: 100vh;
  padding: calc(var(--l-chrome) + var(--s-7)) var(--l-gutter) var(--s-9);
  background: var(--c-bg);
  color: var(--c-text);
}

.card {
  display: grid;
  gap: var(--s-5);
  max-width: 34rem;
  margin: 0 auto;
}

.brand {
  margin: 0;
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

.note {
  margin: 0;
  color: var(--c-text-muted);
}

.googleBtn {
  width: 100%;
}

.divider {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--c-stone);
}

.form {
  display: grid;
  gap: var(--s-2);
}

.fieldLabel {
  margin-top: var(--s-3);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text);
}

.input {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-body);
}

.input::placeholder {
  color: var(--c-text-muted);
}

.error {
  margin: var(--s-2) 0 0;
  font-size: var(--fs-small);
  color: var(--c-error);
}

.submitBtn {
  min-height: 48px;
  margin-top: var(--s-4);
  border: 0;
  border-radius: var(--r-0);
  background: var(--c-text);
  color: var(--c-inverse-text);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: opacity var(--m-fast) var(--m-ease);
}

.submitBtn:hover {
  opacity: 0.85;
}

.submitBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switchLink {
  margin: 0;
  font-size: var(--fs-small);
}

.switchLink a {
  color: var(--c-accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.input:focus-visible,
.submitBtn:focus-visible,
.switchLink a:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}
```

`app/account/(protected)/dashboard/dashboard.module.css`:

```css
.page {
  display: grid;
  gap: var(--s-6);
}

.pageTitle {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.grid {
  display: grid;
  gap: var(--s-5);
}

.block {
  display: grid;
  gap: var(--s-3);
  padding-top: var(--s-4);
  border-top: 1px solid var(--c-stone);
}

.blockLabel {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.blockLink {
  justify-self: start;
  font-size: var(--fs-small);
  color: var(--c-accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.addressBlock {
  margin: 0;
  font-style: normal;
}

.orderList {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.orderRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--c-stone);
}

.orderDate {
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.orderStatus {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.orderTotal {
  font-family: var(--f-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.empty {
  margin: 0;
  color: var(--c-text-muted);
}

.cta {
  display: grid;
  justify-items: start;
  gap: var(--s-3);
}

.ctaBtn {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--s-5);
  border-radius: var(--r-0);
  background: var(--c-text);
  color: var(--c-inverse-text);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.blockLink:focus-visible,
.ctaBtn:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}
```

`app/account/(protected)/profile/profile.module.css`:

```css
.page {
  display: grid;
  gap: var(--s-5);
}

.pageTitle {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.subtitle {
  margin: 0;
  color: var(--c-text-muted);
}

.form {
  display: grid;
  gap: var(--s-6);
}

.section {
  display: grid;
  gap: var(--s-4);
  padding-top: var(--s-4);
  border-top: 1px solid var(--c-stone);
}

.sectionLabel {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.fieldGroup {
  display: grid;
  gap: var(--s-4);
}

.field {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}

.fieldLabel {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text);
}

.input {
  width: 100%;
  min-height: 48px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-body);
}

.input::placeholder {
  color: var(--c-text-muted);
}

.error {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-error);
}

.success {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-success);
}

.saveBtn {
  justify-self: start;
  min-height: 48px;
  padding: 0 var(--s-6);
  border: 0;
  border-radius: var(--r-0);
  background: var(--c-text);
  color: var(--c-inverse-text);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.saveBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input:focus-visible,
.saveBtn:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

@media (min-width: 480px) {
  .fieldGroup {
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }
}
```

`app/account/(protected)/orders/orders.module.css`:

```css
.page {
  display: grid;
  gap: var(--s-5);
}

.pageTitle {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.emptyState {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-6) 0;
  border-top: 1px solid var(--c-stone);
}

.emptyTitle {
  margin: 0;
  font-weight: 600;
}

.emptySub {
  margin: 0;
  color: var(--c-text-muted);
}

.list {
  display: grid;
  gap: var(--s-4);
}

.orderCard {
  display: grid;
  gap: var(--s-4);
  padding: var(--s-4);
  border: 1px solid var(--c-stone);
  background: var(--c-surface);
}

.orderHeader {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--s-2) var(--s-4);
}

.orderDate,
.orderId {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.orderId {
  color: var(--c-text-muted);
}

.orderMeta {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.statusBadge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--s-2);
  border: 1px solid currentColor;
  border-radius: var(--r-1);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.statusGreen {
  color: var(--c-success);
}

.statusAmber {
  border-color: var(--c-peach);
  background: var(--c-peach);
  color: var(--c-text);
}

.statusRed {
  color: var(--c-error);
}

.statusDefault {
  color: var(--c-text-muted);
}

.orderTotal {
  font-family: var(--f-mono);
  font-variant-numeric: tabular-nums;
}

.orderItems {
  display: grid;
  gap: var(--s-2);
}

.orderItem {
  display: grid;
  gap: var(--s-1);
}

.itemName {
  font-weight: 600;
}

.itemVariant {
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.tracking {
  display: grid;
  gap: var(--s-2);
  padding-top: var(--s-3);
  border-top: 1px solid var(--c-stone);
}

.trackRow {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2) var(--s-3);
}

.trackMeta {
  font-family: var(--f-mono);
  font-size: var(--fs-small);
}

.trackLink {
  color: var(--c-accent-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.trackLink:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.shippingLine {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.stepper {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--l-grid-gap);
}

.step,
.stepDone,
.stepActive {
  padding-top: var(--s-2);
  border-top: 2px solid var(--c-stone);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.stepDone {
  border-top-color: var(--c-text);
  color: var(--c-text);
}

.stepActive {
  border-top-color: var(--c-accent);
  color: var(--c-text);
  font-weight: 500;
}
```

- [ ] **Step 5: Run de tests, verwacht groen**

Run: `npm test -- app/account`
Expected: PASS.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Preview: `/account/login` en `/account/register` in één smalle kolom met mono-labels; ingelogd tonen dashboard, orders en profiel dezelfde kolom met de navigatie als drie chips bovenaan.

- [ ] **Step 7: Commit**

```bash
git add app/account
git commit -m "feat: restyle account pages as one narrow v2 column and label every field"
```

---

### Task 7: 404 met links naar de edities

**Files:**
- Create: `lib/not-found.ts`
- Test: `lib/not-found.test.ts`
- Create: `app/not-found.tsx`, `app/not-found.module.css`
- Test: `app/not-found.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md:127-131` (geen props; de root-`not-found` vangt ook elke onbekende URL), `:137` (server component, mag `async`), `:185` (Next zet zelf `noindex` op een 404).

**Interfaces:**
- Consumes: `DROPS`, `isDropListed`, `listDropsNewestFirst`, `currentTimeMs`, `Drop` (fase 1-2 Task 6).
- Produces:
  - `export interface NotFoundLink { label: string; href: string }`
  - `export function notFoundLinks(now: number, drops?: readonly Drop[]): NotFoundLink[]` (gelijste edities, nieuwste eerst, daarna altijd Shop en Archive)
  - `app/not-found.tsx` (default export, geen props)

Spec sectie 5 zegt "links naar de live drops". De root-404 wordt bij de build vooraf gerenderd, dus de klok staat daar stil op het buildmoment. Daarom linkt de pagina naar elke **gelijste** editie (live, en upcoming met teaser) zonder statuswoord: een label als "Coming soon" zou na de release blijven staan tot de volgende deploy. De collectiepagina zelf toont de actuele status.

- [ ] **Step 1: Schrijf de falende tests**

`lib/not-found.test.ts`:

```ts
import { DROPS, getDrop, type Drop } from './drops'
import { notFoundLinks } from './not-found'

const BEFORE_SPORT = Date.parse('2026-10-14T10:00:00Z')
const AFTER_SPORT = Date.parse('2026-11-02T10:00:00Z')
const SHOP_AND_ARCHIVE = [
  { label: 'Shop', href: '/shop' },
  { label: 'Archive', href: '/archive' },
]

describe('notFoundLinks', () => {
  it('links every listed edition, newest first, then the shop and the archive', () => {
    expect(notFoundLinks(BEFORE_SPORT)).toEqual([
      { label: 'OLYMPN Sport', href: '/collections/olympn-sport' },
      { label: 'Olympian', href: '/collections/olympian' },
      ...SHOP_AND_ARCHIVE,
    ])
    expect(notFoundLinks(AFTER_SPORT)).toEqual(notFoundLinks(BEFORE_SPORT))
  })

  it('still offers the shop and the archive when no edition is listed', () => {
    expect(notFoundLinks(BEFORE_SPORT, [])).toEqual(SHOP_AND_ARCHIVE)
  })

  it('does not leak an upcoming edition without a teaser', () => {
    const hidden: Drop = {
      ...(getDrop('olympn-sport') as Drop),
      teaser: false,
      window: { startsAt: '2030-01-01T12:00:00+01:00', endsAt: null },
    }
    expect(notFoundLinks(BEFORE_SPORT, [DROPS[0], hidden])).toEqual([
      { label: 'Olympian', href: '/collections/olympian' },
      ...SHOP_AND_ARCHIVE,
    ])
  })
})
```

`app/not-found.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import NotFound from './not-found'

describe('404', () => {
  it('shows a big 404, one sentence and the way back', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-14T10:00:00Z'))
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
    expect(screen.getByText('This page is not part of any edition.')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Where to next' })
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/collections/olympn-sport',
      '/collections/olympian',
      '/shop',
      '/archive',
    ])
    jest.restoreAllMocks()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- not-found`
Expected: FAIL met `Cannot find module './not-found'`.

- [ ] **Step 3: Implementeer**

`lib/not-found.ts`:

```ts
import { DROPS, isDropListed, listDropsNewestFirst, type Drop } from './drops'

export interface NotFoundLink {
  label: string
  href: string
}

/**
 * Where a lost visitor can go: every listed edition (newest first), then the
 * shop and the archive, which always exist. No status words: the root 404 is
 * rendered at build time, so "Coming soon" would outlive the release.
 */
export function notFoundLinks(now: number, drops: readonly Drop[] = DROPS): NotFoundLink[] {
  const editions = listDropsNewestFirst(drops)
    .filter((drop) => isDropListed(drop, now))
    .map((drop) => ({ label: drop.title, href: `/collections/${drop.slug}` }))
  return [...editions, { label: 'Shop', href: '/shop' }, { label: 'Archive', href: '/archive' }]
}
```

`app/not-found.tsx`:

```tsx
import Link from 'next/link'
import { currentTimeMs } from '@/lib/drops'
import { notFoundLinks } from '@/lib/not-found'
import styles from './not-found.module.css'

export default function NotFound() {
  const links = notFoundLinks(currentTimeMs())
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.code}>404</h1>
        <p className={styles.text}>This page is not part of any edition.</p>
        <nav aria-label="Where to next">
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  )
}
```

`app/not-found.module.css`:

```css
.page {
  min-height: 100vh;
  padding: calc(var(--l-chrome) + var(--s-8)) var(--l-gutter) var(--s-9);
  background: var(--c-bg);
  color: var(--c-text);
}

.inner {
  display: grid;
  gap: var(--s-5);
  max-width: var(--l-max);
  margin: 0 auto;
}

.code {
  margin: 0;
  font-family: var(--f-display);
  font-size: clamp(6rem, 28vw, 20rem);
  font-style: italic;
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.85;
  font-variant-numeric: tabular-nums;
}

.text {
  margin: 0;
  font-size: var(--fs-h3);
  max-width: var(--l-text-max);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.link {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 var(--s-5);
  border: 1px solid var(--c-text);
  border-radius: var(--r-0);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: opacity var(--m-fast) var(--m-ease);
}

.link:hover {
  opacity: 0.75;
}

.link:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run de tests, verwacht groen**

Run: `npm test -- not-found`
Expected: PASS, 4 tests.

- [ ] **Step 5: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; de build-uitvoer noemt `/_not-found` als statische route. Preview: `/bestaat-niet` toont de grote 404 met vier knoppen.

- [ ] **Step 6: Commit**

```bash
git add lib/not-found.ts lib/not-found.test.ts app/not-found.tsx app/not-found.module.css app/not-found.test.tsx
git commit -m "feat: add a v2 404 that links the listed editions, the shop and the archive"
```

---

### Task 8: Transactionele e-mail in het officiële palet

**Files:**
- Modify: `lib/email/brand.ts:6-16` (palet en lettertypen), plus twee constanten na regel 35
- Test: `lib/email/brand.test.ts`
- Modify: `lib/email/order-confirmation.ts` (imports regel 2-5, alle stijlverwijzingen, logo's regel 112, 165, 173, tagline regel 175 en 216, tekstkop regel 188)
- Modify: `lib/email/order-shipped.ts` (imports regel 2-5, alle stijlverwijzingen, logo's regel 53 en 94, tagline regel 96 en 125, tekstkop regel 109)
- Test: `lib/email/order-confirmation.test.ts`, `lib/email/order-shipped.test.ts` (blokken erbij)

**Interfaces:**
- Consumes: `WORDMARK`, `BEELDMERK`, `heightAt`, `BrandImage` (Task 1).
- Produces (`lib/email/brand.ts`): `INK '#2D3A4F'`, `BONE '#F7F1DA'`, `SURFACE '#FFFFFF'`, `ACCENT '#7995C7'`, `ACCENT_INK '#3E5A8F'`, `MUTED '#5B5A58'`, `RULE '#C4C4B5'`, `DISPLAY`, `BODY`, `MONO`, `EMAIL_WORDMARK: BrandImage` (120 breed), `EMAIL_MARK: BrandImage` (28 breed). `PAPER`, `OXBLOOD`, `STONE` en `SERIF` verdwijnen; `escapeHtml`, `firstName`, `emailBaseUrl`, `RenderedEmail` blijven ongewijzigd.

Spec sectie 8 noemt voor de mail `INK #0E0B0B`, `BONE #F4EEE3`, accent `#621926`, rand `#CFC4AD`. Die waarden zijn van vóór het officiële palet; deze taak gebruikt INK `#2D3A4F`, BONE `#F7F1DA`, accent `#7995C7` en rand `#C4C4B5` (Global Constraints). Periwinkle haalt op wit en crème geen tekstcontrast, dus accenttekst (orderreferentie, labels, links) krijgt `#3E5A8F`; `#7995C7` blijft voor de streep naast de pre-sale-melding. De "snapshot-tests" uit de spec zijn de bestaande `toContain`-tests; ze worden uitgebreid, niet vervangen door Jest-snapshots (een snapshot van 200 regels HTML zou elke kleurwijziging als ruis laten zien).

- [ ] **Step 1: Schrijf de falende tests**

`lib/email/brand.test.ts`:

```ts
import { WORDMARK, BEELDMERK } from '../brand'
import {
  ACCENT, ACCENT_INK, BODY, BONE, DISPLAY, EMAIL_MARK, EMAIL_WORDMARK, INK, MONO, MUTED, RULE, SURFACE, escapeHtml,
} from './brand'

describe('email brand', () => {
  it('uses the official palette, with a darker accent for text', () => {
    expect({ INK, BONE, SURFACE, ACCENT, ACCENT_INK, MUTED, RULE }).toEqual({
      INK: '#2D3A4F', BONE: '#F7F1DA', SURFACE: '#FFFFFF', ACCENT: '#7995C7',
      ACCENT_INK: '#3E5A8F', MUTED: '#5B5A58', RULE: '#C4C4B5',
    })
  })

  it('uses web-safe faces from spec section 8', () => {
    expect(DISPLAY).toBe("'Arial Black', Arial, sans-serif")
    expect(BODY).toBe('Arial, Helvetica, sans-serif')
    expect(MONO).toBe("'Courier New', Courier, monospace")
  })

  it('sizes the logos for a 600px mail column, keeping their ratio', () => {
    expect(EMAIL_WORDMARK).toEqual({
      src: WORDMARK.navy.src, width: 120, height: Math.round((120 * WORDMARK.navy.height) / WORDMARK.navy.width),
    })
    expect(EMAIL_MARK.src).toBe(BEELDMERK.navy.src)
    expect(EMAIL_MARK.width).toBe(28)
  })

  it('escapes each special character once', () => {
    expect(escapeHtml('Tee & Towel "Set" <b>')).toBe('Tee &amp; Towel &quot;Set&quot; &lt;b&gt;')
  })
})
```

Voeg onderaan `lib/email/order-confirmation.test.ts` toe (en zet `import { EMAIL_WORDMARK } from './brand'` bovenaan):

```ts
describe('v2 brand', () => {
  it('renders in the official palette with the new wordmark', () => {
    const { html } = renderOrderConfirmation(baseOrder)
    for (const hex of ['#2D3A4F', '#F7F1DA', '#FFFFFF', '#C4C4B5']) expect(html).toContain(hex)
    expect(html).toContain(`${EMAIL_WORDMARK.src}" width="120" height="${EMAIL_WORDMARK.height}"`)
    expect(html).not.toMatch(/#111111|#5C1A1B|#F6F3EC|#EDE8DD|#8A8275|Georgia|\/logos\//)
  })

  it('sets the heading in Arial Black and drops the italics', () => {
    const { html } = renderOrderConfirmation(baseOrder)
    expect(html).toContain("font-family:'Arial Black', Arial, sans-serif;font-weight:900")
    expect(html).not.toContain('font-style:italic')
  })

  it('never uses periwinkle as a text colour', () => {
    const { html } = renderOrderConfirmation(baseOrder)
    expect(html).toContain('#3E5A8F')
    expect(html).not.toMatch(/color:#7995C7/i)
  })

  it('drops the v1 tagline and the long dashes', () => {
    const out = renderOrderConfirmation(baseOrder)
    expect(out.html + out.text).not.toContain('Divine Authority')
    expect(out.html + out.text).not.toMatch(/[\u2013\u2014]/)
    expect(out.text.split('\n')[0]).toBe('7ENO · ORDER CONFIRMATION')
  })

  it('escapes an ampersand product name exactly once and keeps the text version plain', () => {
    const out = renderOrderConfirmation({
      ...baseOrder,
      items: [{ name: 'Tee & Towel "Set"', variant: 'Rose Red / L', quantity: 1, amountCents: 4500 }],
    })
    expect(out.html).toContain('Tee &amp; Towel &quot;Set&quot;')
    expect(out.html).not.toContain('&amp;amp;')
    expect(out.text).toContain('Tee & Towel "Set"')
  })
})
```

Voeg onderaan `lib/email/order-shipped.test.ts` toe (en zet `import { EMAIL_WORDMARK } from './brand'` bovenaan):

```ts
test('renders in the official palette with the new wordmark and no v1 leftovers', () => {
  const { html, text } = renderOrderShipped(data)
  expect(html).toContain('#2D3A4F')
  expect(html).toContain(EMAIL_WORDMARK.src)
  expect(html).not.toMatch(/#111111|#5C1A1B|Georgia|\/logos\/|font-style:italic/)
  expect(html + text).not.toContain('Divine Authority')
  expect(html + text).not.toMatch(/[\u2013\u2014]/)
  expect(text.split('\n')[0]).toBe('7ENO · SHIPPED')
})

test('escapes an ampersand in the carrier exactly once', () => {
  const { html } = renderOrderShipped({ ...data, carrier: 'DHL & Co' })
  expect(html).toContain('DHL &amp; Co')
  expect(html).not.toContain('&amp;amp;')
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- lib/email`
Expected: FAIL: `ACCENT`, `SURFACE`, `EMAIL_WORDMARK` bestaan niet; de HTML bevat `#111111` en Georgia.

- [ ] **Step 3: Nieuw palet in `lib/email/brand.ts`**

Vervang regel 6-16:

```ts
// ── Brand palette (mirrors styles/globals.css) ──────────────────────────────
export const INK = '#111111'
export const BONE = '#F6F3EC'
export const PAPER = '#EDE8DD'
export const OXBLOOD = '#5C1A1B'
export const STONE = '#8A8275'
export const RULE = '#C8C1B2'
// Web-safe serif: real Cormorant won't load in mail clients, Georgia carries
// the same high-contrast, "divine" feel.
export const SERIF = "Georgia, 'Times New Roman', Times, serif"
export const MONO = "'Courier New', Courier, monospace"
```

door:

```ts
import { BEELDMERK, WORDMARK, heightAt, type BrandImage } from '../brand'

// Brand palette for mail, the official v2 values from styles/tokens.css (mail
// clients cannot read CSS variables). Periwinkle fails text contrast on white
// and cream, so text that needs the accent uses ACCENT_INK.
export const INK = '#2D3A4F' // --c-text: all text, primary button
export const BONE = '#F7F1DA' // --c-bg: outer background, text on navy
export const SURFACE = '#FFFFFF' // --c-surface: the card
export const ACCENT = '#7995C7' // --c-accent: bars and rules, never text
export const ACCENT_INK = '#3E5A8F' // --c-accent-ink: references, labels, links
export const MUTED = '#5B5A58' // --c-text-muted
export const RULE = '#C4C4B5' // --c-stone: hairlines and borders
// Web-safe faces (spec section 8): the brand fonts do not load in mail clients.
export const DISPLAY = "'Arial Black', Arial, sans-serif"
export const BODY = 'Arial, Helvetica, sans-serif'
export const MONO = "'Courier New', Courier, monospace"
```

Voeg direct na de functie `emailBaseUrl()` (eindigt op regel 35 met `}`) toe:

```ts

/** Header wordmark sized for a 600px column; fixed attributes stop Outlook from scaling it. */
export const EMAIL_WORDMARK: BrandImage = { src: WORDMARK.navy.src, width: 120, height: heightAt(WORDMARK.navy, 120) }

/** Footer mark. */
export const EMAIL_MARK: BrandImage = { src: BEELDMERK.navy.src, width: 28, height: heightAt(BEELDMERK.navy, 28) }
```

- [ ] **Step 4: Zet beide templates om**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
for f in lib/email/order-confirmation.ts lib/email/order-shipped.ts; do
  perl -CSD -0pi -e '
    s/INK, BONE, PAPER, OXBLOOD, STONE, RULE, SERIF, MONO,/INK, BONE, SURFACE, ACCENT, ACCENT_INK, MUTED, RULE, DISPLAY, BODY, MONO,\n  EMAIL_WORDMARK, EMAIL_MARK,/;
    s/background:\$\{BONE\};border:1px solid \$\{RULE\}/background:\${SURFACE};border:1px solid \${RULE}/g;
    s/\$\{PAPER\}/\${BONE}/g;
    s/border-left:3px solid \$\{OXBLOOD\}/border-left:3px solid \${ACCENT}/g;
    s/\$\{OXBLOOD\}/\${ACCENT_INK}/g;
    s/\$\{STONE\}/\${MUTED}/g;
    s/font-family:\$\{SERIF\};font-style:italic;font-weight:600;font-size:26px;/font-family:\${DISPLAY};font-weight:900;font-size:24px;line-height:1.1;text-transform:uppercase;/g;
    s/font-family:\$\{SERIF\};font-style:italic;/font-family:\${BODY};/g;
    s/\$\{SERIF\}/\${BODY}/g;
    s#\$\{baseUrl\}/logos/woordmerk-ink\.png" width="180" height="138"#\${baseUrl}\${EMAIL_WORDMARK.src}" width="\${EMAIL_WORDMARK.width}" height="\${EMAIL_WORDMARK.height}"#g;
    s#\$\{baseUrl\}/logos/beeldmerk-zwart\.png" width="34" height="35"#\${baseUrl}\${EMAIL_MARK.src}" width="\${EMAIL_MARK.width}" height="\${EMAIL_MARK.height}"#g;
    s#\$\{baseUrl\}/logos/life4hsp\.png#\${baseUrl}/brand/life4hsp.png#g;
    s/Divine Authority/Numbered editions by Abra Entertainment/g;
    s/7ENO \x{2014} /7ENO \x{00B7} /g;
  ' "$f"
done
grep -nE "PAPER|OXBLOOD|STONE|SERIF|/logos/|italic|Divine" lib/email/order-confirmation.ts lib/email/order-shipped.ts
grep -nP "[\x{2013}\x{2014}]" lib/email/*.ts
```

Expected: beide `grep`-opdrachten geven niets.

- [ ] **Step 5: Run de tests, verwacht groen**

Run: `npm test -- lib/email`
Expected: PASS, alle bestaande tests plus de nieuwe.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Er gaat in deze taak geen mail de deur uit: de tests roepen alleen de `render*`-functies aan, en `send.ts` laadt Resend pas bij echt versturen. De echte mail wordt bekeken bij de testbestelling op de go-live-checklist (Task 13).

- [ ] **Step 7: Commit**

```bash
git add lib/email
git commit -m "feat: move order emails to the official v2 palette and wordmark"
```

---

### Task 9: SEO, themakleur, manifest en favicon

**Files:**
- Modify: `lib/seo.ts:1` (import), `:27`, `:33-37`, `:56-60`, `:91`, `:113`
- Test: `lib/seo.test.ts`
- Modify: `app/layout.tsx:5`, `:58-59`, `:83`, `:117-119` (fase 1-2 Task 1 wijzigde de fonts op regel 2-56)
- Modify: `app/manifest.ts:1-22` (volledig vervangen)
- Test: `app/manifest.test.ts`
- Modify: `app/icon.tsx:1-33` (volledig vervangen)
- Modify: `app/collections/[slug]/page.tsx` (gemaakt in fase 1-2 Task 17: de seo-import en `generateMetadata`)
- Test: `app/collections/[slug]/page.test.tsx` (gemaakt in fase 1-2 Task 17: één verwachting)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-viewport.md:71` (`themeColor` hoort in `viewport`), `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md:20-70` (`MetadataRoute.Manifest`, `icons` met `sizes` en `purpose`), `.../01-metadata/app-icons.md:70-170` (`icon.tsx` met `size` en `contentType`, statisch bij de build).

**Interfaces:**
- Consumes: `APP_ICONS`, `BEELDMERK`, `BRAND_COLOURS`, `SEVENO_TILE` (Task 1); `formatEdition`, `Drop` (fase 1-2 Task 6).
- Produces (`lib/seo.ts`):
  - `export const SITE_DESCRIPTION: string` (noemt "Olympian and OLYMPN Sport")
  - `export const THEME_COLOR = '#2D3A4F'`, `export const BACKGROUND_COLOR = '#F7F1DA'`
  - `export function collectionDescription(drop: Pick<Drop, 'title' | 'edition' | 'intro'>): string`
  - `BRAND_KEYWORDS` zonder `'OG collection'`; `organizationJsonLd().logo.url` wijst naar de vierkante 7ENO-tegel.

- [ ] **Step 1: Schrijf de falende tests**

`lib/seo.test.ts`:

```ts
/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { getDrop, type Drop } from './drops'
import {
  BACKGROUND_COLOR, BRAND_KEYWORDS, SITE_DESCRIPTION, THEME_COLOR, collectionDescription, organizationJsonLd, webSiteJsonLd,
} from './seo'

describe('seo', () => {
  it('names the two editions and no longer OG', () => {
    expect(SITE_DESCRIPTION).toContain('Olympian and OLYMPN Sport')
    expect(SITE_DESCRIPTION).not.toMatch(/\bOG\b/)
    expect(BRAND_KEYWORDS).not.toContain('OG collection')
    expect(BRAND_KEYWORDS).toEqual(expect.arrayContaining(['Olympian collection', 'OLYMPN Sport']))
    expect(webSiteJsonLd().description).toBe(SITE_DESCRIPTION)
  })

  it('uses the official navy and cream', () => {
    expect(THEME_COLOR).toBe('#2D3A4F')
    expect(BACKGROUND_COLOR).toBe('#F7F1DA')
  })

  it('points the organisation logo at the square 7ENO tile', () => {
    const org = organizationJsonLd()
    expect(org.logo.url).toMatch(/\/brand\/instagram-logo-nieuw\.webp$/)
    expect(org.image).toBe(org.logo.url)
  })

  it('writes a description per collection', () => {
    const sport = getDrop('olympn-sport') as Drop
    const text = collectionDescription(sport)
    expect(text.startsWith('OLYMPN Sport (Edition 02) by 7ENO (Zeno): ')).toBe(true)
    expect(text).toContain(sport.intro)
    expect(text.endsWith('Free shipping over €75.')).toBe(true)
  })

  it('feeds the root layout from these constants', () => {
    const layout = readFileSync('app/layout.tsx', 'utf8')
    expect(layout).toContain('themeColor: THEME_COLOR')
    expect(layout).not.toContain('const SITE_DESCRIPTION')
    expect(layout).not.toContain('OG and Olympian')
  })
})
```

`app/manifest.test.ts`:

```ts
/** @jest-environment node */
import path from 'node:path'
import sharp from 'sharp'
import manifest from './manifest'

describe('web app manifest', () => {
  const m = manifest()

  it('uses the official cream and navy', () => {
    expect(m.background_color).toBe('#F7F1DA')
    expect(m.theme_color).toBe('#2D3A4F')
    expect(m.description).toContain('Olympian and OLYMPN Sport')
  })

  it('declares a 192 and a 512 icon plus a maskable one, never sizes "any" on a PNG', () => {
    expect(m.icons?.map((i) => [i.sizes, i.purpose])).toEqual([
      ['192x192', 'any'], ['512x512', 'any'], ['512x512', 'maskable'],
    ])
  })

  it('declares sizes that match the real pixels', async () => {
    for (const icon of m.icons ?? []) {
      const meta = await sharp(path.join(process.cwd(), 'public', icon.src)).metadata()
      expect(`${meta.width}x${meta.height}`).toBe(icon.sizes)
      expect(icon.type).toBe('image/png')
    }
  })
})
```

In `app/collections/[slug]/page.test.tsx` (fase 1-2 Task 17) vervang:

```ts
    expect(meta.description).toBe(sport.intro)
```

door:

```ts
    expect(meta.description).toBe(collectionDescription(sport))
```

en voeg bovenaan de imports toe:

```ts
import { collectionDescription } from '@/lib/seo'
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (lib/seo|app/manifest|collections)`
Expected: FAIL: `SITE_DESCRIPTION`, `THEME_COLOR`, `collectionDescription` bestaan niet; het manifest heeft `sizes: 'any'` en `#297d95`.

- [ ] **Step 3: `lib/seo.ts`**

Voeg boven regel 1 (`/**`) in:

```ts
import { SEVENO_TILE } from './brand'
import { formatEdition, type Drop } from './drops'

```

Regel 27 en 113 (lange streepjes):

```bash
perl -CSD -pi -e 's/   \* here \x{2014} an empty list is simply omitted/   * here; an empty list is simply omitted/; s/before the click \x{2014} so the/before the click, so the/' lib/seo.ts
```

Vervang regel 33-37:

```ts
export const BRAND_KEYWORDS = [
  '7ENO', 'Zeno', 'Zeno streetwear', 'Zeno shop', 'Zeno kleding', 'Zeno merk',
  '7eno shop', '7ENO streetwear', 'streetwear', 'streetwear Nederland',
  'Abra Entertainment', 'Olympian collection', 'OG collection', 'premium streetwear',
]
```

door:

```ts
export const BRAND_KEYWORDS = [
  '7ENO', 'Zeno', 'Zeno streetwear', 'Zeno shop', 'Zeno kleding', 'Zeno merk',
  '7eno shop', '7ENO streetwear', 'streetwear', 'streetwear Nederland',
  'Abra Entertainment', 'Olympian collection', 'OLYMPN Sport', 'OLYMPN Sport hoodie', 'premium streetwear',
]

/** Site-wide description: root layout, WebSite node and manifest. */
export const SITE_DESCRIPTION =
  '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the Olympian and OLYMPN Sport editions, with free shipping over €75.'

/** Official navy (browser chrome) and cream (splash screen), spec section 2. */
export const THEME_COLOR = '#2D3A4F'
export const BACKGROUND_COLOR = '#F7F1DA'

/** Meta description for a collection page: edition, brand, intro, shipping. */
export function collectionDescription(drop: Pick<Drop, 'title' | 'edition' | 'intro'>): string {
  return `${drop.title} (${formatEdition(drop.edition)}) by 7ENO (Zeno): ${drop.intro} Free shipping over €75.`
}
```

Vervang regel 56-60:

```ts
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logos/beeldmerk-zwart.png'),
    },
    image: absoluteUrl('/logos/beeldmerk-zwart.png'),
```

door:

```ts
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(SEVENO_TILE.src),
    },
    image: absoluteUrl(SEVENO_TILE.src),
```

Vervang regel 90-91:

```ts
    description:
      '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the OG and Olympian collections.',
```

door:

```ts
    description: SITE_DESCRIPTION,
```

- [ ] **Step 4: `app/layout.tsx`**

Vervang regel 5:

```ts
import { BASE_URL, BRAND_KEYWORDS, organizationJsonLd, webSiteJsonLd } from '@/lib/seo'
```

door:

```ts
import { BASE_URL, BRAND_KEYWORDS, SITE_DESCRIPTION, THEME_COLOR, organizationJsonLd, webSiteJsonLd } from '@/lib/seo'
```

Verwijder regel 58-59 (`const SITE_DESCRIPTION =` en de string eronder) plus de lege regel erna. Vervang:

```ts
export const viewport: Viewport = {
  themeColor: '#111111',
}
```

door:

```ts
export const viewport: Viewport = {
  themeColor: THEME_COLOR,
}
```

Regel 83 (lang streepje):

```bash
perl -CSD -pi -e 's/all\) in Search and Discover \x{2014} the single highest-impact robots directive/all) in Search and Discover: the single highest-impact robots directive/' app/layout.tsx
```

- [ ] **Step 5: Manifest en favicon**

Vervang `app/manifest.ts` volledig:

```ts
import type { MetadataRoute } from 'next'
import { APP_ICONS } from '@/lib/brand'
import { BACKGROUND_COLOR, BRAND, SITE_DESCRIPTION, THEME_COLOR } from '@/lib/seo'

// Web app manifest: lets the store be installed to a home screen and gives
// Android and Chrome the brand name. `name` carries the spoken spelling so
// on-device search for "Zeno" finds it too. Icons declare their real pixel
// size: Chrome rejects a PNG whose declared size does not match.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} (Zeno) · Numbered streetwear editions`,
    short_name: BRAND.name,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    categories: ['shopping', 'lifestyle'],
    icons: APP_ICONS.map((icon) => ({
      src: icon.src,
      sizes: `${icon.width}x${icon.height}`,
      type: 'image/png',
      purpose: icon.purpose,
    })),
  }
}
```

Vervang `app/icon.tsx` volledig:

```tsx
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { BEELDMERK, BRAND_COLOURS } from '@/lib/brand'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

// Favicon: the cream 7ENO mark on navy. Rendered once at build time. PNG until
// Joep delivers the SVG exports (spec section 8 and 10).
export default function Icon() {
  const mark = readFileSync(join(process.cwd(), 'public', BEELDMERK.cream.src))
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BRAND_COLOURS.navy,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
        <img
          src={`data:image/png;base64,${mark.toString('base64')}`}
          alt=""
          style={{ width: '70%', height: '70%', objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
```

- [ ] **Step 6: Collectiepagina's krijgen de rijkere omschrijving**

In `app/collections/[slug]/page.tsx` (fase 1-2 Task 17) vervang:

```ts
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo'
```

door:

```ts
import { absoluteUrl, breadcrumbJsonLd, collectionDescription } from '@/lib/seo'
```

en vervang in `generateMetadata`:

```ts
  return {
    title,
    description: drop.intro,
    alternates: { canonical: url },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description: drop.intro, url: absoluteUrl(url), type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · 7ENO (Zeno)`, description: drop.intro },
  }
```

door:

```ts
  const description = collectionDescription(drop)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title} · 7ENO (Zeno)`, description, url: absoluteUrl(url), type: 'website' },
    twitter: { card: 'summary_large_image', title: `${title} · 7ENO (Zeno)`, description },
  }
```

- [ ] **Step 7: Run de tests, verwacht groen**

Run: `npm test -- (lib/seo|app/manifest|collections)`
Expected: PASS.

- [ ] **Step 8: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Na de build: `grep -o 'theme-color" content="[^"]*' .next/server/app/index.html` geeft `theme-color" content="#2D3A4F`. Preview: de browserbalk op mobiel wordt navy, het tabblad toont de crème 7 op navy, `/manifest.webmanifest` toont drie iconen met echte maten.

- [ ] **Step 9: Commit**

```bash
git add lib/seo.ts lib/seo.test.ts app/layout.tsx app/manifest.ts app/manifest.test.ts app/icon.tsx \
  "app/collections/[slug]/page.tsx" "app/collections/[slug]/page.test.tsx"
git commit -m "feat: name both editions in SEO, navy theme colour, v2 manifest and favicon"
```

---

### Task 10: OG-images met Archivo, site-breed en per collectie

**Files:**
- Create: `scripts/fetch-og-font.mjs`
- Create (gedownload): `app/_fonts/Archivo-ExpandedBlackItalic.ttf`, `app/_fonts/OFL.txt`
- Create: `lib/og.tsx`
- Test: `lib/og.test.tsx`
- Modify: `app/opengraph-image.tsx:1-75` (volledig vervangen)
- Create: `app/collections/[slug]/opengraph-image.tsx`
- Modify: `next.config.ts:39` (na het `images`-blok; fase 1-2 Task 9 zette `redirects()` op regel 40-57)
- Modify: `package.json` (script `brand:og-font`)

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md:50-52` (alleen flexbox, maximaal 500 KB, **alleen ttf, otf en woff**), `:159-190` (`fonts`-optie); `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md:91` (statisch bij de build tenzij dynamisch), `:221-249` (`params` is een Promise), `:417-440` (lokale bestanden via `process.cwd()`); `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md:257-259` (een map met `_` is privé en geen route); `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md:80-110` (`outputFileTracingIncludes`).

**Interfaces:**
- Consumes: `BRAND_COLOURS`, `WORDMARK`, `OLYMPN_SPORT_WORDMARK`, `widthAt`, `BrandImage` (Task 1); `getDropBySlug`, `formatEdition` (fase 1-2 Task 6).
- Produces (`lib/og.tsx`):
  - `export const OG_SIZE = { width: 1200, height: 630 }`, `export const OG_FONT_FILE = 'app/_fonts/Archivo-ExpandedBlackItalic.ttf'`, `export const OG_FONT_FAMILY = 'Archivo'`
  - `export interface OgFont { name: string; data: Buffer; weight: 900; style: 'italic' }`, `export async function loadOgFont(): Promise<OgFont>`
  - `export interface OgCardProps { label: string; title: string; tagline: string; tone: 'light' | 'dark'; logo: BrandImage }` (`logo.src` is een data-URI)
  - `export async function ogCardProps(slug?: string): Promise<OgCardProps>` (onbekende slug geeft de site-kaart, nooit een fout)
  - `export function OgCard(props: OgCardProps): ReactElement`

Google Fonts levert een statische instantie (wdth 125, wght 900, cursief) als TTF aan clients die geen woff2 aankondigen. Het script vraagt de CSS daarom zonder browser-user-agent op en controleert de magische bytes, zodat een woff2 nooit als `.ttf` wordt opgeslagen. Getest op 14-10: 123.864 bytes.

- [ ] **Step 1: Schrijf en draai het downloadscript**

`scripts/fetch-og-font.mjs`:

```js
// Downloads the static Archivo instance the OG images use (wdth 125, wght 900,
// italic) as TTF, plus its licence. ImageResponse reads ttf, otf and woff, not
// woff2 (image-response.md:52); Google serves TTF to clients that do not
// announce woff2 support, which is why no browser user agent is sent.
// Run with `npm run brand:og-font`; the result is committed.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@1,125,900'
const LICENSE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt'
const OUT_DIR = path.join(process.cwd(), 'app/_fonts')
const OUT_FILE = path.join(OUT_DIR, 'Archivo-ExpandedBlackItalic.ttf')
const HEADERS = { 'User-Agent': 'fetch-og-font' }

async function get(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res
}

const css = await (await get(CSS_URL)).text()
const match = /src:\s*url\((https:[^)]+\.ttf)\)/.exec(css)
if (!match) throw new Error('No TTF url in the Google Fonts response')

const bytes = Buffer.from(await (await get(match[1])).arrayBuffer())
if (bytes.readUInt32BE(0) !== 0x00010000) throw new Error('Downloaded file is not a TrueType font')

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, bytes)
await writeFile(path.join(OUT_DIR, 'OFL.txt'), await (await get(LICENSE_URL)).text())
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)} (${bytes.length} bytes) and OFL.txt`)
```

Voeg in `package.json` na de regel `"brand:assets": "node scripts/build-brand-assets.mjs"` toe (komma erachter):

```json
    "brand:og-font": "node scripts/fetch-og-font.mjs"
```

Run: `npm run brand:og-font`
Expected: `Wrote app/_fonts/Archivo-ExpandedBlackItalic.ttf (123864 bytes) and OFL.txt` (de grootte kan een paar bytes verschillen als Google een nieuwe versie uitrolt).

- [ ] **Step 2: Schrijf de falende test**

`lib/og.test.tsx`:

```tsx
/** @jest-environment node */
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { OLYMPN_SPORT_WORDMARK, WORDMARK } from './brand'
import { OG_FONT_FILE, OgCard, loadOgFont, ogCardProps } from './og'

const PNG_SIGNATURE = '89504e470d0a1a0a'

function dataUriBytes(src: string): Buffer {
  expect(src.startsWith('data:image/png;base64,')).toBe(true)
  return Buffer.from(src.slice('data:image/png;base64,'.length), 'base64')
}

describe('OG font', () => {
  it('is a real TrueType file, not woff2 under a ttf name', () => {
    const bytes = readFileSync(path.join(process.cwd(), OG_FONT_FILE))
    expect(bytes.readUInt32BE(0)).toBe(0x00010000)
  })

  it('stays well under the ImageResponse budget of 500 KB together with the largest logo', () => {
    const font = statSync(path.join(process.cwd(), OG_FONT_FILE)).size
    const logo = statSync(path.join(process.cwd(), 'public', OLYMPN_SPORT_WORDMARK.src)).size
    expect(font + logo * 1.34).toBeLessThan(500_000)
  })

  it('loads as Archivo, weight 900, italic', async () => {
    const font = await loadOgFont()
    expect([font.name, font.weight, font.style]).toEqual(['Archivo', 900, 'italic'])
    expect(font.data.length).toBeGreaterThan(50_000)
  })

  it('ships the licence next to the font', () => {
    expect(readFileSync(path.join(process.cwd(), 'app/_fonts/OFL.txt'), 'utf8')).toContain('SIL Open Font License')
  })
})

describe('ogCardProps', () => {
  it('gives the site-wide card on cream with the navy wordmark', async () => {
    const props = await ogCardProps()
    expect([props.tone, props.title, props.label]).toEqual(['light', 'Olympian and OLYMPN Sport', 'Pronounced Zeno'])
    expect([props.logo.width, props.logo.height]).toEqual([WORDMARK.navy.width, WORDMARK.navy.height])
    expect(dataUriBytes(props.logo.src).subarray(0, 8).toString('hex')).toBe(PNG_SIGNATURE)
  })

  it('gives OLYMPN Sport a navy card with its orange wordmark', async () => {
    const props = await ogCardProps('olympn-sport')
    expect([props.tone, props.title, props.label]).toEqual(['dark', 'OLYMPN Sport', 'Edition 02'])
    expect([props.logo.width, props.logo.height]).toEqual([OLYMPN_SPORT_WORDMARK.width, OLYMPN_SPORT_WORDMARK.height])
  })

  it('gives Olympian a cream card', async () => {
    const props = await ogCardProps('olympian')
    expect([props.tone, props.title, props.label]).toEqual(['light', 'Olympian', 'Edition 01'])
  })

  it('falls back to the site-wide card for an unknown slug', async () => {
    expect((await ogCardProps('does-not-exist')).title).toBe('Olympian and OLYMPN Sport')
  })
})

describe('OgCard', () => {
  it('renders the title, label and tagline without long dashes', async () => {
    const html = renderToStaticMarkup(<OgCard {...await ogCardProps('olympn-sport')} />)
    expect(html).toContain('OLYMPN Sport')
    expect(html).toContain('Edition 02')
    expect(html).not.toMatch(/[\u2013\u2014]/)
  })
})
```

- [ ] **Step 3: Run de test, verwacht falen**

Run: `npm test -- lib/og`
Expected: FAIL met `Cannot find module './og'`.

- [ ] **Step 4: Implementeer `lib/og.tsx`**

```tsx
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReactElement } from 'react'
import { BRAND_COLOURS, OLYMPN_SPORT_WORDMARK, WORDMARK, widthAt, type BrandImage } from './brand'
import { formatEdition, getDropBySlug } from './drops'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_FONT_FILE = 'app/_fonts/Archivo-ExpandedBlackItalic.ttf'
export const OG_FONT_FAMILY = 'Archivo'

export interface OgFont {
  name: string
  data: Buffer
  weight: 900
  style: 'italic'
}

export interface OgCardProps {
  label: string
  title: string
  tagline: string
  tone: 'light' | 'dark'
  /** `src` is a data URI: ImageResponse cannot fetch site-relative paths. */
  logo: BrandImage
}

async function inline(image: BrandImage): Promise<BrandImage> {
  const bytes = await readFile(path.join(process.cwd(), 'public', image.src))
  return { ...image, src: `data:image/png;base64,${bytes.toString('base64')}` }
}

export async function loadOgFont(): Promise<OgFont> {
  const data = await readFile(path.join(process.cwd(), OG_FONT_FILE))
  return { name: OG_FONT_FAMILY, data, weight: 900, style: 'italic' }
}

/** What the card for `slug` shows; the site-wide card when the slug is not an edition. */
export async function ogCardProps(slug?: string): Promise<OgCardProps> {
  const drop = slug ? getDropBySlug(slug) : null
  if (!drop) {
    return {
      label: 'Pronounced Zeno',
      title: 'Olympian and OLYMPN Sport',
      tagline: 'Numbered streetwear editions by Abra Entertainment',
      tone: 'light',
      logo: await inline(WORDMARK.navy),
    }
  }
  const logo = drop.id === 'olympn-sport' ? OLYMPN_SPORT_WORDMARK : drop.tone === 'dark' ? WORDMARK.cream : WORDMARK.navy
  return {
    label: formatEdition(drop.edition),
    title: drop.title,
    tagline: drop.intro,
    tone: drop.tone,
    logo: await inline(logo),
  }
}

/** The 1200x630 card: logo top left, edition label, big title, tagline, a colour bar. Flexbox only. */
export function OgCard({ label, title, tagline, tone, logo }: OgCardProps): ReactElement {
  const dark = tone === 'dark'
  const background = dark ? BRAND_COLOURS.navy : BRAND_COLOURS.cream
  const colour = dark ? BRAND_COLOURS.cream : BRAND_COLOURS.navy
  const logoHeight = logo.width / logo.height > 2 ? 96 : 120
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background,
        color: colour,
        fontFamily: OG_FONT_FAMILY,
        fontStyle: 'italic',
        fontWeight: 900,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
      <img src={logo.src} alt="" width={widthAt(logo, logoHeight)} height={logoHeight} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 92, lineHeight: 0.95, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ display: 'flex', marginTop: 24, maxWidth: 960, fontSize: 26, lineHeight: 1.3 }}>{tagline}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 16,
          display: 'flex',
          background: dark ? BRAND_COLOURS.orange : BRAND_COLOURS.periwinkle,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Run de test, verwacht groen**

Run: `npm test -- lib/og`
Expected: PASS, 9 tests.

- [ ] **Step 6: De twee image-routes**

Vervang `app/opengraph-image.tsx` volledig:

```tsx
import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgFont, ogCardProps } from '@/lib/og'

// Default social preview for every page that sets no image of its own
// (product pages pass their own photo). Rendered at build time.
export const alt = '7ENO (Zeno): Olympian and OLYMPN Sport, numbered streetwear editions by Abra Entertainment'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const [props, font] = await Promise.all([ogCardProps(), loadOgFont()])
  return new ImageResponse(<OgCard {...props} />, { ...size, fonts: [font] })
}
```

`app/collections/[slug]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgFont, ogCardProps } from '@/lib/og'

// Per-collection social preview on the drop's own tone (spec section 8).
export const alt = 'A 7ENO edition: edition number, title and wordmark'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function CollectionOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [props, font] = await Promise.all([ogCardProps(slug), loadOgFont()])
  return new ImageResponse(<OgCard {...props} />, { ...size, fonts: [font] })
}
```

- [ ] **Step 7: Laat de font en de logo's meegaan in de functie**

In `next.config.ts` vervang:

```ts
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
```

door:

```ts
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  // The collection OG image reads its font and logos from disk at request time
  // when a slug was not prerendered; make sure they ship with that function.
  outputFileTracingIncludes: {
    '/collections/**': ['./app/_fonts/**/*', './public/brand/*.png'],
  },
```

- [ ] **Step 8: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; de build-uitvoer noemt `/opengraph-image` en `/collections/[slug]/opengraph-image`.

- [ ] **Step 9: Controleer de tracing en het beeld**

```bash
find .next/server/app/collections -name '*.nft.json' -exec grep -l 'Archivo-ExpandedBlackItalic.ttf' {} + | head
npx next start -p 3102 >/tmp/og-start.log 2>&1 & echo $! > /tmp/og-start.pid
sleep 6
curl -s -o /tmp/og-site.png -w '%{http_code} %{content_type}\n' http://localhost:3102/opengraph-image
curl -s -o /tmp/og-sport.png -w '%{http_code} %{content_type}\n' "http://localhost:3102/collections/olympn-sport/opengraph-image"
kill "$(cat /tmp/og-start.pid)"
```

Expected: minstens één `.nft.json` onder `collections` noemt de font; beide `curl`-regels geven `200 image/png`. Bekijk `/tmp/og-site.png` (crème, navy woordmerk, "OLYMPIAN AND OLYMPN SPORT" in brede cursieve Archivo, periwinkle balk) en `/tmp/og-sport.png` (navy, oranje woordmerk, "EDITION 02", oranje balk). De exacte URL van een collectie-OG kan een hash-achtervoegsel hebben; staat er een 404, haal de URL dan uit `<meta property="og:image">` van `http://localhost:3102/collections/olympn-sport`.

- [ ] **Step 10: Commit**

```bash
git add scripts/fetch-og-font.mjs app/_fonts lib/og.tsx lib/og.test.tsx app/opengraph-image.tsx \
  "app/collections/[slug]/opengraph-image.tsx" next.config.ts package.json
git commit -m "feat: rebuild OG images in Archivo with a card per collection"
```

---

### Checkpoint fase 4

- [ ] **Step 1: Volledige poort en handmatige ronde op de Preview**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Joep of de controller pusht `redesign/v2`; op de Preview: home (hero, rijen, fotoband, videoband, strook), About, FAQ, Size guide, Returns, Terms, Privacy, `/account/login`, een onbekende URL (404), de favicon, `/manifest.webmanifest`, en de OG-preview van `/` en `/collections/olympn-sport` (bijvoorbeeld via de Vercel-toolbar of `opengraph.xyz` met de Preview-bypass). Een testmail bekijken kan via de bestaande Stripe-testflow alleen met een `cs_test_`-sessie op de Preview, nooit lokaal met `.env.local`.

---

### Task 11: Vervallen componenten, bestanden en logo-varianten weg

**Files:**
- Create: `lib/filter-types.ts`
- Modify: `components/ui/FilterBar/FilterBar.tsx:8`, `components/ui/FilterBar/FilterBar.test.tsx:5`, `lib/shop-query.ts:1` (fase 1-2 Task 13; de import van `FilterGroup` en eventueel `FilterItem`)
- Delete: `components/Nav`, `components/Footer`, `components/Hero`, `components/LatestDrop`, `components/Marquee`, `components/WaveBars`, `components/ShopDropdown`, `components/ShopSidebar`, `components/ShopFilters`, `components/BundleCover`, `components/DonationBanner`, `components/ProductCard`, `components/ProductCarousel` (al weg sinds fase 3 Task 11; `rm -rf` is dan een no-op)
- Delete: `app/deals/[slug]/BundleConfigurator.tsx`, `app/deals/[slug]/configurator.module.css` (en daarmee `app/deals`), `app/landing.module.css`
- Delete: `public/logos`, `public/categories`, `public/hero-model.png`, `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`
- Modify: `components/Logo/Logo.tsx` (na Task 2: de v1-varianten eruit), `components/Logo/Logo.test.tsx` (de test "maps the v1 colour names")
- Create: `lib/public-assets.test.ts`

**Interfaces:**
- Consumes: niets nieuws.
- Produces:
  - `lib/filter-types.ts`: `export interface FilterItem { label: string; href: string; active: boolean }`, `export interface FilterGroup { label: string; items: FilterItem[] }` (letterlijk de typen uit `components/ShopFilters/ShopFilters.tsx:7-16`; spec sectie 5 laat `ShopFilters` de URL-state leveren, die vorm blijft dus bestaan, het component niet)
  - `LogoVariant = BrandTone` (alleen nog `'navy' | 'cream'`); `toneFor` verdwijnt.

Spec sectie 5 zegt dat `BundleConfigurator` ongebruikt blijft staan; de opdracht voor fase 5 zegt verwijderen. Besluit: verwijderen. De bundel-logica (`lib/bundles.ts`, `lib/bundle-discount.ts`) blijft voor toekomstige sets; de configurator is v1-UI met v1-tokens en zou de token-poort van Task 12 laten falen. Wordt er ooit weer een set gemaakt, dan komt er een v2-configurator op `components/ui/*`.

- [ ] **Step 1: Bewijs dat niets de vervallen bestanden nog gebruikt**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git grep -nE "components/(Nav|Footer|Hero|LatestDrop|Marquee|WaveBars|ShopDropdown|ShopSidebar|ShopFilters|BundleCover|DonationBanner|ProductCard|ProductCarousel)/|BundleConfigurator|landing\.module\.css" -- app components lib hooks store proxy.ts \
  ':!components/Nav' ':!components/Footer' ':!components/Hero' ':!components/LatestDrop' ':!components/Marquee' ':!components/WaveBars' \
  ':!components/ShopDropdown' ':!components/ShopSidebar' ':!components/ShopFilters' ':!components/BundleCover' ':!components/DonationBanner' \
  ':!components/ProductCard' ':!components/ProductCarousel' ':!app/deals'
```

Expected: precies drie regels, de type-imports `import type { FilterGroup } from '@/components/ShopFilters/ShopFilters'` in `components/ui/FilterBar/FilterBar.tsx`, `components/ui/FilterBar/FilterBar.test.tsx` en `lib/shop-query.ts`. Staat er iets anders (bijvoorbeeld een import van `DonationBanner` die fase 3 liet staan), stop dan en meld het de controller.

- [ ] **Step 2: Schrijf de falende test voor publieke paden**

`lib/public-assets.test.ts`:

```ts
/** @jest-environment node */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SOURCE_DIRS = ['app', 'components', 'lib', 'hooks', 'styles']
const ASSET = /['"`(]\/((?:brand|olympian|drops|logos|categories|products)\/[A-Za-z0-9._\/-]+\.(?:png|jpe?g|webp|svg|mp4))/g

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(tsx?|css|json)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) out.push(full)
  }
  return out
}

describe('public assets', () => {
  const refs = SOURCE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(ASSET)].map((m) => ({ file: path.relative(ROOT, file), asset: m[1] })),
  )

  it('finds the asset references it is meant to guard', () => {
    expect(refs.some((r) => r.asset.startsWith('brand/'))).toBe(true)
  })

  it('points every referenced public path at a file that exists', () => {
    const missing = refs.filter((r) => !existsSync(path.join(ROOT, 'public', r.asset)))
    expect(missing).toEqual([])
  })

  it('has nothing left in public/logos, the v1 logo folder', () => {
    expect(refs.filter((r) => r.asset.startsWith('logos/'))).toEqual([])
    expect(existsSync(path.join(ROOT, 'public/logos'))).toBe(false)
  })
})
```

Run: `npm test -- lib/public-assets`
Expected: FAIL op de derde test: `public/logos` bestaat nog.

- [ ] **Step 3: Verplaats de filtertypen**

`lib/filter-types.ts`:

```ts
/** URL-state shape of the shop filters (spec section 5: ShopFilters provides it, FilterBar renders it). */
export interface FilterItem {
  label: string
  href: string
  active: boolean
}

export interface FilterGroup {
  label: string
  items: FilterItem[]
}
```

```bash
perl -pi -e "s#'\@/components/ShopFilters/ShopFilters'#'\@/lib/filter-types'#" \
  components/ui/FilterBar/FilterBar.tsx components/ui/FilterBar/FilterBar.test.tsx lib/shop-query.ts
perl -pi -e 's#in the URL-state shape ShopFilters already uses#in the URL-state shape from lib/filter-types.ts#' lib/shop-query.ts
git grep -n "ShopFilters" -- app components lib hooks
```

Expected: geen uitvoer.

- [ ] **Step 4: Verwijder de vervallen bestanden**

```bash
git rm -rq components/Nav components/Footer components/Hero components/LatestDrop components/Marquee components/WaveBars \
  components/ShopDropdown components/ShopSidebar components/ShopFilters components/BundleCover components/DonationBanner \
  components/ProductCard app/deals app/landing.module.css \
  public/logos public/categories public/hero-model.png public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
test -d components/ProductCarousel && git rm -rq components/ProductCarousel
ls components public
```

Expected: `components` bevat nog `AccountButton`, `AppShell`, `CartDrawer`, `CheckoutHeader`, `CookieBanner`, `GoogleSignIn`, `Logo`, `StoreHydration`, `ui`; `public` bevat `brand`, `drops`, `olympian`, `olympian-trailer.mp4`, `products`.

- [ ] **Step 5: Logo alleen nog navy en crème**

```bash
git grep -nE "Logo(Wordmark|Badge)? [^>]*variant=\"(wit|zwart|butter|ink|blood|stone)\"" -- app components
```

Expected: geen uitvoer (Task 2 zette header, footer en checkout-header op `navy`/`cream`; de success-pagina gebruikt sinds fase 3 Task 10 geen logo meer).

Vervang in `components/Logo/Logo.tsx`:

```tsx
/** v1 colour names, accepted until the last v1 caller is gone (phase 5). */
type LegacyVariant = 'wit' | 'zwart' | 'butter' | 'ink' | 'blood' | 'stone'
export type LogoVariant = BrandTone | LegacyVariant

/** Light variants sit on navy surfaces, everything else on cream. */
export function toneFor(variant: LogoVariant): BrandTone {
  return variant === 'cream' || variant === 'wit' || variant === 'butter' ? 'cream' : 'navy'
}
```

door:

```tsx
/** Navy on cream surfaces, cream on navy ones. */
export type LogoVariant = BrandTone
```

en vervang daarna in hetzelfde bestand elke `[toneFor(variant)]` door `[variant]`:

```bash
perl -pi -e 's/\[toneFor\(variant\)\]/[variant]/g' components/Logo/Logo.tsx
```

Haal in `components/Logo/Logo.test.tsx` de test `it('maps the v1 colour names onto the two tones', ...)` weg en vervang de import `import Logo, { LogoBadge, LogoWordmark, toneFor } from './Logo'` door `import Logo, { LogoBadge, LogoWordmark } from './Logo'`.

- [ ] **Step 6: Run de tests, verwacht groen**

Run: `npm test -- (lib/public-assets|Logo|FilterBar|shop-query)`
Expected: PASS.

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Preview: alles werkt als na fase 4; `/logos/woordmerk-ink.png` geeft 404, `/brand/7eno-wordmark-navy.png` 200.

- [ ] **Step 8: Commit**

```bash
git add -A lib/filter-types.ts lib/public-assets.test.ts lib/shop-query.ts components app/deals app/landing.module.css public
git commit -m "chore: remove retired v1 components, deals configurator and v1 public files"
```

---

### Task 12: Oude tokens, oude fonts en lange streepjes weg, met een repo-poort

**Files:**
- Create: `scripts/repo-gates.test.ts`
- Modify: `styles/globals.css:1-127` (volledig vervangen)
- Modify: `app/layout.tsx:2`, `:9-28`, `:130` (na Task 9)
- Modify: `components/AppShell/AppShell.module.css:19-27` (fase 1-2 Task 5: de `--nav-height`-brug)
- Modify: `components/AccountButton/AccountButton.module.css:1-32` (volledig vervangen)
- Modify: `components/CookieBanner/CookieBanner.module.css:1-88` (volledig vervangen)
- Modify: `styles/tokens.test.ts:105` (testnaam)
- Modify (lange streepjes): `app/api/checkout/route.ts` (commentaar bij `coupon_redemptions`, nu regel 204), `app/api/health/route.ts:69`, `lib/bundles.ts:6`, `lib/supabase/server.ts:22`, `lib/email/send.ts:40`, `lib/color-utils.ts` (7 regels), `lib/merchant-feed.ts` (3), `lib/merchant-feed.test.ts` (3), `lib/printful.ts:189`, `:226`, `scripts/install-printful-webhook.ts:4`, `:37`, `scripts/install-printify-webhook.ts:35`, `supabase/schema.sql:2`, `.env.example:38`, plus wat de poort verder vindt in bestanden die fase 1-3 herschreven (`app/sitemap.ts`, `app/product-feed.xml/route.ts`, `app/checkout/layout.tsx`, `app/shop/[slug]/*`, `lib/product-classify.ts`)

**Interfaces:**
- Consumes: niets nieuws.
- Produces: `scripts/repo-gates.test.ts` met twee poorten die vanaf nu bij elke `npm test` draaien: geen v1-tokens, v1-themaklassen of v1-fonts, en geen em- of en-dashes in de broncode.

De poort scant alle tekstbestanden behalve `node_modules`, `.next`, `.git`, mappen die met een punt beginnen, `docs/` (spec, plannen en QA-rapporten citeren de oude namen bewust), `app/_fonts/` (licentietekst van derden), `AGENTS.md` en `CLAUDE.md` (instructiebestanden van de tooling) en `package-lock.json`. Het patroon is breder dan de `--ink|--bone|oly-|Cormorant|Space Mono` uit de opdracht: elke v1-token uit `styles/globals.css` telt, zodat een vergeten `var(--gutter)` niet doorglipt, en `oly-` alleen als v1-klasse of -token (`poly-` mag).

- [ ] **Step 1: Schrijf de poort**

`scripts/repo-gates.test.ts`:

```ts
/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SKIP_DIRS = new Set(['node_modules', 'docs', 'coverage', 'playwright-report', 'test-results'])
const SKIP_PATHS = new Set(['app/_fonts', 'AGENTS.md', 'CLAUDE.md', 'package-lock.json'])
const TEXT = /\.(ts|tsx|js|mjs|cjs|css|json|md|sql|txt|xml|yml|yaml)$|^\.env\.example$/
const SELF = 'scripts/repo-gates.test.ts'

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = path.relative(ROOT, full)
    if (SKIP_PATHS.has(rel)) continue
    if (statSync(full).isDirectory()) {
      if (!name.startsWith('.') && !SKIP_DIRS.has(name)) walk(full, out)
    } else if (TEXT.test(name)) {
      out.push(rel)
    }
  }
  return out
}

function hits(files: string[], pattern: RegExp): string[] {
  return files.flatMap((file) =>
    readFileSync(path.join(ROOT, file), 'utf8')
      .split('\n')
      .flatMap((line, i) => (pattern.test(line) ? [`${file}:${i + 1}: ${line.trim()}`] : [])),
  )
}

const files = walk(ROOT)

// Every v1 token from the old styles/globals.css, the v1 theme classes and fonts.
const LEGACY =
  /--(ink|bone|butter|paper|oxblood|stone|mid|rule|gutter|font-sans|font-display|font-serif|font-mono|nav-height|max-width)(?![\w-])|\boly-(theme|palette|clay|teal|wheat|rosa|bg)\b|Cormorant|Space[ _]Mono/
const LONG_DASH = /[\u2013\u2014]/

describe('repo gates', () => {
  it('scans the source tree', () => {
    expect(files).toEqual(expect.arrayContaining(['app/layout.tsx', 'styles/tokens.css', '.env.example']))
    expect(files.some((f) => f.startsWith('docs/') || f.startsWith('node_modules/'))).toBe(false)
  })

  it('has no v1 tokens, theme classes or fonts left (spec section 10, phase 5)', () => {
    expect(hits(files.filter((f) => f !== SELF), LEGACY)).toEqual([])
  })

  it('has no em or en dashes anywhere in the source', () => {
    expect(hits(files, LONG_DASH)).toEqual([])
  })
})
```

- [ ] **Step 2: Run de poort, verwacht falen met een lijst**

Run: `npm test -- scripts/repo-gates 2>&1 | head -120`
Expected: FAIL. De v1-poort noemt `styles/globals.css`, `app/layout.tsx` (Cormorant, Space Mono), `components/AppShell/AppShell.module.css`, `components/AccountButton/AccountButton.module.css`, `components/CookieBanner/CookieBanner.module.css` en `styles/tokens.test.ts:105`. De streepjespoort noemt de bestanden uit de Files-lijst. Bewaar deze uitvoer: hij is de werklijst voor Step 3 tot en met 6.

- [ ] **Step 3: Globale CSS en layout zonder v1**

Vervang `styles/globals.css` volledig:

```css
/* Global base for v2. All tokens live in styles/tokens.css (spec section 2);
   this file only resets and sets the page defaults. */

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

body {
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-body);
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  display: block;
  max-width: 100%;
}

button {
  cursor: pointer;
  font-family: inherit;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

De globale klassen `.container` en `.mono` en de keyframe `fadeInUp` vervallen; controleer dat niets ze nog leest:

```bash
git grep -nE "fadeInUp|className=(\"|\{\`)[^\"\`]*\b(container|mono)\b" -- app components
```

Expected: geen uitvoer.

In `app/layout.tsx` vervang regel 2:

```ts
import { Space_Mono, Cormorant_Garamond, Archivo, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google'
```

door:

```ts
import { Archivo, Instrument_Sans, IBM_Plex_Mono } from 'next/font/google'
```

Verwijder regel 9-28: het commentaarblok dat begint met `// Cormorant Garamond is the site-wide typeface` tot en met de afsluitende `})` van `const spaceMono = Space_Mono({ ... })`, plus de lege regel erna. Vervang:

```tsx
      className={`${cormorant.variable} ${spaceMono.variable} ${archivo.variable} ${instrumentSans.variable} ${plexMono.variable}`}
```

door:

```tsx
      className={`${archivo.variable} ${instrumentSans.variable} ${plexMono.variable}`}
```

In `components/AppShell/AppShell.module.css` vervang regel 19-27:

```css
/*
 * Old pages pad and stick against --nav-height (styles/globals.css). Inside
 * the shell it equals the new fixed chrome, so they line up under it without
 * changing the old token definition. New pages use var(--l-chrome) directly.
 */
.content {
  flex: 1;
  --nav-height: var(--l-chrome);
}
```

door:

```css
.content {
  flex: 1;
}
```

In `styles/tokens.test.ts` vervang regel 105:

```ts
  it('declares only the new prefixes, so it can never clash with --ink or --gutter', () => {
```

door:

```ts
  it('declares only the v2 prefixes (c, f, fs, s, r, l, m)', () => {
```

- [ ] **Step 4: AccountButton en CookieBanner in v2**

Vervang `components/AccountButton/AccountButton.module.css` volledig:

```css
.btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: none;
  color: var(--c-text);
  text-decoration: none;
  transition: opacity var(--m-fast) var(--m-ease);
}

.btn:hover {
  opacity: 0.7;
}

.btn:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-success);
}
```

Vervang `components/CookieBanner/CookieBanner.module.css` volledig:

```css
.banner {
  position: fixed;
  bottom: var(--s-5);
  left: 50%;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: var(--s-5);
  width: calc(100% - 2 * var(--l-gutter));
  max-width: 640px;
  padding: var(--s-4) var(--s-5);
  border-radius: var(--r-0);
  background: var(--c-inverse-bg);
  color: var(--c-inverse-text);
  transform: translateX(-50%);
}

.text {
  flex: 1;
  margin: 0;
  font-family: var(--f-body);
  font-size: var(--fs-small);
  line-height: 1.5;
}

.policyLink {
  color: var(--c-inverse-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--s-2);
}

.decline,
.accept {
  min-height: 44px;
  padding: 0 var(--s-4);
  border: 1px solid var(--c-inverse-text);
  border-radius: var(--r-0);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: opacity var(--m-fast) var(--m-ease);
}

.decline {
  background: transparent;
  color: var(--c-inverse-text);
}

.accept {
  background: var(--c-inverse-text);
  color: var(--c-text);
}

.decline:hover,
.accept:hover {
  opacity: 0.85;
}

.policyLink:focus-visible,
.decline:focus-visible,
.accept:focus-visible {
  outline: 2px solid var(--c-inverse-text);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .banner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--s-4);
  }
}
```

- [ ] **Step 5: Lange streepjes in bestanden die geen eerdere taak herschreef**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
perl -CSD -pi -e 's/ \x{2014} /: /g' lib/color-utils.ts lib/supabase/server.ts app/api/health/route.ts scripts/install-printify-webhook.ts supabase/schema.sql
perl -CSD -pi -e 's/enforced \x{2014} see coupon_redemptions\)/enforced, see coupon_redemptions)/' app/api/checkout/route.ts
perl -CSD -pi -e 's/product id \x{2014} must be a real id/product id, must be a real id/' lib/bundles.ts
perl -CSD -pi -e 's/renderOrderConfirmation \x{2014} and their tests \x{2014} never/renderOrderConfirmation (and their tests) never/' lib/email/send.ts
perl -CSD -pi -e 's/config \x{2014} re-running is idempotent/config, so re-running is idempotent/; s/ \x{2014} /: /g' scripts/install-printful-webhook.ts
perl -CSD -pi -e 's/colour and size \x{2014} without those/colour and size; without those/; s/disapproval \x{2014} so non-apparel/disapproval, so non-apparel/; s/join\(\x27 \x{2014} \x27\)/join(\x27 - \x27)/' lib/merchant-feed.ts
perl -CSD -pi -e 's/ \x{2014} / - /g' lib/merchant-feed.test.ts
perl -CSD -pi -e 's/\x{2013}/-/g' lib/printful.ts
perl -CSD -pi -e 's#http://localhost:3000 \x{2014} production: #http://localhost:3000, production: #' .env.example
npm test -- scripts/repo-gates 2>&1 | grep -E "^\s+\"" | head -40
```

`lib/merchant-feed.ts` bouwt de Merchant Center-titel met `' - '` in plaats van een lang streepje ("Olympian Tee - Ocean, M"); dat is een titelwijziging in de feed en staat daarom op de go-live-checklist (Task 13). `lib/printful.ts` geeft maatbereiken voortaan als `86-94`.

Expected: de laatste opdracht toont alleen nog hits in bestanden die fase 1-3 herschreven (of geen enkele).

- [ ] **Step 6: Restanten volgens vaste regels**

Los elke resterende hit uit de uitvoer van Step 5 op met de Edit-tool (lees het bestand eerst) volgens deze regels, in deze volgorde:

| Situatie | Vervang door | Voorbeeld |
|---|---|---|
| Getalbereik (`5`, lang streepje, `10`) | koppelteken zonder spaties, of "to" in lopende tekst | `86-94`; "5 to 10 business days" |
| Lege tabelcel of placeholder (`'`, lang streepje, `'`) | `'-'` | `{value \|\| '-'}` |
| Titel- of naamscheiding in metadata, feed of `<title>` | ` · ` | `'7ENO (Zeno) · Premium Streetwear'` |
| Gedachtestreepje in commentaar of UI-tekst | `: ` als er een uitleg volgt, `, ` als de zin doorloopt, twee streepjes om een tussenzin worden haakjes | "remove.bg credits: and it would" wordt "remove.bg credits, and it would" |
| CSS `content:` met een streepje | `'-'` | `content: '-';` |
| v1-token in CSS (v1-poort) | het v2-token met dezelfde rol | `--ink` wordt `--c-text`, `--bone`/`--butter` `--c-bg`, `--paper` `--c-surface`, `--stone`/`--mid` `--c-text-muted`, `--rule` `--c-stone`, `--oxblood` `--c-accent-ink`, `--gutter` `--l-gutter`, `--nav-height` `--l-chrome`, `--max-width` `--l-max`, `--font-sans`/`--font-serif` `--f-body`, `--font-display` `--f-display`, `--font-mono` `--f-mono` |
| v1-tokennaam in commentaar | herschrijf de zin zonder de naam | "pads against the fixed chrome" |

Run daarna: `npm test -- (scripts/repo-gates|merchant-feed|printful|sitemap|product-feed)`
Expected: PASS. Faalt een feed- of sitemaptest op een verwachte titel met een lang streepje, pas dan de verwachting aan volgens dezelfde regel (de test volgt de nieuwe titel).

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; de build laadt alleen nog Archivo, Instrument Sans en IBM Plex Mono (`ls .next/static/media | wc -l` is kleiner dan vóór deze taak). Preview: geen visuele wijziging behalve de cookiebanner (navy, leesbare tekst) en het accounticoon (navy op crème).

- [ ] **Step 8: Commit**

```bash
git add -A scripts/repo-gates.test.ts styles app/layout.tsx components/AppShell components/AccountButton components/CookieBanner \
  app lib scripts supabase .env.example
git commit -m "chore: drop v1 tokens, fonts and long dashes, gate them repo-wide"
```

---

### Task 13: README, `.env.example` en de go-live-checklist

**Files:**
- Modify: `.env.example:7` (twee Printful-variabelen erna), `:36` (waitlist-audience erna)
- Create: `lib/env-example.test.ts`
- Modify: `README.md:1-36` (volledig vervangen)
- Create: `docs/qa/go-live-checklist.md`

**Interfaces:**
- Consumes: niets.
- Produces: `lib/env-example.test.ts` bewaakt dat elke `process.env.X` in de code in `.env.example` staat en dat `.env.example` geen echte sleutels bevat.

- [ ] **Step 1: Schrijf de falende test**

`lib/env-example.test.ts`:

```ts
/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CODE = ['app', 'components', 'hooks', 'lib', 'store', 'scripts', 'proxy.ts', 'next.config.ts']
// Set by the platform or by the QA scripts themselves, never by a person.
const PLATFORM = new Set(['NODE_ENV', 'VERCEL_ENV', 'NEXT_RUNTIME', 'CI', 'CHROME_PATH', 'LH_PORT', 'E2E_PORT'])

function files(entry: string, out: string[] = []): string[] {
  const full = path.join(ROOT, entry)
  if (statSync(full).isDirectory()) {
    for (const name of readdirSync(full)) files(path.join(entry, name), out)
  } else if (/\.(ts|tsx|mjs)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
    out.push(full)
  }
  return out
}

const example = readFileSync(path.join(ROOT, '.env.example'), 'utf8')
const declared = new Set([...example.matchAll(/^([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]))
const used = new Set(
  CODE.flatMap((entry) => files(entry)).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)].map((m) => m[1]),
  ),
)

describe('.env.example', () => {
  it('declares every variable the code reads', () => {
    expect([...used].filter((name) => !PLATFORM.has(name) && !declared.has(name)).sort()).toEqual([])
  })

  it('declares the v2 variables from spec section 7', () => {
    for (const name of ['RESEND_WAITLIST_AUDIENCE_ID', 'SITE_PREVIEW_KEY', 'PRINTFUL_ACCOUNT_TOKEN', 'PRINTFUL_STORE_ID']) {
      expect(declared.has(name)).toBe(true)
    }
  })

  it('never contains a real secret', () => {
    expect(example).not.toMatch(/sk_live_|rk_live_|whsec_[A-Za-z0-9]{12,}|re_[A-Za-z0-9]{20,}/)
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- lib/env-example`
Expected: FAIL: `PRINTFUL_STORE_ID` (gelezen in `lib/printful.ts:27`) en `RESEND_WAITLIST_AUDIENCE_ID` (gelezen in `lib/waitlist-resend.ts`, fase 1-2 Task 15) ontbreken; `PRINTFUL_ACCOUNT_TOKEN` ook.

- [ ] **Step 3: Vul `.env.example` aan**

Voeg na regel 7 (`PRINTFUL_API_KEY=your_printful_api_key`) in:

```bash
# Optional: the Printful store to address when the API key reaches more than
# one store (sent as X-PF-Store-Id). Leave empty for a single-store key.
PRINTFUL_STORE_ID=
# Account-level Printful token (scope product_templates/read), set in the
# Preview and Production env (spec section 7). The shop itself does not read
# it; it is for template lookups against the Printful API.
PRINTFUL_ACCOUNT_TOKEN=
```

Voeg na de regel `ORDER_EMAIL_BCC=orders@7eno.shop` in:

```bash
# Resend audience for the drop waitlist (app/api/waitlist). Use a test audience
# on the Preview and the live audience in Production. Create the contact
# properties drop_id and product_slug (string) in Resend first. Without this
# value the form answers "The waitlist is not open right now." and stores nothing.
RESEND_WAITLIST_AUDIENCE_ID=
```

- [ ] **Step 4: Run de test, verwacht groen**

Run: `npm test -- lib/env-example`
Expected: PASS.

- [ ] **Step 5: Vervang `README.md`**

````markdown
# 7eno.shop

The online store of 7ENO (pronounced "Zeno"), streetwear by Abra Entertainment. The shop is drop-driven: every collection is a numbered edition with a release window (Olympian is edition 01, OLYMPN Sport edition 02). Products are made to order by Printful; payments run through Stripe, accounts and order history through Supabase, mail through Resend.

## Stack

Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, CSS Modules with the v2 tokens in `styles/tokens.css`, Zustand for the cart, Jest 30 with Testing Library, Playwright with axe for accessibility, Lighthouse for performance. Read `AGENTS.md` first: this Next.js version differs from older docs, and the bundled guides live in `node_modules/next/dist/docs/`.

## Getting started

```bash
npm ci
cp .env.example .env.local   # fill in test keys only, see below
npm run dev                  # http://localhost:3000
```

Use Stripe test keys (`sk_test_`, `pk_test_`) locally. Never run a checkout against a live key.

## Environment

Every variable is documented in `.env.example`; `lib/env-example.test.ts` fails when the code reads one that is not listed there. The rebrand added:

| Variable | Purpose |
|---|---|
| `RESEND_WAITLIST_AUDIENCE_ID` | Resend audience for the drop waitlist (`app/api/waitlist`). Test audience on the Preview, live audience in Production. |
| `SITE_PREVIEW_KEY` | Visiting any URL with `?preview=<key>` stores a cookie that shows an upcoming drop as live, for QA. Ignored when `VERCEL_ENV=production`. |
| `PRINTFUL_ACCOUNT_TOKEN` | Account-level Printful token (`product_templates/read`) for template lookups. Not read by the shop itself. |
| `PRINTFUL_STORE_ID` | Optional store id when the Printful key reaches more than one store. |

## Drops

`lib/drops.ts` is the single source of truth: which Printful products belong to which edition (sync id first, then name prefix), when an edition goes live and whether it can be bought. `getShopProducts` in `lib/catalog.ts` applies it as an allow-list; pages, sitemap, product feed and the checkout guard all read from there. Never rename a product in Printful after it is published: the slug, the sitemap entry and Merchant Center links depend on its name.

## Brand files

`lib/brand.ts` lists every logo, icon and video in `public/brand/` with its pixel size. Rebuild the generated ones after a source in `docs/brand/` changes:

```bash
npm run brand:assets   # wordmarks, marks, app icons, app/apple-icon.png, lib/brand-assets.json
npm run brand:og-font  # Archivo TTF for the OG images in app/_fonts/
```

The logos are PNG until the SVG exports arrive; then the favicon and OG images get one more pass.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js development server, production build, production server |
| `npm test` | Jest, including the repo gates (no v1 tokens, no long dashes) |
| `npm run lint` | ESLint over the whole repo |
| `npm run qa:a11y` | axe scan via Playwright on a production build, writes `docs/qa/a11y-<date>.md` |
| `npm run qa:lighthouse` | Lighthouse (mobile) on home, PLP and PDP, writes `docs/qa/lighthouse-<date>.md` |

Quality gate for every change: `npx tsc --noEmit && npm test && npm run lint && npm run build`.

## Deploying

Vercel. `master` is production; every push to another branch gives a Preview behind Deployment Protection. The v2 redesign lives on `redesign/v2` and goes live through the checklist in `docs/qa/go-live-checklist.md`.
````

- [ ] **Step 6: Schrijf de go-live-checklist**

`docs/qa/go-live-checklist.md`:

```markdown
# Go-live checklist rebrand v2

Bron: spec sectie 7 (`docs/superpowers/specs/2026-10-13-rebrand-v2-design.md`), aangevuld met wat fase 4 en 5 opleverden. Vink af in deze volgorde; productie blijft onaangeroerd tot stap 3.

## Voor de merge

- [ ] 1. Joep heeft de Preview van `redesign/v2` goedgekeurd (home, collecties, archive, PLP, PDP, cart, checkout tot vóór betalen, account, tekstpagina's, 404).
- [ ] 2. Releasedatum OLYMPN Sport (1 november 2026, 12:00 NL-tijd) staat bevestigd in `lib/drops.ts`, en de acht sync-id's staan in `printfulSyncIds`.
- [ ] Lighthouse mobiel 90+ op home, PLP en PDP volgens het laatste rapport in `docs/qa/` (`lighthouse-<datum>.md`); punten onder 90 zijn opgelost of door Joep geaccepteerd.
- [ ] axe-scan zonder fouten volgens het laatste `docs/qa/a11y-<datum>.md` (home, PLP, PDP, cart open, checkout, mobiel menu open).
- [ ] Testorders op de Preview (`cs_test_`) zijn uit Supabase en Printful (concepten) opgeruimd.
- [ ] Logo's: SVG-exports van Joep binnen? Zo ja: woordmerk, beeldmerk, favicon en OG-images vervangen en `npm run brand:assets` opnieuw. Zo nee: bewust live met PNG.

## Merge en productie

- [ ] 3. PR `redesign/v2` naar `master`, CI groen, mergen.
- [ ] 4. Production-env in Vercel: `PRINTFUL_ACCOUNT_TOKEN` en `RESEND_WAITLIST_AUDIENCE_ID` (live audience, met de contact-properties `drop_id` en `product_slug`). `SITE_PREVIEW_KEY` niet zetten in Production.
- [ ] 5. Redirects testen op productie: `/olympian`, `/deals`, `/deals/x`, `/coming-soon`, `/shop?line=olympian`, `/shop?line=og&utm_source=ig` (allemaal 308 met behoud van de overige query).
- [ ] 6. `sitemap.xml` en `product-feed.xml` controleren (alleen live drops, geen OG, geen teaser), sitemap opnieuw indienen in Search Console, feed in Merchant Center laten verversen. Let op: de feedtitels gebruiken nu " - " in plaats van een lang streepje, Merchant Center kan de items opnieuw beoordelen.
- [ ] Metadata: `theme-color` is `#2D3A4F`, de OG-preview van `/` en `/collections/olympn-sport` klopt (bijvoorbeeld via de debugger van Facebook of LinkedIn), `/manifest.webmanifest` toont drie iconen.
- [ ] 7. Eén echte kleine bestelling, daarna annuleren en terugbetalen. De prefix-guard uit PR A verdwijnt met de merge; de drop-logica neemt het over.
- [ ] Orderbevestiging en verzendmail van die bestelling bekijken in een echte mailclient (Gmail en Apple Mail): navy en crème, nieuw woordmerk, geen Georgia.

## Na de release (1 november 2026, 12:00)

- [ ] `/collections/olympn-sport` kantelt van klok naar "Live now" binnen een minuut, zonder deploy.
- [ ] Waitlist-contacten in Resend gemaild met de release.
```

- [ ] **Step 7: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; de repo-poort uit Task 12 controleert ook `README.md` en `.env.example` op lange streepjes.

- [ ] **Step 8: Commit**

```bash
git add .env.example lib/env-example.test.ts README.md docs/qa/go-live-checklist.md
git commit -m "docs: document v2 env vars, rewrite README and add the go-live checklist"
```

---

### Task 14: Toegankelijkheidsscan en Lighthouse, met rapporten in `docs/qa`

**Files:**
- Modify: `package.json` (devDependencies `@playwright/test@1.63.0`, `@axe-core/playwright@4.13.0`, `lighthouse@13.5.0`; scripts `qa:a11y`, `qa:lighthouse`), `package-lock.json`
- Modify: `jest.config.ts:6-10` (`testPathIgnorePatterns` voor `e2e/`)
- Create: `playwright.config.ts`
- Create: `e2e/a11y.spec.ts`
- Create: `scripts/lib/lighthouse-report.mjs`
- Test: `scripts/lib/lighthouse-report.test.ts`
- Create: `scripts/lighthouse-report.mjs`
- Create (gegenereerd): `docs/qa/a11y-<datum>.md`, `docs/qa/lighthouse-<datum>.md`

**Interfaces:**
- Consumes: de UI uit fase 1-3: knop "Open menu" en dialoog "Menu" (fase 1-2 Task 4), knop "Open cart" (naam begint zo, fase 1-2 Task 4) en dialoog "Cart" (fase 3 Task 8), de cart-opslag `7eno-cart-v2` met `version: 2` (`store/cart.ts:69-73`), tegels met `a[href^="/shop/"]`.
- Produces (`scripts/lib/lighthouse-report.mjs`):
  - `export const TARGET = 90`
  - `export function pickPdpPath(sitemapXml: string): string | null`
  - `export async function warmUp(base: string, paths: string[], fetchImpl?: typeof fetch, times?: number): Promise<Record<string, number[]>>`
  - `export function summarise(lhr): { performance: number; accessibility: number; bestPractices: number; seo: number; lcp: string; cls: string; tbt: string }`
  - `export function meetsTarget(summary, target?: number): boolean`
  - `export function renderReport({ date, base, rows, warm, lighthouseVersion }): string`

Beide QA-runs gebruiken een productiebuild (`next start`) met `.env.local`. Dat bevat een live Stripe-sleutel; daarom blokkeert de axe-scan `/api/checkout`, `/api/promo/*` en alles van `stripe.com` op netwerkniveau, vult hij geen enkel formulierveld in en drukt hij op geen enkele knop in de checkout. Lighthouse opent de checkout niet.

- [ ] **Step 1: Installeer de gereedschappen**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
npm install --save-dev --save-exact @playwright/test@1.63.0 @axe-core/playwright@4.13.0 lighthouse@13.5.0
npx playwright install chromium
```

Expected: drie devDependencies erbij; Playwright meldt dat Chromium klaarstaat (of downloadt hem eenmalig, ongeveer 150 MB).

Voeg in `package.json` na de regel `"brand:og-font": "node scripts/fetch-og-font.mjs"` toe (komma erachter):

```json
    "qa:a11y": "playwright test",
    "qa:lighthouse": "node scripts/lighthouse-report.mjs"
```

Vervang in `jest.config.ts` regel 6-10:

```ts
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}
```

door:

```ts
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Playwright specs run with `npm run qa:a11y`, not with Jest.
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
}
```

- [ ] **Step 2: Schrijf de falende test voor de Lighthouse-helpers**

`scripts/lib/lighthouse-report.test.ts`:

```ts
/** @jest-environment node */
import { meetsTarget, pickPdpPath, renderReport, summarise, warmUp } from './lighthouse-report.mjs'

const SITEMAP = `<?xml version="1.0"?><urlset>
  <url><loc>https://www.7eno.shop/</loc></url>
  <url><loc>https://www.7eno.shop/shop</loc></url>
  <url><loc> https://www.7eno.shop/shop/olympian-tee-ocean-unisex </loc></url>
  <url><loc>https://www.7eno.shop/shop/olympian-tee-sand-unisex</loc></url>
</urlset>`

const summary = (score: number) => ({
  performance: score, accessibility: 100, bestPractices: 100, seo: 100, lcp: '2.1 s', cls: '0', tbt: '120 ms',
})

describe('pickPdpPath', () => {
  it('takes the first product page from the sitemap', () => {
    expect(pickPdpPath(SITEMAP)).toBe('/shop/olympian-tee-ocean-unisex')
  })

  it('returns null when no product is live', () => {
    expect(pickPdpPath('<urlset><url><loc>https://x/shop</loc></url></urlset>')).toBeNull()
  })
})

describe('warmUp', () => {
  it('requests every path twice before anything is measured, without following redirects', async () => {
    const calls: string[] = []
    const fakeFetch = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push(`${url} ${init?.redirect}`)
      return { status: url.endsWith('/shop') ? 200 : 308 } as Response
    })
    const statuses = await warmUp('http://localhost:3100', ['/', '/shop'], fakeFetch as unknown as typeof fetch)
    expect(calls).toEqual([
      'http://localhost:3100/ manual', 'http://localhost:3100/ manual',
      'http://localhost:3100/shop manual', 'http://localhost:3100/shop manual',
    ])
    expect(statuses).toEqual({ '/': [308, 308], '/shop': [200, 200] })
  })
})

describe('summarise and meetsTarget', () => {
  it('turns Lighthouse scores into whole numbers and reads the vitals', () => {
    const lhr = {
      categories: { performance: { score: 0.894 }, accessibility: { score: 1 }, 'best-practices': { score: 0.96 }, seo: { score: 1 } },
      audits: {
        'largest-contentful-paint': { displayValue: '2.4 s' },
        'cumulative-layout-shift': { displayValue: '0.01' },
        'total-blocking-time': { displayValue: '90 ms' },
      },
    }
    expect(summarise(lhr)).toEqual({
      performance: 89, accessibility: 100, bestPractices: 96, seo: 100, lcp: '2.4 s', cls: '0.01', tbt: '90 ms',
    })
  })

  it('needs 90 on every category', () => {
    expect(meetsTarget(summary(90))).toBe(true)
    expect(meetsTarget(summary(89))).toBe(false)
  })
})

describe('renderReport', () => {
  const report = renderReport({
    date: '2026-10-20',
    base: 'http://localhost:3100',
    lighthouseVersion: '13.5.0',
    warm: { '/': [200, 200], '/shop': [200, 200] },
    rows: [
      { name: 'Home', path: '/', summary: summary(93) },
      { name: 'PLP', path: '/shop', summary: summary(85) },
      { name: 'PDP', path: null, summary: null },
    ],
  })

  it('has a table row per page with the verdict', () => {
    expect(report).toContain('# Lighthouse, 2026-10-20')
    expect(report).toContain('| Home | `/` | 93 | 100 | 100 | 100 | 2.1 s | 0 | 120 ms | met |')
    expect(report).toContain('| PLP | `/shop` | 85 | 100 | 100 | 100 | 2.1 s | 0 | 120 ms | not met |')
    expect(report).toContain('| PDP | none live | skipped |')
  })

  it('records the warm-up and lists what is below target', () => {
    expect(report).toContain('- `/`: 200, 200')
    expect(report).toContain('- PLP: performance 85')
  })

  it('contains no long dashes', () => {
    expect(report).not.toMatch(/[\u2013\u2014]/)
  })
})
```

- [ ] **Step 3: Run de test, verwacht falen**

Run: `npm test -- scripts/lib/lighthouse-report`
Expected: FAIL met `Cannot find module './lighthouse-report.mjs'`.

- [ ] **Step 4: Implementeer de helpers**

`scripts/lib/lighthouse-report.mjs`:

```js
/** Pure helpers for scripts/lighthouse-report.mjs. */

export const TARGET = 90

/** First product page in a sitemap; only live products are listed there. */
export function pickPdpPath(sitemapXml) {
  for (const match of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const { pathname } = new URL(match[1].trim())
    if (/^\/shop\/[^/]+$/.test(pathname)) return pathname
  }
  return null
}

/**
 * Requests every path `times` times before measuring, so the Printful fetch
 * cache and the ISR pages are warm: a cold first render is not what visitors
 * get. Redirects are not followed, so a 308 shows up in the report.
 */
export async function warmUp(base, paths, fetchImpl = fetch, times = 2) {
  const statuses = {}
  for (const p of paths) {
    statuses[p] = []
    for (let i = 0; i < times; i += 1) {
      const res = await fetchImpl(new URL(p, base).href, { redirect: 'manual' })
      statuses[p].push(res.status)
    }
  }
  return statuses
}

/** Scores (0-100) and three vitals from a Lighthouse result object. */
export function summarise(lhr) {
  const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100)
  const audit = (id) => lhr.audits[id]?.displayValue ?? 'n/a'
  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('best-practices'),
    seo: score('seo'),
    lcp: audit('largest-contentful-paint'),
    cls: audit('cumulative-layout-shift'),
    tbt: audit('total-blocking-time'),
  }
}

export function meetsTarget(summary, target = TARGET) {
  return [summary.performance, summary.accessibility, summary.bestPractices, summary.seo].every((s) => s >= target)
}

export function renderReport({ date, base, rows, warm, lighthouseVersion }) {
  const lines = [
    `# Lighthouse, ${date}`,
    '',
    `Mobile preset (Lighthouse ${lighthouseVersion} defaults: phone emulation, simulated slow 4G), production build via \`next start\` on ${base}. Every page was requested twice before measuring (warm-up below). Target: ${TARGET} or more on every category (spec section 9).`,
    '',
    '| Page | Path | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Target |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ]
  for (const row of rows) {
    if (!row.summary) {
      lines.push(`| ${row.name} | none live | skipped |`)
      continue
    }
    const s = row.summary
    const verdict = meetsTarget(s) ? 'met' : 'not met'
    lines.push(`| ${row.name} | \`${row.path}\` | ${s.performance} | ${s.accessibility} | ${s.bestPractices} | ${s.seo} | ${s.lcp} | ${s.cls} | ${s.tbt} | ${verdict} |`)
  }
  lines.push('', '## Warm-up', '')
  for (const [p, statuses] of Object.entries(warm)) lines.push(`- \`${p}\`: ${statuses.join(', ')}`)
  lines.push('', '## Below target', '')
  const below = rows.flatMap((row) => {
    if (!row.summary) return []
    const s = row.summary
    const parts = [
      ['performance', s.performance], ['accessibility', s.accessibility], ['best practices', s.bestPractices], ['seo', s.seo],
    ].filter(([, score]) => score < TARGET)
    return parts.map(([label, score]) => `- ${row.name}: ${label} ${score}`)
  })
  lines.push(...(below.length > 0 ? below : ['None.']), '')
  return lines.join('\n')
}
```

- [ ] **Step 5: Run de test, verwacht groen**

Run: `npm test -- scripts/lib/lighthouse-report`
Expected: PASS, 9 tests.

- [ ] **Step 6: Het Lighthouse-script**

`scripts/lighthouse-report.mjs`:

```js
// Runs Lighthouse (mobile preset) against a production build on home, PLP and
// PDP and writes docs/qa/lighthouse-<date>.md. Run `npm run build` first, then
// `npm run qa:lighthouse`. Starts and stops `next start` itself.
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { meetsTarget, pickPdpPath, renderReport, summarise, warmUp } from './lib/lighthouse-report.mjs'

const ROOT = process.cwd()
const PORT = Number(process.env.LH_PORT ?? 3100)
const BASE = `http://localhost:${PORT}`
const BIN = (name) => path.join(ROOT, 'node_modules/.bin', name)

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited with ${code}`))))
  })
}

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No server at ${url} after ${timeoutMs} ms`)
}

const server = spawn(BIN('next'), ['start', '-p', String(PORT)], { stdio: 'inherit' })
try {
  await waitForServer(BASE)
  const pdp = pickPdpPath(await (await fetch(`${BASE}/sitemap.xml`)).text())
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'PLP', path: '/shop' },
    { name: 'PDP', path: pdp },
  ]
  const warm = await warmUp(BASE, pages.filter((p) => p.path).map((p) => p.path))
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'lighthouse-'))
  const env = { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? chromium.executablePath() }
  const rows = []
  for (const page of pages) {
    if (!page.path) {
      rows.push({ ...page, summary: null })
      continue
    }
    const out = path.join(tmp, `${page.name}.json`)
    await run(BIN('lighthouse'), [
      new URL(page.path, BASE).href,
      '--output=json',
      `--output-path=${out}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ], env)
    rows.push({ ...page, summary: summarise(JSON.parse(await readFile(out, 'utf8'))) })
  }
  const lighthouseVersion = JSON.parse(await readFile(path.join(ROOT, 'node_modules/lighthouse/package.json'), 'utf8')).version
  const date = new Date().toISOString().slice(0, 10)
  const file = path.join(ROOT, 'docs/qa', `lighthouse-${date}.md`)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, renderReport({ date, base: BASE, rows, warm, lighthouseVersion }))
  console.log(`Wrote ${path.relative(ROOT, file)}`)
  if (rows.some((row) => row.summary && !meetsTarget(row.summary))) process.exitCode = 1
} finally {
  server.kill('SIGTERM')
}
```

- [ ] **Step 7: De axe-scan**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3101)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

`e2e/a11y.spec.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// WCAG 2.2 AA as far as axe checks it (spec section 9).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const results: { page: string; violations: string[] }[] = []

const CART_ITEM = {
  provider: 'printful', variantId: 'a11y-variant', productId: 'a11y-product', productName: 'Olympian Tee Ocean Unisex',
  variantName: 'Ocean / M', price: '34.95', currency: 'EUR', quantity: 1, imageUrl: null,
}

async function scan(page: Page, name: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  results.push({ page: name, violations: violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length})`) })
  expect(violations.map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target.join(' ')) }))).toEqual([])
}

test.beforeEach(async ({ page }) => {
  // .env.local carries a live Stripe key: nothing in this scan may reach an order API or Stripe.
  await page.route('**/api/checkout**', (route) => route.abort())
  await page.route('**/api/promo/**', (route) => route.abort())
  await page.route(/stripe\.com/, (route) => route.abort())
})

test.afterAll(() => {
  const date = new Date().toISOString().slice(0, 10)
  const lines = [
    `# Accessibility scan, ${date}`,
    '',
    `axe (${TAGS.join(', ')}) via Playwright on a production build (\`next start\`).`,
    '',
    '| Page | Violations |',
    '|---|---|',
    ...results.map((r) => `| ${r.page} | ${r.violations.length === 0 ? 'none' : r.violations.join('; ')} |`),
    '',
  ]
  const file = path.join(process.cwd(), 'docs/qa', `a11y-${date}.md`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, lines.join('\n'))
})

test('home', async ({ page }) => {
  await page.goto('/')
  await scan(page, 'Home')
})

test('PLP', async ({ page }) => {
  await page.goto('/shop')
  await scan(page, 'PLP /shop')
})

test('PDP', async ({ page }) => {
  await page.goto('/shop')
  const href = await page.locator('main a[href^="/shop/"]').first().getAttribute('href')
  expect(href).toBeTruthy()
  await page.goto(href as string)
  await scan(page, `PDP ${href}`)
})

test('cart drawer open', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Open cart/ }).click()
  await expect(page.getByRole('dialog', { name: 'Cart' })).toBeVisible()
  await scan(page, 'Cart drawer open')
})

test('checkout with one line in the cart, nothing filled in', async ({ page }) => {
  await page.addInitScript((item) => {
    window.localStorage.setItem('7eno-cart-v2', JSON.stringify({ state: { items: [item] }, version: 2 }))
  }, CART_ITEM)
  await page.goto('/checkout')
  await expect(page.getByText('Olympian Tee Ocean Unisex').first()).toBeVisible()
  await scan(page, 'Checkout')
})

test.describe('mobile', () => {
  test.use({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true })

  test('menu open', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await scan(page, 'Mobile menu open')
  })
})
```

- [ ] **Step 8: Draai beide QA-runs**

```bash
npm run build
npm run qa:a11y
npm run qa:lighthouse
ls docs/qa
```

Expected: `qa:a11y` geeft `6 passed` en schrijft `docs/qa/a11y-<datum>.md` met overal "none". `qa:lighthouse` schrijft `docs/qa/lighthouse-<datum>.md` met drie rijen en twee warm-upregels per pagina met `200, 200`.

Vindt axe iets: lees de `id` en de `targets` in de uitvoer, los het op in het component dat de markup levert (niet in de test), voeg in de test van dat component een assert toe die het pint (bijvoorbeeld `getByLabelText` voor `label`, of `toHaveAttribute('aria-label')` voor `button-name`), draai `npm run build && npm run qa:a11y` opnieuw. Haalt Lighthouse op een pagina geen 90, dan sluit het script met code 1 en staat de score onder "Below target" in het rapport; het rapport wordt hoe dan ook gecommit, en de go-live-checklist (Task 13) houdt het punt open tot Joep het oplost of accepteert. Los in deze taak alleen op wat het rapport aanwijst in code die dit plan schreef (bijvoorbeeld `sizes` van de hero-foto of de OG-wordmark); een structureel probleem in fase 1-3-code wordt een eigen taak.

- [ ] **Step 9: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; Jest pakt `e2e/a11y.spec.ts` niet op (`testPathIgnorePatterns`), de repo-poort scant `docs/` niet.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json jest.config.ts playwright.config.ts e2e scripts/lib/lighthouse-report.mjs \
  scripts/lib/lighthouse-report.test.ts scripts/lighthouse-report.mjs docs/qa
git commit -m "test: add axe and Lighthouse QA runs and commit their first reports"
```

---

### Checkpoint fase 5

- [ ] **Step 1: Eindcontrole**

```bash
npx tsc --noEmit && npm test && npm run lint && npm run build
git grep -nE -- "--ink|--bone|\boly-(theme|palette)|Cormorant|Space Mono" -- ':!docs' ':!node_modules'
git grep -nP "[\x{2013}\x{2014}]" -- ':!docs' ':!AGENTS.md' ':!CLAUDE.md' ':!app/_fonts' ':!package-lock.json'
git status --short
```

Expected: poort groen; beide `git grep`-opdrachten geven niets (op `scripts/repo-gates.test.ts` na voor de eerste, dat het patroon zelf bevat); de tree is schoon. Meld de controller: fase 4 en 5 klaar, rapporten in `docs/qa/`, open punten staan in `docs/qa/go-live-checklist.md`. Niet pushen, niet mergen.

---

## Spec-dekking

| Spec | Taak |
|---|---|
| §2 Palet, type, tokens; "in fase 5 verdwijnen de oude tokens, `.oly-theme`, `.oly-palette` en Cormorant/Space Mono" | Task 12 (plus de poort in `scripts/repo-gates.test.ts`) |
| §2 Beeld: OLYMPN Sport-modelfoto als hero, ad-video's met poster, `preload="none"`, niet op mobiel; Olympian eigen modelfoto's | Task 1 (bestanden), Task 3 (hero, banden, `AutoplayVideo`) |
| §5 Home: hero van de eerstvolgende drop via `DropBlock`, rij tegels per drop, Olympian-fotoband, waitlist-strook, lookbook weg | Task 3 (lookbook al weg in fase 1-2 Task 18) |
| §5 Content: About, FAQ als `Accordion`, Size guide, legal als tekstkolom met grote kop | Task 4, Task 5 |
| §5 Account: één smalle kolom met mono-labels, logica blijft | Task 6 |
| §5 404: grote "404", één zin, links naar de drops | Task 7 |
| §5 `BundleConfigurator` blijft ongebruikt staan | Task 11 (besluit: verwijderd, zie daar) |
| §7 Go-live-checklist | Task 13 (`docs/qa/go-live-checklist.md`) |
| §7 Preview-env `RESEND_WAITLIST_AUDIENCE_ID`, `SITE_PREVIEW_KEY`, `PRINTFUL_ACCOUNT_TOKEN` | Task 13 (`.env.example`, README, env-test) |
| §8 E-mail-palet, koppen Arial Black, tekst Arial, mono Courier, nieuw woordmerk als PNG, tests bijgewerkt | Task 8 (officieel palet in plaats van de waarden uit §8) |
| §8 SEO: "Olympian and OLYMPN Sport", `themeColor`, title en description per collectie | Task 9 (themakleur `#2D3A4F`) |
| §8 OG-image: crème, merk, Archivo uit `app/_fonts/`, per collectie | Task 10 |
| §8 Favicon en manifest op het beeldmerk | Task 1 (bestanden), Task 9 (manifest `#F7F1DA`/`#2D3A4F`, `icon.tsx`) |
| §8 Logo's: PNG tot de SVG's er zijn, oude `public/logos` na fase 5 weg | Task 1, Task 2, Task 11 |
| §9 Lighthouse 90+ mobiel op home, PLP, PDP | Task 14 |
| §9 A11y: focus, drawers, dialogs, contrast | Task 14 (axe), contrastkeuzes in Task 3, 6, 8, 12 |
| §9 Performance: geen video zonder poster, geen autoplay op mobiel | Task 3 |
| §10 Fase 4 en 5, risico "beeldmerk alleen als PNG" en "achtergebleven verwijzingen" | Task 1 en 13 (checklist), Task 11 en 12 (poorten) |
