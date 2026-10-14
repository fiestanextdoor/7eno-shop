# Fase 3: kopen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Op `redesign/v2` de koopflow in het v2-ontwerp bouwen: een nieuwe PDP (`Gallery`, sticky `BuyPanel`, maten als radiogroep, size guide als native `<dialog>`, kleur-als-product-wissel, sold-out met waitlist, sticky koopbalk op mobiel), een cart-drawer op de `Drawer` uit fase 1, een eigen checkout-shell en een nieuwe success-pagina, zonder dat de koop-, cart- of checkoutlogica verandert.

**Architecture:** De PDP-pagina (server) verzamelt alles in serialiseerbare props: de winkelregel uit `getShopProducts`, beeld per kleur uit `lib/product-page.ts` (remove.bg en de lokale overrides zoals nu), de kleurfamilie uit `lib/colour-siblings.ts` en de accordeonteksten uit `lib/product-copy.ts`. Eén clientcomponent `ProductView` roept `usePurchase` aan (een dunne laag over `useVariantPicker` en de Zustand-store) en geeft die ene koopstaat aan `Gallery`, `BuyPanel` en `StickyBuyBar`, zodat paneel en mobiele balk altijd hetzelfde zeggen. Cart-drawer en checkout krijgen alleen nieuwe markup en CSS; `useCartTotals`, `useCheckout`, `store/cart.ts` en `/api/checkout` blijven ongemoeid.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19.2, TypeScript 5 (strict), CSS Modules, Zustand 5, Jest 30 via `next/jest` (jsdom 26, SWC), @testing-library/react 16 (`render`, `renderHook`, `fireEvent`, `act`, `within`), ESLint 9 flat config (`eslint-config-next` 16.2.6 met `react-hooks/purity` en `react-hooks/set-state-in-effect`).

**Spec:** `docs/superpowers/specs/2026-10-13-rebrand-v2-design.md` (sectie 2 Beeld en tokens, sectie 4 teaser en waitlist, sectie 5 PDP, Cart-drawer, Checkout-shell en de `components/ui`-tabel, sectie 9, rij 3 van sectie 10). Bouwt voort op `docs/superpowers/plans/2026-10-14-phase-1-2-foundation-and-drops.md` (hierna "fase 1-2"); de Produces-blokken daaruit gelden hier als gegeven.

## Global Constraints

- Alles op branch `redesign/v2` in `/Users/joep/Documents/Persoonlijk/7eno-shop-master`. Nooit `master` aanraken, nooit mergen, nooit `git stash` (gedeeld over worktrees), nooit pushen behalve in het checkpoint aan het eind. Een push van `redesign/v2` geeft alleen een Preview.
- `.env.local` bevat een **live** Stripe-sleutel. Geen enkele taak start een echte checkout, opent `/checkout` met betaalgegevens of klikt lokaal op "Pay with Stripe". Unit-tests mocken `fetch`, `stripe`, `printful`, `printify`, `supabase`, `resend` en `remove-bg` altijd volledig.
- Checkout, Stripe, promo-codes, verzendregels, Printful/Printify-orderflow en het Supabase-schema blijven functioneel gelijk (spec sectie 1). `hooks/useCheckout.ts`, `hooks/useCartTotals.ts`, `hooks/useVariantPicker.ts` (op twee commentregels na), `store/cart.ts` en `app/api/checkout/route.ts` worden niet inhoudelijk gewijzigd; `hooks/useCheckout.test.ts`, `hooks/useCartTotals.test.ts`, `hooks/useVariantPicker.test.ts`, `store/cart.test.ts` en `app/api/checkout/route.test.ts` blijven ongewijzigd groen.
- Kwaliteitspoort na elke taak: `npx tsc --noEmit && npm test && npm run lint && npm run build`. In Next 16 bestaat `next lint` niet; `npm run lint` is `eslint .`.
- Jest: tests staan naast de bron. `jest.mock()` krijgt een **relatief** pad (geen `@/`, want `next/jest` heeft geen `moduleNameMapper` voor `@/`). Het padargument van `npm test -- <arg>` is een regex. Route handlers en server-only modules krijgen `/** @jest-environment node */`. Componenten met Testing Library (`render`, `screen`, `fireEvent`, `act`, `within`, `renderHook`). `next/navigation` wordt gemockt waar `useRouter`, `useSearchParams`, `notFound` of `permanentRedirect` gebruikt wordt. jsdom 26 kent geen `HTMLDialogElement.showModal`/`close` en geen `scrollIntoView`; componenten vangen dat af, tests stubben het waar ze het native pad willen zien.
- TS strict. CSS Modules in `components/ui/*` en in elke omgebouwde pagina gebruiken **alleen** de nieuwe tokens (`--c-`, `--f-`, `--fs-`, `--s-`, `--r-`, `--l-`, `--m-`). Oude tokens (`--ink`, `--bone`, `--gutter`, `--font-sans`, `.oly-theme`) blijven onaangeroerd tot fase 5.
- Lint-regel `react-hooks/purity` verbiedt `Date.now()` in een component (ook in async server components). Pagina's halen de tijd via `currentTimeMs()` uit `lib/drops.ts`.
- Geen em-dashes en geen en-dashes, niet in proza, code, commentaar, UI-tekst of commitberichten (lege tabelcellen krijgen `-`). Commits: conventional commits in het Engels (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- Kleuren (spec sectie 2): `--c-bg #F7F1DA`, `--c-surface #FFFFFF`, `--c-stone #C4C4B5`, `--c-text #2D3A4F`, `--c-text-muted #5B5A58`, `--c-border-strong #8A897F`, `--c-accent #7995C7`, `--c-accent-ink #3E5A8F`, `--c-live #FEAB27`, `--c-sage #BACCB1`, `--c-rose #E8697D`, `--c-peach #F5C190`, `--c-inverse-bg #2D3A4F`, `--c-inverse-text #F7F1DA`, `--c-success #3E5A2E`, `--c-error #A32020`, `--c-focus #2D3A4F`; swatches `#621926` rose red, `#9CAF92` pistachio, `#9E7551` mocha, `#0E0B0B` obsidian, `#C3B99C` dune, `#3C3D2E` olive, `#071429` maritime. Pastels en `--c-live` nooit als tekst op crème; tekst is altijd navy.
- Type: `--f-display` Archivo (variabel, `wght` 900, `wdth` 125, cursief voor drop-titels, terugval Archivo Black), `--f-body` Instrument Sans 400/500/600, `--f-mono` IBM Plex Mono 400/500; `--fs-display clamp(2.75rem, 8vw, 7.5rem)`, `--fs-h1 clamp(2rem, 5vw, 4rem)`, `--fs-h2 clamp(1.5rem, 3vw, 2.25rem)`, `--fs-h3 1.25rem`, `--fs-body 1rem`, `--fs-small 0.875rem`, `--fs-label 0.75rem` (labels uppercase, `letter-spacing: 0.08em`). Koppen uppercase, `line-height: 0.95`; body `line-height: 1.5`; klok en prijs `font-variant-numeric: tabular-nums`.
- Maat: `--s-1` tot `--s-10` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px; `--r-0 0`, `--r-1 2px` (knoppen en tegels 0, invoer en chips 2px); `--l-gutter` 16px (24px vanaf 768px, 32px vanaf 1200px); `--l-grid-gap 2px`; `--l-max 1600px`; `--l-text-max 68ch`; `--l-nav` 56px (64px vanaf 1024px); `--l-announce 32px`; `--l-chrome` is announce plus nav (fase 1-2 Task 1).
- Motion: `--m-fast 120ms`, `--m-base 200ms`, `--m-slow 400ms`, `--m-ease cubic-bezier(0.2, 0, 0, 1)`, `--m-ease-out cubic-bezier(0.16, 1, 0.3, 1)`. Alleen `transform` en `opacity` animeren. Onder `prefers-reduced-motion: reduce` alle duren `0.01ms` (staat al in `tokens.css`); smooth scrollen in JS valt dan terug op `auto`. Geen GSAP, geen Lenis, geen `PageTransition`.
- Focus: 2px solide `--c-focus` met 2px offset; op donkere vlakken `--c-inverse-text`. Drawers en dialogs met focus-trap en Esc; maten als radiogroep met label (spec sectie 9).
- Productbeeld (spec sectie 2): altijd een mockup op `--c-surface`, verhouding 4:5, `object-fit: contain`. `lib/remove-bg.ts` blijft de achtergrond strippen (front en back), overige Printful-mockups en lokale foto's uit `lib/product-images.ts` worden ongewijzigd getoond, een lokale override wint altijd. Eerste galerijbeeld `loading="eager"` en `fetchPriority="high"` (spec sectie 9).
- Gratis verzending vanaf €75 (`FREE_SHIPPING_THRESHOLD` in `lib/shipping.ts`), vlak tarief €4,95.
- PDP-kopteksten blijven Engels, net als de rest van de winkel-UI.

## Review Focus

1. **Een product met één maat of zonder koopbare maat** (een "One size"-tas, een product waarvan Printful de details niet gaf zodat `variants` leeg is, een product met alleen maten uit `HIDDEN_SIZES`): bij één maat geen maatkeuze en direct "Add to cart" met die variant; zonder koopbare maat geen prijs en geen koopknop maar "Notify me", en de pagina crasht nooit. Tests: `hooks/usePurchase.test.tsx` (Task 5), `components/ui/BuyPanel/BuyPanel.test.tsx` (Task 6), `lib/product-page.test.ts` (Task 7).
2. **Uitverkocht op drie niveaus** (één maat van een kleur op, het hele product op terwijl de pre-sale-regel van `useVariantPicker` het nog bestelbaar noemt, een uitverkochte kleur-sibling): de maat is doorgestreept maar kiesbaar en de knop wordt "Notify me"; `soldOut` van de winkelregel wint van de pre-sale-regel; een uitverkochte sibling blijft een link met "sold out" in de naam. Tests: `hooks/usePurchase.test.tsx` (Task 5), `BuyPanel.test.tsx` (Task 6), `lib/colour-siblings.test.ts` en `ColourSiblings.test.tsx` (Task 3).
3. **De URL van iets dat niet (meer) te koop is** (een vervallen OG- of Printify-slug, een onbekende slug, een oud numeriek Printful-id, een teaser vóór de release): 308 naar `/shop`, 404, 308 naar de slug, en een teaser zonder koopknop en zonder Offer in de JSON-LD. Test: `app/shop/[slug]/page.test.tsx` (Task 7).
4. **Aantal op de grenzen in de cart-drawer** (min op 1 stuk, plus op 100 stuks, de grens van `app/api/checkout/route.ts:43`): min op 1 haalt de regel weg (storegedrag ongewijzigd) en toont de lege staat; plus is uit op 100, zodat de checkout nooit 400 "Invalid item quantity" geeft. Test: `components/CartDrawer/CartDrawer.test.tsx` (Task 8).
5. **De mobiele sticky "Add to cart"-balk onderaan de pagina** (footer, iOS-safe-area, teaser, een maat nog niet gekozen): de balk plakt binnen het PDP-blok en stopt dus boven de footer, heeft safe-area-padding, ontbreekt bij een teaser, en volgt dezelfde keuze als het paneel ("Select a size" springt naar de maten). Tests: `components/ui/StickyBuyBar/StickyBuyBar.test.tsx` (Task 6) en `app/shop/[slug]/ProductView.test.tsx` (Task 7).

---

## File Structure

**PDP-bouwstenen (`components/ui/*`, puur presentatie, elk met test)**
- `components/ui/SizeSelector`: maten (en eventueel kleuren binnen één product) als radiogroep met roving tabindex.
- `components/ui/SizeGuideDialog`: knop "Size guide" plus native `<dialog>` met de Printful-maattabel.
- `components/ui/Accordion`: `details`/`summary`.
- `components/ui/ColourSiblings` met `lib/colour-siblings.ts`: kleurwissel tussen producten van één familie.
- `components/ui/Gallery` met `lib/product-gallery.ts`: gestapeld met sticky thumbnails (desktop), scroll-snap (mobiel).
- `components/ui/BuyPanel`, `components/ui/StickyBuyBar` met `lib/product-copy.ts`: koopkolom, mobiele balk, accordeonteksten.

**Koopstaat**
- `lib/money.ts`: `formatPrice` (verhuisd uit `lib/tiles.ts`, zodat clientcode geen server-beeldhelpers importeert) en `formatEuro`.
- `hooks/usePurchase.ts`: maat- en kleurkeuze, sold-out, deep link `?color=`, one-size, add to cart. Bovenop `useVariantPicker` en `useCartStore`.

**PDP-pagina**
- `lib/product-page.ts`: server-side beeld en Printful-verrijking per product (de huidige regels 85-170 van `app/shop/[slug]/page.tsx`, ongewijzigd in gedrag op twee bewuste punten na, zie Task 7).
- `app/shop/[slug]/ProductView.tsx` en `product.module.css`: de clientcompositie. `app/shop/[slug]/page.tsx`: data, metadata, JSON-LD.
- Weg: `app/shop/[slug]/ProductDetail.tsx`, `ProductDetail.test.tsx`, `detail.module.css`.

**Cart en checkout**
- `components/CartDrawer/CartDrawer.tsx` (op `Drawer`), `CartLine.tsx`, CSS.
- `components/CheckoutHeader`: logo en "Back to cart".
- `app/checkout/page.tsx`, `app/checkout/OrderSummary.tsx`, `checkout.module.css`, `page.test.tsx` (karakterisatie).
- `app/success/page.tsx`, `success.module.css`, `page.test.tsx`.

**Opruimen**
- Weg: `components/ProductCarousel/*` (quick-add-carousel zonder afnemer na fase 1-2 Task 18).

**Regelnummers.** De Modify-regels gelden voor de huidige `redesign/v2` (commit `3a298be`). Fase 1-2 verandert vóór deze fase al: `app/shop/[slug]/page.tsx` (Task 7 en 18), `app/shop/[slug]/ProductDetail.tsx`, `ProductDetail.test.tsx` en `detail.module.css` (Task 18), `lib/product-classify.ts` (Task 10 en 14), `lib/tiles.ts` (gemaakt in Task 11), `components/ui/WaitlistForm/WaitlistForm.tsx` (gemaakt in Task 15), `app/shop/[slug]/page.test.tsx` (gemaakt in Task 18), `components/AppShell/AppShell.tsx` (Task 5 en 9). Die bestanden worden hier ofwel volledig vervangen of verwijderd, ofwel gewijzigd met Edit-stappen die op exacte tekst ankeren; zoek de regels dus op die tekst, niet op het nummer. `components/CartDrawer/*`, `components/CheckoutHeader/*`, `app/checkout/*` en `app/success/*` raakt fase 1-2 niet.

**Beeldmateriaal.** De klaargezette modelfoto (`model-dune.webp`) en de ad-video's worden in deze fase **niet** gebruikt: spec sectie 2 zegt "Productbeeld is altijd een mockup op een egaal `--c-surface`-vlak" en reserveert de modelfoto en video's voor hero's. Ze horen bij fase 4 (home en collectie-hero's). Geen kopieerstap hier.

---

### Voorbereiding

- [ ] **Step 1: Fase 1-2 is af en de basis is groen**

```bash
cd /Users/joep/Documents/Persoonlijk/7eno-shop-master
git switch redesign/v2
git status --short
ls components/ui/Drawer/Drawer.tsx components/ui/Button/Button.tsx components/ui/Badge/Badge.tsx components/ui/WaitlistForm/WaitlistForm.tsx lib/drops.ts lib/catalog.ts lib/tiles.ts lib/shop-query.ts lib/preview-session.ts "app/shop/[slug]/page.test.tsx"
npm ci
npx tsc --noEmit && npm test && npm run lint
```

Expected: `git status --short` is leeg; `ls` vindt alle bestanden; tsc, tests en lint groen. Ontbreekt er een bestand, dan is fase 1-2 niet af: stop en meld het. Is de tree niet schoon, vraag Joep wat er met de wijzigingen moet gebeuren (geen `git stash`).

---

### Task 1: SizeSelector

**Files:**
- Create: `components/ui/SizeSelector/SizeSelector.tsx`, `components/ui/SizeSelector/SizeSelector.module.css`
- Test: `components/ui/SizeSelector/SizeSelector.test.tsx`

**Interfaces:**
- Consumes: tokens (fase 1-2 Task 1).
- Produces:
  - `export interface SizeOption { value: string; label: string; soldOut: boolean }`
  - `export interface SizeSelectorProps { sizes: SizeOption[]; value: string | null; onChange(value: string): void; label?: string; aside?: ReactNode; id?: string }`
  - `export default function SizeSelector(props: SizeSelectorProps)`: `role="radiogroup"` met `aria-labelledby` naar het label (standaard "Size"), elke optie een `button` met `role="radio"`, `aria-checked`, roving tabindex; pijltjes (ook omhoog/omlaag) verplaatsen en kiezen met omloop, Home en End springen; een uitverkochte maat heeft `data-sold-out="true"`, is doorgestreept, heet "L (sold out)" en blijft kiesbaar. Lege lijst rendert niets. `id` komt op de radiogroep (anker voor de sticky balk).

- [ ] **Step 1: Schrijf de falende test**

`components/ui/SizeSelector/SizeSelector.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import SizeSelector, { type SizeOption } from './SizeSelector'

const SIZES: SizeOption[] = [
  { value: 's', label: 'S', soldOut: false },
  { value: 'm', label: 'M', soldOut: false },
  { value: 'l', label: 'L', soldOut: true },
  { value: 'xl', label: 'XL', soldOut: false },
]

function Controlled({
  initial = null,
  onChange = () => {},
}: {
  initial?: string | null
  onChange?: (value: string) => void
}) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <SizeSelector
      sizes={SIZES}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange(v)
      }}
    />
  )
}

const radio = (name: string) => screen.getByRole('radio', { name })

describe('SizeSelector', () => {
  it('is a labelled radio group with the sizes as text', () => {
    render(<Controlled />)
    const group = screen.getByRole('radiogroup', { name: 'Size' })
    expect(within(group).getAllByRole('radio').map((r) => r.textContent)).toEqual(['S', 'M', 'L (sold out)', 'XL'])
  })

  it('has one tab stop: the checked size, or the first when none is checked', () => {
    const { unmount } = render(<Controlled />)
    expect(screen.getAllByRole('radio').map((r) => r.tabIndex)).toEqual([0, -1, -1, -1])
    unmount()
    render(<Controlled initial="xl" />)
    expect(screen.getAllByRole('radio').map((r) => r.tabIndex)).toEqual([-1, -1, -1, 0])
  })

  it('selects a sold-out size too, struck through', () => {
    const onChange = jest.fn()
    render(<Controlled onChange={onChange} />)
    const l = radio('L (sold out)')
    expect(l).toHaveAttribute('data-sold-out', 'true')
    fireEvent.click(l)
    expect(onChange).toHaveBeenCalledWith('l')
    expect(l).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('L, sold out')).toBeInTheDocument()
  })

  it('moves and selects with the arrow keys, wrapping at both ends', () => {
    render(<Controlled initial="s" />)
    fireEvent.keyDown(radio('S'), { key: 'ArrowRight' })
    expect(radio('M')).toHaveAttribute('aria-checked', 'true')
    expect(radio('M')).toHaveFocus()
    fireEvent.keyDown(radio('M'), { key: 'ArrowUp' })
    expect(radio('S')).toHaveFocus()
    fireEvent.keyDown(radio('S'), { key: 'ArrowLeft' })
    expect(radio('XL')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radio('XL'), { key: 'ArrowDown' })
    expect(radio('S')).toHaveAttribute('aria-checked', 'true')
  })

  it('jumps with Home and End and ignores other keys', () => {
    render(<Controlled initial="m" />)
    fireEvent.keyDown(radio('M'), { key: 'End' })
    expect(radio('XL')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radio('XL'), { key: 'Home' })
    expect(radio('S')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radio('S'), { key: 'a' })
    expect(radio('S')).toHaveAttribute('aria-checked', 'true')
  })

  it('renders nothing without sizes', () => {
    const { container } = render(<SizeSelector sizes={[]} value={null} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('takes a custom label, an id and an aside', () => {
    render(
      <SizeSelector
        sizes={SIZES}
        value={null}
        onChange={() => {}}
        label="Colour"
        id="colours"
        aside={<a href="#guide">Size guide</a>}
      />
    )
    expect(screen.getByRole('radiogroup', { name: 'Colour' })).toHaveAttribute('id', 'colours')
    expect(screen.getByRole('link', { name: 'Size guide' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- SizeSelector`
Expected: FAIL met "Cannot find module './SizeSelector'".

- [ ] **Step 3: Implementeer `SizeSelector`**

`components/ui/SizeSelector/SizeSelector.tsx`:

```tsx
'use client'

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import styles from './SizeSelector.module.css'

export interface SizeOption {
  /** Stable value, e.g. the variant id. */
  value: string
  /** What the shopper reads: "M", "XL", "EU 42". */
  label: string
  /** Struck through but still selectable (spec section 5): picking it offers "Notify me". */
  soldOut: boolean
}

export interface SizeSelectorProps {
  sizes: SizeOption[]
  value: string | null
  onChange(value: string): void
  /** Group label and accessible name. Defaults to "Size". */
  label?: string
  /** Extra content at the end of the label row, e.g. the size guide button. */
  aside?: ReactNode
  /** Put on the radio group; the sticky buy bar jumps to it. */
  id?: string
}

const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown'])
const PREV_KEYS = new Set(['ArrowLeft', 'ArrowUp'])

/**
 * Sizes as text in a radio group (WAI-ARIA radio pattern): one tab stop,
 * arrow keys move and select with wrap-around, Home and End jump.
 */
export default function SizeSelector({ sizes, value, onChange, label = 'Size', aside, id }: SizeSelectorProps) {
  const labelId = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  if (sizes.length === 0) return null

  const checkedIndex = sizes.findIndex((s) => s.value === value)
  const tabStop = checkedIndex === -1 ? 0 : checkedIndex
  const selected = checkedIndex === -1 ? null : sizes[checkedIndex]

  function move(to: number) {
    const index = (to + sizes.length) % sizes.length
    onChange(sizes[index].value)
    refs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (NEXT_KEYS.has(event.key)) move(index + 1)
    else if (PREV_KEYS.has(event.key)) move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(sizes.length - 1)
    else return
    event.preventDefault()
  }

  return (
    <div className={styles.selector}>
      <div className={styles.head}>
        <span id={labelId} className={styles.label}>{label}</span>
        {selected && (
          <span className={styles.value}>
            {selected.soldOut ? `${selected.label}, sold out` : selected.label}
          </span>
        )}
        {aside && <span className={styles.aside}>{aside}</span>}
      </div>
      <div id={id} role="radiogroup" aria-labelledby={labelId} className={styles.options}>
        {sizes.map((size, i) => (
          <button
            key={size.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={size.value === value}
            tabIndex={i === tabStop ? 0 : -1}
            className={styles.option}
            data-sold-out={size.soldOut ? 'true' : undefined}
            onClick={() => onChange(size.value)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            {size.label}
            {size.soldOut && <span className={styles.srOnly}> (sold out)</span>}
          </button>
        ))}
      </div>
    </div>
  )
}
```

`components/ui/SizeSelector/SizeSelector.module.css`:

