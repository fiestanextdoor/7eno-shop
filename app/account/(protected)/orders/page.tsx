import { createClient } from '@/lib/supabase/server'
import type { Order, Fulfillment } from '@/lib/supabase/types'
import { deriveOrderStatus, statusMeta, STEP_LABELS, type StatusTone } from '@/lib/order-status'
import styles from './orders.module.css'

const TONE_CLASS: Record<StatusTone, string> = {
  default: styles.statusDefault,
  green: styles.statusGreen,
  red: styles.statusRed,
  amber: styles.statusAmber,
}

/** De 4-staps voortgangsbalk. Verborgen bij probleemstatussen (cancelled/failed). */
function Stepper({ current }: { current: number }) {
  return (
    <div className={styles.stepper}>
      {STEP_LABELS.map((label, i) => {
        const cls =
          i < current ? styles.stepDone : i === current ? styles.stepActive : styles.step
        return (
          <span key={label} className={cls}>
            {label}
          </span>
        )
      })}
    </div>
  )
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const orders = (data ?? []) as Order[]

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Orders</h1>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No orders yet</p>
          <p className={styles.emptySub}>Your orders will appear here once you place one.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => {
            const items = Array.isArray(order.items) ? order.items as Array<{ productName: string; quantity: number; variantName: string }> : []
            const shipping = order.shipping_address as { name?: string; line1?: string; city?: string; postal_code?: string } | null
            const fulfillments = (Array.isArray(order.fulfillments) ? order.fulfillments : []) as unknown as Fulfillment[]
            const meta = deriveOrderStatus(fulfillments, order.status)
            const tracked = fulfillments.filter((f) => f.tracking_url || f.tracking_number)

            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div>
                    <p className={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <p className={styles.orderId}>#{order.stripe_session_id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className={styles.orderMeta}>
                    <span className={`${styles.statusBadge} ${TONE_CLASS[meta.tone]}`}>
                      {meta.label}
                    </span>
                    <span className={styles.orderTotal}>
                      &euro;{(order.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {meta.tone !== 'red' && <Stepper current={meta.step} />}

                <div className={styles.orderItems}>
                  {items.map((item, i) => (
                    <div key={i} className={styles.orderItem}>
                      <span className={styles.itemName}>{item.productName}</span>
                      <span className={styles.itemVariant}>{item.variantName} &middot; qty {item.quantity}</span>
                    </div>
                  ))}
                </div>

                {tracked.length > 0 && (
                  <div className={styles.tracking}>
                    {tracked.map((f, i) => {
                      const label = [f.carrier, f.tracking_number].filter(Boolean).join(' · ')
                      return (
                        <div key={i} className={styles.trackRow}>
                          <span className={styles.trackMeta}>
                            {statusMeta(f.status).label}{label ? ` · ${label}` : ''}
                          </span>
                          {f.tracking_url && (
                            <a
                              href={f.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.trackLink}
                            >
                              Track your package &rarr;
                            </a>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {shipping && (
                  <p className={styles.shippingLine}>
                    Delivery address: {shipping.name}, {shipping.line1}, {shipping.postal_code} {shipping.city}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
