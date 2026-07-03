# Order status & tracking in het account (Printful-pariteit)

**Datum:** 2026-07-03
**Status:** Goedgekeurd, in uitvoering

## Doel

De klant ziet in zijn account de live fulfillment-status + tracking van zijn
bestelling, gelijk aan wat in het Printful-dashboard zichtbaar is. Daarnaast
krijgt de klant een "je bestelling is onderweg"-mail met track&trace-link zodra
de order verzonden is.

## Huidige staat (context)

- Orders staan in Supabase `orders` met een grove `status`-kolom
  (`processing / fulfilled / completed / cancelled / fulfillment_failed`).
- Er is een `fulfillments` jsonb-kolom: `[{ provider, order_id, status }]`.
  Voor **Printify** wordt die status live bijgewerkt via een webhook
  (`pending → in_production → shipped → delivered`).
  Voor **Printful** wordt de status op `processing` gezet bij het aanmaken en
  **nooit meer bijgewerkt** — er is geen Printful-webhook of polling.
- De account-orders-pagina (`app/account/(protected)/orders/page.tsx`) en het
  dashboard tonen alleen `order.status` en lezen `fulfillments` niet uit. Er is
  nergens een tracking-nummer of track&trace-link opgeslagen of getoond.
- Het `Order`-type in `lib/supabase/types.ts` mist het `fulfillments`-veld.

## Beslissingen

1. **Volledige pariteit:** live status-stappen + tracking-nummer + track&trace-link.
2. **Printful-webhook** als update-mechanisme (spiegelbeeld van de Printify-webhook).
3. **Verzend-mail** met tracking-link toevoegen (op de bestaande Resend-flow).

## Architectuur

### 1. Datamodel

- `fulfillments` jsonb-entry uitbreiden naar
  `{ provider, order_id, status, tracking_number?, tracking_url?, carrier?, shipped_at? }`.
  jsonb, dus geen DDL voor de vorm; wel code + types.
- Nieuwe nullable kolom `customer_email` op `orders` (migratie). Nodig om de
  verzend-mail betrouwbaar te sturen, ook voor gast-bestellingen (geen `auth.users`).
- Bij het aanmaken van de Printful-order een `external_id` (= Stripe session id)
  meesturen, zodat webhooks robuust matchen. Printify doet dit al.
- `Order`-type bijwerken in `lib/supabase/types.ts`: `fulfillments` + `customer_email`
  toevoegen, plus een gedeeld `Fulfillment`-type.

### 2. Printful webhook-handler

Nieuw: `app/api/printful-webhook/route.ts` + `lib/printful-webhook.ts`
(spiegelbeeld van het Printify-paar).

- **Beveiliging:** geheim token in de URL (`?token=…`), constant-time vergeleken
  met `PRINTFUL_WEBHOOK_SECRET`. Printful tekent de payload niet met HMAC.
- **Events:** `package_shipped` → `shipped` + tracking opslaan;
  `order_updated`/`order_created` → Printful-status mappen
  (`draft/pending`→pending, `inprocess`→in_production, `onhold`→on_hold,
  `partial`→partially_shipped, `fulfilled`→shipped);
  `order_canceled` → cancelled; `order_failed` → failed.
- **Matchen:** order-rij op Printful order-id (`fulfillments[].order_id` /
  `printful_order_id`), met `external_id` als fallback. Alleen de Printful-entry
  in de array wordt bijgewerkt.
- `mapPrintfulStatus()` als pure, unit-testbare functie.
- Bij de transitie naar `shipped` (en niet eerder al verzonden): verzend-mail triggeren.
- **Beperking:** de legacy Printful-API pusht geen "delivered"-event; status stopt
  bij "shipped". (Printify gaat wel tot "delivered".)

### 3. Verzend-mail

Nieuw: `lib/email/order-shipped.ts` (spiegelbeeld van `order-confirmation.ts`).
Onderwerp "Je 7ENO-bestelling is onderweg", met carrier + tracking-nummer en een
"Volg je pakket"-knop naar de `tracking_url`. Verstuurd vanuit de webhook zodra
een fulfillment naar `shipped` springt. Best-effort: faalt nooit de webhook.

### 4. Account-UI

Orders-pagina en dashboard herschrijven zodat ze `fulfillments` uitlezen i.p.v.
alleen `order.status`:

- Statusstappen: Besteld → In productie → Verzonden (→ Bezorgd bij Printify).
- Bij verzonden: carrier + tracking-nummer + "Volg je pakket"-link.
- Gedeelde status-labels voor beide providers.
- Multi-provider orders (Printful + Printify in één bestelling) netjes tonen.

## Data flow

Stripe `checkout.session.completed` → Printful-order aanmaken (mét `external_id`)
→ `fulfillments{status: processing}` + `customer_email` opslaan. Later fulfilt
Printful → webhook → token verifiëren → order matchen → `fulfillments[printful]`
status + tracking bijwerken → bij nieuwe "verzonden" de mail sturen. Account-pagina
leest order + fulfillments via RLS en toont status + tracking.

## Error handling

- Webhook: ongeldig token → 400; onbekende/niet-gematchte order → 200 `{unmatched}`
  (geen eeuwige Printful-retries); e-mailfout → gelogd, 200.
- Idempotentie: verzend-mail alleen bij transitie naar `shipped` vanuit een
  niet-verzonden staat (vergelijk de opgeslagen status vóór de update).

## Testen (TDD)

- `lib/printful-webhook.test.ts`: token-verificatie (secret gezet/leeg/mismatch),
  `mapPrintfulStatus` per event/status, tracking-extractie uit `package_shipped`,
  detectie van de shipped-transitie.
- E-mail-builder: rendert tracking-link.
- Bestaande tests blijven groen.

## Setup (eenmalig in Printful)

- `PRINTFUL_WEBHOOK_SECRET` env zetten.
- Webhook registreren in Printful naar
  `https://…/api/printful-webhook?token=SECRET` met de events.
- Orders moeten in Printful bevestigd worden (`PRINTFUL_AUTO_CONFIRM=true` of
  handmatig), anders blijven ze draft en verandert de status nooit.

## Buiten scope (YAGNI)

- Bezorgd-tracking voor Printful (API pusht dat niet).
- Realtime push naar de browser (refresh volstaat).
- Retour-/refund-status.
