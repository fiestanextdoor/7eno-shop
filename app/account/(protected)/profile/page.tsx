'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Address } from '@/lib/supabase/types'
import styles from './profile.module.css'

const COUNTRIES = [
  { code: 'NL', name: 'Nederland' },
  { code: 'BE', name: 'België' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'GB', name: 'Verenigd Koninkrijk' },
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
      setError('Opslaan mislukt. Probeer opnieuw.')
    } else {
      setSaved(true)
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Profiel & Adres</h1>
      <p className={styles.subtitle}>
        Sla je afleveradres op voor een snellere checkout.
      </p>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.section}>
          <p className={styles.sectionLabel}>Afleveradres</p>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Volledige naam</label>
              <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jan Janssen" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Straat + huisnummer</label>
              <input className={styles.input} value={line1} onChange={(e) => setLine1(e.target.value)} required placeholder="Keizersgracht 1" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Toevoeging (optioneel)</label>
              <input className={styles.input} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="App. B" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Postcode</label>
              <input className={styles.input} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required placeholder="1234 AB" />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Stad</label>
              <input className={styles.input} value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Amsterdam" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Land</label>
              <select className={styles.input} value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {saved && <p className={styles.success}>Adres opgeslagen.</p>}

        <button type="submit" className={styles.saveBtn} disabled={loading}>
          {loading ? 'Opslaan...' : 'Adres opslaan'}
        </button>
      </form>
    </div>
  )
}
