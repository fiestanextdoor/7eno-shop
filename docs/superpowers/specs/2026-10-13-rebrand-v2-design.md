# 7eno.shop rebrand v2: ontwerpspec

Datum: 13-10-2026. Bron: `docs/research/2026-10-13-rebrand-brief.md`. Branch: `redesign/v2`.

## 1. Doel en kaders

**Doel.** 7eno.shop krijgt een nieuw design en een nieuwe UI/UX in een "Archive Edition"-skelet met het warme palet van de OLYMPN Sport-hoodies. De shop wordt drop-gedreven: elke collectie is een genummerde editie met een releasevenster. Daardoor kan OLYMPN Sport als echte drop live, met aftelklok en waitlist.

**Buiten scope.** Checkout-logica, Stripe-betalingen, promo-codes, verzendregels, Printful/Printify-orderflow en het Supabase-schema blijven functioneel gelijk. Eén uitzondering: de checkout-API krijgt een guard die niet-koopbare drops weigert (sectie 4).

**Uitrol.** Alles gebeurt op `redesign/v2` en is alleen zichtbaar op de Vercel Preview. Productie (`master`) blijft onaangeroerd, op twee kleine PR's na (sectie 6), en die mergen pas na akkoord van Joep.

**Collecties.** Zichtbaar zijn alleen **Olympian** (editie 01) en **OLYMPN Sport** (editie 02). De OG-collectie en alle Printify-producten worden verborgen via een allow-list. Ze blijven bestaan in Printful en Printify. De sets in `lib/bundles.ts` bestaan volledig uit OG-producten. Ze worden uitgezet: `BUNDLES` wordt een lege lijst, de bundel-logica en `bundle-discount` blijven staan voor toekomstige sets.

## 2. Merk en design-tokens

**Palet.** Afgeleid uit de hoodie-kleuren. Rose Red is het enige UI-accent. De overige hoodie-kleuren zijn alleen vlakken en swatches, nooit tekst.

| Token | Waarde | Rol |
|---|---|---|
| `--c-bg` | `#F4EEE3` | Pagina-achtergrond (warm crème) |
| `--c-surface` | `#EAE2D2` | Kaarten, productvlak, drawer |
| `--c-dune` | `#C3B99C` | Tonale vlakken, Dune-swatch |
| `--c-text` | `#0E0B0B` | Tekst, primaire knop (Obsidian), 16,97:1 op bg |
| `--c-text-muted` | `#5E574C` | Meta, labels, 6,18:1 op bg |
| `--c-border` | `#CFC4AD` | Haarlijnen (decoratief) |
| `--c-border-strong` | `#766C5B` | Invoervelden, chips, 4,47:1 op bg, 4,01:1 op surface |
| `--c-accent` | `#621926` | Rose Red: accentknop, badges, links in hover, 10,78:1 op bg |
| `--c-olive` | `#3C3D2E` | Secundair donker vlak |
| `--c-inverse-bg` | `#0E0B0B` | Donkere secties (OLYMPN Sport-landing) |
| `--c-inverse-text` | `#C3B99C` | Tekst op donker, 10,02:1 |
| `--c-success` | `#3E5A2E` | Succes, 6,72:1 op bg |
| `--c-error` | `#A32020` | Fout, 6,53:1, altijd met tekst of icoon |
| `--c-focus` | `#0E0B0B` | Focusring op licht (op donker: `--c-bg`) |
| `--c-swatch-*` | `#621926` rose, `#9CAF92` pistachio, `#9E7551` mocha, `#0E0B0B` obsidian, `#C3B99C` dune, `#3C3D2E` olive, `#071429` maritime | Alleen swatches en drop-thema's |

**Typografie.** Google Fonts via `next/font/google`, zelf gehost.

