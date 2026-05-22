import { createClient } from '@/lib/supabase/server'
import type { Order } from '@/lib/supabase/types'
import styles from './orders.module.css'

function statusLabel(status: string) {
  const map: Record<string, string> = {
    processing: 'Processing',
    fulfilled: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status] ?? status
}

function statusClass(status: string) {
  if (status === 'fulfilled' || status === 'completed') return styles.statusGreen
  if (status === 'cancelled') return styles.statusRed
  return styles.statusDefault
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
                    <span className={`${styles.statusBadge} ${statusClass(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className={styles.orderTotal}>
                      &euro;{(order.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={styles.orderItems}>
                  {items.map((item, i) => (
                    <div key={i} className={styles.orderItem}>
                      <span className={styles.itemName}>{item.productName}</span>
                      <span className={styles.itemVariant}>{item.variantName} &middot; qty {item.quantity}</span>
                    </div>
                  ))}
                </div>

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
