'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Address } from '@/lib/supabase/types'
import styles from './profile.module.css'

const COUNTRIES = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
]

export default function ProfilePage() {
  const [address, setAddress] = useState<Address | null>(null)
  const [fullName, setFullName] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('NL')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: rawData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()
      const data = rawData as unknown as Address | null
      if (data) {
        setAddress(data)
        setFullName(data.full_name)
        setLine1(data.line1)
        setLine2(data.line2 ?? '')
        setCity(data.city)
        setPostalCode(data.postal_code)
        setCountry(data.country)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      full_name: fullName,
      line1,
      line2: line2 || null,
      city,
      postal_code: postalCode,
      country,
      is_default: true,
    }

    let err
    if (address) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (supabase.from('addresses') as any).update(payload).eq('id', address.id)
      err = res.error
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (supabase.from('addresses') as any).insert(payload)
      err = res.error
    }

    if (err) {
      setError('Failed to save. Please try again.')
    } else {
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Profile & Address</h1>
      <p className={styles.subtitle}>
        Save your delivery address for faster checkout.
      </p>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Delivery address</p>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Full name</label>
              <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Smith" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Street address</label>
              <input className={styles.input} value={line1} onChange={(e) => setLine1(e.target.value)} required placeholder="123 Main St" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Apartment, suite, etc. (optional)</label>
              <input className={styles.input} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Apt. B" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Postal code</label>
              <input className={styles.input} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required placeholder="1234 AB" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>City</label>
              <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Amsterdam" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Country</label>
              <select className={styles.input} value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {saved && <p className={styles.success}>Address saved.</p>}

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Saving...' : 'Save address'}
        </button>
      </form>
    </div>
  )
}