| Token | Waarde | Rol |
|---|---|---|
| `--f-display` | Archivo (variabel, `wght` 900, `wdth` 125) | Koppen, drop-titels; sluit aan op de "OLYMPN SPORT"-print. Terugval: Archivo Black |
| `--f-body` | Instrument Sans 400/500/600 | Lopende tekst, UI |
| `--f-mono` | IBM Plex Mono 400/500 | Labels, editienummers, prijzen in tabellen, klok |
| `--fs-display` | `clamp(2.75rem, 8vw, 7.5rem)` | Hero |
| `--fs-h1` / `--fs-h2` / `--fs-h3` | `clamp(2rem, 5vw, 4rem)` / `clamp(1.5rem, 3vw, 2.25rem)` / `1.25rem` | Koppen |
| `--fs-body` / `--fs-small` / `--fs-label` | `1rem` / `0.875rem` / `0.75rem` | Tekst; labels uppercase, `letter-spacing: 0.08em` |

Koppen uppercase met `line-height: 0.95`. Body `line-height: 1.5`. Cijfers in klok en prijs: `font-variant-numeric: tabular-nums`.

**Maatvoering.**

| Token | Waarde | Rol |
|---|---|---|
| `--s-1` tot `--s-10` | 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px | Spacing-schaal |
| `--r-0` / `--r-1` | `0` / `2px` | Knoppen en tegels 0; invoer en chips 2px |
| `--l-gutter` | 16px, vanaf 768px 24px, vanaf 1200px 32px | Paginarand |
| `--l-grid-gap` | `2px` | PLP-grid, bijna naadloos |
| `--l-max` | `1600px` | Max breedte; tekstblokken `--l-text-max: 68ch` |
| `--l-nav` | 56px, vanaf 1024px 64px | Header |
| `--l-announce` | 32px | Announcement-bar, vaste hoogte |

**Motion.**

| Token | Waarde |
|---|---|
| `--m-fast` / `--m-base` / `--m-slow` | 120ms / 200ms / 400ms |
| `--m-ease` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--m-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |

Regels: CSS-transities, alleen `transform` en `opacity`. Onder `prefers-reduced-motion: reduce` zet `tokens.css` alle duren op `0.01ms` en staat de announcement-bar stil. GSAP komt er niet bij: geen onderdeel vraagt om een tijdlijn. Lenis en `PageTransition` vervallen (scroll-a11y, CLS).

**Beeld.** Productbeeld is altijd een mockup op een egaal `--c-surface`-vlak, verhouding 4:5, gecentreerd met `object-fit: contain`. `lib/remove-bg.ts` blijft de achtergrond strippen. Geen campagnebeeld van andere merken. Hero's zonder campagnefoto's zijn typografisch: drop-titel in `--fs-display` op het drop-themavlak, met daaronder een rij vrijstaande mockups in alle kleuren. Olympian gebruikt de eigen modelfoto's uit `public/olympian`. Video alleen met poster (`olympian-trailer.mp4` plus `hero-poster.jpg`), `preload="none"` en niet op mobiel.

**Naast de oude tokens.** `styles/tokens.css` gebruikt nieuwe prefixen (`--c-`, `--f-`, `--fs-`, `--s-`, `--r-`, `--l-`, `--m-`). Die botsen niet met `--ink`, `--bone`, `--gutter`, `--font-sans` of `.oly-theme`. `app/layout.tsx` importeert `tokens.css` na `globals.css`. Nieuwe componenten gebruiken alleen nieuwe tokens. Oude CSS-modules blijven werken tot hun pagina is omgebouwd. In fase 5 verdwijnen de oude tokens, `.oly-theme`, `.oly-palette` en Cormorant/Space Mono.

## 3. Informatiearchitectuur en routes

**Navigatie:** Shop, Olympian, OLYMPN Sport, Archive, About. Rechts: account en cart met aantal.

