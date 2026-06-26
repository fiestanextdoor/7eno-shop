import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPrintifySignature, mapPrintifyStatus, buildPublishHandle } from '@/lib/printify-webhook'
import * as printify from '@/lib/printify'
import { productSlug } from '@/lib/slug'

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

  let payload: {
    type?: string
    resource?: { id?: string; data?: { external_id?: string; id?: string; action?: string } }
  }
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const topic = payload.type ?? ''

  // Clicking "Publish" in Printify only locks the product and fires this event; we
  // must call back so it unlocks and gets the external marker `isPublished` checks.
  if (topic === 'product:publish:started') {
    return handlePublishStarted(payload.resource?.id, payload.resource?.data?.action)
  }

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

/**
 * Acknowledge a `product:publish:started` event. For a publish ("create") we resolve
 * the product's public URL and report success with a non-empty external id, which
 * unlocks it and makes `isPublished` true. For an unpublish ("delete") we just
 * acknowledge so the product unlocks. On any error we report the publish as failed,
 * so the product never stays stuck in the locked state.
 */
async function handlePublishStarted(productId?: string, action?: string) {
  if (!productId) {
    return NextResponse.json({ received: true, unmatched: true })
  }
  try {
    let handle = ''
    if (action !== 'delete') {
      // Best-effort deep link for Printify's dashboard; never block publish on it.
      try {
        const product = await printify.getProduct(productId)
        handle = buildPublishHandle(productSlug(product.name), process.env.NEXT_PUBLIC_BASE_URL)
      } catch (err) {
        console.warn('[PrintifyWebhook] could not build product handle for', productId, err)
      }
    }
    await printify.publishingSucceeded(productId, { id: productId, handle })
    return NextResponse.json({ received: true, published: true })
  } catch (err) {
    console.error('[PrintifyWebhook] publish handling failed for', productId, err)
    await printify.publishingFailed(productId, 'Storefront publish handler error').catch(() => {})
    return NextResponse.json({ received: true, error: 'publish-failed' })
  }
}