```css
.selector {
  display: grid;
  gap: var(--s-3);
}

.head {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
}

.label {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.value {
  font-family: var(--f-body);
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.aside {
  margin-left: auto;
}

.options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: var(--s-2);
}

.option {
  min-height: 44px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-small);
  font-weight: 500;
  cursor: pointer;
}

.option[aria-checked='true'] {
  border-color: var(--c-text);
  background: var(--c-text);
  color: var(--c-inverse-text);
}

.option[data-sold-out='true'] {
  color: var(--c-text-muted);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.option[data-sold-out='true'][aria-checked='true'] {
  color: var(--c-inverse-text);
}

.option:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 4: Run de test, verwacht slagen**

Run: `npm test -- SizeSelector`
Expected: PASS, 7 tests.

- [ ] **Step 5: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. Het component is nog nergens gemonteerd; op de Preview zichtbaar vanaf Task 7.

- [ ] **Step 6: Commit**

```bash
git add components/ui/SizeSelector
git commit -m "feat: add SizeSelector radio group with keyboard support"
```

---

### Task 2: SizeGuideDialog en Accordion

**Files:**
- Create: `components/ui/SizeGuideDialog/SizeGuideDialog.tsx`, `components/ui/SizeGuideDialog/SizeGuideDialog.module.css`
- Test: `components/ui/SizeGuideDialog/SizeGuideDialog.test.tsx`
- Create: `components/ui/Accordion/Accordion.tsx`, `components/ui/Accordion/Accordion.module.css`
- Test: `components/ui/Accordion/Accordion.test.tsx`

**Interfaces:**
- Consumes: `SizeGuide` (`lib/printful.ts:180-184`, alleen het type: `{ unit: string; sizes: string[]; rows: { label: string; values: Record<string, string> }[] }`).
- Produces:
  - `export interface SizeGuideDialogProps { category: string; guide: SizeGuide; modelNote?: string; sizeLabels?: Record<string, string> }`
  - `export default function SizeGuideDialog(props)`: rendert een knop "Size guide" (`aria-haspopup="dialog"`) en een `<dialog>` met naam "`{category}` size guide". Opent met `showModal()` als de browser dat heeft, anders met het `open`-attribuut; sluit via de knop "Close size guide", Esc (`cancel`-event en `keydown`) en een klik op de backdrop; focus gaat terug naar de knop.
  - `export interface AccordionItem { title: string; content: ReactNode }`, `export interface AccordionProps { items: AccordionItem[]; defaultOpen?: number }`, `export default function Accordion(props)` (een `details` per item; lege lijst rendert niets).

De spec noemt "maattabel per categorie". Printful levert de tabel per catalogusproduct (`getSizeGuide`, zoals de huidige PDP); dat ís in de praktijk per categorie. `category` ("Hoodies") is daarom de titel, `guide` de data.

- [ ] **Step 1: Schrijf de falende tests**

`components/ui/SizeGuideDialog/SizeGuideDialog.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { SizeGuide } from '@/lib/printful'
import SizeGuideDialog, { type SizeGuideDialogProps } from './SizeGuideDialog'

const GUIDE: SizeGuide = {
  unit: 'cm',
  sizes: ['S', 'M', 'L'],
  rows: [
    { label: 'Chest', values: { S: '104', M: '110', L: '116' } },
    { label: 'Length', values: { S: '70', M: '72' } },
  ],
}

function setup(props: Partial<SizeGuideDialogProps> = {}) {
  render(<SizeGuideDialog category="Hoodies" guide={GUIDE} {...props} />)
  const trigger = screen.getByRole('button', { name: 'Size guide' })
  const dialog = document.querySelector('dialog') as HTMLDialogElement
  return { trigger, dialog }
}

type DialogProto = { showModal?: unknown; close?: unknown }