| Route | Besluit |
|---|---|
| `/` | Blijft, nieuw ontwerp |
| `/shop` | Blijft. Filters: `?collection=olympian\|olympn-sport`, `?category=tees\|knits\|hoodies\|bags`, `?sort=`. `?gender` en `?line` vervallen |
| `/shop/[slug]` | Blijft. PDP van een product zonder drop: `permanentRedirect('/archive')` |
| `/collections/[slug]` | Nieuw: drop-landing per collectie |
| `/archive` | Nieuw: overzicht van alle edities |
| `/olympian` | Vervalt, 308 naar `/collections/olympian` |
| `/deals`, `/deals/[slug]` | Vervallen, 308 naar `/shop` |
| `/coming-soon` | Vervalt, 308 naar `/`. Pre-release loopt via de drop-status |
| `/shop?line=olympian` | 308 naar `/collections/olympian` (redirect met `has: query`) |
| `/shop?line=og` | 308 naar `/shop` |
| `/about`, `/faq`, `/size-guide`, `/returns`, `/terms`, `/privacy`, `/success`, `/checkout`, `/account/*` | Blijven, nieuw ontwerp |

Redirects staan in `next.config.ts`. Lees eerst `node_modules/next/dist/docs` (Next 16, zie `AGENTS.md`). De querystring gaat mee naar de bestemming; de canonical vangt dat op.

**Sitemap en feed.** `app/sitemap.ts` verliest `/deals*`, `/olympian`, `?line=*` en `?gender=*`, en krijgt `/collections/*` en `/archive`. Productregels alleen voor producten in een live drop. `product-feed.xml` filtert op dezelfde regel.

**Slugs.** Slugs blijven naam-gebaseerd (`lib/slug.ts`). Een productnaam wijzigen in Printful breekt de URL, de sitemap-entry en Merchant Center-links. Joep hernoemt na publicatie dus niets. Wordt hernoemen toch nodig, dan komt er een redirect in `next.config.ts`.

## 4. Drop- en collectiemodel

**`lib/drops.ts`**

```ts
export type DropStatus = 'upcoming' | 'live' | 'closed'

export interface Drop {
  id: 'olympian' | 'olympn-sport'
  edition: number                    // 1, 2: getoond als "Edition 02"
  title: string                      // "OLYMPN Sport"
  slug: string                       // URL-segment onder /collections
  window: { startsAt: string; endsAt: string | null } // ISO met offset
  match: {
    printfulSyncIds: string[]        // exacte match, gevuld na "Add to store"
    namePrefixes: string[]           // hoofdletterongevoelig, bv. "OLYMPN Sport "
  }
  hero: { image: string; alt: string; video?: string; poster?: string; lineup: string[] }
  intro: string
  waitlist: boolean
  teaser: boolean                    // producten zichtbaar vóór release
  tone: 'light' | 'dark'             // landingsvlak: crème of Obsidian
  colourOrder: string[]              // sortering binnen een productfamilie
  modelNote?: string                 // "Model is 1,85 m en draagt L"
}

export function getDropStatus(drop: Drop, now = Date.now()): DropStatus
export function matchDrop(p: Pick<NormalizedProduct, 'id' | 'provider' | 'name'>): Drop | null
export function isPurchasable(drop: Drop | null, now?: number): boolean
```

Olympian: `startsAt` 19-06-2026 19:00 CEST, `endsAt: null`, prefix `Olympian `, `teaser: false`. OLYMPN Sport: prefix `OLYMPN Sport `, `tone: 'dark'`, `teaser: true`, `waitlist: true`, `lineup` met de acht template-mockups uit de JSON, lokaal opgeslagen in `public/drops/olympn-sport/`. De prefix met "OLYMPN" voorkomt een botsing met OG-namen als "Ink/Butter Sport Tee". Sync-id gaat altijd voor op naam. `matchDrop` matcht alleen `provider: 'printful'`.

**Catalog.** `lib/catalog.ts` krijgt `getShopProducts(now)`: haalt de catalogus op, koppelt elk product aan `matchDrop` en laat producten zonder drop vallen. Dit is een allow-list van collecties in plaats van een keyword-blacklist: OG, Printify en elk nieuw ongepland product blijven automatisch onzichtbaar. Printify wordt niet meer opgehaald zolang geen drop Printify matcht. Uitverkochte producten worden niet meer weggefilterd maar krijgen `soldOut: true`. `product-classify.ts` doet alleen nog productsoort: `isTee`, `isKnit`, `isHoodie`, `isBag`. `isOlympian`, `isSport`, `olympianSortRank` en `SORT_PRIORITY` vervallen. Sortering: drop-editie aflopend, dan productfamilie (naam zonder kleur), dan `colourOrder`.

