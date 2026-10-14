import { DROPS } from '@/lib/drops'

export interface WaitlistSignup {
  email: string
  dropId: string | null
  productSlug: string | null
}

export type WaitlistParse =
  | { ok: true; signup: WaitlistSignup }
  | { ok: false; reason: 'honeypot' }
  | { ok: false; reason: 'invalid'; error: string }

/** A field people never see or fill; bots that fill every input do. */
export const HONEYPOT_FIELD = 'company'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

export function parseWaitlistBody(body: unknown): WaitlistParse {
  if (body === null || typeof body !== 'object') {
    return { ok: false, reason: 'invalid', error: 'Invalid request' }
  }
  const input = body as Record<string, unknown>

  const trap = input[HONEYPOT_FIELD]
  if (typeof trap === 'string' && trap.trim() !== '') return { ok: false, reason: 'honeypot' }

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (email.length === 0 || email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, reason: 'invalid', error: 'Enter a valid email address.' }
  }

  const rawDrop = input.dropId
  let dropId: string | null = null
  if (!isBlank(rawDrop)) {
    if (typeof rawDrop !== 'string' || !DROPS.some((d) => d.id === rawDrop)) {
      return { ok: false, reason: 'invalid', error: 'Unknown drop.' }
    }
    dropId = rawDrop
  }

  const rawSlug = input.productSlug
  let productSlug: string | null = null
  if (!isBlank(rawSlug)) {
    if (typeof rawSlug !== 'string' || rawSlug.length > 120 || !SLUG.test(rawSlug)) {
      return { ok: false, reason: 'invalid', error: 'Unknown product.' }
    }
    productSlug = rawSlug
  }

  return { ok: true, signup: { email, dropId, productSlug } }
}

export interface RateLimiter {
  check(key: string, now?: number): boolean
}

/**
 * In-memory sliding window per key. Per server instance: on serverless there
 * are several, so this is a brake on one client hammering the form, not a wall.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>()
  return {
    check(key: string, now: number = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
      if (recent.length >= limit) {
        hits.set(key, recent)
        return false
      }
      recent.push(now)
      hits.set(key, recent)
      if (hits.size > 5000) {
        for (const [k, times] of hits) {
          if (times.every((t) => now - t >= windowMs)) hits.delete(k)
        }
      }
      return true
    },
  }
}

/** The client address as Vercel forwards it. */
export function clientIp(headers: Headers): string {
  const first = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (first) return first
  return headers.get('x-real-ip')?.trim() || 'unknown'
}
