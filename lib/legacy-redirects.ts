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