**Coming soon: teaser, niet koopbaar.** Vóór `startsAt` zijn producten van een drop met `teaser: true` zichtbaar met badge "Coming soon" en releasedatum, zonder maatkeuze of koopknop. Motivatie: bij print-on-demand is het tijdvenster de enige eerlijke schaarste, en zichtbare stukken zetten bezoekers om naar de waitlist. Zijn er nog geen sync-producten, dan toont de landing de `lineup`-mockups. Een drop met `teaser: false` blijft tot release helemaal verborgen. Teaser-PDP's krijgen `noindex`, geen Offer-JSON-LD, en staan niet in sitemap of feed. `app/api/checkout/route.ts` roept `isPurchasable` aan per regel en geeft 409 bij een niet-koopbaar product. Met de cookie van `SITE_PREVIEW_KEY` ziet Joep een upcoming drop als live voor QA. `lib/release.ts` en de seal in `proxy.ts` vervallen.

**Waitlist en notify.** Geen Supabase-wijziging. `app/api/waitlist/route.ts` zet het e-mailadres als contact in een Resend-audience (`RESEND_WAITLIST_AUDIENCE_ID`), met drop-id of product-slug als eigenschap. Validatie in `lib/waitlist.ts`, honeypot-veld, rate-limit per IP in geheugen.

**Wat Joep in Printful doet, en wanneer.**
1. Na merge van de guard-PR op master (sectie 6): de acht OLYMPN Sport-templates via "Add to store" toevoegen aan de 7ENO-store. Namen exact laten zoals de template-titel, bv. "OLYMPN Sport Oversized Hoodie Rose Red".
2. De sync-id's doorgeven; die gaan in `printfulSyncIds`.
3. Prijzen en maten S tot 3XL controleren. Mockups per kleur aanvullen met back en detail als die er komen.
4. Niets hernoemen na publicatie.

## 5. Pagina's en componenten

**Home.** Hero van de eerstvolgende drop: upcoming toont `DropBlock` met klok en waitlist, live toont titel plus "Shop the drop". Daarna per drop een rij tegels, een Olympian-fotoband en een waitlist-strook. Het hardcoded lookbook in `app/page.tsx` vervalt.

**Collectiepagina (`/collections/[slug]`).** Volledig themavlak volgens `tone`. Mono-label "Edition 02", titel, intro, `DropBlock`. Daarna het grid van de drop met `GridDensityToggle`.

**PLP (`/shop`).** Sticky `FilterBar` onder de header met collectie- en categorie-chips, sortering en `GridDensityToggle` (desktop 2/4, mobiel 1/2). Grid met 2px gap. Tegel: beeld, naam, prijs, badges New in, Coming soon, Sold out.

**PDP.** Desktop twee kolommen: `Gallery` links (verticaal gestapeld, thumbnails sticky), `BuyPanel` rechts sticky. Mobiel: swipe-galerij, daarna koopkolom, en een sticky "Add to cart"-balk onderaan. `BuyPanel`: titel, prijs, `ColourSiblings` (kleuren zijn losse producten), `SizeSelector` met maten als tekst, link naar `SizeGuideDialog`, `modelNote`, koopknop, accordeons (Details, Pasvorm, Verzending en retour). Sold out: maat doorgestreept maar kiesbaar, knop wordt "Notify me" met `WaitlistForm`.

**Cart-drawer.** Rechts, volle hoogte, focus-trap. Regels met miniatuur, maat, aantal, verwijderen. Gratis-verzending-voortgang (€75), subtotaal via `useCartTotals`, checkout-knop. Logica blijft in `CartDrawer` en de Zustand-store.

