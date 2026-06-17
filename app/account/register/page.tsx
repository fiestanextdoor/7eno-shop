'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GoogleSignIn from '@/components/GoogleSignIn/GoogleSignIn'
import styles from '../login/login.module.css'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.brand}>7ENO</p>
          <h1 className={styles.title}>Confirm your email</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--stone)', lineHeight: 1.6 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>7ENO</p>
        <h1 className={styles.title}>Register</h1>

        <GoogleSignIn
          redirectTo="/account/dashboard"
          text="signup_with"
          fallbackLabel="Continue with Google"
          fallbackClassName={styles.googleBtn}
          onError={setError}
        />

        <div className={styles.divider}><span>or</span></div>

        <form onSubmit={handleRegister} className={styles.form}>
          <label className={styles.fieldLabel}>Full name</label>
          <input
            type="text"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            placeholder="John Smith"
          />

          <label className={styles.fieldLabel}>Email address</label>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <label className={styles.fieldLabel}>Password</label>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Loading...' : 'Create account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/account/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
