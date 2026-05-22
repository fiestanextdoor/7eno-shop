'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './account.layout.module.css'

export default function AccountLogout() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button className={styles.logoutBtn} onClick={handleLogout}>
      Sign out
    </button>
  )
}