**Checkout-shell.** Eigen header met logo en "Back to cart". Desktop formulier links, samenvatting rechts sticky. Mobiel samenvatting inklapbaar bovenaan. Logica via `useCheckout`.

**Account.** Alle accountpagina's in één smalle kolom met mono-labels. Logica blijft.

**Content.** About, FAQ, Size guide en legal: tekstkolom met grote kop, FAQ als `Accordion`.

**Archive.** Lijst van edities, nieuwste eerst: editienummer, titel, releasevenster, status, beeldstrook, link naar collectie. Gesloten edities blijven hier staan.

**404.** Grote "404", één zin, links naar de live drops.

**Blijven en vervallen:** zoals de audit in de brief. Logica-componenten blijven, hun markup en CSS worden vervangen. `ShopFilters` levert de URL-state aan `FilterBar`. `BundleConfigurator` blijft ongebruikt staan.

**Nieuw in `components/ui/*`:**

| Component | Props | Verantwoordelijkheid |
|---|---|---|
| `AnnouncementBar` | `messages: string[]; href?: string` | Sticky USP-balk, vaste hoogte, geen neon |
| `SiteHeader` | `nav: NavItem[]; cartCount: number` | Logo, navigatie, account, cart |
| `MobileNav` | `nav: NavItem[]; open: boolean; onClose(): void` | Volledig scherm, focus-trap, Esc sluit |
| `Drawer` | `open; onClose; side: 'left'\|'right'; title: string` | Basis voor cart en filters |
| `Button` | `variant: 'primary'\|'accent'\|'ghost'; size?; loading?` | Knoppen, radius 0 |
| `Badge` | `kind: 'new'\|'coming'\|'sold-out'\|'edition'` | Labels op tegels en PDP |
| `ProductTile` | `product: TileProduct; density: 1\|2\|4; eager?: boolean` | Tegel met 4:5-beeld en badges |
| `GridDensityToggle` | `value: number; options: number[]; onChange(v): void` | Griddichtheid, onthouden in `localStorage` met try/catch |
| `FilterBar` | `filters: FilterGroup[]; sort: string` | Sticky chips; mobiel opent een `Drawer` |
| `DropBlock` | `drop: DropView; now: number` | Editie, titel, klok of "Live", waitlist |
| `Countdown` | `target: string` | Server rendert datum; client telt per seconde, `aria-live` uit |
| `WaitlistForm` | `dropId?: string; productSlug?: string; compact?: boolean` | POST naar `/api/waitlist`, inline status |
| `Gallery` | `images: GalleryImage[]` | Sticky thumbnails desktop, scroll-snap mobiel |
| `BuyPanel` | `product; drop: DropView; siblings` | Sticky koopkolom op `useVariantPicker` |
| `SizeSelector` | `sizes: SizeOption[]; value; onChange` | Maten als tekst, radiogroep |
| `SizeGuideDialog` | `category: string; modelNote?: string` | Native `<dialog>` met maattabel |
| `ColourSiblings` | `items: { name; hex; href; current }[]` | Kleurwissel tussen productfamilie |
| `Accordion` | `items: { title; content }[]` | `details`/`summary` |
| `EditionCard` | `drop: DropView` | Archive-regel |
| `SiteFooter` | `nav: NavItem[]` | Links, waitlist, legal |

## 6. Refactor-stap vooraf (naar master)

Twee kleine PR's op master, elk pas mergen na akkoord van Joep.

**PR A: `fix: hide unreleased OLYMPN Sport products`.** In `lib/catalog.ts` een filter op prefix `OLYMPN Sport ` in `getCatalogProducts`, en dezelfde check in `app/api/checkout/route.ts`. Test in `lib/catalog.test.ts`. Hierdoor kan Joep de templates direct aan de store toevoegen zonder dat productie ze toont.