describe('SizeGuideDialog', () => {
  it('starts closed and opens as a labelled dialog with the size table', () => {
    const { trigger, dialog } = setup()
    expect(dialog).not.toHaveAttribute('open')
    fireEvent.click(trigger)
    expect(dialog).toHaveAttribute('open')
    const d = screen.getByRole('dialog', { name: 'Hoodies size guide' })
    expect(within(d).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Size', 'S', 'M', 'L'])
    expect(within(d).getByRole('row', { name: /Length/ })).toHaveTextContent('Length7072-')
    expect(within(d).getByText('Body measurements in cm')).toBeInTheDocument()
  })

  it('closes with the close button and returns focus to the trigger', () => {
    const { trigger, dialog } = setup()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Close size guide' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(trigger).toHaveFocus()
  })

  it('closes on Escape, as a cancel event and as a key press', () => {
    const { trigger, dialog } = setup()
    fireEvent.click(trigger)
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(dialog).not.toHaveAttribute('open')
    expect(trigger).toHaveFocus()
    fireEvent.click(trigger)
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(dialog).not.toHaveAttribute('open')
  })

  it('closes on a backdrop click, not on a click inside', () => {
    const { trigger, dialog } = setup()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Chest'))
    expect(dialog).toHaveAttribute('open')
    fireEvent.click(dialog)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('uses the native modal API when the browser has it', () => {
    const proto = HTMLDialogElement.prototype as unknown as DialogProto
    const showModal = jest.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    const close = jest.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
    proto.showModal = showModal
    proto.close = close
    try {
      const { trigger } = setup()
      fireEvent.click(trigger)
      expect(showModal).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByRole('button', { name: 'Close size guide' }))
      expect(close).toHaveBeenCalledTimes(1)
    } finally {
      delete proto.showModal
      delete proto.close
    }
  })

  it('shows the model note and display labels such as EU sizes', () => {
    const { trigger } = setup({ modelNote: 'Model is 1,85 m and wears L', sizeLabels: { S: 'EU 40' } })
    fireEvent.click(trigger)
    const d = screen.getByRole('dialog', { name: 'Hoodies size guide' })
    expect(within(d).getByRole('columnheader', { name: 'EU 40' })).toBeInTheDocument()
    expect(within(d).getByText('Model is 1,85 m and wears L')).toBeInTheDocument()
  })
})
```

`components/ui/Accordion/Accordion.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import Accordion from './Accordion'

describe('Accordion', () => {
  it('renders one details element per item with its summary and content', () => {
    const { container } = render(
      <Accordion
        items={[
          { title: 'Details', content: <p>Heavyweight cotton</p> },
          { title: 'Fit', content: 'Oversized fit' },
        ]}
        defaultOpen={0}
      />
    )
    const details = container.querySelectorAll('details')
    expect(details).toHaveLength(2)
    expect(details[0]).toHaveAttribute('open')
    expect(details[1]).not.toHaveAttribute('open')
    expect(screen.getByText('Details').closest('summary')).not.toBeNull()
    expect(details[0]).toContainElement(screen.getByText('Heavyweight cotton'))
    expect(details[1]).toHaveTextContent('Oversized fit')
  })

  it('starts fully closed without defaultOpen', () => {
    const { container } = render(<Accordion items={[{ title: 'Fit', content: 'x' }]} />)
    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('renders nothing without items', () => {
    const { container } = render(<Accordion items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (SizeGuideDialog|Accordion)`
Expected: FAIL met "Cannot find module './SizeGuideDialog'" en "Cannot find module './Accordion'".

- [ ] **Step 3: Implementeer `SizeGuideDialog`**

`components/ui/SizeGuideDialog/SizeGuideDialog.tsx`:

```tsx
'use client'

import { useId, useRef, type KeyboardEvent, type MouseEvent, type SyntheticEvent } from 'react'
import type { SizeGuide } from '@/lib/printful'
import styles from './SizeGuideDialog.module.css'

export interface SizeGuideDialogProps {
  /** "Hoodies": the dialog title reads "Hoodies size guide". */
  category: string
  guide: SizeGuide
  modelNote?: string
  /** Display label per size, e.g. EU sizes for footwear. */
  sizeLabels?: Record<string, string>
}

/**
 * A "Size guide" button and a native <dialog> with the Printful size table.
 * The native modal gives focus containment, Esc and focus return; browsers
 * without showModal (and jsdom) get the open attribute plus the same Esc and
 * focus-return handling here.
 */
export default function SizeGuideDialog({ category, guide, modelNote, sizeLabels = {} }: SizeGuideDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  function open() {
    const dialog = dialogRef.current
    if (!dialog || dialog.hasAttribute('open')) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
  }

  function close() {
    const dialog = dialogRef.current
    if (!dialog || !dialog.hasAttribute('open')) return
    if (typeof dialog.close === 'function') {
      dialog.close()
    } else {
      dialog.removeAttribute('open')
      triggerRef.current?.focus()
    }
  }

  function onCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    close()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    close()
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The inner wrapper fills the dialog box, so only a click on the
    // backdrop targets the dialog element itself.
    if (event.target === event.currentTarget) close()
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={styles.trigger} onClick={open} aria-haspopup="dialog">
        Size guide
      </button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={onCancel}
        onKeyDown={onKeyDown}
        onClick={onBackdropClick}
      >
        <div className={styles.inner}>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.title}>{category} size guide</h2>
            <button type="button" className={styles.close} onClick={close} aria-label="Close size guide">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
              </svg>
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className={styles.caption}>Body measurements in {guide.unit}</caption>
              <thead>
                <tr>
                  <th scope="col">Size</th>
                  {guide.sizes.map((size) => (
                    <th key={size} scope="col">{sizeLabels[size] ?? size}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guide.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {guide.sizes.map((size) => (
                      <td key={size}>{row.values[size] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {modelNote && <p className={styles.note}>{modelNote}</p>}
        </div>
      </dialog>
    </>
  )
}
```

`components/ui/SizeGuideDialog/SizeGuideDialog.module.css`:

```css
.trigger {
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-accent-ink);
  font-family: var(--f-body);
  font-size: var(--fs-small);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.trigger:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.dialog {
  width: min(640px, calc(100vw - 2 * var(--l-gutter)));
  max-height: calc(100vh - 2 * var(--s-6));
  padding: 0;
  border: 0;
  border-radius: var(--r-0);
  background: var(--c-surface);
  color: var(--c-text);
}

.dialog::backdrop {
  background: var(--c-text);
  opacity: 0.4;
}

.inner {
  display: grid;
  gap: var(--s-4);
  padding: var(--s-5) var(--l-gutter) var(--s-6);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h3);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
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

.tableWrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.caption {
  caption-side: bottom;
  padding-top: var(--s-3);
  text-align: left;
  font-family: var(--f-body);
  color: var(--c-text-muted);
}

.table th,
.table td {
  padding: var(--s-2) var(--s-3);
  border-bottom: 1px solid var(--c-stone);
  text-align: center;
  white-space: nowrap;
}

.table thead th {
  font-size: var(--fs-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.table th[scope='row'] {
  text-align: left;
  font-weight: 500;
}

.note {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}
```

- [ ] **Step 4: Implementeer `Accordion`**

`components/ui/Accordion/Accordion.tsx`:

```tsx
import type { ReactNode } from 'react'
import styles from './Accordion.module.css'

export interface AccordionItem {
  title: string
  content: ReactNode
}

export interface AccordionProps {
  items: AccordionItem[]
  /** Index of the item that starts open. */
  defaultOpen?: number
}

/** Native details/summary: keyboard and screen-reader support come for free. */
export default function Accordion({ items, defaultOpen }: AccordionProps) {
  if (items.length === 0) return null
  return (
    <div className={styles.accordion}>
      {items.map((item, i) => (
        <details key={item.title} className={styles.item} open={i === defaultOpen ? true : undefined}>
          <summary className={styles.summary}>
            <span>{item.title}</span>
            <span className={styles.icon} aria-hidden="true" />
          </summary>
          <div className={styles.content}>{item.content}</div>
        </details>
      ))}
    </div>
  )
}
```

`components/ui/Accordion/Accordion.module.css`:

```css
.accordion {
  border-top: 1px solid var(--c-stone);
}

.item {
  border-bottom: 1px solid var(--c-stone);
}

.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  list-style: none;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.summary::-webkit-details-marker {
  display: none;
}

.summary:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.icon {
  position: relative;
  width: 12px;
  height: 12px;
}

.icon::before,
.icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 12px;
  height: 1px;
  background: currentColor;
  transition: transform var(--m-base) var(--m-ease);
}

.icon::after {
  transform: rotate(90deg);
}

.item[open] .icon::after {
  transform: rotate(0deg);
}

.content {
  padding: 0 0 var(--s-5);
  font-size: var(--fs-small);
  line-height: 1.5;
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (SizeGuideDialog|Accordion)`
Expected: PASS, 9 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add components/ui/SizeGuideDialog components/ui/Accordion
git commit -m "feat: add SizeGuideDialog on native dialog and Accordion"
```

---

### Task 3: ColourSiblings en de kleurfamilie

**Files:**
- Create: `lib/colour-siblings.ts`
- Test: `lib/colour-siblings.test.ts`
- Create: `components/ui/ColourSiblings/ColourSiblings.tsx`, `components/ui/ColourSiblings/ColourSiblings.module.css`
- Test: `components/ui/ColourSiblings/ColourSiblings.test.tsx`

**Interfaces:**
- Consumes: `ShopProduct` (fase 1-2 Task 7); `familyKey`, `colourRank`, `colourLabel`, `DROPS` (fase 1-2 Task 6); `OLYMPIAN_COLORWAYS` (`lib/color-utils.ts:164-169`); `productSlug` (`lib/slug.ts`).
- Produces:
  - `export interface ColourSibling { name: string; hex: string; href: string; current: boolean; soldOut: boolean }` (de spec-vorm `{ name; hex; href; current }` plus `soldOut`)
  - `export const SWATCH_HEX: Readonly<Record<string, string>>` (kleurnaam in kleine letters naar hex)
  - `export function buildColourSiblings(products: readonly ShopProduct[], current: ShopProduct): ColourSibling[]` (zelfde drop en `familyKey`, met herkende kleur, op `colourRank`; minder dan twee leden geeft `[]`)
  - `export interface ColourSiblingsProps { items: ColourSibling[] }`, `export default function ColourSiblings(props)` (rendert niets onder twee items)

Dit vervangt de Olympian-specifieke regels 183-206 van de huidige `app/shop/[slug]/page.tsx` (`olympianColorway`, eigen `familyKey`), zodat OLYMPN Sport dezelfde kleurwissel krijgt.

- [ ] **Step 1: Schrijf de falende tests**

`lib/colour-siblings.test.ts`:

```ts
import type { ShopProduct } from './catalog'
import { buildColourSiblings, SWATCH_HEX } from './colour-siblings'
import { DROPS } from './drops'
import { productSlug } from './slug'

const [olympian, sport] = DROPS

function product(name: string, overrides: Partial<ShopProduct> = {}): ShopProduct {
  return {
    provider: 'printful',
    id: productSlug(name),
    name,
    slug: productSlug(name),
    thumbnailUrl: null,
    variants: [],
    colors: [],
    currency: 'EUR',
    drop: name.startsWith('Olympian') ? olympian : sport,
    status: 'live',
    purchasable: true,
    soldOut: false,
    ...overrides,
  }
}

const roseRed = product('OLYMPN Sport Oversized Hoodie Rose Red')
const pistachio = product('OLYMPN Sport Oversized Hoodie Pistachio', { soldOut: true })
const mocha = product('OLYMPN Sport Oversized Hoodie Mocha')
const dune = product('OLYMPN Sport Relaxed Hoodie Dune')
const obsidianRelaxed = product('OLYMPN Sport Relaxed Hoodie Obsidian')
const ocean = product('Olympian Tee Ocean Unisex')
const sand = product('Olympian Tee Sand Unisex')
const ALL = [ocean, mocha, dune, roseRed, sand, pistachio, obsidianRelaxed]

describe('buildColourSiblings', () => {
  it('lists the colours of one family in colourOrder, the current one marked', () => {
    expect(buildColourSiblings(ALL, mocha)).toEqual([
      { name: 'Rose Red', hex: '#621926', href: '/shop/olympn-sport-oversized-hoodie-rose-red', current: false, soldOut: false },
      { name: 'Pistachio', hex: '#9CAF92', href: '/shop/olympn-sport-oversized-hoodie-pistachio', current: false, soldOut: true },
      { name: 'Mocha', hex: '#9E7551', href: '/shop/olympn-sport-oversized-hoodie-mocha', current: true, soldOut: false },
    ])
  })

  it('keeps fits apart: the relaxed hoodies are their own family', () => {
    expect(buildColourSiblings(ALL, dune).map((s) => s.name)).toEqual(['Obsidian', 'Dune'])
  })

  it('handles the Olympian colourways with their own swatches', () => {
    expect(buildColourSiblings(ALL, sand).map((s) => [s.name, s.hex, s.current])).toEqual([
      ['Ocean', '#297d95', false],
      ['Sand', '#eddca2', true],
    ])
  })

  it('returns nothing for a family of one or a product without a known colour', () => {
    expect(buildColourSiblings([roseRed], roseRed)).toEqual([])
    const cap = product('OLYMPN Sport Cap')
    expect(buildColourSiblings([...ALL, cap], cap)).toEqual([])
  })

  it('has a swatch for every OLYMPN Sport colour', () => {
    for (const colour of sport.colourOrder) expect(SWATCH_HEX[colour]).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})
```

`components/ui/ColourSiblings/ColourSiblings.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import type { ColourSibling } from '@/lib/colour-siblings'
import ColourSiblings from './ColourSiblings'

const ITEMS: ColourSibling[] = [
  { name: 'Rose Red', hex: '#621926', href: '/shop/olympn-sport-oversized-hoodie-rose-red', current: false, soldOut: false },
  { name: 'Pistachio', hex: '#9CAF92', href: '/shop/olympn-sport-oversized-hoodie-pistachio', current: false, soldOut: true },
  { name: 'Mocha', hex: '#9E7551', href: '/shop/olympn-sport-oversized-hoodie-mocha', current: true, soldOut: false },
]

describe('ColourSiblings', () => {
  it('links to the other colours and names the current one', () => {
    render(<ColourSiblings items={ITEMS} />)
    expect(screen.getByText('Colour')).toBeInTheDocument()
    expect(screen.getByText('Mocha')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rose Red' })).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-rose-red')
    expect(screen.getByRole('img', { name: 'Mocha, selected' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Mocha/ })).toBeNull()
  })

  it('keeps a sold-out colour reachable and says so', () => {
    render(<ColourSiblings items={ITEMS} />)
    const pistachio = screen.getByRole('link', { name: 'Pistachio, sold out' })
    expect(pistachio).toHaveAttribute('data-sold-out', 'true')
    expect(pistachio).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-pistachio')
  })

  it('renders nothing for a single colour', () => {
    const { container } = render(<ColourSiblings items={[ITEMS[2]]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (colour-siblings|ColourSiblings)`
Expected: FAIL met "Cannot find module './colour-siblings'" en "Cannot find module './ColourSiblings'".

- [ ] **Step 3: Implementeer `lib/colour-siblings.ts`**

```ts
import type { ShopProduct } from '@/lib/catalog'
import { OLYMPIAN_COLORWAYS } from '@/lib/color-utils'
import { colourLabel, colourRank, familyKey } from '@/lib/drops'

/** One colour of a product family; each colour is its own product (spec section 5). */
export interface ColourSibling {
  name: string
  hex: string
  href: string
  current: boolean
  soldOut: boolean
}

/** Swatch colours by lowercase colour name: the hoodie palette (spec section 2) and the Olympian colourways. */
export const SWATCH_HEX: Readonly<Record<string, string>> = {
  'rose red': '#621926',
  pistachio: '#9CAF92',
  mocha: '#9E7551',
  obsidian: '#0E0B0B',
  dune: '#C3B99C',
  olive: '#3C3D2E',
  maritime: '#071429',
  ...Object.fromEntries(OLYMPIAN_COLORWAYS.map((c) => [c.key, c.hex])),
}

/** --c-stone: a neutral swatch for a colour that is named but not in the palette yet. */
const FALLBACK_HEX = '#C4C4B5'

/**
 * The colours of `current`'s product family within its drop, in the drop's
 * colourOrder. Sold-out colours stay in the list: their page offers the waitlist.
 */
export function buildColourSiblings(products: readonly ShopProduct[], current: ShopProduct): ColourSibling[] {
  if (colourLabel(current.drop, current.name) === null) return []
  const family = familyKey(current.drop, current.name)
  const members = products.filter(
    (p) =>
      p.drop.id === current.drop.id &&
      familyKey(p.drop, p.name) === family &&
      colourLabel(p.drop, p.name) !== null
  )
  if (members.length < 2) return []
  return [...members]
    .sort((a, b) => colourRank(a.drop, a.name) - colourRank(b.drop, b.name))
    .map((p) => {
      const name = colourLabel(p.drop, p.name) as string
      return {
        name,
        hex: SWATCH_HEX[name.toLowerCase()] ?? FALLBACK_HEX,
        href: `/shop/${p.slug}`,
        current: p.provider === current.provider && p.id === current.id,
        soldOut: p.soldOut,
      }
    })
}
```

- [ ] **Step 4: Implementeer `ColourSiblings`**

`components/ui/ColourSiblings/ColourSiblings.tsx`:

```tsx
import Link from 'next/link'
import type { ColourSibling } from '@/lib/colour-siblings'
import styles from './ColourSiblings.module.css'

export interface ColourSiblingsProps {
  items: ColourSibling[]
}

/** Swatches that link between the colours of one product family. */
export default function ColourSiblings({ items }: ColourSiblingsProps) {
  if (items.length < 2) return null
  const current = items.find((item) => item.current)
  return (
    <div className={styles.siblings}>
      <p className={styles.label}>
        <span className={styles.labelText}>Colour</span>
        {current && <span className={styles.value}>{current.name}</span>}
      </p>
      <ul className={styles.list}>
        {items.map((item) => {
          const name = item.soldOut ? `${item.name}, sold out` : item.name
          return (
            <li key={item.href}>
              {item.current ? (
                <span
                  className={styles.swatch}
                  style={{ background: item.hex }}
                  data-current="true"
                  data-sold-out={item.soldOut ? 'true' : undefined}
                  role="img"
                  aria-label={`${name}, selected`}
                />
              ) : (
                <Link
                  href={item.href}
                  className={styles.swatch}
                  style={{ background: item.hex }}
                  data-sold-out={item.soldOut ? 'true' : undefined}
                  aria-label={name}
                  title={name}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

`components/ui/ColourSiblings/ColourSiblings.module.css`:

```css
.siblings {
  display: grid;
  gap: var(--s-3);
}

.label {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  margin: 0;
}

.labelText {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.value {
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.swatch {
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
}

.swatch[data-current='true'] {
  outline: 2px solid var(--c-text);
  outline-offset: 2px;
}

/* Sold out: a diagonal stroke, never colour alone (the name says it too). */
.swatch[data-sold-out='true']::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -4px;
  right: -4px;
  height: 2px;
  background: var(--c-surface);
  transform: rotate(-45deg);
}

a.swatch:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (colour-siblings|ColourSiblings)`
Expected: PASS, 8 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add lib/colour-siblings.ts lib/colour-siblings.test.ts components/ui/ColourSiblings
git commit -m "feat: add colour siblings across a product family"
```

---

### Task 4: Gallery en de galerijvolgorde

**Files:**
- Create: `lib/product-gallery.ts`
- Test: `lib/product-gallery.test.ts`
- Create: `components/ui/Gallery/Gallery.tsx`, `components/ui/Gallery/Gallery.module.css`
- Test: `components/ui/Gallery/Gallery.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (regel 115-136 `fill` vraagt een gepositioneerde ouder; regel 199-232 `sizes`; regel 265-293: `preload` alleen voor één LCP-beeld, `priority` is in Next 16 vervangen; regel 287-289 en 295-310: gebruik `loading="eager"` of `fetchPriority="high"`).

**Interfaces:**
- Consumes: tokens.
- Produces:
  - `export interface GalleryImage { src: string; alt: string }`
  - `export interface GallerySource { productName: string; front: string | null; back: string | null; mockups: string[]; extras: string[] }`
  - `export function buildGallery(source: GallerySource): GalleryImage[]` (front, back, overige mockups, lokale foto's; elke URL één keer; alt "`naam`, front" / ", back" / ", view N")
  - `export function galleryFor(galleries: Record<string, GalleryImage[]>, colour: string): GalleryImage[]` (de kleur, anders `''`, anders de eerste, anders `[]`)
  - `export interface GalleryProps { images: GalleryImage[]; label: string }`, `export default function Gallery(props)`: desktop verticaal gestapeld met sticky thumbnails (klik scrollt naar het beeld en zet `aria-current`), mobiel horizontale scroll-snap-strook met teller "1 / 3"; eerste beeld `loading="eager"` en `fetchPriority="high"`; zonder beelden een leeg 4:5-vlak met `role="img"`.

- [ ] **Step 1: Schrijf de falende tests**

`lib/product-gallery.test.ts`:

```ts
import { buildGallery, galleryFor } from './product-gallery'

describe('buildGallery', () => {
  it('leads with front and back, then the mockups and the local photos, each once', () => {
    expect(
      buildGallery({
        productName: 'OLYMPN Sport Oversized Hoodie Mocha',
        front: 'https://cdn.test/front.png',
        back: 'https://cdn.test/back.png',
        mockups: ['https://cdn.test/model.jpg', 'https://cdn.test/front.png'],
        extras: ['/products/x/lifestyle.png'],
      })
    ).toEqual([
      { src: 'https://cdn.test/front.png', alt: 'OLYMPN Sport Oversized Hoodie Mocha, front' },
      { src: 'https://cdn.test/back.png', alt: 'OLYMPN Sport Oversized Hoodie Mocha, back' },
      { src: 'https://cdn.test/model.jpg', alt: 'OLYMPN Sport Oversized Hoodie Mocha, view 3' },
      { src: '/products/x/lifestyle.png', alt: 'OLYMPN Sport Oversized Hoodie Mocha, view 4' },
    ])
  })

  it('skips a missing front or back', () => {
    expect(buildGallery({ productName: 'Bag', front: null, back: null, mockups: ['/a.png'], extras: [] })).toEqual([
      { src: '/a.png', alt: 'Bag, view 1' },
    ])
  })
})

describe('galleryFor', () => {
  const a = [{ src: '/a.png', alt: 'a' }]
  const b = [{ src: '/b.png', alt: 'b' }]

  it('picks the colour, then the colourless gallery, then the first one', () => {
    expect(galleryFor({ Black: a, Maroon: b }, 'Maroon')).toBe(b)
    expect(galleryFor({ '': a }, 'Black')).toBe(a)
    expect(galleryFor({ Black: a }, 'Unknown')).toBe(a)
    expect(galleryFor({}, '')).toEqual([])
  })
})
```

`components/ui/Gallery/Gallery.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import type { GalleryImage } from '@/lib/product-gallery'
import Gallery from './Gallery'

const IMAGES: GalleryImage[] = [
  { src: '/drops/olympn-sport/mocha.webp', alt: 'Hoodie Mocha, front' },
  { src: '/drops/olympn-sport/dune.webp', alt: 'Hoodie Mocha, back' },
  { src: '/drops/olympn-sport/olive.webp', alt: 'Hoodie Mocha, view 3' },
]

const scrollIntoView = jest.fn()

beforeEach(() => {
  scrollIntoView.mockReset()
  Element.prototype.scrollIntoView = scrollIntoView
})

describe('Gallery', () => {
  it('renders every image, the first one eager and high priority', () => {
    render(<Gallery images={IMAGES} label="Hoodie Mocha" />)
    const imgs = screen.getAllByRole('img', { name: /Hoodie Mocha,/ })
    expect(imgs.map((img) => img.getAttribute('alt'))).toEqual(IMAGES.map((i) => i.alt))
    expect(imgs[0]).toHaveAttribute('fetchpriority', 'high')
    expect(imgs[0]).toHaveAttribute('loading', 'eager')
    expect(imgs[1]).toHaveAttribute('loading', 'lazy')
  })

  it('selects an image from its thumbnail and scrolls to it', () => {
    render(<Gallery images={IMAGES} label="Hoodie Mocha" />)
    const thumbs = screen.getAllByRole('button', { name: /Show image/ })
    expect(thumbs).toHaveLength(3)
    expect(thumbs[0]).toHaveAttribute('aria-current', 'true')
    fireEvent.click(thumbs[2])
    expect(thumbs[2]).toHaveAttribute('aria-current', 'true')
    expect(thumbs[0]).not.toHaveAttribute('aria-current')
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByRole('img', { name: 'Hoodie Mocha, view 3' }).closest('li'))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
  })

  it('follows a swipe on the mobile strip', () => {
    render(<Gallery images={IMAGES} label="Hoodie Mocha" />)
    const track = screen.getByRole('list', { name: /swipe/ })
    Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true })
    Object.defineProperty(track, 'scrollLeft', { value: 300, configurable: true })
    fireEvent.scroll(track)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('shows no thumbnails or counter for a single image', () => {
    render(<Gallery images={IMAGES.slice(0, 1)} label="Hoodie Mocha" />)
    expect(screen.queryByRole('button', { name: /Show image/ })).toBeNull()
    expect(screen.queryByText('1 / 1')).toBeNull()
  })

  it('keeps the 4:5 surface when there is no image yet', () => {
    render(<Gallery images={[]} label="Hoodie Mocha" />)
    expect(screen.getByRole('img', { name: 'Hoodie Mocha, no image yet' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (product-gallery|ui/Gallery)`
Expected: FAIL met "Cannot find module './product-gallery'" en "Cannot find module './Gallery'".

- [ ] **Step 3: Implementeer `lib/product-gallery.ts`**

```ts
/** One product photo for the gallery. */
export interface GalleryImage {
  src: string
  alt: string
}

export interface GallerySource {
  productName: string
  /** Front mockup (background removed) or a local override. */
  front: string | null
  /** Genuine back mockup (background removed) or a local override. */
  back: string | null
  /** Other provider mockups (flat, on-model, detail crops), shown as-is. */
  mockups: string[]
  /** Local lifestyle photos from lib/product-images.ts, shown as-is. */
  extras: string[]
}

/** Front, back, then the other mockups and the local photos; every URL once. */
export function buildGallery({ productName, front, back, mockups, extras }: GallerySource): GalleryImage[] {
  const seen = new Set<string>()
  const out: GalleryImage[] = []
  const add = (src: string | null, alt: string) => {
    if (!src || seen.has(src)) return
    seen.add(src)
    out.push({ src, alt })
  }
  add(front, `${productName}, front`)
  add(back, `${productName}, back`)
  for (const src of [...mockups, ...extras]) add(src, `${productName}, view ${out.length + 1}`)
  return out
}

/** The gallery of a colour; a product without colours uses the '' key. */
export function galleryFor(galleries: Record<string, GalleryImage[]>, colour: string): GalleryImage[] {
  return galleries[colour] ?? galleries[''] ?? Object.values(galleries)[0] ?? []
}
```

- [ ] **Step 4: Implementeer `Gallery`**

`components/ui/Gallery/Gallery.tsx`:

```tsx
'use client'

import Image from 'next/image'
import { useRef, useState, type UIEvent } from 'react'
import type { GalleryImage } from '@/lib/product-gallery'
import styles from './Gallery.module.css'

export interface GalleryProps {
  images: GalleryImage[]
  /** Product name, used for the region and the empty state. */
  label: string
}

function scrollBehavior(): ScrollBehavior {
  const reduce =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduce ? 'auto' : 'smooth'
}

/**
 * Desktop: images stacked, sticky thumbnails that scroll to an image.
 * Mobile: a horizontal scroll-snap strip with a counter. Mockups sit on the
 * white surface at 4:5 with object-fit: contain (spec section 2).
 */
export default function Gallery({ images, label }: GalleryProps) {
  const [active, setActive] = useState(0)
  const slides = useRef<(HTMLLIElement | null)[]>([])

  if (images.length === 0) {
    return <div className={styles.placeholder} role="img" aria-label={`${label}, no image yet`} />
  }

  function show(index: number) {
    setActive(index)
    slides.current[index]?.scrollIntoView?.({ behavior: scrollBehavior(), block: 'start', inline: 'start' })
  }

  function onTrackScroll(event: UIEvent<HTMLUListElement>) {
    const track = event.currentTarget
    if (track.clientWidth === 0) return
    const index = Math.round(track.scrollLeft / track.clientWidth)
    if (index >= 0 && index < images.length && index !== active) setActive(index)
  }

  return (
    <section className={styles.gallery} aria-label={`${label} images`}>
      {images.length > 1 && (
        <ol className={styles.thumbs}>
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                className={styles.thumb}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => show(i)}
              >
                <Image src={image.src} alt="" fill sizes="72px" className={styles.thumbImage} />
              </button>
            </li>
          ))}
        </ol>
      )}
      <ul
        className={styles.track}
        onScroll={onTrackScroll}
        tabIndex={0}
        aria-label={`${label} images, swipe for more`}
      >
        {images.map((image, i) => (
          <li
            key={image.src}
            ref={(el) => {
              slides.current[i] = el
            }}
            className={styles.slide}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className={styles.image}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : undefined}
            />
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <p className={styles.counter} aria-hidden="true">
          {active + 1} / {images.length}
        </p>
      )}
    </section>
  )
}
```

`components/ui/Gallery/Gallery.module.css`:

```css
.gallery {
  position: relative;
}

.placeholder {
  aspect-ratio: 4 / 5;
  background: var(--c-surface);
}

.track {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.track::-webkit-scrollbar {
  display: none;
}

.track:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: -2px;
}

.slide {
  position: relative;
  flex: 0 0 100%;
  aspect-ratio: 4 / 5;
  background: var(--c-surface);
  scroll-snap-align: start;
  scroll-margin-top: calc(var(--l-chrome) + var(--s-4));
}

.image {
  object-fit: contain;
}

.thumbs {
  display: none;
}

.thumb {
  position: relative;
  display: block;
  width: 72px;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 1px solid var(--c-stone);
  border-radius: var(--r-0);
  background: var(--c-surface);
  cursor: pointer;
}

.thumb[aria-current='true'] {
  border-color: var(--c-text);
}

.thumb:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.thumbImage {
  object-fit: contain;
}

.counter {
  position: absolute;
  right: var(--l-gutter);
  bottom: var(--s-3);
  margin: 0;
  padding: var(--s-1) var(--s-2);
  background: var(--c-surface);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 1024px) {
  .gallery {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr);
    gap: var(--s-3);
    align-items: start;
  }

  .thumbs {
    position: sticky;
    top: calc(var(--l-chrome) + var(--s-5));
    display: grid;
    gap: var(--s-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .track {
    grid-column: 2;
    flex-direction: column;
    gap: var(--l-grid-gap);
    overflow: visible;
    scroll-snap-type: none;
  }

  .counter {
    display: none;
  }
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (product-gallery|ui/Gallery)`
Expected: PASS, 8 tests.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add lib/product-gallery.ts lib/product-gallery.test.ts components/ui/Gallery
git commit -m "feat: add product Gallery with sticky thumbnails and swipe strip"
```

---

### Task 5: `usePurchase` en prijsopmaak

**Files:**
- Create: `lib/money.ts`
- Test: `lib/money.test.ts`
- Modify: `lib/tiles.ts` (gemaakt in fase 1-2 Task 11: de `SYMBOLS`-constante en `formatPrice`, plus één import)
- Create: `hooks/usePurchase.ts`
- Test: `hooks/usePurchase.test.tsx`

**Interfaces:**
- Consumes: `useVariantPicker`, `PickableVariant` (`hooks/useVariantPicker.ts:8-38`, ongewijzigd); `useCartStore` (`store/cart.ts`, `addItem`); `SizeOption` (Task 1); `NormalizedVariant`, `Provider` (`types/catalog.ts`).
- Produces:
  - `lib/money.ts`: `export function formatPrice(cents: number | undefined, currency: string): string | null` (zelfde gedrag als in fase 1-2 Task 11: `'€64.95'`, `'SEK 64.95'`, `null` bij 0 of ontbrekend) en `export function formatEuro(amount: number): string` (`'€4.95'`, ook `'€0.00'`). `lib/tiles.ts` exporteert `formatPrice` voortaan door vanuit `lib/money.ts`.
  - `hooks/usePurchase.ts`:
    - `export const ADDED_MS = 2200`
    - `export function sizeLabel(v: Pick<NormalizedVariant, 'size' | 'name'>, euSizeMap?: Record<string, string>): string`
    - `export interface UsePurchaseOptions { provider: Provider; productId: string; productName: string; variants: NormalizedVariant[]; soldOut: boolean; euSizeMap?: Record<string, string>; imageFor(colour: string): string | null }`
    - `export interface Purchase { colours: SizeOption[]; selectedColour: string; selectColour(colour: string): void; sizes: SizeOption[]; selectedSize: string | null; selectSize(variantId: string): void; needsSize: boolean; selectionSoldOut: boolean; price: string | null; added: boolean; addToCart(): void }`
    - `export function usePurchase(options: UsePurchaseOptions): Purchase`

Regels (spec sectie 5 plus het bestaande gedrag van `ProductDetail.tsx:136-178`):
- Een maat is uitverkocht als het hele product `soldOut` is (winkelregel, fase 1-2 Task 7) of als `useVariantPicker` hem niet beschikbaar noemt. Uitverkocht is doorgestreept maar kiesbaar; dan is `selectionSoldOut` waar en gaat er niets in de cart.
- `soldOut` van de winkelregel wint van de pre-sale-regel van `useVariantPicker` (een hele kleur op voorraad-nul blijft daar bestelbaar). De tegel zegt "Sold out", dus de PDP zegt dat ook; de hook zelf blijft ongewijzigd voor andere afnemers.
- Geen koopbare maat (geen varianten, of alleen `HIDDEN_SIZES`) telt als uitverkocht: "Notify me".
- Eén maat: geen keuze nodig, die variant wordt (als hij beschikbaar is) automatisch gekozen; `?color=` kiest de kleur vooraf; "Added to cart" staat 2,2 s.

- [ ] **Step 1: Schrijf de falende tests**

`lib/money.test.ts`:

```ts
import { formatEuro, formatPrice } from './money'

describe('formatPrice', () => {
  it('formats cents with the currency symbol, or the code', () => {
    expect(formatPrice(6495, 'EUR')).toBe('€64.95')
    expect(formatPrice(6495, 'SEK')).toBe('SEK 64.95')
  })

  it('shows no price instead of a wrong one', () => {
    expect(formatPrice(undefined, 'EUR')).toBeNull()
    expect(formatPrice(0, 'EUR')).toBeNull()
    expect(formatPrice(Number.NaN, 'EUR')).toBeNull()
  })
})

describe('formatEuro', () => {
  it('formats euro amounts, zero included', () => {
    expect(formatEuro(4.95)).toBe('€4.95')
    expect(formatEuro(75 - 45.1)).toBe('€29.90')
    expect(formatEuro(0)).toBe('€0.00')
    expect(formatEuro(Number.NaN)).toBe('€0.00')
  })
})
```

`hooks/usePurchase.test.tsx` (de gevallen van `app/shop/[slug]/ProductDetail.test.tsx` verhuizen hierheen, met de sold-out-regel volgens spec sectie 5):

```tsx
import { act, renderHook } from '@testing-library/react'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'
import { ADDED_MS, sizeLabel, usePurchase, type UsePurchaseOptions } from './usePurchase'

function variant(id: string, color: string, size: string, inStock = true, priceCents = 4500): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${size} / ${color}`, size, color,
    colorCode: color === 'Black' ? '#111111' : '#7b1f2b', priceCents, currency: 'EUR',
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

function setup(overrides: Partial<UsePurchaseOptions> = {}) {
  const options: UsePurchaseOptions = {
    provider: 'printful',
    productId: 'p1',
    productName: 'Olympian Tee',
    variants: twoColours,
    soldOut: false,
    imageFor: (colour) => `/img/${colour || 'base'}.png`,
    ...overrides,
  }
  return renderHook(() => usePurchase(options))
}

const cartIds = () => useCartStore.getState().items.map((i) => i.variantId)

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympian-tee')
})

describe('usePurchase', () => {
  it('asks for a size first, then adds the chosen size of the first colour', () => {
    const { result } = setup()
    expect(result.current.needsSize).toBe(true)
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual([])
    act(() => result.current.selectSize('b-m'))
    expect(result.current.needsSize).toBe(false)
    act(() => result.current.addToCart())
    expect(useCartStore.getState().items).toEqual([
      {
        provider: 'printful', variantId: 'b-m', productId: 'p1', productName: 'Olympian Tee',
        variantName: 'M / Black', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: '/img/Black.png',
      },
    ])
    expect(result.current.added).toBe(true)
  })

  it('never offers hidden sizes; a sold-out size is offered, selectable and not buyable', () => {
    const { result } = setup()
    expect(result.current.sizes).toEqual([
      { value: 'b-m', label: 'M', soldOut: false },
      { value: 'b-l', label: 'L', soldOut: true },
    ])
    act(() => result.current.selectSize('b-l'))
    expect(result.current.selectedSize).toBe('b-l')
    expect(result.current.selectionSoldOut).toBe(true)
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual([])
  })

  it('clears the chosen size when another colour is picked', () => {
    const { result } = setup()
    expect(result.current.colours.map((c) => c.label)).toEqual(['Black', 'Maroon'])
    act(() => result.current.selectSize('b-m'))
    act(() => result.current.selectColour('Maroon'))
    expect(result.current.selectedSize).toBeNull()
    expect(result.current.needsSize).toBe(true)
    act(() => result.current.selectSize('r-l'))
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual(['r-l'])
  })

  it('preselects the colour from a ?color= deep link', () => {
    window.history.replaceState({}, '', '/shop/olympian-tee?color=Maroon')
    const { result } = setup()
    expect(result.current.selectedColour).toBe('Maroon')
  })

  it('auto-selects the only variant of a one-size product', () => {
    const { result } = setup({ variants: [variant('cap', '', 'One size')] })
    expect(result.current.colours).toEqual([])
    expect(result.current.needsSize).toBe(false)
    expect(result.current.selectedSize).toBe('cap')
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual(['cap'])
  })

  it('can only be waitlisted without variants or with hidden sizes only', () => {
    for (const variants of [[], [variant('x', 'Black', '4XL')]]) {
      const { result } = setup({ variants })
      expect(result.current.sizes).toEqual([])
      expect(result.current.needsSize).toBe(false)
      expect(result.current.selectionSoldOut).toBe(true)
      act(() => result.current.addToCart())
      expect(cartIds()).toEqual([])
    }
  })

  it('treats a sold-out product as sold out even where the pre-sale rule would sell it', () => {
    const allOut = [variant('m', 'Black', 'M', false), variant('l', 'Black', 'L', false)]
    const { result } = setup({ variants: allOut, soldOut: true })
    expect(result.current.sizes.every((s) => s.soldOut)).toBe(true)
    expect(result.current.selectionSoldOut).toBe(true)
    act(() => result.current.selectSize('m'))
    act(() => result.current.addToCart())
    expect(cartIds()).toEqual([])
  })

  it('shows the price of the chosen size', () => {
    const { result } = setup({ variants: [variant('m', '', 'M', true, 4500), variant('xl', '', 'XL', true, 5000)] })
    expect(result.current.price).toBe('€45.00')
    act(() => result.current.selectSize('xl'))
    expect(result.current.price).toBe('€50.00')
  })

  it('says Added to cart for a moment', () => {
    jest.useFakeTimers()
    try {
      const { result } = setup({ variants: [variant('cap', '', 'One size')] })
      act(() => result.current.addToCart())
      expect(result.current.added).toBe(true)
      act(() => {
        jest.advanceTimersByTime(ADDED_MS)
      })
      expect(result.current.added).toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('sizeLabel', () => {
  it('uses the EU size when there is one, else capitalises the size or name', () => {
    expect(sizeLabel({ size: '42', name: '' }, { '42': 'EU 42' })).toBe('EU 42')
    expect(sizeLabel({ size: 'xl', name: '' })).toBe('Xl')
    expect(sizeLabel({ size: '', name: 'one size' })).toBe('One Size')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (lib/money|usePurchase)`
Expected: FAIL met "Cannot find module './money'" en "Cannot find module './usePurchase'".

- [ ] **Step 3: Implementeer `lib/money.ts` en laat `lib/tiles.ts` hem gebruiken**

`lib/money.ts`:

```ts
const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }

/**
 * "€64.95" from cents. null for a missing or zero price, so a wrong price is
 * never shown. Safe in client components (no server imports).
 */
export function formatPrice(cents: number | undefined, currency: string): string | null {
  if (cents === undefined || !Number.isFinite(cents) || cents <= 0) return null
  return `${SYMBOLS[currency] ?? `${currency} `}${(cents / 100).toFixed(2)}`
}

/** "€4.95" for an amount in euro: cart and checkout totals, which may be 0. */
export function formatEuro(amount: number): string {
  return `€${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`
}
```

In `lib/tiles.ts` (stand na fase 1-2 Task 11) voeg direct na de regel `import { NEW_IN_MS, formatDropDate } from '@/lib/drops'` toe:

```ts
import { formatPrice } from '@/lib/money'
```

en vervang:

```ts
const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' }

export function formatPrice(cents: number | undefined, currency: string): string | null {
  if (cents === undefined || !Number.isFinite(cents) || cents <= 0) return null
  return `${SYMBOLS[currency] ?? `${currency} `}${(cents / 100).toFixed(2)}`
}
```

door:

```ts
/** Lives in lib/money.ts so client components can format prices without the server image helpers. */
export { formatPrice }
```

- [ ] **Step 4: Implementeer `hooks/usePurchase.ts`**

```ts
import { useEffect, useState } from 'react'
import type { SizeOption } from '@/components/ui/SizeSelector/SizeSelector'
import { useVariantPicker } from '@/hooks/useVariantPicker'
import { formatPrice } from '@/lib/money'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant, Provider } from '@/types/catalog'

/** How long the button says "Added to cart" (same as the old product page). */
export const ADDED_MS = 2200

export interface UsePurchaseOptions {
  provider: Provider
  productId: string
  productName: string
  variants: NormalizedVariant[]
  /** Every variant out of stock (ShopProduct.soldOut): the whole product is sold out. */
  soldOut: boolean
  /** EU labels for footwear sizes, from Printful. */
  euSizeMap?: Record<string, string>
  /** Cart thumbnail for a colour: the first gallery image. */
  imageFor(colour: string): string | null
}

/** Everything the buy panel and the sticky bar show and do. */
export interface Purchase {
  /** Colours within this one product (rare: v2 colours are separate products). */
  colours: SizeOption[]
  selectedColour: string
  selectColour(colour: string): void
  /** One option per size; value is the variant id. */
  sizes: SizeOption[]
  selectedSize: string | null
  selectSize(variantId: string): void
  /** More than one size and none chosen yet. */
  needsSize: boolean
  /** The chosen size (or the whole product) cannot be bought: offer "Notify me". */
  selectionSoldOut: boolean
  /** Price of the chosen size, else the first variant; null when unknown. */
  price: string | null
  added: boolean
  addToCart(): void
}

export function sizeLabel(v: Pick<NormalizedVariant, 'size' | 'name'>, euSizeMap: Record<string, string> = {}): string {
  return euSizeMap[v.size] ?? (v.size || v.name).replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * The buy state of one product page on top of useVariantPicker and the cart
 * store. Sold out follows spec section 5: struck through, selectable, and
 * "Notify me" instead of adding.
 */
export function usePurchase({
  provider,
  productId,
  productName,
  variants,
  soldOut,
  euSizeMap = {},
  imageFor,
}: UsePurchaseOptions): Purchase {
  const colourKeys = [...new Set(variants.map((v) => v.color).filter(Boolean))]
  const picker = useVariantPicker({ variants, colors: colourKeys })
  const { selectedColor, selectedVariant, selectColor, selectVariant, isAvailable } = picker
  const pickerSizes = picker.sizes
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  // Preselect a colour when arriving via a swatch deep link (/shop/{slug}?color=...).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('color')
    if (param && colourKeys.includes(param)) selectColor(param)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-select the only variant of a one-size product (bags, caps).
  useEffect(() => {
    if (pickerSizes.length === 1 && isAvailable(pickerSizes[0])) selectVariant(pickerSizes[0].id)
  }, [selectedColor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), ADDED_MS)
    return () => clearTimeout(t)
  }, [added])

  const isSoldOut = (v: NormalizedVariant) => soldOut || !isAvailable(v)
  const chosen = selectedVariant ?? (pickerSizes.length === 1 ? pickerSizes[0] : null)
  const selectionSoldOut = soldOut || pickerSizes.length === 0 || (chosen !== null && isSoldOut(chosen))
  const priced = chosen ?? variants[0] ?? null

  function addToCart() {
    if (!chosen || selectionSoldOut) return
    addItem({
      provider,
      variantId: chosen.id,
      productId,
      productName,
      variantName: chosen.name,
      price: (chosen.priceCents / 100).toFixed(2),
      currency: chosen.currency,
      quantity: 1,
      imageUrl: imageFor(selectedColor),
    })
    setAdded(true)
  }

  return {
    colours: colourKeys.map((colour) => ({ value: colour, label: colour, soldOut: false })),
    selectedColour: selectedColor,
    selectColour: selectColor,
    sizes: pickerSizes.map((v) => ({ value: v.id, label: sizeLabel(v, euSizeMap), soldOut: isSoldOut(v) })),
    selectedSize: selectedVariant?.id ?? null,
    selectSize: selectVariant,
    needsSize: pickerSizes.length > 1 && selectedVariant === null,
    selectionSoldOut,
    price: priced ? formatPrice(priced.priceCents, priced.currency) : null,
    added,
    addToCart,
  }
}
```

- [ ] **Step 5: Run de tests, verwacht slagen**

Run: `npm test -- (lib/money|lib/tiles|usePurchase|useVariantPicker)`
Expected: PASS: `money` 3, `usePurchase` 10, en de bestaande `tiles`- en `useVariantPicker`-tests ongewijzigd groen.

- [ ] **Step 6: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 7: Commit**

```bash
git add lib/money.ts lib/money.test.ts lib/tiles.ts hooks/usePurchase.ts hooks/usePurchase.test.tsx
git commit -m "feat: add usePurchase buy state on top of the variant picker"
```

---

### Task 6: BuyPanel, StickyBuyBar en de productteksten

**Files:**
- Create: `lib/product-copy.ts`
- Test: `lib/product-copy.test.ts`
- Modify: `components/ui/WaitlistForm/WaitlistForm.tsx` (gemaakt in fase 1-2 Task 15: props-interface, functiekop, label, succesmelding)
- Create: `components/ui/BuyPanel/BuyPanel.tsx`, `components/ui/BuyPanel/BuyPanel.module.css`
- Test: `components/ui/BuyPanel/BuyPanel.test.tsx`
- Create: `components/ui/StickyBuyBar/StickyBuyBar.tsx`, `components/ui/StickyBuyBar/StickyBuyBar.module.css`
- Test: `components/ui/StickyBuyBar/StickyBuyBar.test.tsx`

**Interfaces:**
- Consumes: `SizeSelector`, `SizeOption` (Task 1); `SizeGuideDialog`, `Accordion` (Task 2); `ColourSiblings`, `ColourSibling` (Task 3); `Purchase`, `usePurchase` (Task 5); `Button` (fase 1-2 Task 2: `variant`, `size`, `className`, `loading`); `Badge` (fase 1-2 Task 2: `kind="coming"` geeft "Coming soon", `kind="sold-out"` geeft "Sold out"); `WaitlistForm` (fase 1-2 Task 15); `DropView`, `toDropView`, `DROPS` (fase 1-2 Task 6); `CATEGORIES`, `matchesCategory` (fase 1-2 Task 13); `FLAT_SHIPPING_RATE`, `FREE_SHIPPING_THRESHOLD` (`lib/shipping.ts:20-21`); `SizeGuide` (type).
- Produces:
  - `lib/product-copy.ts`: `export interface InfoSection { title: string; lines: string[] }`, `export const CARE_INSTRUCTIONS: string[]`, `export function categoryLabel(name: string): string` (`'Hoodies'`, `'Tees'`, `'Knits'`, `'Bags'`, anders `'Product'`), `export function fitFromName(name: string): string | null`, `export interface ProductInfoInput { productName: string; materials: string[]; modelNote?: string; dropTitle: string; editionLabel: string }`, `export function productInfoSections(input: ProductInfoInput): InfoSection[]` (Details, Fit, Shipping and returns).
  - `WaitlistFormProps` krijgt `label?: string` en `doneMessage?: string`; zonder die props blijft alles zoals in fase 1-2.
  - `export interface BuyPanelProduct { name: string; slug: string; purchasable: boolean; soldOut: boolean; releaseLabel?: string }`
  - `export interface BuyPanelAnchors { sizes: string; notify: string }`
  - `export interface BuyPanelSizeGuide { category: string; guide: SizeGuide; sizeLabels?: Record<string, string> }`
  - `export interface BuyPanelProps { product: BuyPanelProduct; drop: DropView; siblings: ColourSibling[]; purchase: Purchase; sizeGuide: BuyPanelSizeGuide | null; modelNote?: string; info: InfoSection[]; anchors: BuyPanelAnchors }`
  - `export interface StickyBuyBarProps { name: string; purchase: Purchase; anchors: BuyPanelAnchors }`; de balk draagt `data-sticky-buy` en is `position: sticky; bottom: 0` (nooit `fixed`).

Spec sectie 5 geeft `BuyPanel` de props `product; drop: DropView; siblings`. De koopstaat (`purchase`) komt er als prop bij omdat de mobiele balk dezelfde keuze moet tonen; `ProductView` (Task 7) maakt hem één keer aan. De teksten in de accordeons: Printful levert geen pasvorminformatie, dus "Fit" noemt alleen wat de naam zegt (Oversized, Relaxed), de `modelNote` van de drop en de verwijzing naar de size guide.

- [ ] **Step 1: Schrijf de falende tests**

`lib/product-copy.test.ts`:

```ts
import { CARE_INSTRUCTIONS, categoryLabel, fitFromName, productInfoSections } from './product-copy'

describe('productInfoSections', () => {
  it('builds Details, Fit and Shipping and returns', () => {
    const sections = productInfoSections({
      productName: 'OLYMPN Sport Oversized Hoodie Dune',
      materials: ['100% cotton'],
      modelNote: 'Model is 1,85 m and wears L',
      dropTitle: 'OLYMPN Sport',
      editionLabel: 'Edition 02',
    })
    expect(sections.map((s) => s.title)).toEqual(['Details', 'Fit', 'Shipping and returns'])
    expect(sections[0].lines).toEqual([
      'OLYMPN Sport, Edition 02. Made to order by 7ENO, Abra Entertainment.',
      '100% cotton',
      ...CARE_INSTRUCTIONS,
    ])
    expect(sections[1].lines).toEqual([
      'Oversized fit: roomy through the body and sleeves.',
      'Model is 1,85 m and wears L',
      'Body measurements per size are in the size guide.',
    ])
    expect(sections[2].lines).toEqual([
      'Flat €4.95 shipping, free on orders over €75.',
      'Made to order: delivered in 5 to 10 business days.',
      'Returns within 14 days, see the returns policy.',
    ])
  })

  it('makes no fit claim the name does not make', () => {
    const [, fit] = productInfoSections({
      productName: 'Olympian Tee Sand Unisex',
      materials: [],
      dropTitle: 'Olympian',
      editionLabel: 'Edition 01',
    })
    expect(fit.lines).toEqual(['Body measurements per size are in the size guide.'])
    expect(fitFromName('OLYMPN Sport Relaxed Hoodie Dune')).toBe('Relaxed fit: an easy, slightly loose cut.')
  })
})

describe('categoryLabel', () => {
  it('names the shop category, with a neutral fallback', () => {
    expect(categoryLabel('OLYMPN Sport Oversized Hoodie Dune')).toBe('Hoodies')
    expect(categoryLabel('Olympian Knitted Tee Sand')).toBe('Knits')
    expect(categoryLabel('Olympian Tee Ocean Unisex')).toBe('Tees')
    expect(categoryLabel('Olympian Backpack Ocean')).toBe('Bags')
    expect(categoryLabel('Olympian Cap')).toBe('Product')
  })
})
```

`components/ui/BuyPanel/BuyPanel.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { usePurchase } from '@/hooks/usePurchase'
import { DROPS, toDropView } from '@/lib/drops'
import type { InfoSection } from '@/lib/product-copy'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'
import BuyPanel, { type BuyPanelProduct, type BuyPanelSizeGuide } from './BuyPanel'

const [, sport] = DROPS
const DROP = toDropView(sport, Date.parse('2026-11-02T10:00:00Z'))
const INFO: InfoSection[] = [
  { title: 'Details', lines: ['Heavyweight cotton'] },
  { title: 'Fit', lines: ['Oversized fit'] },
  { title: 'Shipping and returns', lines: ['Returns within 14 days'] },
]
const GUIDE: BuyPanelSizeGuide = {
  category: 'Hoodies',
  guide: { unit: 'cm', sizes: ['S', 'M'], rows: [{ label: 'Chest', values: { S: '104', M: '110' } }] },
}
const NAME = 'OLYMPN Sport Oversized Hoodie Mocha'

function variant(id: string, size: string, inStock = true): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${NAME} / ${size}`, size, color: 'Mocha',
    colorCode: '#9E7551', priceCents: 6495, currency: 'EUR', inStock, imageUrl: null,
  }
}

const SIZES = [variant('s', 'S'), variant('m', 'M'), variant('l', 'L', false)]

function Harness({
  product = {},
  variants = SIZES,
  sizeGuide = GUIDE,
}: {
  product?: Partial<BuyPanelProduct>
  variants?: NormalizedVariant[]
  sizeGuide?: BuyPanelSizeGuide | null
}) {
  const full: BuyPanelProduct = {
    name: NAME,
    slug: 'olympn-sport-oversized-hoodie-mocha',
    purchasable: true,
    soldOut: false,
    ...product,
  }
  const purchase = usePurchase({
    provider: 'printful',
    productId: 'p1',
    productName: full.name,
    variants,
    soldOut: full.soldOut,
    imageFor: () => '/drops/olympn-sport/mocha.webp',
  })
  return (
    <BuyPanel
      product={full}
      drop={DROP}
      siblings={[]}
      purchase={purchase}
      sizeGuide={sizeGuide}
      modelNote="Model is 1,85 m and wears L"
      info={INFO}
      anchors={{ sizes: 'sizes', notify: 'notify' }}
    />
  )
}

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympn-sport-oversized-hoodie-mocha')
})

describe('BuyPanel', () => {
  it('shows the edition, the name, the price and the accordions', () => {
    render(<Harness />)
    expect(screen.getByRole('link', { name: 'Edition 02 · OLYMPN Sport' })).toHaveAttribute('href', '/collections/olympn-sport')
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeInTheDocument()
    expect(screen.getByText('€64.95')).toBeInTheDocument()
    for (const title of ['Details', 'Fit', 'Shipping and returns']) {
      expect(screen.getByText(title).closest('summary')).not.toBeNull()
    }
  })

  it('adds the chosen size to the cart store', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Select a size' })).toBeDisabled()
    fireEvent.click(screen.getByRole('radio', { name: 'M' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items).toMatchObject([
      { variantId: 'm', productName: NAME, price: '64.95', quantity: 1, imageUrl: '/drops/olympn-sport/mocha.webp' },
    ])
    expect(screen.getByRole('button', { name: 'Added to cart' })).toBeInTheDocument()
  })

  it('turns the button into Notify me for a sold-out size', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('radio', { name: 'L (sold out)' }))
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.getByText('This size is sold out.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email me when it is back')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('shows Sold out and Notify me straight away for a sold-out product', () => {
    render(<Harness product={{ soldOut: true }} variants={[variant('s', 'S', false), variant('m', 'M', false)]} />)
    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.getByText('Sold out.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio').every((r) => r.getAttribute('data-sold-out') === 'true')).toBe(true)
  })

  it('offers a waitlist instead of sizes and add-to-cart before the release', () => {
    render(<Harness product={{ purchasable: false, releaseLabel: '1 November 2026 at 12:00 CET' }} />)
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(screen.getByText('Drops 1 November 2026 at 12:00 CET')).toBeInTheDocument()
    expect(screen.getByLabelText('Get notified when it drops')).toBeInTheDocument()
  })

  it('skips the size picker for a one-size product and adds straight away', () => {
    render(<Harness variants={[variant('one', 'One size')]} />)
    expect(screen.queryByRole('radiogroup', { name: 'Size' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Size guide' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['one'])
  })

  it('can only be waitlisted when there are no variants', () => {
    render(<Harness variants={[]} sizeGuide={null} />)
    expect(screen.queryByText(/€/)).toBeNull()
    expect(screen.queryByRole('button', { name: /Add to cart|Select a size/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Notify me' })).toBeInTheDocument()
  })

  it('opens the size guide from the size row and shows the model note', () => {
    render(<Harness />)
    expect(screen.getAllByText('Model is 1,85 m and wears L').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Size guide' }))
    expect(screen.getByRole('dialog', { name: 'Hoodies size guide' })).toBeInTheDocument()
  })
})
```

`components/ui/StickyBuyBar/StickyBuyBar.test.tsx`:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Purchase } from '@/hooks/usePurchase'
import StickyBuyBar from './StickyBuyBar'

function purchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    colours: [],
    selectedColour: '',
    selectColour: jest.fn(),
    sizes: [],
    selectedSize: null,
    selectSize: jest.fn(),
    needsSize: false,
    selectionSoldOut: false,
    price: '€64.95',
    added: false,
    addToCart: jest.fn(),
    ...overrides,
  }
}

const ANCHORS = { sizes: 'sizes', notify: 'notify' }

describe('StickyBuyBar', () => {
  it('shows the name and price and adds to the cart', () => {
    const p = purchase()
    render(<StickyBuyBar name="OLYMPN Sport Oversized Hoodie Mocha" purchase={p} anchors={ANCHORS} />)
    expect(screen.getByText('OLYMPN Sport Oversized Hoodie Mocha')).toBeInTheDocument()
    expect(screen.getByText('€64.95')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
    expect(p.addToCart).toHaveBeenCalledTimes(1)
  })

  it('sends Select a size to the size group, on the focusable radio', () => {
    const p = purchase({ needsSize: true })
    render(
      <>
        <div id="sizes" role="radiogroup" aria-label="Size">
          <button type="button" role="radio" aria-checked={false} tabIndex={0}>S</button>
          <button type="button" role="radio" aria-checked={false} tabIndex={-1}>M</button>
        </div>
        <StickyBuyBar name="Hoodie" purchase={p} anchors={ANCHORS} />
      </>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Select a size' }))
    expect(screen.getByRole('radio', { name: 'S' })).toHaveFocus()
    expect(p.addToCart).not.toHaveBeenCalled()
  })

  it('sends Notify me to the email field', () => {
    render(
      <>
        <div id="notify" tabIndex={-1}>
          <label htmlFor="mail">Email</label>
          <input id="mail" type="email" />
        </div>
        <StickyBuyBar name="Hoodie" purchase={purchase({ selectionSoldOut: true })} anchors={ANCHORS} />
      </>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Notify me' }))
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('says Added to cart after adding', () => {
    render(<StickyBuyBar name="Hoodie" purchase={purchase({ added: true })} anchors={ANCHORS} />)
    expect(screen.getByRole('button', { name: 'Added to cart' })).toBeInTheDocument()
  })

  it('is sticky inside the page, never fixed over the footer, and clears the iOS home bar', () => {
    const css = readFileSync(path.join(process.cwd(), 'components/ui/StickyBuyBar/StickyBuyBar.module.css'), 'utf8')
    const bar = css.slice(css.indexOf('.bar {'), css.indexOf('}', css.indexOf('.bar {')))
    expect(bar).toContain('position: sticky')
    expect(bar).toContain('bottom: 0')
    expect(bar).toContain('env(safe-area-inset-bottom)')
    expect(css).not.toContain('position: fixed')
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (product-copy|BuyPanel|StickyBuyBar)`
Expected: FAIL met "Cannot find module './product-copy'", "Cannot find module './BuyPanel'" en "Cannot find module './StickyBuyBar'".

- [ ] **Step 3: Implementeer `lib/product-copy.ts`**

```ts
import { FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { CATEGORIES, matchesCategory } from '@/lib/shop-query'

/** One accordion section on the product page. */
export interface InfoSection {
  title: string
  lines: string[]
}

/**
 * Standard care for 7ENO's printed apparel. Printful exposes no care field,
 * so this is the recommended care for DTF and all-over prints (moved from the
 * old ProductDetail).
 */
export const CARE_INSTRUCTIONS = [
  'Machine wash cold, inside out, gentle cycle',
  'Use mild detergent, do not bleach',
  'Tumble dry low or hang to dry',
  'Do not iron directly on the print',
  'Do not dry clean',
]

/** "Hoodies": the shop category, used as the size guide title. */
export function categoryLabel(name: string): string {
  return CATEGORIES.find((c) => matchesCategory(name, c.value))?.label ?? 'Product'
}

/** Only what the product name itself says about the fit; no invented claims. */
export function fitFromName(name: string): string | null {
  if (/\boversized\b/i.test(name)) return 'Oversized fit: roomy through the body and sleeves.'
  if (/\brelaxed\b/i.test(name)) return 'Relaxed fit: an easy, slightly loose cut.'
  return null
}

export interface ProductInfoInput {
  productName: string
  materials: string[]
  modelNote?: string
  dropTitle: string
  editionLabel: string
}

/** Details, Fit, Shipping and returns (spec section 5). */
export function productInfoSections({
  productName,
  materials,
  modelNote,
  dropTitle,
  editionLabel,
}: ProductInfoInput): InfoSection[] {
  const fit = [fitFromName(productName), modelNote ?? null, 'Body measurements per size are in the size guide.'].filter(
    (line): line is string => line !== null
  )
  return [
    {
      title: 'Details',
      lines: [`${dropTitle}, ${editionLabel}. Made to order by 7ENO, Abra Entertainment.`, ...materials, ...CARE_INSTRUCTIONS],
    },
    { title: 'Fit', lines: fit },
    {
      title: 'Shipping and returns',
      lines: [
        `Flat €${FLAT_SHIPPING_RATE.toFixed(2)} shipping, free on orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)}.`,
        'Made to order: delivered in 5 to 10 business days.',
        'Returns within 14 days, see the returns policy.',
      ],
    },
  ]
}
```

- [ ] **Step 4: `WaitlistForm` krijgt een eigen label en succesmelding**

In `components/ui/WaitlistForm/WaitlistForm.tsx` (stand na fase 1-2 Task 15) vervang:

```tsx
export interface WaitlistFormProps {
  dropId?: string
  productSlug?: string
  compact?: boolean
}
```

door:

```tsx
export interface WaitlistFormProps {
  dropId?: string
  productSlug?: string
  compact?: boolean
  /** Field label; defaults to the drop wording. The sold-out notify form says "Email me when it is back". */
  label?: string
  /** Shown after a successful signup. */
  doneMessage?: string
}
```

Vervang:

```tsx
export default function WaitlistForm({ dropId, productSlug, compact = false }: WaitlistFormProps) {
```

door:

```tsx
export default function WaitlistForm({
  dropId,
  productSlug,
  compact = false,
  label,
  doneMessage = "You're on the list. We'll email you when it drops.",
}: WaitlistFormProps) {
```

Vervang:

```tsx
        setMessage("You're on the list. We'll email you when it drops.")
```

door:

```tsx
        setMessage(doneMessage)
```

Vervang:

```tsx
        {compact ? 'Email for drop alerts' : 'Get notified when it drops'}
```

door:

```tsx
        {label ?? (compact ? 'Email for drop alerts' : 'Get notified when it drops')}
```

- [ ] **Step 5: Implementeer `BuyPanel`**

`components/ui/BuyPanel/BuyPanel.tsx`:

```tsx
'use client'

import Link from 'next/link'
import Accordion from '@/components/ui/Accordion/Accordion'
import Badge from '@/components/ui/Badge/Badge'
import Button from '@/components/ui/Button/Button'
import ColourSiblings from '@/components/ui/ColourSiblings/ColourSiblings'
import SizeGuideDialog from '@/components/ui/SizeGuideDialog/SizeGuideDialog'
import SizeSelector from '@/components/ui/SizeSelector/SizeSelector'
import WaitlistForm from '@/components/ui/WaitlistForm/WaitlistForm'
import type { Purchase } from '@/hooks/usePurchase'
import type { ColourSibling } from '@/lib/colour-siblings'
import type { DropView } from '@/lib/drops'
import type { SizeGuide } from '@/lib/printful'
import type { InfoSection } from '@/lib/product-copy'
import styles from './BuyPanel.module.css'

export interface BuyPanelProduct {
  name: string
  slug: string
  /** False for a teaser before its release (spec section 4). */
  purchasable: boolean
  /** Every variant out of stock. */
  soldOut: boolean
  /** "1 November 2026 at 12:00 CET", shown on a teaser. */
  releaseLabel?: string
}

/** Element ids the sticky bar jumps to. */
export interface BuyPanelAnchors {
  sizes: string
  notify: string
}

export interface BuyPanelSizeGuide {
  category: string
  guide: SizeGuide
  sizeLabels?: Record<string, string>
}

export interface BuyPanelProps {
  product: BuyPanelProduct
  drop: DropView
  siblings: ColourSibling[]
  purchase: Purchase
  sizeGuide: BuyPanelSizeGuide | null
  modelNote?: string
  info: InfoSection[]
  anchors: BuyPanelAnchors
}

/** The buy column: sticky on desktop (ProductView), first after the gallery on mobile. */
export default function BuyPanel({ product, drop, siblings, purchase, sizeGuide, modelNote, info, anchors }: BuyPanelProps) {
  const guide = sizeGuide ? (
    <SizeGuideDialog
      category={sizeGuide.category}
      guide={sizeGuide.guide}
      modelNote={modelNote}
      sizeLabels={sizeGuide.sizeLabels}
    />
  ) : null
  const ctaLabel = purchase.added ? 'Added to cart' : purchase.needsSize ? 'Select a size' : 'Add to cart'

  return (
    <div className={styles.panel}>
      <Link href={drop.href} className={styles.edition}>
        {drop.editionLabel} · {drop.title}
      </Link>
      <h1 className={styles.name}>{product.name}</h1>

      <div className={styles.priceRow}>
        {purchase.price && (
          <p className={styles.price}>
            <span>{purchase.price}</span> <span className={styles.tax}>incl. tax</span>
          </p>
        )}
        {!product.purchasable && <Badge kind="coming" />}
        {product.purchasable && product.soldOut && <Badge kind="sold-out" />}
      </div>

      <ColourSiblings items={siblings} />

      {product.purchasable ? (
        <>
          {purchase.colours.length > 1 && (
            <SizeSelector
              label="Colour"
              sizes={purchase.colours}
              value={purchase.selectedColour}
              onChange={purchase.selectColour}
            />
          )}
          {purchase.sizes.length > 1 ? (
            <SizeSelector
              id={anchors.sizes}
              sizes={purchase.sizes}
              value={purchase.selectedSize}
              onChange={purchase.selectSize}
              aside={guide}
            />
          ) : (
            guide && <div className={styles.guideRow}>{guide}</div>
          )}
          {modelNote && <p className={styles.modelNote}>{modelNote}</p>}

          {purchase.selectionSoldOut ? (
            <div id={anchors.notify} tabIndex={-1} className={styles.notify}>
              <p className={styles.notifyText}>
                {purchase.sizes.length > 1 && !product.soldOut ? 'This size is sold out.' : 'Sold out.'}
              </p>
              <WaitlistForm
                productSlug={product.slug}
                label="Email me when it is back"
                doneMessage="You're on the list. We'll email you when it is back."
              />
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className={styles.cta}
              onClick={purchase.addToCart}
              disabled={purchase.needsSize}
            >
              {ctaLabel}
            </Button>
          )}
        </>
      ) : (
        <div className={styles.teaser}>
          {product.releaseLabel && <p className={styles.teaserDate}>Drops {product.releaseLabel}</p>}
          <WaitlistForm productSlug={product.slug} />
        </div>
      )}

      <Accordion
        items={info.map((section) => ({
          title: section.title,
          content: (
            <ul className={styles.infoList}>
              {section.lines.map((line, i) => (
                <li key={`${section.title}-${i}`}>{line}</li>
              ))}
            </ul>
          ),
        }))}
      />
    </div>
  )
}
```

`components/ui/BuyPanel/BuyPanel.module.css`:

```css
.panel {
  display: grid;
  gap: var(--s-5);
  color: var(--c-text);
}

.edition {
  justify-self: start;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-accent-ink);
  text-decoration: none;
}

.edition:hover {
  text-decoration: underline;
}

.edition:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.name {
  margin: 0;
  font-family: var(--f-display);
  font-size: var(--fs-h2);
  font-weight: 900;
  font-variation-settings: 'wdth' 125;
  line-height: 0.95;
  text-transform: uppercase;
}

.priceRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
}

.price {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-body);
  font-variant-numeric: tabular-nums;
}

.tax {
  margin-left: var(--s-1);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.guideRow {
  display: flex;
  justify-content: flex-end;
}

.modelNote {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.cta {
  width: 100%;
}

.notify,
.teaser {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-5);
  border: 1px solid var(--c-stone);
  background: var(--c-surface);
}

.notify:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.notifyText,
.teaserDate {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.infoList {
  display: grid;
  gap: var(--s-2);
  margin: 0;
  padding-left: var(--s-5);
}
```

- [ ] **Step 6: Implementeer `StickyBuyBar`**

`components/ui/StickyBuyBar/StickyBuyBar.tsx`:

```tsx
'use client'

import Button from '@/components/ui/Button/Button'
import type { BuyPanelAnchors } from '@/components/ui/BuyPanel/BuyPanel'
import type { Purchase } from '@/hooks/usePurchase'
import styles from './StickyBuyBar.module.css'

export interface StickyBuyBarProps {
  name: string
  purchase: Purchase
  anchors: BuyPanelAnchors
}

/** Scroll the anchor into view and focus `selector` inside it, else the anchor. */
function reveal(id: string, selector: string) {
  const root = document.getElementById(id)
  if (!root) return
  root.scrollIntoView?.({ block: 'center' })
  ;(root.querySelector<HTMLElement>(selector) ?? root).focus()
}

/**
 * Mobile "Add to cart" bar. Sticky at the bottom of the product block, so it
 * stops above the footer instead of covering it; hidden from 1024px, where
 * the buy panel itself is sticky.
 */
export default function StickyBuyBar({ name, purchase, anchors }: StickyBuyBarProps) {
  let label = purchase.added ? 'Added to cart' : 'Add to cart'
  let onClick: () => void = purchase.addToCart
  if (purchase.selectionSoldOut) {
    label = 'Notify me'
    onClick = () => reveal(anchors.notify, 'input[type="email"]')
  } else if (purchase.needsSize) {
    label = 'Select a size'
    onClick = () => reveal(anchors.sizes, '[role="radio"][tabindex="0"]')
  }

  return (
    <div className={styles.bar} data-sticky-buy="">
      <div className={styles.summary}>
        <p className={styles.name}>{name}</p>
        {purchase.price && <p className={styles.price}>{purchase.price}</p>}
      </div>
      <Button variant="primary" onClick={onClick}>
        {label}
      </Button>
    </div>
  )
}
```

`components/ui/StickyBuyBar/StickyBuyBar.module.css`:

```css
.bar {
  position: sticky;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-3) var(--l-gutter) calc(var(--s-3) + env(safe-area-inset-bottom));
  border-top: 1px solid var(--c-stone);
  background: var(--c-surface);
  color: var(--c-text);
}

.summary {
  min-width: 0;
}

.name {
  margin: 0;
  overflow: hidden;
  font-size: var(--fs-small);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

@media (min-width: 1024px) {
  .bar {
    display: none;
  }
}
```

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (product-copy|BuyPanel|StickyBuyBar|WaitlistForm)`
Expected: PASS: `product-copy` 3, `BuyPanel` 8, `StickyBuyBar` 5, en de bestaande `WaitlistForm`-tests ongewijzigd groen.

- [ ] **Step 8: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

- [ ] **Step 9: Commit**

```bash
git add lib/product-copy.ts lib/product-copy.test.ts components/ui/WaitlistForm/WaitlistForm.tsx components/ui/BuyPanel components/ui/StickyBuyBar
git commit -m "feat: add BuyPanel and mobile StickyBuyBar with sold-out notify"
```

---

### Task 7: De nieuwe PDP `/shop/[slug]`

**Files:**
- Create: `lib/product-page.ts`
- Test: `lib/product-page.test.ts`
- Create: `app/shop/[slug]/ProductView.tsx`, `app/shop/[slug]/product.module.css`
- Test: `app/shop/[slug]/ProductView.test.tsx`
- Modify: `app/shop/[slug]/page.tsx:1-303` (volledig vervangen; fase 1-2 Task 7 en 18 hebben hem al aangepast)
- Modify: `app/shop/[slug]/page.test.tsx` (gemaakt in fase 1-2 Task 18; volledig vervangen, de twee metadata-tests blijven letterlijk staan)
- Delete: `app/shop/[slug]/ProductDetail.tsx`, `app/shop/[slug]/ProductDetail.test.tsx`, `app/shop/[slug]/detail.module.css`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` (regel 16-50: `params` is een Promise; regel 256-290 `dynamicParams`: niet-gegenereerde slugs renderen bij de eerste aanvraag, wat we willen voor nieuwe Printful-producten), `.../04-functions/generate-metadata.md:551-575` (`robots`; een pagina-`robots` vervangt die van de layout volledig), `.../04-functions/permanentRedirect.md:11` (308 buiten een server action) en `:50` (gooit `NEXT_REDIRECT`, dus niet in een `try`), `.../04-functions/not-found.md:10` en `:33` (gooit, type `never`), `.../03-file-conventions/02-route-segment-config/index.md:19` (`revalidate` werkt zolang Cache Components uit staat, zoals hier).

**Interfaces:**
- Consumes: alles uit Task 1 tot en met 6; `getShopProducts`, `findBySlug`, `isRetiredProductSlug`, `getCatalogProduct`, `ShopProduct` (fase 1-2 Task 7); `currentTimeMs`, `formatDropDate`, `toDropView` (fase 1-2 Task 6); `isPreviewSession` (fase 1-2 Task 6); `getProduct`, `getEuSizeMapForProduct`, `getCatalogProductId`, `getProductMaterials`, `getSizeGuide`, `SizeGuide` (`lib/printful.ts`); `variantFrontImage`, `variantBackImage`, `variantMockupImages` (`lib/printful-normalize.ts:32-59`); `getProductImageOverride` (`lib/product-images.ts:90-92`); `removeBackground` (`lib/remove-bg.ts:39`); `HIDDEN_SIZES` (`lib/product-classify.ts`); `BASE_URL`, `BRAND_KEYWORDS`, `absoluteUrl`, `breadcrumbJsonLd`, `merchantPolicyJsonLd` (`lib/seo.ts`); `FLAT_SHIPPING_RATE`, `ALLOWED_COUNTRIES` (`lib/shipping.ts`).
- Produces:
  - `lib/product-page.ts`: `export interface ProductMedia { variants: NormalizedVariant[]; currency: string; galleries: Record<string, GalleryImage[]>; euSizeMap: Record<string, string>; materials: string[]; sizeGuide: SizeGuide | null; schemaImages: string[] }` en `export async function loadProductMedia(match: ShopProduct): Promise<ProductMedia>`.
  - `app/shop/[slug]/ProductView.tsx`: `export interface ProductViewProduct extends BuyPanelProduct { provider: Provider; id: string }`, `export interface ProductViewProps { product: ProductViewProduct; drop: DropView; variants: NormalizedVariant[]; galleries: Record<string, GalleryImage[]>; siblings: ColourSibling[]; euSizeMap: Record<string, string>; sizeGuide: { category: string; guide: SizeGuide } | null; modelNote?: string; info: InfoSection[] }`; root draagt `data-pdp`.
  - Route `/shop/[slug]`: zelfde `generateStaticParams`, `generateMetadata` (teaser `noindex`), redirects en JSON-LD als na fase 1-2, nu met de nieuwe weergave.

Gedrag dat bewust anders wordt dan de oude pagina, en waarom:
- Mislukt remove.bg voor de productthumbnail, dan valt het basisbeeld terug op de originele thumbnail (was: geen beeld). Zo werken de per-kleur-beelden al, en `resolveCardImage` (`lib/card-image.ts`) doet hetzelfde.
- Valt Printful weg bij maattabel, materialen of back-mockups, dan rendert de PDP zonder die extra's (was: een 500). Vallen de varianten weg, dan toont hij "Notify me" (was: 404).
- De deal-banner (`BUNDLES` is leeg sinds fase 1-2 Task 7 en `/deals` is weg) en de Life4HSP-banner (een OG-product, valt buiten elke drop) verdwijnen; `components/DonationBanner` blijft ongebruikt staan tot fase 5.
- Een uitverkochte maat is niet meer uitgeschakeld maar doorgestreept en kiesbaar, met "Notify me" (spec sectie 5).

`ProductDetail.test.tsx` (karakterisatie uit fase 0 plus de teaser-test uit fase 1-2 Task 18) wordt verwijderd met het component dat hij test. Zijn gevallen leven voort: kleur, maat, deep link, one-size en "eerst een maat" in `hooks/usePurchase.test.tsx` (Task 5); de teaser-test letterlijk en de sold-out-test (nieuwe regel) in `components/ui/BuyPanel/BuyPanel.test.tsx` (Task 6).

- [ ] **Step 1: Schrijf de falende tests**

`lib/product-page.test.ts`:

```ts
/** @jest-environment node */
import type { ShopProduct } from './catalog'
import { getCatalogProduct } from './catalog'
import { DROPS } from './drops'
import * as printful from './printful'
import { loadProductMedia } from './product-page'
import { removeBackground } from './remove-bg'
import type { NormalizedVariant } from '@/types/catalog'
import type { PrintfulProductDetail } from '@/types/printful'

jest.mock('./catalog', () => ({ getCatalogProduct: jest.fn() }))
jest.mock('./printful', () => ({
  getProduct: jest.fn(),
  getEuSizeMapForProduct: jest.fn(),
  getCatalogProductId: jest.fn(),
  getProductMaterials: jest.fn(),
  getSizeGuide: jest.fn(),
}))
jest.mock('./printful-normalize', () => ({
  variantFrontImage: (v: { front?: string }) => v.front ?? null,
  variantBackImage: (v: { back?: string }) => v.back ?? null,
  variantMockupImages: (v: { mocks?: string[] }) => v.mocks ?? [],
}))
jest.mock('./remove-bg', () => ({ removeBackground: jest.fn() }))

const [, sport] = DROPS
const FRONT = 'https://cdn.test/front-mocha.png'
const BACK = 'https://cdn.test/back-mocha.png'
const MODEL = 'https://cdn.test/model-mocha.jpg'

function variant(id: string, size: string, imageUrl: string | null = FRONT): NormalizedVariant {
  return {
    provider: 'printful', productId: '101', id, name: `Hoodie / ${size}`, size, color: 'Mocha',
    colorCode: '#9E7551', priceCents: 6495, currency: 'EUR', inStock: true, imageUrl,
  }
}

function shopProduct(overrides: Partial<ShopProduct> = {}): ShopProduct {
  return {
    provider: 'printful', id: '101', name: 'OLYMPN Sport Oversized Hoodie Mocha',
    slug: 'olympn-sport-oversized-hoodie-mocha', thumbnailUrl: 'https://cdn.test/thumb.png',
    variants: [variant('1', 'S'), variant('2', 'M')], colors: [], currency: 'EUR',
    drop: sport, status: 'live', purchasable: true, soldOut: false, ...overrides,
  }
}

const SYNC = [
  { variant_id: 9001, size: 'S', color: 'Mocha', front: FRONT, back: BACK, mocks: [FRONT, MODEL, BACK] },
  { variant_id: 9002, size: 'M', color: 'Mocha', front: FRONT, back: BACK, mocks: [FRONT, MODEL, BACK] },
  { variant_id: 9003, size: '4XL', color: 'Mocha', front: FRONT, back: BACK, mocks: [] },
]

beforeEach(() => {
  jest.mocked(removeBackground).mockReset().mockImplementation(async (url: string) => (url.includes('fail') ? null : `${url}#cut`))
  jest.mocked(getCatalogProduct).mockReset()
  jest.mocked(printful.getProduct).mockReset().mockResolvedValue({
    sync_product: { id: 101, name: 'OLYMPN Sport Oversized Hoodie Mocha', thumbnail_url: null, variants: 3, synced: 3 },
    sync_variants: SYNC,
  } as unknown as PrintfulProductDetail)
  jest.mocked(printful.getEuSizeMapForProduct).mockReset().mockResolvedValue({})
  jest.mocked(printful.getCatalogProductId).mockReset().mockResolvedValue(77)
  jest.mocked(printful.getProductMaterials).mockReset().mockResolvedValue(['100% cotton'])
  jest.mocked(printful.getSizeGuide).mockReset().mockResolvedValue({ unit: 'cm', sizes: ['S', 'M'], rows: [] })
})

describe('loadProductMedia', () => {
  it('leads with the cut-out front and back, then the other mockups as-is', async () => {
    const media = await loadProductMedia(shopProduct())
    expect(media.galleries.Mocha.map((i) => i.src)).toEqual([`${FRONT}#cut`, `${BACK}#cut`, MODEL])
    expect(jest.mocked(removeBackground).mock.calls.map(([url]) => url)).not.toContain(MODEL)
    expect(printful.getSizeGuide).toHaveBeenCalledWith(77, ['S', 'M'])
    expect(media.materials).toEqual(['100% cotton'])
    expect(media.sizeGuide).toEqual({ unit: 'cm', sizes: ['S', 'M'], rows: [] })
    expect(media.variants).toHaveLength(2)
  })

  it('falls back to the original image when remove.bg fails', async () => {
    const failing = 'https://cdn.test/fail-front.png'
    const media = await loadProductMedia(shopProduct({ variants: [variant('1', 'S', failing)] }))
    expect(media.galleries.Mocha[0].src).toBe(failing)
  })

  it('lets local overrides win, without sending them to remove.bg', async () => {
    const media = await loadProductMedia(shopProduct({ slug: 'butter-blood-tee-men' }))
    expect(media.galleries.Mocha.slice(0, 2).map((i) => i.src)).toEqual([
      '/products/butter-blood-tee-men/front.png',
      '/products/butter-blood-tee-men/back.png',
    ])
    expect(jest.mocked(removeBackground).mock.calls.map(([url]) => url)).not.toContain('/products/butter-blood-tee-men/front.png')
  })

  it('still renders without the Printful extras when Printful fails', async () => {
    jest.mocked(printful.getProduct).mockRejectedValue(new Error('printful down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const media = await loadProductMedia(shopProduct())
    expect(media.sizeGuide).toBeNull()
    expect(media.materials).toEqual([])
    expect(media.galleries.Mocha.map((i) => i.src)).toEqual([`${FRONT}#cut`])
    errorSpy.mockRestore()
  })

  it('fetches the variants once more when the catalogue had none, and survives a failure', async () => {
    jest.mocked(getCatalogProduct).mockRejectedValue(new Error('detail down'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const media = await loadProductMedia(shopProduct({ variants: [] }))
    expect(getCatalogProduct).toHaveBeenCalledWith('printful', '101')
    expect(media.variants).toEqual([])
    expect(media.galleries).toEqual({
      '': [{ src: 'https://cdn.test/thumb.png#cut', alt: 'OLYMPN Sport Oversized Hoodie Mocha, front' }],
    })
    errorSpy.mockRestore()
  })
})
```

`app/shop/[slug]/ProductView.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { DROPS, toDropView } from '@/lib/drops'
import { useCartStore } from '@/store/cart'
import type { NormalizedVariant } from '@/types/catalog'
import ProductView, { type ProductViewProps } from './ProductView'

const [, sport] = DROPS
const NAME = 'OLYMPN Sport Oversized Hoodie Mocha'

function variant(id: string, size: string): NormalizedVariant {
  return {
    provider: 'printful', productId: 'p1', id, name: `${NAME} / ${size}`, size, color: 'Mocha',
    colorCode: '#9E7551', priceCents: 6495, currency: 'EUR', inStock: true, imageUrl: null,
  }
}

function props(overrides: Partial<ProductViewProps['product']> = {}): ProductViewProps {
  return {
    product: {
      provider: 'printful', id: 'p1', name: NAME, slug: 'olympn-sport-oversized-hoodie-mocha',
      purchasable: true, soldOut: false, ...overrides,
    },
    drop: toDropView(sport, Date.parse('2026-11-02T10:00:00Z')),
    variants: [variant('s', 'S'), variant('m', 'M')],
    galleries: {
      Mocha: [
        { src: '/drops/olympn-sport/mocha.webp', alt: `${NAME}, front` },
        { src: '/drops/olympn-sport/dune.webp', alt: `${NAME}, back` },
      ],
    },
    siblings: [],
    euSizeMap: {},
    sizeGuide: null,
    info: [{ title: 'Details', lines: ['Heavyweight cotton'] }],
  }
}

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false })
  window.history.replaceState({}, '', '/shop/olympn-sport-oversized-hoodie-mocha')
})

describe('ProductView', () => {
  it('keeps gallery, buy panel and the sticky bar in one block, the bar last', () => {
    const { container } = render(<ProductView {...props()} />)
    const root = container.querySelector('[data-pdp]') as HTMLElement
    expect(root).not.toBeNull()
    expect(within(root).getByRole('heading', { level: 1, name: NAME })).toBeInTheDocument()
    expect(within(root).getAllByRole('img', { name: new RegExp(NAME) })).toHaveLength(2)
    expect(root.lastElementChild).toHaveAttribute('data-sticky-buy')
  })

  it('lets the sticky bar and the panel share one selection', () => {
    const { container } = render(<ProductView {...props()} />)
    const bar = container.querySelector('[data-sticky-buy]') as HTMLElement
    expect(within(bar).getByRole('button', { name: 'Select a size' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'M' }))
    fireEvent.click(within(bar).getByRole('button', { name: 'Add to cart' }))
    expect(useCartStore.getState().items).toMatchObject([{ variantId: 'm', imageUrl: '/drops/olympn-sport/mocha.webp' }])
  })

  it('has no sticky bar for a teaser', () => {
    const { container } = render(
      <ProductView {...props({ purchasable: false, releaseLabel: '1 November 2026 at 12:00 CET' })} />
    )
    expect(container.querySelector('[data-sticky-buy]')).toBeNull()
  })
})
```

`app/shop/[slug]/page.test.tsx` (volledig vervangen):

```tsx
import { render } from '@testing-library/react'
import { createElement } from 'react'
import type { ShopProduct } from '@/lib/catalog'
import { DROPS, type Drop, type DropStatus } from '@/lib/drops'
import type { ProductMedia } from '@/lib/product-page'
import ProductPage, { generateMetadata } from './page'

const mockGetShopProducts = jest.fn()
const mockIsRetired = jest.fn()
const mockLoadMedia = jest.fn()

interface MockViewProps {
  product: { purchasable: boolean; releaseLabel?: string }
}

function mockView(p: MockViewProps) {
  return createElement('div', {
    'data-testid': 'product-view',
    'data-purchasable': String(p.product.purchasable),
    'data-release': p.product.releaseLabel ?? '',
  })
}

jest.mock('../../../lib/catalog', () => ({
  ...jest.requireActual('../../../lib/catalog'),
  getShopProducts: (...args: unknown[]) => mockGetShopProducts(...args),
  isRetiredProductSlug: (...args: unknown[]) => mockIsRetired(...args),
}))
jest.mock('../../../lib/preview-session', () => ({ isPreviewSession: async () => false }))
jest.mock('../../../lib/product-page', () => ({ loadProductMedia: (...args: unknown[]) => mockLoadMedia(...args) }))
jest.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  permanentRedirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`)
  },
}))
jest.mock('./ProductView', () => ({ __esModule: true, default: (p: MockViewProps) => mockView(p) }))

const [olympian, sport] = DROPS

function product(name: string, slug: string, drop: Drop, status: DropStatus, id = slug): ShopProduct {
  return {
    provider: 'printful', id, name, slug, thumbnailUrl: null, variants: [], colors: [], currency: 'EUR',
    drop, status, purchasable: status === 'live', soldOut: false,
  }
}

const MEDIA: ProductMedia = {
  variants: [
    {
      provider: 'printful', productId: 'x', id: 'v1', name: 'x / M', size: 'M', color: '', colorCode: '',
      priceCents: 6495, currency: 'EUR', inStock: true, imageUrl: null,
    },
  ],
  currency: 'EUR',
  galleries: { '': [] },
  euSizeMap: {},
  materials: [],
  sizeGuide: null,
  schemaImages: [],
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

function jsonLd(type: string): Record<string, unknown> {
  const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
    (s) => JSON.parse(s.textContent ?? '{}') as Record<string, unknown>
  )
  return blocks.find((b) => b['@type'] === type) ?? {}
}

beforeEach(() => {
  mockGetShopProducts.mockReset().mockResolvedValue([
    product('OLYMPN Sport Oversized Hoodie Mocha', 'olympn-sport-oversized-hoodie-mocha', sport, 'upcoming'),
    product('Olympian Tee Sand Unisex', 'olympian-tee-sand-unisex', olympian, 'live', '433351254'),
  ])
  mockIsRetired.mockReset().mockResolvedValue(false)
  mockLoadMedia.mockReset().mockResolvedValue(MEDIA)
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

describe('product page', () => {
  it('sends a retired product to the shop with a 308', async () => {
    mockIsRetired.mockResolvedValue(true)
    await expect(ProductPage(params('ink-butter-sport-tee-unisex'))).rejects.toThrow('NEXT_REDIRECT /shop')
  })

  it('answers an unknown slug with a 404', async () => {
    await expect(ProductPage(params('does-not-exist'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('sends an old numeric Printful id to the slug', async () => {
    await expect(ProductPage(params('433351254'))).rejects.toThrow('NEXT_REDIRECT /shop/olympian-tee-sand-unisex')
    await expect(ProductPage(params('999'))).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('renders a teaser as not for sale, without an Offer', async () => {
    render(await ProductPage(params('olympn-sport-oversized-hoodie-mocha')))
    const view = document.querySelector('[data-testid="product-view"]')
    expect(view).toHaveAttribute('data-purchasable', 'false')
    expect(view).toHaveAttribute('data-release', '1 November 2026 at 12:00 CET')
    expect(jsonLd('Product').offers).toBeUndefined()
    expect(JSON.stringify(jsonLd('BreadcrumbList'))).toContain('/collections/olympn-sport')
  })

  it('gives a live product an Offer', async () => {
    render(await ProductPage(params('olympian-tee-sand-unisex')))
    expect(document.querySelector('[data-testid="product-view"]')).toHaveAttribute('data-purchasable', 'true')
    expect(jsonLd('Product').offers).toMatchObject({ lowPrice: '64.95', availability: 'https://schema.org/InStock' })
  })
})
```

- [ ] **Step 2: Run de tests, verwacht falen**

Run: `npm test -- (product-page|slug\]/(page|ProductView))`
Expected: FAIL: "Cannot find module './product-page'" en "Cannot find module './ProductView'"; `page.test.tsx` faalt op de `lib/product-page`-mock en de ontbrekende `ProductView`.

- [ ] **Step 3: Implementeer `lib/product-page.ts`**

```ts
import { getCatalogProduct, type ShopProduct } from '@/lib/catalog'
import {
  getCatalogProductId,
  getEuSizeMapForProduct,
  getProduct as getPrintfulProduct,
  getProductMaterials,
  getSizeGuide,
  type SizeGuide,
} from '@/lib/printful'
import { variantBackImage, variantFrontImage, variantMockupImages } from '@/lib/printful-normalize'
import { HIDDEN_SIZES } from '@/lib/product-classify'
import { buildGallery, type GalleryImage } from '@/lib/product-gallery'
import { getProductImageOverride } from '@/lib/product-images'
import { removeBackground } from '@/lib/remove-bg'
import type { NormalizedProduct, NormalizedVariant } from '@/types/catalog'

/** Everything the product page shows beyond the catalogue row. */
export interface ProductMedia {
  variants: NormalizedVariant[]
  currency: string
  /** Gallery per variant colour; '' for a product without colours. */
  galleries: Record<string, GalleryImage[]>
  euSizeMap: Record<string, string>
  materials: string[]
  sizeGuide: SizeGuide | null
  /** Up to eight distinct photos for the Product JSON-LD. */
  schemaImages: string[]
}

interface PrintfulExtras {
  euSizeMap: Record<string, string>
  materials: string[]
  sizeGuide: SizeGuide | null
  /** Genuine back-angle mockups per colour, background removed. */
  backs: Record<string, string>
  /** The remaining mockups per colour, shown as-is. */
  mockups: Record<string, string[]>
}

const NO_EXTRAS: PrintfulExtras = { euSizeMap: {}, materials: [], sizeGuide: null, backs: {}, mockups: {} }

/** remove.bg cut-out (cached in Supabase storage), else the original URL. */
async function cutOut(url: string): Promise<string> {
  return (await removeBackground(url).catch(() => null)) ?? url
}

/** getShopProducts already loads variants; fetch them again only when that failed. */
async function withVariants(match: ShopProduct): Promise<NormalizedProduct> {
  if (match.variants.length > 0) return match
  try {
    return await getCatalogProduct(match.provider, match.id)
  } catch (err) {
    console.error(`[PDP] variants for ${match.slug} failed:`, err)
    return match
  }
}

/** Size guide, materials, EU sizes and extra mockups. Optional: the page renders without them. */
async function printfulExtras(productId: string): Promise<PrintfulExtras> {
  try {
    const { sync_variants: syncVariants } = await getPrintfulProduct(productId)
    const euSizeMap = await getEuSizeMapForProduct(syncVariants)
    const catalogProductId = syncVariants[0]?.variant_id
      ? await getCatalogProductId(syncVariants[0].variant_id)
      : null
    const isFootwear = Object.keys(euSizeMap).length > 0
    const offeredSizes = [...new Set(syncVariants.map((v) => v.size).filter(Boolean))].filter(
      (s) => !HIDDEN_SIZES.has(s)
    )
    const [materials, sizeGuide] = await Promise.all([
      catalogProductId ? getProductMaterials(catalogProductId) : Promise.resolve([]),
      catalogProductId && !isFootwear ? getSizeGuide(catalogProductId, offeredSizes) : Promise.resolve(null),
    ])

    const rawBacks: Record<string, string> = {}
    const mockups: Record<string, string[]> = {}
    for (const variant of syncVariants) {
      if (!variant.color) continue
      const front = variantFrontImage(variant)
      const back = variantBackImage(variant)
      // Only a genuine back mockup that differs from the front (some products
      // ship a back mockup as their only image, which is already the front).
      if (!rawBacks[variant.color] && back && back !== front) rawBacks[variant.color] = back
      // Photographed scenes (flat, on-model, detail crops): used as-is, a
      // cut-out would ruin them and spend remove.bg credits.
      if (!mockups[variant.color]) {
        const rest = variantMockupImages(variant).filter((u) => u !== front && u !== back)
        if (rest.length > 0) mockups[variant.color] = rest
      }
    }
    const backs: Record<string, string> = {}
    await Promise.all(
      Object.entries(rawBacks).map(async ([colour, url]) => {
        backs[colour] = await cutOut(url)
      })
    )
    return { euSizeMap, materials, sizeGuide, backs, mockups }
  } catch (err) {
    console.error(`[PDP] Printful details for ${productId} failed:`, err)
    return NO_EXTRAS
  }
}

/**
 * Images and Printful details for one product page. Front and back mockups
 * are cut out by remove.bg; other mockups and the local photos from
 * lib/product-images.ts are used as-is, and a local override always wins.
 */
export async function loadProductMedia(match: ShopProduct): Promise<ProductMedia> {
  const product = await withVariants(match)
  const override = getProductImageOverride(match.slug)
  const extras = override?.galleryImages ?? []
  const base = product.thumbnailUrl ? await cutOut(product.thumbnailUrl) : null

  const rawFronts: Record<string, string> = {}
  for (const v of product.variants) {
    if (v.color && !rawFronts[v.color] && v.imageUrl) rawFronts[v.color] = v.imageUrl
  }
  const fronts: Record<string, string> = {}
  await Promise.all(
    Object.entries(rawFronts).map(async ([colour, url]) => {
      fronts[colour] = await cutOut(url)
    })
  )
  Object.assign(fronts, override?.colorFrontImages ?? {})

  const pf = match.provider === 'printful' ? await printfulExtras(match.id) : NO_EXTRAS
  const backs: Record<string, string> = { ...pf.backs, ...(override?.colorBackImages ?? {}) }

  const colours = [...new Set(product.variants.map((v) => v.color).filter(Boolean))]
  const galleries: Record<string, GalleryImage[]> = {}
  for (const colour of colours.length > 0 ? colours : ['']) {
    galleries[colour] = buildGallery({
      productName: product.name,
      front: override?.frontImage ?? fronts[colour] ?? base,
      back: override?.backImage ?? backs[colour] ?? null,
      mockups: pf.mockups[colour] ?? [],
      extras,
    })
  }

  const schemaImages = [
    ...new Set(
      [product.thumbnailUrl, ...Object.values(fronts), ...Object.values(pf.mockups).flat(), ...extras].filter(
        (u): u is string => typeof u === 'string' && u.length > 0
      )
    ),
  ].slice(0, 8)

  return {
    variants: product.variants,
    currency: product.currency || 'EUR',
    galleries,
    euSizeMap: pf.euSizeMap,
    materials: pf.materials,
    sizeGuide: pf.sizeGuide,
    schemaImages,
  }
}
```

- [ ] **Step 4: Implementeer `ProductView` en de pagina-CSS**

`app/shop/[slug]/ProductView.tsx`:

```tsx
'use client'

import { useId } from 'react'
import BuyPanel, { type BuyPanelProduct } from '@/components/ui/BuyPanel/BuyPanel'
import Gallery from '@/components/ui/Gallery/Gallery'
import StickyBuyBar from '@/components/ui/StickyBuyBar/StickyBuyBar'
import { usePurchase } from '@/hooks/usePurchase'
import type { ColourSibling } from '@/lib/colour-siblings'
import type { DropView } from '@/lib/drops'
import type { SizeGuide } from '@/lib/printful'
import type { InfoSection } from '@/lib/product-copy'
import { galleryFor, type GalleryImage } from '@/lib/product-gallery'
import type { NormalizedVariant, Provider } from '@/types/catalog'
import styles from './product.module.css'

export interface ProductViewProduct extends BuyPanelProduct {
  provider: Provider
  id: string
}

export interface ProductViewProps {
  product: ProductViewProduct
  drop: DropView
  variants: NormalizedVariant[]
  galleries: Record<string, GalleryImage[]>
  siblings: ColourSibling[]
  euSizeMap: Record<string, string>
  sizeGuide: { category: string; guide: SizeGuide } | null
  modelNote?: string
  info: InfoSection[]
}

/**
 * The product page body: one buy state for the gallery, the buy panel and
 * the mobile sticky bar. The bar is the last child of this block, so its
 * sticky positioning ends where the block ends, above the footer.
 */
export default function ProductView({
  product,
  drop,
  variants,
  galleries,
  siblings,
  euSizeMap,
  sizeGuide,
  modelNote,
  info,
}: ProductViewProps) {
  const anchors = { sizes: useId(), notify: useId() }
  const purchase = usePurchase({
    provider: product.provider,
    productId: product.id,
    productName: product.name,
    variants,
    soldOut: product.soldOut,
    euSizeMap,
    imageFor: (colour) => galleryFor(galleries, colour)[0]?.src ?? null,
  })
  const images = galleryFor(galleries, purchase.selectedColour)

  return (
    <div className={styles.view} data-pdp="">
      <div className={styles.layout}>
        <div className={styles.media}>
          <Gallery key={purchase.selectedColour} images={images} label={product.name} />
        </div>
        <div className={styles.buy}>
          <BuyPanel
            product={product}
            drop={drop}
            siblings={siblings}
            purchase={purchase}
            sizeGuide={sizeGuide ? { ...sizeGuide, sizeLabels: euSizeMap } : null}
            modelNote={modelNote}
            info={info}
            anchors={anchors}
          />
        </div>
      </div>
      {product.purchasable && <StickyBuyBar name={product.name} purchase={purchase} anchors={anchors} />}
    </div>
  )
}
```

`app/shop/[slug]/product.module.css`:

```css
.page {
  min-height: 100vh;
  padding-top: var(--l-chrome);
  background: var(--c-bg);
  color: var(--c-text);
}

.view {
  max-width: var(--l-max);
  margin: 0 auto;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.media {
  min-width: 0;
}

.buy {
  padding: var(--s-6) var(--l-gutter) var(--s-8);
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: minmax(0, 7fr) minmax(360px, 5fr);
    gap: var(--s-7);
    align-items: start;
    padding: var(--s-5) var(--l-gutter) var(--s-9);
  }

  .buy {
    position: sticky;
    top: calc(var(--l-chrome) + var(--s-5));
    max-height: calc(100vh - var(--l-chrome) - var(--s-7));
    overflow-y: auto;
    padding: 0;
  }
}
```

- [ ] **Step 5: Vervang `app/shop/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { findBySlug, getShopProducts, isRetiredProductSlug, type ShopProduct } from '@/lib/catalog'
import { buildColourSiblings } from '@/lib/colour-siblings'
import { currentTimeMs, formatDropDate, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { categoryLabel, productInfoSections } from '@/lib/product-copy'
import { loadProductMedia } from '@/lib/product-page'
import { BASE_URL, BRAND_KEYWORDS, absoluteUrl, breadcrumbJsonLd, merchantPolicyJsonLd } from '@/lib/seo'
import { ALLOWED_COUNTRIES, FLAT_SHIPPING_RATE } from '@/lib/shipping'
import ProductView from './ProductView'
import styles from './product.module.css'

interface Props {
  params: Promise<{ slug: string }>
}

// Teaser to live flips on the drop clock: re-render at least every minute.
export const revalidate = 60

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
  if (!match) return { title: 'Product not found' }
  const collection = match.drop.title
  const description = `Buy the ${match.name} from the 7ENO (Zeno) ${collection} collection. Official streetwear by Abra Entertainment, with free shipping over €75 and 14-day returns.`
  return {
    title: match.name,
    // A teaser is not for sale yet: keep it out of the index until the release (spec section 4).
    ...(match.status === 'upcoming'
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    description,
    keywords: [match.name, `${match.name} 7ENO`, `${match.name} Zeno`, ...BRAND_KEYWORDS],
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title: `${match.name} · 7ENO (Zeno)`,
      description,
      type: 'website',
      url: absoluteUrl(`/shop/${slug}`),
      ...(match.thumbnailUrl ? { images: [{ url: match.thumbnailUrl, alt: match.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${match.name} · 7ENO (Zeno)`,
      description,
      ...(match.thumbnailUrl ? { images: [match.thumbnailUrl] } : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const now = currentTimeMs()
  const preview = await isPreviewSession()

  let products: ShopProduct[] = []
  try {
    products = await getShopProducts(now, { preview })
  } catch {
    products = []
  }

  // Back-compat: old numeric-id Printful URLs (/shop/433351254) redirect to the slug.
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

  const media = await loadProductMedia(match)
  const drop = toDropView(match.drop, now, { preview })
  const teaser = match.status === 'upcoming'

  // Product structured data: price, availability, return and shipping terms,
  // tied to the 7ENO/"Zeno" brand. No Offer for a teaser (spec section 4).
  const priceCents = media.variants.map((v) => v.priceCents).filter((c) => c > 0)
  const inStock = media.variants.some((v) => v.inStock !== false)
  const sizes = [...new Set(media.variants.map((v) => v.size).filter(Boolean))]
  const colorNames = [...new Set(media.variants.map((v) => v.color).filter(Boolean))]
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${absoluteUrl(`/shop/${slug}`)}#product`,
    name: match.name,
    description: `${match.name} from the 7ENO (Zeno) ${match.drop.title} collection, by Abra Entertainment.`,
    ...(media.schemaImages.length > 0 ? { image: media.schemaImages } : {}),
    url: absoluteUrl(`/shop/${slug}`),
    sku: `${match.provider}-${match.id}`,
    brand: { '@type': 'Brand', name: '7ENO', alternateName: 'Zeno' },
    ...(colorNames.length > 0 ? { color: colorNames.join(', ') } : {}),
    ...(sizes.length > 0 ? { size: sizes } : {}),
    ...(media.materials.length > 0 ? { material: media.materials.join(', ') } : {}),
    isPartOf: { '@id': `${BASE_URL}/#website` },
    ...(match.purchasable && priceCents.length > 0
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: media.currency,
            lowPrice: (Math.min(...priceCents) / 100).toFixed(2),
            highPrice: (Math.max(...priceCents) / 100).toFixed(2),
            offerCount: media.variants.length,
            url: absoluteUrl(`/shop/${slug}`),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': `${BASE_URL}/#organization` },
            ...merchantPolicyJsonLd(FLAT_SHIPPING_RATE, ALLOWED_COUNTRIES),
          },
        }
      : {}),
  }

  const breadcrumbs = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: match.drop.title, path: `/collections/${match.drop.slug}` },
    { name: match.name, path: `/shop/${slug}` },
  ])

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <ProductView
        product={{
          provider: match.provider,
          id: match.id,
          name: match.name,
          slug: match.slug,
          purchasable: match.purchasable,
          soldOut: match.soldOut,
          releaseLabel: teaser ? formatDropDate(match.drop.window.startsAt) : undefined,
        }}
        drop={drop}
        variants={media.variants}
        galleries={media.galleries}
        siblings={buildColourSiblings(products, match)}
        euSizeMap={media.euSizeMap}
        sizeGuide={
          media.sizeGuide && media.sizeGuide.sizes.length > 0
            ? { category: categoryLabel(match.name), guide: media.sizeGuide }
            : null
        }
        modelNote={match.drop.modelNote}
        info={productInfoSections({
          productName: match.name,
          materials: media.materials,
          modelNote: match.drop.modelNote,
          dropTitle: match.drop.title,
          editionLabel: drop.editionLabel,
        })}
      />
    </main>
  )
}
```

- [ ] **Step 6: Verwijder de oude PDP**

```bash
git rm "app/shop/[slug]/ProductDetail.tsx" "app/shop/[slug]/ProductDetail.test.tsx" "app/shop/[slug]/detail.module.css"
git grep -n -w -E "ProductDetail|detail\.module" -- app components lib hooks
```

Expected (`-w`, zodat `PrintfulProductDetail` niet meetelt): de grep vindt alleen nog de commentregel in `lib/product-classify.ts` ("see ProductDetail / QuickAddCard"); die gaat in Task 11.

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (product-page|slug\]/(page|ProductView)|usePurchase|BuyPanel)`
Expected: PASS: `product-page` 5, `ProductView` 3, `page` 7, plus de suites uit Task 5 en 6.

- [ ] **Step 8: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `npm run dev`, dan op 1440 en 390 breed een Olympian-PDP (bijvoorbeeld `/shop/olympian-tee-sand-unisex`): desktop galerij links met sticky thumbnails en een sticky koopkolom rechts; mobiel swipe-strook met teller, koopkolom eronder en de balk "Select a size" onderaan die vóór de footer stopt; maten met pijltjestoetsen, size guide opent en sluit met Esc, kleurswatches linken naar de andere kleuren. Klik niet op "Checkout" of verder. `curl -s http://localhost:3000/shop/ink-butter-sport-tee-unisex -o /dev/null -w '%{http_code}\n'` geeft `308`.

- [ ] **Step 9: Commit**

```bash
git add lib/product-page.ts lib/product-page.test.ts "app/shop/[slug]/ProductView.tsx" "app/shop/[slug]/ProductView.test.tsx" "app/shop/[slug]/product.module.css" "app/shop/[slug]/page.tsx" "app/shop/[slug]/page.test.tsx"
git commit -m "feat: rebuild the product page with Gallery, BuyPanel and sticky buy bar"
```

---

### Task 8: Cart-drawer op `Drawer`

**Files:**
- Modify: `components/CartDrawer/CartDrawer.tsx:1-138` (volledig vervangen)
- Modify: `components/CartDrawer/CartDrawer.module.css:1-338` (volledig vervangen)
- Create: `components/CartDrawer/CartLine.tsx`, `components/CartDrawer/CartLine.module.css`
- Test: `components/CartDrawer/CartDrawer.test.tsx`

**Interfaces:**
- Consumes: `Drawer` (fase 1-2 Task 3: `open`, `onClose`, `side`, `title`, `footer`, `closeLabel`; focus-trap, Esc, scroll-lock, gesloten `inert`); `buttonClasses` (fase 1-2 Task 2); `useCartStore` (`items`, `isCartOpen`, `closeCart`, `removeItem`, `updateQuantity`; ongewijzigd); `useCartTotals` (`bundleDiscountCents`, `discountedTotal`; ongewijzigd); `cartItemKey` (`lib/cart-key.ts`); `productSlug`; `FREE_SHIPPING_THRESHOLD`; `formatEuro` (Task 5).
- Produces:
  - `components/CartDrawer/CartLine.tsx`: `export const MAX_LINE_QUANTITY = 100`, `export function sizeFromVariantName(variantName: string): string | null`, `export interface CartLineProps { item: CartItem; onQuantity(quantity: number): void; onRemove(): void; onNavigate(): void }`, `export default function CartLine(props)`.
  - `CartDrawer` (default export, geen props): zelfde mount in `AppShell` als nu.

Logica blijft (spec sectie 5): groepering per set, `updateQuantity(key, aantal - 1)` haalt bij 0 de regel weg, totaal en gratis-verzendingsdrempel uit `discountedTotal` zoals de huidige drawer (`CartDrawer.tsx:121-127`), checkoutknop als gewone `<a href="/checkout">` die de drawer sluit. Nieuw is alleen de bovengrens van 100 per regel op de plusknop, gelijk aan wat `/api/checkout` al afdwingt (`route.ts:43`).

- [ ] **Step 1: Schrijf de falende test**

`components/CartDrawer/CartDrawer.test.tsx`:

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import CartDrawer from './CartDrawer'
import { sizeFromVariantName } from './CartLine'

const NAME = 'OLYMPN Sport Oversized Hoodie Mocha'

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    provider: 'printful', variantId: 'v1', productId: 'p1', productName: NAME,
    variantName: `${NAME} / M`, price: '45.00', currency: 'EUR', quantity: 1,
    imageUrl: '/drops/olympn-sport/mocha.webp', ...overrides,
  }
}

function openWith(items: CartItem[]) {
  useCartStore.setState({ items, isCartOpen: true })
  return render(<CartDrawer />)
}

const row = (label: string) => screen.getByText(label).parentElement as HTMLElement
const quantity = () => screen.getByRole('group', { name: `Quantity of ${NAME}` })

describe('CartDrawer', () => {
  it('is a labelled dialog with the line, the subtotal and the checkout link', () => {
    openWith([item()])
    expect(screen.getByRole('dialog', { name: 'Cart' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: NAME })).toHaveAttribute('href', '/shop/olympn-sport-oversized-hoodie-mocha')
    expect(screen.getByText('Size M')).toBeInTheDocument()
    expect(row('Subtotal')).toHaveTextContent('€45.00')
    expect(screen.getByRole('link', { name: 'Checkout' })).toHaveAttribute('href', '/checkout')
  })

  it('shows how far the order is from free shipping', () => {
    openWith([item()])
    expect(screen.getByText('Add €30.00 for free shipping.')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Progress to free shipping' })).toHaveAttribute('aria-valuenow', '60')
  })

  it('updates the line, the subtotal and the free-shipping line on plus', () => {
    openWith([item()])
    fireEvent.click(within(quantity()).getByRole('button', { name: 'Increase quantity' }))
    expect(quantity()).toHaveTextContent('2')
    expect(screen.getByText('Your order ships free.')).toBeInTheDocument()
    expect(row('Subtotal')).toHaveTextContent('€90.00')
    expect(screen.getByRole('progressbar', { name: 'Progress to free shipping' })).toHaveAttribute('aria-valuenow', '100')
  })

  it('removes the line when minus is pressed on a single piece', () => {
    openWith([item()])
    fireEvent.click(within(quantity()).getByRole('button', { name: 'Decrease quantity' }))
    expect(useCartStore.getState().items).toEqual([])
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop the drops' })).toHaveAttribute('href', '/shop')
  })

  it('stops at 100 pieces, the checkout limit', () => {
    openWith([item({ quantity: 100 })])
    const plus = within(quantity()).getByRole('button', { name: 'Increase quantity' })
    expect(plus).toBeDisabled()
    fireEvent.click(plus)
    expect(useCartStore.getState().items[0].quantity).toBe(100)
  })

  it('removes a line with its remove button', () => {
    openWith([item(), item({ variantId: 'v2', variantName: `${NAME} / L` })])
    fireEvent.click(screen.getAllByRole('button', { name: `Remove ${NAME}` })[0])
    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual(['v2'])
  })

  it('closes with the close button and with Escape', () => {
    openWith([item()])
    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }))
    expect(useCartStore.getState().isCartOpen).toBe(false)
    act(() => useCartStore.setState({ isCartOpen: true }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(useCartStore.getState().isCartOpen).toBe(false)
  })

  it('keeps set items grouped under the set title', () => {
    openWith([item({ bundleId: 'set-1', bundleTitle: 'Starter set' })])
    expect(screen.getByText('Starter set')).toBeInTheDocument()
  })
})

describe('sizeFromVariantName', () => {
  it('takes the last part after " / ", or nothing', () => {
    expect(sizeFromVariantName(`${NAME} / M`)).toBe('M')
    expect(sizeFromVariantName('Olympian Tee / Ocean / XL')).toBe('XL')
    expect(sizeFromVariantName('Olympian Backpack')).toBeNull()
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- CartDrawer`
Expected: FAIL: "Cannot find module './CartLine'".

- [ ] **Step 3: Implementeer `CartLine`**

`components/CartDrawer/CartLine.tsx`:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatEuro } from '@/lib/money'
import { productSlug } from '@/lib/slug'
import type { CartItem } from '@/types/cart'
import styles from './CartLine.module.css'

/** app/api/checkout/route.ts rejects a line above 100 pieces; the stepper stops there. */
export const MAX_LINE_QUANTITY = 100

/** "M" from "OLYMPN Sport Oversized Hoodie Mocha / M"; null when the name carries no size. */
export function sizeFromVariantName(variantName: string): string | null {
  const parts = variantName.split(' / ')
  if (parts.length < 2) return null
  return parts[parts.length - 1].trim() || null
}

export interface CartLineProps {
  item: CartItem
  onQuantity(quantity: number): void
  onRemove(): void
  /** A product link was followed: close the drawer. */
  onNavigate(): void
}

export default function CartLine({ item, onQuantity, onRemove, onNavigate }: CartLineProps) {
  // The slug comes from the product name, the same way the catalogue builds it.
  const href = `/shop/${productSlug(item.productName)}`
  const size = sizeFromVariantName(item.variantName)
  const lineTotal = (parseFloat(item.price) || 0) * item.quantity

  return (
    <li className={styles.line}>
      <Link href={href} className={styles.thumb} onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="72px" className={styles.thumbImage} />}
      </Link>
      <div className={styles.info}>
        <Link href={href} className={styles.name} onClick={onNavigate}>
          {item.productName}
        </Link>
        {size && <p className={styles.meta}>Size {size}</p>}
        <div className={styles.controls}>
          <div className={styles.stepper} role="group" aria-label={`Quantity of ${item.productName}`}>
            <button
              type="button"
              className={styles.step}
              aria-label="Decrease quantity"
              onClick={() => onQuantity(item.quantity - 1)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <span className={styles.qty} aria-live="polite">{item.quantity}</span>
            <button
              type="button"
              className={styles.step}
              aria-label="Increase quantity"
              disabled={item.quantity >= MAX_LINE_QUANTITY}
              onClick={() => onQuantity(item.quantity + 1)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1 6h10M6 1v10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
          <button type="button" className={styles.remove} aria-label={`Remove ${item.productName}`} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
      <p className={styles.price}>{formatEuro(lineTotal)}</p>
    </li>
  )
}
```

`components/CartDrawer/CartLine.module.css`:

```css
.line {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: start;
  padding: var(--s-4) 0;
  border-bottom: 1px solid var(--c-stone);
}

.thumb {
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  background: var(--c-bg);
}

.thumbImage {
  object-fit: contain;
}

.info {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}

.name {
  color: var(--c-text);
  font-size: var(--fs-small);
  font-weight: 600;
  text-decoration: none;
}

.name:hover {
  text-decoration: underline;
}

.name:focus-visible,
.step:focus-visible,
.remove:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.meta {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  margin-top: var(--s-2);
}

.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
}

.step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--c-text);
  cursor: pointer;
}

.step:disabled {
  color: var(--c-text-muted);
  cursor: not-allowed;
}

.qty {
  min-width: 2ch;
  text-align: center;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.remove {
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-text-muted);
  font-size: var(--fs-small);
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.price {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 4: Vervang `CartDrawer`**

`components/CartDrawer/CartDrawer.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button/Button'
import Drawer from '@/components/ui/Drawer/Drawer'
import { useCartTotals } from '@/hooks/useCartTotals'
import { cartItemKey } from '@/lib/cart-key'
import { formatEuro } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import CartLine from './CartLine'
import styles from './CartDrawer.module.css'

function FreeShippingProgress({ total }: { total: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)
  const percent = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100))
  return (
    <div className={styles.progress}>
      <p className={styles.progressText} aria-live="polite">
        {remaining === 0 ? 'Your order ships free.' : `Add ${formatEuro(remaining)} for free shipping.`}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Progress to free shipping"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span className={styles.fill} style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
    </div>
  )
}

/** The cart: a right-hand Drawer (focus trap, Esc) over the store; logic unchanged. */
export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)

  // Display only: the checkout API recomputes the bundle discount and totals.
  const { bundleDiscountCents, discountedTotal } = useCartTotals()

  // Set items grouped together; standalone items after the sets.
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

  const renderLine = (item: CartItem) => {
    const key = cartItemKey(item.provider, item.variantId, item.bundleId, item.productId)
    return (
      <CartLine
        key={key}
        item={item}
        onQuantity={(quantity) => updateQuantity(key, quantity)}
        onRemove={() => removeItem(key)}
        onNavigate={closeCart}
      />
    )
  }

  const footer =
    items.length > 0 ? (
      <div className={styles.footer}>
        <FreeShippingProgress total={discountedTotal} />
        {bundleDiscountCents > 0 && (
          <p className={styles.row}>
            <span>Combi-deal discount</span>
            <span className={styles.amount}>-{formatEuro(bundleDiscountCents / 100)}</span>
          </p>
        )}
        <p className={styles.row}>
          <span>Subtotal</span>
          <span className={styles.amount}>{formatEuro(discountedTotal)}</span>
        </p>
        <p className={styles.note}>Taxes included. Shipping is calculated at checkout.</p>
        <a href="/checkout" className={`${buttonClasses('primary', 'lg')} ${styles.checkout}`} onClick={closeCart}>
          Checkout
        </a>
      </div>
    ) : undefined

  return (
    <Drawer open={isOpen} onClose={closeCart} side="right" title="Cart" closeLabel="Close cart" footer={footer}>
      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Your cart is empty.</p>
          <Link href="/shop" className={buttonClasses('ghost')} onClick={closeCart}>
            Shop the drops
          </Link>
        </div>
      ) : (
        <ul className={styles.lines}>
          {[...bundleGroups.entries()].map(([bundleId, group]) => (
            <li key={`group-${bundleId}`} className={styles.group}>
              <span className={styles.groupTitle}>{group[0].bundleTitle ?? 'Set'}</span>
              <ul className={styles.lines}>{group.map(renderLine)}</ul>
            </li>
          ))}
          {standalone.map(renderLine)}
        </ul>
      )}
    </Drawer>
  )
}
```

`components/CartDrawer/CartDrawer.module.css` (volledig vervangen):

```css
.lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.group {
  padding-top: var(--s-4);
}

.groupTitle {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.empty {
  display: grid;
  justify-items: start;
  gap: var(--s-4);
  padding-top: var(--s-6);
}

.emptyText {
  margin: 0;
  font-size: var(--fs-body);
}

.footer {
  display: grid;
  gap: var(--s-3);
}

.progress {
  display: grid;
  gap: var(--s-2);
}

.progressText {
  margin: 0;
  font-size: var(--fs-small);
}

.track {
  height: 4px;
  overflow: hidden;
  background: var(--c-stone);
}

.fill {
  display: block;
  height: 100%;
  background: var(--c-text);
  transform-origin: left center;
  transition: transform var(--m-base) var(--m-ease);
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0;
  font-size: var(--fs-small);
}

.amount {
  font-family: var(--f-mono);
  font-variant-numeric: tabular-nums;
}

.note {
  margin: 0;
  font-size: var(--fs-label);
  color: var(--c-text-muted);
}

.checkout {
  width: 100%;
  text-align: center;
  text-decoration: none;
}
```

- [ ] **Step 5: Run de test, verwacht slagen**

Run: `npm test -- (CartDrawer|AppShell|store/cart|useCartTotals)`
Expected: PASS: `CartDrawer` 9; `AppShell`, `store/cart` en `useCartTotals` ongewijzigd groen.

- [ ] **Step 6: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `npm run dev`: product toevoegen op een PDP, cart openen via de header; drawer schuift rechts in, Tab blijft binnen, Esc sluit en de focus gaat terug naar de cartknop; plus, min en verwijderen werken, de voortgangsbalk loopt naar "Your order ships free.". Klik niet op "Checkout".

- [ ] **Step 7: Commit**

```bash
git add components/CartDrawer
git commit -m "feat: rebuild the cart drawer on the v2 Drawer with free-shipping progress"
```

---

### Task 9: Checkout-shell

**Files:**
- Modify: `components/CheckoutHeader/CheckoutHeader.tsx:1-15`, `components/CheckoutHeader/CheckoutHeader.module.css:1-8` (volledig vervangen)
- Test: `components/CheckoutHeader/CheckoutHeader.test.tsx`
- Create: `app/checkout/OrderSummary.tsx`
- Modify: `app/checkout/page.tsx:1-368`, `app/checkout/checkout.module.css:1-499` (volledig vervangen)
- Test: `app/checkout/page.test.tsx`

**Interfaces:**
- Consumes: `useCheckout`, `AddressForm` (`hooks/useCheckout.ts`, ongewijzigd); `useCartTotals` (ongewijzigd); `useCartStore` (`items`, `openCart`); `createClient` (`lib/supabase/client.ts`); `ALLOWED_COUNTRIES`, `COUNTRY_NAMES`, `FREE_SHIPPING_THRESHOLD`, `FLAT_SHIPPING_RATE` (`lib/shipping.ts`); `Button` (fase 1-2 Task 2); `LogoWordmark` (`components/Logo/Logo.tsx`, tot fase 4); `formatEuro` (Task 5); `cartItemKey`.
- Produces:
  - `CheckoutHeader` (geen props): logo en een link "Back to cart" naar `/shop` die via `openCart()` de drawer opent; `AppShell` monteert hem op `/checkout` zoals nu (fase 1-2 Task 5).
  - `app/checkout/OrderSummary.tsx`: `export interface OrderSummaryProps { items: CartItem[]; subtotal: number; discount: number; appliedCode: string | null; shippingCost: number; freeShipping: boolean; shippingNote: string; grandTotal: number }`.
  - `/checkout`: desktop formulier links, samenvatting rechts sticky (`<aside aria-label="Order summary">`); mobiel de samenvatting bovenaan, ingeklapt achter een knop "Show order summary" met `aria-expanded`. Request en response naar `/api/promo/validate` en `/api/checkout` identiek.

"Back to cart" gaat naar `/shop` en zet `isCartOpen` in de store; Zustand overleeft de client-navigatie, dus `AppShell` toont op `/shop` meteen de open drawer. Een `router.back()` is onvoorspelbaar (iemand kan direct op `/checkout` landen).

De test van de pagina is een karakterisatie: hij legt eerst het gedrag van de huidige pagina vast (Step 1 tot en met 2, slaagt op de oude markup) en moet na de ombouw ongewijzigd slagen. Daarna komen pas de tests voor de nieuwe shell.

- [ ] **Step 1: Schrijf de karakterisatietest**

`app/checkout/page.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import CheckoutPage from './page'

let mockUser: { id: string } | null = null

jest.mock('../../lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
  }),
}))

const ITEM: CartItem = {
  provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Ocean Unisex',
  variantName: 'Olympian Tee Ocean Unisex / M', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null,
}

const fetchMock = jest.fn()
const reply = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body })
const row = (label: string) => screen.getByText(label).parentElement as HTMLElement

function fillAddress() {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sam Test' } })
  fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Teststraat 1' } })
  fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '3011 AA' } })
  fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Rotterdam' } })
}

beforeEach(() => {
  mockUser = null
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
  useCartStore.setState({ items: [ITEM], isCartOpen: false })
})

describe('checkout page (characterisation)', () => {
  it('shows an empty cart with a way back to the shop', () => {
    useCartStore.setState({ items: [] })
    render(<CheckoutPage />)
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Shop' })).toHaveAttribute('href', '/shop')
  })

  it('asks for the shipping address with the Netherlands preselected', () => {
    render(<CheckoutPage />)
    for (const label of ['Full name', 'Address', 'Address line 2 (optional)', 'Postal code', 'City']) {
      expect(screen.getByLabelText(label)).toHaveValue('')
    }
    const country = screen.getByLabelText('Country')
    expect(country).toHaveValue('NL')
    expect(Array.from((country as HTMLSelectElement).options).map((o) => o.value)).toEqual(['NL', 'BE', 'DE', 'FR', 'GB'])
  })

  it('only enables payment with a full address and the terms accepted', () => {
    render(<CheckoutPage />)
    const pay = screen.getByRole('button', { name: 'Pay with Stripe' })
    expect(pay).toBeDisabled()
    expect(screen.getByText('Fill in your shipping address to continue.')).toBeInTheDocument()
    fillAddress()
    expect(pay).toBeDisabled()
    expect(screen.getByText('Please accept the Terms & Conditions and Returns Policy to continue.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(pay).toBeEnabled()
  })

  it('shows subtotal, flat shipping and total', () => {
    render(<CheckoutPage />)
    expect(row('Subtotal')).toHaveTextContent('€45.00')
    expect(row('Shipping')).toHaveTextContent('€4.95')
    expect(row('Total')).toHaveTextContent('€49.95')
    expect(screen.getByText('Flat €4.95 shipping. Add €30.00 more for free shipping.')).toBeInTheDocument()
  })

  it('applies a discount code through the promo endpoint and can remove it', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { valid: true, code: 'WELCOME10', percentOff: 10, freeShipping: false }))
    render(<CheckoutPage />)
    fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'welcome10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText('Code WELCOME10 applied: 10% off.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/promo/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'welcome10' }),
    })
    expect(row('Discount (WELCOME10)')).toHaveTextContent('-€4.50')
    expect(row('Total')).toHaveTextContent('€45.45')
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText('Discount (WELCOME10)')).toBeNull()
  })

  it('offers a log-in link when a code needs an account', async () => {
    mockUser = { id: 'u1' }
    fetchMock.mockResolvedValueOnce(reply(401, { valid: false, error: 'Log in to use a discount code.' }))
    render(<CheckoutPage />)
    fireEvent.change(screen.getByLabelText('Discount code'), { target: { value: 'MEMBERS' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText(/Log in to use a discount code\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/account/login?redirect=/checkout')
  })

  it('posts the cart and the address to the checkout API and shows its error', async () => {
    fetchMock.mockResolvedValueOnce(reply(409, { error: 'One or more products are not available' }))
    render(<CheckoutPage />)
    fillAddress()
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'BE' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Pay with Stripe' }))
    expect(await screen.findByText('One or more products are not available')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/checkout')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      items: [ITEM],
      address: { name: 'Sam Test', line1: 'Teststraat 1', line2: '', city: 'Rotterdam', postalCode: '3011 AA', country: 'BE' },
    })
  })

  it('nudges a guest to log in or register', async () => {
    render(<CheckoutPage />)
    expect(await screen.findByText(/Checking out as a guest/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run de karakterisatie op de huidige pagina, verwacht slagen**

Run: `npm test -- app/checkout/page`
Expected: PASS, 8 tests, op de **oude** markup. Faalt er een, dan klopt de test niet met het huidige gedrag: pas de test aan (niet de pagina) tot hij groen is, en noteer in het commitbericht wat je vastlegde.

- [ ] **Step 3: Voeg de tests voor de nieuwe shell toe, verwacht falen**

Voeg onderaan `app/checkout/page.test.tsx` toe:

```tsx
describe('checkout shell', () => {
  it('has the form and a labelled order summary', () => {
    render(<CheckoutPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Checkout' })).toBeInTheDocument()
    const summary = screen.getByRole('complementary', { name: 'Order summary' })
    expect(summary).toHaveTextContent('Olympian Tee Ocean Unisex')
  })

  it('folds the summary away on mobile behind a toggle with the total', () => {
    render(<CheckoutPage />)
    const toggle = screen.getByRole('button', { name: /Show order summary/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveTextContent('€49.95')
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: /Hide order summary/ })).toHaveAttribute('aria-expanded', 'true')
  })
})
```

`components/CheckoutHeader/CheckoutHeader.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { createElement, type MouseEvent, type ReactNode } from 'react'
import { useCartStore } from '@/store/cart'
import CheckoutHeader from './CheckoutHeader'

interface MockLinkProps {
  href: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  className?: string
}

function mockLink({ href, children, onClick, className }: MockLinkProps) {
  return createElement(
    'a',
    {
      href,
      className,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event)
        event.preventDefault()
      },
    },
    children
  )
}

jest.mock('next/link', () => ({ __esModule: true, default: (p: MockLinkProps) => mockLink(p) }))

describe('CheckoutHeader', () => {
  it('takes the shopper back to the shop with the cart open', () => {
    useCartStore.setState({ items: [], isCartOpen: false })
    render(<CheckoutHeader />)
    const back = screen.getByRole('link', { name: 'Back to cart' })
    expect(back).toHaveAttribute('href', '/shop')
    fireEvent.click(back)
    expect(useCartStore.getState().isCartOpen).toBe(true)
  })

  it('shows the 7ENO wordmark', () => {
    render(<CheckoutHeader />)
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('img', { name: /7ENO/i }))
  })
})
```

Run: `npm test -- (app/checkout/page|CheckoutHeader)`
Expected: FAIL: de shell-tests vinden geen `complementary` en geen toggle; `CheckoutHeader` heeft geen "Back to cart". De 8 karakterisatietests blijven groen. (`LogoWordmark` rendert `alt="7ENO"`, `components/Logo/Logo.tsx:49`; daarop rust de tweede headertest.)

- [ ] **Step 4: Vervang `CheckoutHeader`**

`components/CheckoutHeader/CheckoutHeader.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { LogoWordmark } from '@/components/Logo/Logo'
import { useCartStore } from '@/store/cart'
import styles from './CheckoutHeader.module.css'

/**
 * Header of the sealed checkout: the wordmark (not a link, so the shopper
 * stays in the flow) and one way out, back to the cart. The link goes to the
 * shop and opens the drawer through the store, which survives the client-side
 * navigation.
 */
export default function CheckoutHeader() {
  const openCart = useCartStore((s) => s.openCart)
  return (
    <header className={styles.header}>
      <Link href="/shop" className={styles.back} onClick={openCart}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>Back to cart</span>
      </Link>
      <div className={styles.logo}>
        <LogoWordmark variant="ink" height={28} align="center" priority />
      </div>
      <p className={styles.secure}>Secure checkout</p>
    </header>
  )
}
```

`components/CheckoutHeader/CheckoutHeader.module.css`:

```css
.header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: var(--l-nav);
  padding: 0 var(--l-gutter);
  border-bottom: 1px solid var(--c-stone);
  background: var(--c-bg);
  color: var(--c-text);
}

.back {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: 44px;
  color: inherit;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
}

.back:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.logo {
  justify-self: center;
}

.secure {
  display: none;
  justify-self: end;
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

@media (min-width: 480px) {
  .secure {
    display: block;
  }
}
```

- [ ] **Step 5: Maak `OrderSummary`**

`app/checkout/OrderSummary.tsx`:

```tsx
import Image from 'next/image'
import { cartItemKey } from '@/lib/cart-key'
import { formatEuro } from '@/lib/money'
import type { CartItem } from '@/types/cart'
import styles from './checkout.module.css'

export interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  discount: number
  appliedCode: string | null
  shippingCost: number
  freeShipping: boolean
  shippingNote: string
  grandTotal: number
}

/** Lines and totals; display only, /api/checkout recomputes everything. */
export default function OrderSummary({
  items,
  subtotal,
  discount,
  appliedCode,
  shippingCost,
  freeShipping,
  shippingNote,
  grandTotal,
}: OrderSummaryProps) {
  return (
    <>
      <ul className={styles.lines}>
        {items.map((item) => (
          <li key={cartItemKey(item.provider, item.variantId, item.bundleId, item.productId)} className={styles.line}>
            <div className={styles.lineThumb}>
              {item.imageUrl && (
                <Image src={item.imageUrl} alt={item.productName} fill sizes="64px" className={styles.lineImage} />
              )}
            </div>
            <div className={styles.lineInfo}>
              <p className={styles.lineName}>{item.productName}</p>
              <p className={styles.lineVariant}>
                {item.variantName} &middot; qty {item.quantity}
              </p>
            </div>
            <p className={styles.linePrice}>{formatEuro((parseFloat(item.price) || 0) * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className={styles.totals}>
        <div className={styles.row}>
          <dt>Subtotal</dt>
          <dd>{formatEuro(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className={styles.row}>
            <dt>Discount ({appliedCode})</dt>
            <dd>-{formatEuro(discount)}</dd>
          </div>
        )}
        <div className={styles.row}>
          <dt>Shipping</dt>
          <dd>{freeShipping ? 'Free' : formatEuro(shippingCost)}</dd>
        </div>
        <div className={`${styles.row} ${styles.totalRow}`}>
          <dt>Total</dt>
          <dd>{formatEuro(grandTotal)}</dd>
        </div>
      </dl>
      <p className={styles.note}>{shippingNote}</p>
    </>
  )
}
```

- [ ] **Step 6: Vervang `app/checkout/page.tsx`**

```tsx
'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button/Button'
import { useCartTotals } from '@/hooks/useCartTotals'
import { useCheckout, type AddressForm } from '@/hooks/useCheckout'
import { formatEuro } from '@/lib/money'
import { ALLOWED_COUNTRIES, COUNTRY_NAMES, FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import OrderSummary from './OrderSummary'
import styles from './checkout.module.css'

const ADDRESS_FIELDS: { key: keyof AddressForm; label: string; autoComplete: string; half?: boolean }[] = [
  { key: 'name', label: 'Full name', autoComplete: 'name' },
  { key: 'line1', label: 'Address', autoComplete: 'address-line1' },
  { key: 'line2', label: 'Address line 2 (optional)', autoComplete: 'address-line2' },
  { key: 'postalCode', label: 'Postal code', autoComplete: 'postal-code', half: true },
  { key: 'city', label: 'City', autoComplete: 'address-level2', half: true },
]

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
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
  const summaryId = useId()
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Detect auth so only guests are nudged to create an account. null = not
  // resolved yet, so a logged-in customer never sees the notice flash.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const appliedCode = promo?.code ?? null
  const promoFreeShipping = promo?.freeShipping ?? false
  const hasBundle = items.some((item) => Boolean(item.bundleId))

  // Flat fee, free above the threshold, or waived by a code. The server
  // recomputes all of this; the page only displays it.
  const { subtotal, shippingCost, freeShipping, remainingForFree, promoDiscount: discount, grandTotal } =
    useCartTotals(promo)

  const shippingNote = promoFreeShipping
    ? `✓ Free shipping included with code ${appliedCode}.`
    : freeShipping
      ? `✓ You qualify for free shipping (orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)}).`
      : `Flat €${FLAT_SHIPPING_RATE.toFixed(2)} shipping. Add €${remainingForFree.toFixed(2)} more for free shipping.`

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p className={styles.empty}>Your cart is empty.</p>
          <Link href="/shop" className={styles.textLink}>Back to Shop</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.summary} aria-label="Order summary">
          <button
            type="button"
            className={styles.summaryToggle}
            aria-expanded={summaryOpen}
            aria-controls={summaryId}
            onClick={() => setSummaryOpen((open) => !open)}
          >
            <span>{summaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
            <span className={styles.summaryToggleTotal}>{formatEuro(grandTotal)}</span>
          </button>
          <div id={summaryId} className={styles.summaryBody} data-open={summaryOpen ? 'true' : 'false'}>
            <h2 className={styles.summaryTitle}>Order summary</h2>
            <OrderSummary
              items={items}
              subtotal={subtotal}
              discount={discount}
              appliedCode={appliedCode}
              shippingCost={shippingCost}
              freeShipping={freeShipping}
              shippingNote={shippingNote}
              grandTotal={grandTotal}
            />
          </div>
        </aside>

        <div className={styles.form}>
          <div>
            <h1 className={styles.title}>Checkout</h1>
            <p className={styles.count}>
              {items.length} item{items.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className={styles.notice} role="status">
            <svg className={styles.noticeIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className={styles.noticeText}>
              <strong className={styles.noticeTitle}>Pre-sale order</strong>
              Because pre-sale is active, shipping can run up to <strong>5 working days</strong> longer than the usual
              estimate. Your order is reserved and ships the moment stock lands.
            </p>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Shipping address</h2>
            <div className={styles.fields}>
              {ADDRESS_FIELDS.map((field) => (
                <label key={field.key} className={field.half ? `${styles.field} ${styles.half}` : styles.field}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  <input
                    className={styles.input}
                    type="text"
                    autoComplete={field.autoComplete}
                    value={form[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                  />
                </label>
              ))}
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Country</span>
                <select
                  className={styles.input}
                  autoComplete="country"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                >
                  {ALLOWED_COUNTRIES.map((code) => (
                    <option key={code} value={code}>
                      {COUNTRY_NAMES[code]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Discount code</h2>
            {hasBundle ? (
              <p className={styles.hint}>Discount codes can&apos;t be combined with bundle deals.</p>
            ) : appliedCode ? (
              <div className={styles.promoApplied}>
                <span>
                  Code <strong>{appliedCode}</strong> · {promo?.percentOff ?? 0}% off
                  {promoFreeShipping ? ' · free shipping' : ''}
                </span>
                <button type="button" className={styles.textButton} onClick={removePromo}>
                  Remove
                </button>
              </div>
            ) : (
              <div className={styles.promoRow}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Discount code"
                  value={promoInput}
                  onChange={(e) => changePromoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyPromo()
                    }
                  }}
                  aria-label="Discount code"
                />
                <Button
                  variant="ghost"
                  onClick={applyPromo}
                  disabled={promoLoading || promoInput.trim() === ''}
                >
                  {promoLoading ? '…' : 'Apply'}
                </Button>
              </div>
            )}
            {promoMsg && (
              <p className={styles.message} data-type={promoMsg.type} aria-live="polite">
                {promoMsg.text}
                {promoNeedsLogin && (
                  <>
                    {' '}
                    <Link href="/account/login?redirect=/checkout" className={styles.textLink}>
                      Log in
                    </Link>
                  </>
                )}
              </p>
            )}
          </section>

          {loggedIn === false && (
            <p className={styles.guest}>
              Checking out as a guest.{' '}
              <Link href="/account/login?redirect=/checkout" className={styles.textLink}>
                Log in
              </Link>{' '}
              or{' '}
              <Link href="/account/register" className={styles.textLink}>
                create an account
              </Link>{' '}
              to track your order and check out faster next time. You can still pay as a guest below.
            </p>
          )}

          {payError && (
            <p className={styles.error} aria-live="polite">
              {payError}
            </p>
          )}

          <label className={styles.agree}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agreed}
              onChange={(e) => changeAgreed(e.target.checked)}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link href="/returns" target="_blank" rel="noopener noreferrer" className={styles.textLink}>
                Returns Policy
              </Link>
              .
            </span>
          </label>

          <Button variant="primary" size="lg" className={styles.pay} onClick={pay} disabled={!canPay} loading={payLoading}>
            {payLoading ? 'Redirecting...' : 'Pay with Stripe'}
          </Button>
          {!addressComplete && <p className={styles.hint}>Fill in your shipping address to continue.</p>}
          {addressComplete && !agreed && (
            <p className={styles.hint}>Please accept the Terms &amp; Conditions and Returns Policy to continue.</p>
          )}
        </div>
      </div>
    </main>
  )
}
```

`app/checkout/checkout.module.css` (volledig vervangen):

```css
.page {
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--f-body);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  max-width: 1200px;
  margin: 0 auto;
}

.emptyState {
  display: grid;
  justify-items: start;
  gap: var(--s-4);
  max-width: var(--l-text-max);
  margin: 0 auto;
  padding: var(--s-9) var(--l-gutter);
}

.empty {
  margin: 0;
  font-size: var(--fs-body);
}

/* Order summary: on top and folded on mobile, sticky on the right from 1024px. */
.summary {
  border-bottom: 1px solid var(--c-stone);
  background: var(--c-surface);
}

.summaryToggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 56px;
  padding: 0 var(--l-gutter);
  border: 0;
  background: transparent;
  color: inherit;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.summaryToggle:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: -2px;
}

.summaryToggleTotal {
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.summaryBody {
  padding: 0 var(--l-gutter) var(--s-5);
}

.summaryBody[data-open='false'] {
  display: none;
}

.summaryTitle {
  margin: 0 0 var(--s-3);
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.lines {
  margin: 0;
  padding: 0;
  list-style: none;
}

.line {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--c-stone);
}

.lineThumb {
  position: relative;
  aspect-ratio: 4 / 5;
  background: var(--c-bg);
}

.lineImage {
  object-fit: contain;
}

.lineInfo {
  min-width: 0;
}

.lineName,
.lineVariant,
.linePrice {
  margin: 0;
  font-size: var(--fs-small);
}

.lineName {
  font-weight: 600;
}

.lineVariant {
  color: var(--c-text-muted);
}

.linePrice {
  font-family: var(--f-mono);
  font-variant-numeric: tabular-nums;
}

.totals {
  display: grid;
  gap: var(--s-2);
  margin: var(--s-4) 0 0;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: var(--fs-small);
}

.row dt,
.row dd {
  margin: 0;
}

.row dd {
  font-family: var(--f-mono);
  font-variant-numeric: tabular-nums;
}

.totalRow {
  padding-top: var(--s-3);
  border-top: 1px solid var(--c-stone);
  font-size: var(--fs-body);
  font-weight: 600;
}

.note {
  margin: var(--s-3) 0 0;
  font-size: var(--fs-label);
  color: var(--c-text-muted);
}

/* Form column. */
.form {
  display: grid;
  gap: var(--s-6);
  padding: var(--s-6) var(--l-gutter) var(--s-9);
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

.count {
  margin: var(--s-2) 0 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.notice {
  display: flex;
  gap: var(--s-3);
  padding: var(--s-4);
  border: 1px solid var(--c-stone);
  background: var(--c-surface);
}

.noticeIcon {
  flex: none;
}

.noticeText {
  margin: 0;
  font-size: var(--fs-small);
  line-height: 1.5;
}

.noticeTitle {
  display: block;
  margin-bottom: var(--s-1);
}

.section {
  display: grid;
  gap: var(--s-3);
}

.sectionTitle {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-3);
}

.field {
  display: grid;
  grid-column: 1 / -1;
  gap: var(--s-1);
}

.half {
  grid-column: auto;
}

.fieldLabel {
  font-size: var(--fs-small);
  font-weight: 500;
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 0 var(--s-3);
  border: 1px solid var(--c-border-strong);
  border-radius: var(--r-1);
  background: var(--c-surface);
  color: var(--c-text);
  font-family: var(--f-body);
  font-size: var(--fs-body);
}

.input:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.promoRow {
  display: flex;
  gap: var(--s-2);
}

.promoApplied {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: var(--s-3);
  background: var(--c-sage);
  font-size: var(--fs-small);
}

.message {
  margin: 0;
  font-size: var(--fs-small);
}

.message[data-type='error'] {
  color: var(--c-error);
}

.message[data-type='success'] {
  color: var(--c-success);
}

.guest,
.hint {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--c-text-muted);
}

.error {
  margin: 0;
  padding: var(--s-3);
  border-left: 2px solid var(--c-error);
  color: var(--c-error);
  font-size: var(--fs-small);
}

.agree {
  display: flex;
  gap: var(--s-3);
  align-items: flex-start;
  font-size: var(--fs-small);
}

.checkbox {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--c-text);
}

.checkbox:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.textLink,
.textButton {
  padding: 0;
  border: 0;
  background: none;
  color: var(--c-accent-ink);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.textLink:focus-visible,
.textButton:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}

.pay {
  width: 100%;
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: minmax(0, 7fr) minmax(320px, 5fr);
    gap: var(--s-8);
    align-items: start;
    padding: var(--s-7) var(--l-gutter) var(--s-9);
  }

  .form {
    grid-column: 1;
    grid-row: 1;
    padding: 0;
  }

  .summary {
    grid-column: 2;
    grid-row: 1;
    position: sticky;
    top: var(--s-5);
    border: 1px solid var(--c-stone);
  }

  .summaryToggle {
    display: none;
  }

  .summaryBody,
  .summaryBody[data-open='false'] {
    display: block;
    padding: var(--s-5);
  }
}
```

- [ ] **Step 7: Run de tests, verwacht slagen**

Run: `npm test -- (app/checkout/page|CheckoutHeader|useCheckout|api/checkout|AppShell)`
Expected: PASS: karakterisatie 8 en shell 2 in `page.test.tsx`, `CheckoutHeader` 2; `useCheckout`, `app/api/checkout/route` en `AppShell` ongewijzigd groen.

- [ ] **Step 8: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `npm run dev`: met iets in de cart `/checkout` openen en **alleen kijken**: header met "Back to cart" en logo; desktop formulier links en sticky samenvatting rechts; op 390 breed de samenvatting ingeklapt bovenaan met het totaal, uitklapbaar. "Back to cart" brengt je op `/shop` met de drawer open. Vul geen adres in en klik **niet** op "Pay with Stripe" (`.env.local` heeft een live sleutel).

- [ ] **Step 9: Commit**

```bash
git add components/CheckoutHeader app/checkout/page.tsx app/checkout/OrderSummary.tsx app/checkout/checkout.module.css app/checkout/page.test.tsx
git commit -m "feat: rebuild the checkout shell with sticky summary and back-to-cart header"
```

---

### Task 10: Success-pagina

**Files:**
- Modify: `app/success/page.tsx:1-47`, `app/success/success.module.css:1-74` (volledig vervangen)
- Test: `app/success/page.test.tsx`

**Docs:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md:82-86` (`useSearchParams` in een `<Suspense>`-grens, anders rendert de hele boom client-side).

**Interfaces:**
- Consumes: `useCartStore` (`clearCart`); `buttonClasses` (fase 1-2 Task 2).
- Produces: `/success` in het v2-ontwerp; leegt de cart bij openen (ongewijzigd) en toont de laatste 12 tekens van `session_id` als orderreferentie. `app/success/layout.tsx` (noindex) blijft.

- [ ] **Step 1: Schrijf de falende test**

`app/success/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import type { CartItem } from '@/types/cart'
import SuccessPage from './page'

jest.mock('next/navigation', () => ({ useSearchParams: jest.fn() }))

const ITEM: CartItem = {
  provider: 'printful', variantId: 'v1', productId: 'p1', productName: 'Olympian Tee Ocean Unisex',
  variantName: 'Olympian Tee Ocean Unisex / M', price: '45.00', currency: 'EUR', quantity: 1, imageUrl: null,
}

function at(query: string) {
  jest.mocked(useSearchParams).mockReturnValue(new URLSearchParams(query) as unknown as ReturnType<typeof useSearchParams>)
}

beforeEach(() => {
  useCartStore.setState({ items: [ITEM], isCartOpen: false })
})

describe('success page', () => {
  it('confirms the order, shows the reference and empties the cart', () => {
    at('session_id=cs_test_a1b2c3d4e5f6g7h8i9j0')
    render(<SuccessPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Thank you' })).toBeInTheDocument()
    expect(screen.getByText('Order confirmed')).toBeInTheDocument()
    expect(screen.getByText('e5f6g7h8i9j0')).toBeInTheDocument()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('leaves out the reference without a session id', () => {
    at('')
    render(<SuccessPage />)
    expect(screen.queryByText('Order ref')).toBeNull()
  })

  it('leads back to the shop and to the orders', () => {
    at('')
    render(<SuccessPage />)
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/shop')
    expect(screen.getByRole('link', { name: 'View your orders' })).toHaveAttribute('href', '/account/orders')
  })
})
```

- [ ] **Step 2: Run de test, verwacht falen**

Run: `npm test -- app/success`
Expected: FAIL: geen heading "Thank you" (de oude pagina zegt "Order Confirmed") en geen link "View your orders".

- [ ] **Step 3: Vervang de pagina en de CSS**

`app/success/page.tsx`:

```tsx
'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { buttonClasses } from '@/components/ui/Button/Button'
import { useCartStore } from '@/store/cart'
import styles from './success.module.css'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className={styles.inner}>
      <p className={styles.label}>Order confirmed</p>
      <h1 className={styles.title}>Thank you</h1>
      <p className={styles.body}>
        Your order has been placed and a confirmation email is on its way. Every piece is made to order, so it ships
        within 5 to 10 business days.
      </p>
      {sessionId && (
        <p className={styles.ref}>
          <span className={styles.refLabel}>Order ref</span> <span>{sessionId.slice(-12)}</span>
        </p>
      )}
      <div className={styles.actions}>
        <Link href="/shop" className={buttonClasses('primary', 'lg')}>
          Continue shopping
        </Link>
        <Link href="/account/orders" className={styles.textLink}>
          View your orders
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </main>
  )
}
```

`app/success/success.module.css`:

```css
.page {
  min-height: 100vh;
  padding: calc(var(--l-chrome) + var(--s-9)) var(--l-gutter) var(--s-9);
  background: var(--c-bg);
  color: var(--c-text);
}

.inner {
  display: grid;
  justify-items: start;
  gap: var(--s-5);
  max-width: var(--l-text-max);
  margin: 0 auto;
}

.label,
.refLabel {
  font-family: var(--f-mono);
  font-size: var(--fs-label);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--c-text-muted);
}

.label {
  margin: 0;
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

.body {
  margin: 0;
  font-size: var(--fs-body);
  line-height: 1.5;
}

.ref {
  margin: 0;
  font-family: var(--f-mono);
  font-size: var(--fs-small);
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-5);
}

.textLink {
  color: var(--c-accent-ink);
  font-size: var(--fs-small);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.textLink:focus-visible {
  outline: 2px solid var(--c-focus);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run de test, verwacht slagen**

Run: `npm test -- app/success`
Expected: PASS, 3 tests.

- [ ] **Step 5: Kwaliteitspoort en check**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen. `npm run dev`: `/success?session_id=cs_test_demo1234567890` toont "Thank you", de referentie en de twee links onder de v2-chrome; de cart is daarna leeg.

- [ ] **Step 6: Commit**

```bash
git add app/success/page.tsx app/success/success.module.css app/success/page.test.tsx
git commit -m "feat: restyle the order success page"
```

---

### Task 11: Quick-add-carousel weg

**Files:**
- Delete: `components/ProductCarousel/ProductCarousel.tsx`, `components/ProductCarousel/ProductCarousel.module.css`, `components/ProductCarousel/QuickAddCard.tsx`, `components/ProductCarousel/QuickAddCard.module.css`, `components/ProductCarousel/QuickAddCard.test.tsx`
- Modify: `hooks/useVariantPicker.ts:4` en `:7` (commentaar)
- Modify: `lib/product-classify.ts` (na fase 1-2 Task 14: de commentregel "Sizes the storefront hides (see ProductDetail / QuickAddCard). The Merchant")

**Interfaces:**
- Consumes: niets.
- Produces: geen quick-add meer in de codebase; `useVariantPicker` heeft alleen nog `usePurchase` als afnemer.

Besluit: verwijderen, niet ombouwen. Fase 1-2 Task 18 vervangt `app/page.tsx` volledig en haalt daarbij de quick-add-carousel van de home; daarna importeert niets meer `ProductCarousel` of `QuickAddCard` (`git grep` in Step 1 bewijst dat). Spec sectie 5 vraagt op de home "per drop een rij tegels", en die rij gebruikt `ProductTile` al. Een ongebruikte carousel ombouwen is werk zonder afnemer. Fase 1-2 zette hem in de opruimlijst van fase 5; omdat zijn enige reden van bestaan (de hook-test-dekking) nu in `usePurchase` zit, gaat hij hier al weg.

- [ ] **Step 1: Controleer dat niets hem nog gebruikt**

Run: `git grep -n -E "ProductCarousel|QuickAddCard|CarouselItem|CarouselVariant" -- app components lib hooks store types`
Expected: alleen treffers binnen `components/ProductCarousel/` zelf, plus de twee commentregels in `hooks/useVariantPicker.ts` en die in `lib/product-classify.ts`. Staat er een import in `app/` of elders in `components/`, stop dan: fase 1-2 Task 18 is niet uitgevoerd zoals gepland; meld het.

- [ ] **Step 2: Verwijder de carousel**

```bash
git rm components/ProductCarousel/ProductCarousel.tsx components/ProductCarousel/ProductCarousel.module.css components/ProductCarousel/QuickAddCard.tsx components/ProductCarousel/QuickAddCard.module.css components/ProductCarousel/QuickAddCard.test.tsx
```

- [ ] **Step 3: Werk de commentaren bij**

In `hooks/useVariantPicker.ts` vervang regel 4:

```ts
/** Sizes the shop never offers, on the product page and in quick-add alike; one list for client and server. */
```

door:

```ts
/** Sizes the shop never offers; one list for client and server. */
```

en regel 7:

```ts
/** The variant fields the picker needs; NormalizedVariant and CarouselVariant both fit. */
```

door:

```ts
/** The variant fields the picker needs; NormalizedVariant fits. */
```

In `lib/product-classify.ts` vervang:

```ts
 * Sizes the storefront hides (see ProductDetail / QuickAddCard). The Merchant
```

door:

```ts
 * Sizes the storefront hides (see hooks/useVariantPicker.ts). The Merchant
```

- [ ] **Step 4: Controleer opnieuw**

Run: `git grep -n -w -E "ProductCarousel|QuickAddCard|CarouselItem|CarouselVariant|ProductDetail" -- app components lib hooks store types`
Expected: geen uitvoer (`-w`: `PrintfulProductDetail` is een ander type en telt niet mee).

- [ ] **Step 5: Kwaliteitspoort**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen; het aantal suites is één lager (`QuickAddCard.test.tsx` is weg), `hooks/useVariantPicker.test.ts` blijft groen.

- [ ] **Step 6: Commit**

```bash
git add hooks/useVariantPicker.ts lib/product-classify.ts
git commit -m "chore: remove the unused quick-add carousel"
```

---

### Checkpoint fase 3

- [ ] **Step 1: Hele branch groen en schoon**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: alles groen.

Run: `git grep -n -P "\x{2014}|\x{2013}" -- app components hooks lib styles`
Expected: geen uitvoer (geen em- of en-dashes in wat deze fase schreef of raakte).

- [ ] **Step 2: Push en controle op de Preview**

```bash
git push origin redesign/v2
```

Controleer op de Preview-URL, op 1440 en 390 breed:

1. Olympian-PDP: galerij (desktop gestapeld met sticky thumbnails, mobiel swipen met teller), sticky koopkolom, maten met toetsenbord (Tab naar de groep, pijltjes kiezen), size guide opent en sluit met Esc en backdrop, kleurswatches naar de andere kleuren, accordeons Details, Fit, Shipping and returns. Mobiel: "Select a size"-balk onderaan, die bij de footer stopt.
2. OLYMPN Sport-PDP (zodra de templates in de store staan): zonder preview "Coming soon", de releasedatum en de waitlist, geen maten, geen balk; met `?preview=<SITE_PREVIEW_KEY>` koopbaar.
3. Een product met een uitverkochte maat (of, als die er niet is, met de Printful-voorraad van een maat tijdelijk op nul in Printful door Joep): maat doorgestreept, kiesbaar, "Notify me" met waitlist; aanmelden komt in de test-audience met `product_slug`.
4. Cart-drawer: openen, plus, min, verwijderen, voortgang naar gratis verzending, Esc en focus terug naar de cartknop.
5. Checkout: "Back to cart" opent de drawer op `/shop`; desktop sticky samenvatting; mobiel ingeklapte samenvatting; promo-code toepassen en verwijderen.

- [ ] **Step 3: Testbestelling (Joep, alleen op de Preview)**

Spec sectie 10 vraagt bij fase 3 een volledige testbestelling met iDEAL en kaart. Die doet Joep zelf, op de Preview, nooit lokaal:

1. Controleer eerst in Vercel dat `STRIPE_SECRET_KEY` voor scope Preview met `sk_test_` begint en `PRINTFUL_AUTO_CONFIRM=false` staat (spec sectie 7).
2. Eén bestelling met iDEAL (Stripe-testbank, "Authorize") en één met kaart `4242 4242 4242 4242`; beide komen op `/success` met referentie, de cart is leeg, de bevestigingsmail gaat naar `ORDER_EMAIL_BCC`, de Printful-order staat als concept.
3. Ruim de `cs_test_`-orders daarna op in Supabase (spec sectie 7).

Meld de bevindingen aan Joep; hij beslist over fase 4.

---

## Spec-dekking

| Spec | Taak |
|---|---|
| 2 Beeld: mockup op `--c-surface`, 4:5, `object-fit: contain`; remove.bg blijft | 4 (Gallery), 7 (`lib/product-page.ts`) |
| 2 Alleen `transform`/`opacity`, reduced motion | 2 (accordeon-icoon), 4 (scroll valt terug op `auto`), 8 (voortgangsbalk) |
| 4 Teaser: badge Coming soon, releasedatum, geen maat of koopknop, waitlist; noindex en geen Offer | 6, 7 |
| 5 PDP desktop: `Gallery` links gestapeld met sticky thumbnails, `BuyPanel` rechts sticky | 4, 6, 7 |
| 5 PDP mobiel: swipe-galerij, koopkolom, sticky "Add to cart"-balk | 4, 6, 7 |
| 5 `BuyPanel`: titel, prijs, `ColourSiblings`, `SizeSelector`, `SizeGuideDialog`, `modelNote`, koopknop, accordeons | 1, 2, 3, 6 |
| 5 Sold out: maat doorgestreept maar kiesbaar, "Notify me" met `WaitlistForm` | 1, 5, 6 |
| 5 Cart-drawer: rechts, volle hoogte, focus-trap, regels, voortgang €75, subtotaal via `useCartTotals`, checkoutknop; logica gelijk | 8 |
| 5 Checkout-shell: eigen header met logo en "Back to cart", formulier links, samenvatting rechts sticky, mobiel inklapbaar; logica via `useCheckout` | 9 |
| 3 `/success` nieuw ontwerp | 10 |
| 9 Tests: `SizeSelector` (radiogroep, toetsenbord) plus de PDP-, drawer- en checkouttests | 1 tot en met 10 |
| 9 A11y: maten als radiogroep met label, dialogs en drawers met focus-trap en Esc, focusring | 1, 2, 8 |
| 9 Performance: eerste beeld eager en `fetchPriority="high"`, vaste beeldverhouding | 4 |

Bewust niet in dit plan: de modelfoto en de ad-video's (spec sectie 2 houdt productbeeld bij mockups; de foto en video's horen bij de hero's in fase 4); home, content- en accountpagina's, 404, e-mail, SEO-teksten, OG-image, favicon en logo's (fase 4); oude tokens, `.oly-theme`, `components/DonationBanner`, `components/Logo` en de overige vervallen componenten (fase 5).
