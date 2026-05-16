'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './AccountButton.module.css'

export default function AccountButton() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Link
      href={loggedIn ? '/account/dashboard' : '/account/login'}
      className={styles.btn}
      aria-label={loggedIn ? 'Mijn account' : 'Inloggen'}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      {loggedIn && <span className={styles.dot} aria-hidden="true" />}
    </Link>
  )
}