**PR B: `refactor: extract AppShell and cart/checkout hooks`.**
- `components/AppShell/AppShell.tsx`: de route-chrome uit `CartProvider` (checkout-variant, footer-uitzonderingen). `CartProvider` vervalt, `app/layout.tsx` gebruikt `AppShell`.
- `hooks/useVariantPicker.ts`: kleur, maat, beschikbaarheid, `HIDDEN_SIZES`, gekozen variant. Uit `ProductDetail.tsx` en `QuickAddCard`.
- `hooks/useCartTotals.ts`: subtotaal, bundelkorting, promo, verzending via `lib/shipping.ts`.
- `hooks/useCheckout.ts`: formulierstate, promo-validatie, POST naar `/api/checkout`, fouten. Uit `app/checkout/page.tsx`.
- `package.json`: `"lint": "eslint ."`.
- Tests: `hooks/useVariantPicker.test.ts`, `hooks/useCartTotals.test.ts`, `hooks/useCheckout.test.ts` (fetch gemockt), `components/AppShell/AppShell.test.tsx` (chrome per route). Gedrag en markup ongewijzigd.

`redesign/v2` rebaset daarna op master.

## 7. Branch, Preview en omgeving

Branch `redesign/v2`, vanaf master na PR A en B. Elke push geeft een Preview. Vercel Deployment Protection staat aan op Previews.

**Preview-env (scope Preview, branch `redesign/v2`):** `NEXT_PUBLIC_BASE_URL`, `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (eigen test-endpoint), `PRINTFUL_API_KEY`, `PRINTFUL_ACCOUNT_TOKEN`, `PRINTFUL_STORE_ID`, `PRINTFUL_WEBHOOK_SECRET`, `PRINTFUL_AUTO_CONFIRM=false`, `PRINTIFY_AUTO_CONFIRM=false`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_WAITLIST_AUDIENCE_ID` (test-audience), `ORDER_EMAIL_FROM`, `ORDER_EMAIL_BCC` (Joep), `REMOVE_BG_API_KEY`, `SITE_PREVIEW_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

**Productie blijft onaangeroerd:** geen merge, geen wijziging aan Production-env, Stripe in testmodus, Printful-orders als concept. Preview deelt het Supabase-project; testorders (`cs_test_`) worden na QA opgeruimd.

**Go-live-checklist:**
1. Joep akkoord op de Preview.
2. Releasedatum OLYMPN Sport definitief in `lib/drops.ts`, sync-id's ingevuld.
3. PR `redesign/v2` naar master, CI groen, mergen.
4. Production-env: `PRINTFUL_ACCOUNT_TOKEN`, `RESEND_WAITLIST_AUDIENCE_ID` (live).
5. Redirects testen op productie (`/olympian`, `/deals`, `/coming-soon`, `?line=`).
6. Sitemap en `product-feed.xml` controleren, sitemap opnieuw indienen in Search Console, feed in Merchant Center laten verversen.
7. Eén echte kleine bestelling, daarna annuleren. De prefix-guard uit PR A verdwijnt met de merge, de drop-logica neemt het over.

## 8. Rebrand buiten de UI

- **E-mail (`lib/email/brand.ts`):** constanten naar het nieuwe palet (`INK #0E0B0B`, `BONE #F4EEE3`, accent `#621926`, rand `#CFC4AD`). Koppen in `'Arial Black', Arial, sans-serif`, tekst in `Arial, Helvetica, sans-serif`, mono blijft Courier. Nieuw woordmerk als PNG. De snapshot-tests van order-confirmation en order-shipped worden bijgewerkt.
- **SEO:** `lib/seo.ts` en layout-metadata noemen "Olympian and OLYMPN Sport" in plaats van "OG and Olympian". `themeColor` `#0E0B0B`. Per collectiepagina eigen title en description.
- **OG-image:** `app/opengraph-image.tsx` opnieuw, crème vlak, beeldmerk, titel in Archivo. Het fontbestand staat lokaal in `app/_fonts/` voor `ImageResponse`. Per collectie een eigen `opengraph-image.tsx` met het themavlak.
- **Favicon en manifest:** `app/icon.tsx` en `app/manifest.ts` op basis van het beeldmerk uit `Onderdelen Beeldmerk 7ENO butter` (bovenkant 7, onderkant 7, bliksem). Manifest `background_color #F4EEE3`, `theme_color #0E0B0B`.
- **Logo's (`public/logos`):** nieuwe set als SVG: beeldmerk Obsidian en crème, woordmerk Obsidian en crème, lockup "OLYMPN SPORT". Oude bestanden blijven tot fase 5 in gebruik, daarna weg.

