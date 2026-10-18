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

## Social band (home)

- [x] TikTok-handle bevestigd door Joep 18-10: `@7enobyabraentertainment` (`lib/social.ts`).
- [ ] Optioneel: `INSTAGRAM_ACCESS_TOKEN` in Vercel (Instagram API met Instagram-login, scope `instagram_business_basic`, vereist Business- of Creator-account) zodat de vier nieuwste posts live meelopen. Zonder token staan de vier posts van 18-10-2026 uit `lib/social.ts` erop.
