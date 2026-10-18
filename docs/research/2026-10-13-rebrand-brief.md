# Rebrand brief (input voor de spec), 13-10-2026

## Beslissingen van Joep
- Complete herbouw van design en UI/UX van 7eno.shop; logica (Printful/Printify, cart, checkout, account, promo) blijft.
- Bouwen op een feature-branch (`redesign/v2`) zodat Vercel een Preview geeft; `master`/productie blijft tot akkoord onaangeroerd.
- Collecties na de rebrand: **Olympian** (bestaand, 12 Printful-producten: 4 Knitted Tees, 4 Tees, 4 Backpacks, plus /olympian-pagina en modelfoto's in public/olympian) en **OLYMPN Sport** (nieuwe drop). De **OG-collectie verdwijnt** uit de shop (Box Tees, Sport Tees, Shorts, caps, loafers, handdoek, mousepad, desk mat, iPhone-case, backpack, Life4HSP-tee, Ink/Blood-tees). Ook Printify (Stroke Tee, Swim Shorts) niet tonen tenzij Joep anders zegt.
- Ontwerprichting: "Archive Edition"-skelet (Arte Antwerp / Cole Buxton) met het warme palet van "Warm Essentials" (Nude Project). Palet uit de hoodie-kleuren: Obsidian (bijna zwart), Dune (steen/crème), Olive, Rose Red als accent; achtergrond warm wit/crème. Google Fonts (Archivo Black voor koppen, Space Grotesk of Instrument Sans voor tekst), geen commerciële fonts.
- Lenen: Represent griddichtheid-schakelaar (2/4), Nude Project PDP (sticky galerij, thumbnails, maten als tekst, accordeons), Cole Buxton dropblok (Edition-nummer, aftelklok, e-mail/waitlist), Arte Archive-pagina, Bershka sticky promobalk (zonder neon-tekst), cart-drawer.

## De drop (Printful product templates, Account-token)
8 templates "OLYMPN Sport", aangemaakt 4-5 okt 2026, nog GEEN store-producten:
- Oversized Heavyweight Hoodie (catalog 892, Bella+Canvas 4719): Rose Red (#621926), Pistachio (#9caf92), Mocha (#9e7551), Obsidian (#0e0b0b)
- Relaxed Chaser Hoodie (catalog 1577, Stanley/Stella SASU038): Dune (#c3b99c), Olive (#3c3d2e), Obsidian (#0b0b0b), Maritime (#071429)
- Maten S-3XL; basisprijs 32-41 EUR; 1 mockup per template (1000x1000, front); print "OLYMPN SPORT" gradient.
- Zodra ze in Printful aan de store worden toegevoegd zijn het sync-producten en toont de huidige site ze direct. De nieuwe site moet dus een drop-config met releasedatum hebben die producten verbergt tot release ("coming soon" met waitlist), onafhankelijk van Printful.
- Template-JSON: docs/drops/2026-10-13-printful-templates.json; mockups: docs/drops/2026-10-13-olympn-sport-mockups.jpg.
- API: geen drop/collectie-begrip in Printful of Printify; sync-API heeft geen created-datum; kleurnaam bij AOP is "Custom"/"White". Lokale config nodig: `lib/drops.ts` (naam, edition-nummer, releasevenster, product-matcher op naam/id, hero-assets, tekst).

## Codebase (audit)
- Next 16.2.6, React 19.2, TS, Zustand, Supabase, Stripe (card+iDEAL), Resend, Lenis, Vercel Analytics. CSS Modules, geen Tailwind. Tokens in styles/globals.css (--ink, --bone, --paper, --oxblood, --stone, --rule, --gutter, --max-width, --nav-height) + .oly-theme override-mechanisme. Fonts: Cormorant Garamond + Space Mono via next/font in app/layout.tsx.
- Routes: /, /shop (?gender ?line ?category), /shop/[slug], /olympian, /deals, /deals/[slug], /checkout, /success, /account/*, /coming-soon, /about, /faq, /size-guide, /privacy, /terms, /returns; sitemap/robots/manifest/icon/opengraph-image/product-feed.xml; api: checkout, webhook (Stripe), printful-webhook, printify-webhook, promo/validate, health, auth/callback.
- Integraties: lib/printful.ts (+printful-normalize), lib/printify.ts, lib/catalog.ts (merge, verbergt uitverkocht), lib/promo.ts (hardcoded codes), lib/shipping.ts, lib/stripe.ts, lib/email/* (brand.ts = merkstijl), lib/remove-bg.ts, lib/card-image.ts, supabase/schema.sql.
- Drop/collectie nu: afgeleid uit productnaam in lib/product-classify.ts; SORT_PRIORITY in app/shop/page.tsx; olympianSortRank; lookbook/tegels hardcoded in app/page.tsx; bundles in lib/bundles.ts (hardcoded Printful-ids, OG-producten → vervalt of herzien).
- Bewaren (logica): components/CartProvider (app-shell, route-chrome), StoreHydration, CartDrawer-logica, QuickAddCard + app/shop/[slug]/ProductDetail.tsx (472 regels, variant/maat), ShopFilters (URL-state), BundleConfigurator, app/checkout/page.tsx (466 regels), GoogleSignIn, AccountLogout, server-side datafetching in page.tsx's.
- Vervangen (presentatie): Hero, OlympianMark, Logo, Marquee, WaveBars, PageTransition, SmoothScroll, Footer, BundleCover, DonationBanner, ShopDropdown, CheckoutHeader, ProductCard, alle content/account-CSS. Dode code: LatestDrop, Marquee, ShopSidebar, WaveBars.
- Kwaliteit: tsc 0 fouten, jest 20 suites/198 tests groen (vooral lib/store); `npm run lint` kapot (next lint bestaat niet, moet `eslint .`); `priority` al vervangen door loading/fetchPriority; slugs uit productnaam (hernoemen breekt URL); lib/release.ts + proxy.ts kunnen de site tot een datum naar /coming-soon sturen (verlopen 19-06-2026, herbruikbaar); CSP report-only; Vercel Analytics laadt los van consent.
- Aanbeveling audit: in-place op feature-branch (geen route-group, geen /v2-prefix); eerst kleine refactor-PR (AppShell uit CartProvider; hooks useVariantPicker/useCheckout/useCartTotals), dan markup+CSS; styles/tokens.css + components/ui naast het oude; Preview-env: Stripe testkeys, AUTO_CONFIRM false, eigen STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_BASE_URL preview, SITE_PREVIEW_KEY; rebrand ook lib/email/brand.ts, lib/seo.ts, layout-metadata, opengraph-image, icon, manifest, public/logos.
- Env: PRINTFUL_API_KEY (Store-token) + nieuw PRINTFUL_ACCOUNT_TOKEN (Account-token, product_templates/read) in .env.local en ~/.config/jkc/printful-7eno.env; beide nog in Vercel zetten.

## Referentie-patronen (top-10 verwachtingen doelgroep)
Volle foto/video hero met één kop; marquee/announcement met USP's; PLP 4/2 kolommen (nauwelijks gutter); badges New In/Most Wanted/Sold out; sold-out blijft staan met notify; sticky filter/sort met chips; PDP galerij links + sticky koopkolom; maten als knoppen + size guide + modelmaat; cart-drawer; e-mail/membership-aanmelding. Valkuilen: geen commerciële fonts, geen campagnebeeld van andere merken, video-hero met poster/lazy, max 1 overlay, neon niet als tekstkleur, geen nep-schaarste bij print-on-demand (tijdvenster i.p.v. voorraad).
