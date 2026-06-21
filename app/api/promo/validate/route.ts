import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROMO_CODE, PROMO_PERCENT_OFF, isValidPromoCode } from '@/lib/promo'

/**
 * Validates a discount code for the signed-in user before checkout, so the page
 * can show the discount (or the right error) without starting a Stripe session.
 *
 * The code is single-use per account and requires an account: an anonymous
 * visitor gets 401, a user who already redeemed it gets 409. The checkout route
 * re-runs every check (never trust the client) and additionally blocks bundles.
 */
export async function POST(req: NextRequest) {
  let code: unknown
  try {
    code = (await req.json())?.code
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof code !== 'string' || !isValidPromoCode(code)) {
    return NextResponse.json({ error: 'This discount code is not valid.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Create an account or log in to use this discount code.' },
      { status: 401 }
    )
  }

  const { data: existing } = await supabase
    .from('coupon_redemptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('code', PROMO_CODE)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'You have already used this discount code.' },
      { status: 409 }
    )
  }

  return NextResponse.json({ valid: true, code: PROMO_CODE, percentOff: PROMO_PERCENT_OFF })
}
