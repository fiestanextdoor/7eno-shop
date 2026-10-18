import { NextResponse, type NextRequest } from 'next/server'
import { clientIp, createRateLimiter, parseWaitlistBody } from '@/lib/waitlist'
import { addWaitlistContact } from '@/lib/waitlist-resend'

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 })

export async function POST(req: NextRequest) {
  if (!limiter.check(clientIp(req.headers))) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = parseWaitlistBody(body)
  // A bot that filled the honeypot gets the same answer as a person, so it learns nothing.
  if (!parsed.ok && parsed.reason === 'honeypot') return NextResponse.json({ ok: true })
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const result = await addWaitlistContact(parsed.signup)
  if (result === 'unconfigured') {
    return NextResponse.json({ error: 'The waitlist is not open right now.' }, { status: 503 })
  }
  if (result === 'failed') {
    return NextResponse.json({ error: 'Could not join the waitlist. Please try again.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