## 9. Testen en kwaliteit

**Blijven:** alle 20 suites. Aanpassen: `product-classify.test.ts` (soorten in plaats van lijnen), `catalog.test.ts` (allow-list, `soldOut` in plaats van filter), `bundles.test.ts` (fixtures in plaats van echte sets), `merchant-feed.test.ts` (alleen live drops), e-mailtests.

**Erbij:**
- `lib/drops.test.ts`: status op de grenzen van het venster, tijdzone, `endsAt: null`, match op sync-id vóór naam, OG-namen en Printify matchen niet, geen product in twee drops.
- `lib/catalog.test.ts`: `getShopProducts` met OG, Printify, teaser en sold-out.
- `lib/waitlist.test.ts`: validatie en honeypot.
- Checkout-guard: niet-koopbare regel geeft 409.
- Hooks uit PR B.
- UI: `Countdown` (nep-timers), `GridDensityToggle` (opslag faalt netjes), `SizeSelector` (radiogroep, toetsenbord).

**Per fase:** `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run build`.

**Lighthouse en CLS:** doel 90+ mobiel op home, PLP en PDP. Tegels met vaste `aspect-ratio`. Announcement-bar en header met vaste hoogte. `next/font` met `adjustFontFallback`. Klok rendert server-side en gebruikt tabular-nums. Eerste rij tegels `loading="eager"`, hero `fetchPriority="high"`.

**A11y:** accent op crème 10,78:1, tekst 16,97:1, muted 6,18:1. Mocha, pistachio en dune nooit als tekst. Focus: 2px solide `--c-focus` met 2px offset, op donkere vlakken crème. Drawers en dialogs met focus-trap en Esc. Maten als radiogroep met label. De klok heeft altijd een statisch tekstalternatief met datum, tijd en tijdzone.

**Performance:** geen video zonder poster, geen autoplay op mobiel, Printify-fetch weg.

## 10. Fasering

| Fase | Klaar en demonstreerbaar op Preview | Risico's |
|---|---|---|
| 0. Voorwerk master | PR A en B gemerged. Productie toont OLYMPN Sport niet, gedrag verder gelijk. Joep voegt templates toe aan de store | Hook-refactor breekt checkout ongemerkt: hook-tests plus handmatige testbestelling |
| 1. Fundament | `tokens.css`, fonts, `AppShell` met nieuwe header, announcement-bar, mobiele nav, footer. `lib/drops.ts`, `getShopProducts`, redirects. Shop toont alleen Olympian | Oude pagina's onder nieuwe chrome ogen half. Redirect-syntax van Next 16 |
| 2. Shop en drops | PLP met filters en griddichtheid, `/collections/*`, `DropBlock`, klok, waitlist, Archive | Resend-audience-limieten. Teaser lekt via sitemap of feed: test |
| 3. Kopen | PDP met galerij, sticky koopkolom, maten, size guide, sold-out-notify. Cart-drawer, checkout-shell, success | Variantkeuze per kleur-als-product. Regressie in checkout: volledige testbestelling met iDEAL en kaart |
| 4. Content en merk | Home, About, FAQ, Size guide, legal, account, 404. E-mail, SEO, OG-image, favicon, manifest, logo's | Beeldmerk alleen als PNG beschikbaar. Metadata-regressie in Search Console |
| 5. Afronding | Oude tokens, `.oly-theme`, Cormorant en vervallen componenten weg. Lighthouse, a11y-scan, go-live-checklist klaar | Achtergebleven verwijzingen naar oude tokens: grep op `--ink`, `--bone`, `oly-` moet leeg zijn |
