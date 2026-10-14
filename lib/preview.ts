/**
 * QA preview for upcoming drops (spec section 4). `?preview=<SITE_PREVIEW_KEY>`
 * stores the key in an httpOnly cookie (proxy.ts); with that cookie an
 * upcoming drop counts as live. The cookie carries the key itself, so a
 * hand-made cookie does nothing, and preview is never honoured on Vercel
 * production, where pages must stay static and the drop clock is the law.
 */
export const PREVIEW_COOKIE = 'drop_preview'
export const PREVIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

type Env = Record<string, string | undefined>

export function isPreviewEnabled(env: Env = process.env): boolean {
  return Boolean(env.SITE_PREVIEW_KEY) && env.VERCEL_ENV !== 'production'
}

export function isPreviewCookieValue(value: string | undefined, env: Env = process.env): boolean {
  return isPreviewEnabled(env) && value !== undefined && value === env.SITE_PREVIEW_KEY
}

export type PreviewParamAction = 'set' | 'clear' | 'ignore'

export function previewParamAction(param: string, env: Env = process.env): PreviewParamAction {
  if (param === 'off') return 'clear'
  if (isPreviewEnabled(env) && param === env.SITE_PREVIEW_KEY) return 'set'
  return 'ignore'
}
