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
