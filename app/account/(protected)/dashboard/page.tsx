import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Order, Address } from '@/lib/supabase/types'
import styles from './dashboard.module.css'

function statusLabel(status: string) {
  const map: Record<string, string> = {
    processing: 'In verwerking',
    fulfilled: 'Verzonden',
    completed: 'Voltooid',
    cancelled: 'Geannuleerd',
  }
  return map[status] ?? status
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [ordersRes, addressRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_default', true)
      .single(),
  ])

  const recentOrders = (ordersRes.data ?? []) as unknown as Order[]
  const address = addressRes.data as unknown as Address | null

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.grid}>
        <div className={styles.block}>
          <p className={styles.blockLabel}>Recente bestellingen</p>
          {recentOrders.length === 0 ? (
            <p className={styles.empty}>Nog geen bestellingen.</p>
          ) : (
            <div className={styles.orderList}>
              {recentOrders.map((order) => (
                <div key={order.id} className={styles.orderRow}>
                  <div>
                    <p className={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <p className={styles.orderStatus}>{statusLabel(order.status)}</p>
                  </div>
                  <p className={styles.orderTotal}>
                    &euro;{(order.total_amount / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link href="/account/orders" className={styles.blockLink}>
            Alle bestellingen bekijken
          </Link>
        </div>

        <div className={styles.block}>
          <p className={styles.blockLabel}>Standaard afleveradres</p>
          {address ? (
            <address className={styles.addressBlock}>
              <span>{address.full_name}</span>
              <span>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</span>
              <span>{address.postal_code} {address.city}</span>
              <span>{address.country}</span>
            </address>
          ) : (
            <p className={styles.empty}>Geen adres opgeslagen.</p>
          )}
          <Link href="/account/profile" className={styles.blockLink}>
            {address ? 'Adres wijzigen' : 'Adres toevoegen'}
          </Link>
        </div>
      </div>

      <div className={styles.cta}>
        <Link href="/shop" className={styles.ctaBtn}>
          Shop de collectie
        </Link>
      </div>
    </div>
  )
}
