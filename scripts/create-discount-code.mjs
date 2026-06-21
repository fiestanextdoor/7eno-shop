// One-off: create the MAARDANWEL promotion code (7% off) in Stripe.
//
// Run once per Stripe environment (test keys AND live keys, separately):
//   node --env-file=.env.local scripts/create-discount-code.mjs
//
// Idempotent: if the promotion code already exists it reports it and exits
// without creating a duplicate. The storefront enables the promotion-code
// field on Stripe Checkout automatically whenever no combi-deal is applied
// (see app/api/checkout/route.ts), so once this code exists customers can
// redeem it at checkout.

import Stripe from 'stripe'

const CODE = 'MAARDANWEL'
const PERCENT_OFF = 7

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error(
    'STRIPE_SECRET_KEY is not set. Run with:\n' +
      '  node --env-file=.env.local scripts/create-discount-code.mjs'
  )
  process.exit(1)
}

const stripe = new Stripe(key)

const existing = await stripe.promotionCodes.list({ code: CODE, limit: 1 })
if (existing.data.length > 0) {
  const pc = existing.data[0]
  console.log(`Promotion code ${CODE} already exists (${pc.id}, active=${pc.active}). Nothing to do.`)
  process.exit(0)
}

const coupon = await stripe.coupons.create({
  percent_off: PERCENT_OFF,
  duration: 'once',
  name: `${PERCENT_OFF}% off`,
})

const promo = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code: CODE,
})

console.log(
  `Created promotion code ${promo.code} (${promo.id}) -> ${PERCENT_OFF}% off coupon ${coupon.id}.`
)
console.log('Customers can now redeem it on Stripe Checkout.')
