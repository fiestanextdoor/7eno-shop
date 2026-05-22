import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountLogout from './AccountLogout'
import styles from './account.layout.module.css'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/account/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { full_name: string | null } | null
  const displayName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Account'

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <p className={styles.sidebarLabel}>Account</p>
          <p className={styles.sidebarName}>{displayName}</p>
          <p className={styles.sidebarEmail}>{user.email}</p>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/account/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/account/orders" className={styles.navLink}>Orders</Link>
          <Link href="/account/profile" className={styles.navLink}>Profile & Address</Link>
        </nav>
        <AccountLogout />
      </aside>
      <main className={styles.content}>
        {children}
      </main>
    </div>
  )
}
