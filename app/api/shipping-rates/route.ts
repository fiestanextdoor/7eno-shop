import { NextRequest, NextResponse } from 'next/server'
import { buildVariantLookup, getShippingRates, type ShippingRateItem } from '@/lib/printful'
import { validateShippingAddress } from '@/lib/shipping'
import type { CartItem } from '@/types/cart'

export async function POST(req: NextRequest) {
  let items: CartItem[]
  let address: unknown
  try {
    const body = await req.json()
    items = body.items
    address = body.address
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  for (const item of items) {
    if (!Number.isInteger(item.variantId) || !Number.isInteger(item.productId)) {
      return NextResponse.json({ error: 'Invalid item' }, { status: 400 })
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 })
    }
  }

  const validated = validateShippingAddress(address)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }
  const addr = validated.address

  let rateItems: ShippingRateItem[]
  try {
    const lookup = await buildVariantLookup(items.map((i) => i.productId))
    rateItems = []
    for (const item of items) {
      const found = lookup.get(item.variantId)
      if (!found) {
        return NextResponse.json(
          { error: 'One or more products are no longer available' },
          { status: 400 }
        )
      }
      rateItems.push({ variant_id: found.variant.variant_id, quantity: item.quantity })
    }
  } catch (err) {
    console.error('[ShippingRates] Failed to resolve variants:', err)
    return NextResponse.json({ error: 'Could not load products' }, { status: 502 })
  }

  try {
    const rates = await getShippingRates(
      {
        address1: addr.line1,
        city: addr.city,
        country_code: addr.country,
        zip: addr.postalCode,
      },
      rateItems
    )

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping options are available for this address.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      rates: rates.map((r) => ({
        id: r.id,
        name: r.name,
        rate: r.rate,
        currency: r.currency,
        minDeliveryDays: r.minDeliveryDays,
        maxDeliveryDays: r.maxDeliveryDays,
      })),
    })
  } catch (err) {
    console.error('[ShippingRates] Printful request failed:', err)
    return NextResponse.json(
      { error: 'Could not calculate shipping. Please check your address and try again.' },
      { status: 400 }
    )
  }
}
