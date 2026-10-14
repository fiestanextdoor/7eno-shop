# Lighthouse, 2026-10-14

Mobile preset (Lighthouse 13.5.0 defaults: phone emulation, simulated slow 4G), production build via `next start` on http://localhost:3100. Every page was requested twice before measuring (warm-up below). Target: 90 or more on every category (spec section 9).

Cache note: the warm-up fills the server side caches (Printful fetch cache, ISR pages). Lighthouse itself starts every run with an empty browser cache, so the numbers are a first visit on a warm server, not a repeat visit.

| Page | Path | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Target |
|---|---|---|---|---|---|---|---|---|---|
| Home | `/` | 90 | 100 | 96 | 100 | 3.7 s | 0 | 0 ms | met |
| PLP | `/shop` | 86 | 99 | 96 | 100 | 4.3 s | 0 | 10 ms | not met |
| PDP | `/shop/olympian-ocean-backpack-20-l` | 89 | 100 | 96 | 100 | 3.8 s | 0 | 0 ms | not met |

## Warm-up

HTTP status of the two warm-up requests per path (redirects not followed).

- `/`: 200, 200
- `/shop`: 200, 200
- `/shop/olympian-ocean-backpack-20-l`: 200, 200

## Below target

- PLP: performance 86
- PDP: performance 89

## Notes (added by hand after the run)

- Variance: this is the second full run of `npm run qa:lighthouse` on the same build. The first run scored Home 68, PLP 87, PDP 86 on performance (accessibility 100, 99, 100; best practices 96 everywhere; SEO 100 everywhere). In that first run the Home LCP text painted 8.9 s after load in the unthrottled trace, a cold start outlier: the warm-up fetches HTML only, so the first Lighthouse load also hit a cold image optimizer (`/_next/image`) and a fresh Chrome profile. Two separate Home runs in between scored 86 and 85. Expect a spread of a few points per run; treat performance as roughly 85 to 90 on all three pages.
- Performance (all pages): the simulated LCP of about 4 s against an FCP of about 0.9 s comes mostly from the preloaded web fonts (about 240 KiB: Archivo variable normal and italic, Instrument Sans, IBM Plex Mono). Candidates for a separate task: do not preload the Archivo italic file, or subset the variable axis. Lighthouse also lists about 74 KiB of unused JavaScript and 150 ms of render blocking CSS.
- Best practices 96 (all pages): the console logs a 404 for `/_vercel/insights/script.js`, which only exists on Vercel. Not expected on the deployed site.
- Accessibility 99 on PLP: `heading-order`, the product tile names are `h3` directly under the page `h1` with no `h2` in between (ProductTile from phase 1 to 3; axe does not flag it because it is not a WCAG rule).
- Measured on localhost, not through the Vercel CDN; real field numbers will differ.
