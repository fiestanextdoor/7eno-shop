import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPrintifySignature, mapPrintifyStatus } from '@/lib/printify-webhook'

export async function POST(req: NextRequest) {
  const body = await req.text()
  // Header name confirmed against a live webhook create response (installer). Until
  // then we read the common header and fall back to degraded acceptance.
  const signature = req.headers.get('x-pfy-signature') ?? req.headers.get('x-printify-signature')
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET ?? ''

  if (!verifyPrintifySignature(body, signature, secret)) {
    console.error('[PrintifyWebhook] Signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let payload: { type?: string; resource?: { id?: string; data?: { external_id?: string; id?: string } } }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const topic = payload.type ?? ''
  if (!topic.startsWith('order:')) {
    return NextResponse.json({ received: true, ignored: true })
  }

  // We set external_id = Stripe session id when creating the order.
  const externalId = payload.resource?.data?.external_id
  const printifyOrderId = payload.resource?.id ?? payload.resource?.data?.id
  const newStatus = mapPrintifyStatus(topic)

  if (!externalId && !printifyOrderId) {
    return NextResponse.json({ received: true, unmatched: true })
  }

  const supabase = await createServiceClient()

  // Match the order row by Stripe session id (external_id). Update the printify
  // entry in the fulfillments array.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (supabase.from('orders') as any).select('id, fulfillments')
  const { data: row } = externalId
    ? await query.eq('stripe_session_id', externalId).maybeSingle()
    : { data: null }

  if (!row) {
    console.warn('[PrintifyWebhook] No order row for external_id', externalId)
    return NextResponse.json({ received: true, unmatched: true })
  }

  const fulfillments: { provider: string; order_id: string; status: string }[] = Array.isArray(row.fulfillments)
    ? row.fulfillments
    : []
  const updated = fulfillments.map((f) =>
    f.provider === 'printify' ? { ...f, status: newStatus } : f
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('orders') as any).update({ fulfillments: updated }).eq('id', row.id)

  return NextResponse.json({ received: true })
}
