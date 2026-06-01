/**
 * Single source of truth for the shop launch.
 *
 * Until this moment the entire storefront is sealed behind /coming-soon and no
 * orders can be placed (enforced in proxy.ts). After it, the site opens
 * automatically. Launch: 19 June 2026, 19:00 Europe/Amsterdam (CEST = UTC+2),
 * i.e. 17:00 UTC. Month is 0-based in Date.UTC, so 5 = June.
 */
export const RELEASE_AT_UTC = Date.UTC(2026, 5, 19, 17, 0, 0)

/** Human-readable launch moment for the announcement page. */
export const RELEASE_DATE_LABEL = '19 June 2026'
export const RELEASE_TIME_LABEL = '19:00 CEST'

/** True while the shop is still locked (before the launch moment). */
export function isShopLocked(now: number = Date.now()): boolean {
  return now < RELEASE_AT_UTC
}
