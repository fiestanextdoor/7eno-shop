'use client'

import { useId, useRef, useState, type FormEvent } from 'react'
import Button from '@/components/ui/Button/Button'
import { HONEYPOT_FIELD } from '@/lib/waitlist'
import styles from './WaitlistForm.module.css'

export interface WaitlistFormProps {
  dropId?: string
  productSlug?: string
  compact?: boolean
  /** Field label; defaults to the drop wording. The sold-out notify form says "Email me when it is back". */
  label?: string
  /** Shown after a successful signup. */
  doneMessage?: string
}

type Status = 'idle' | 'sending' | 'done' | 'error'

/** Email signup for a drop or product. Colours follow the surrounding surface. */
export default function WaitlistForm({
  dropId,
  productSlug,
  compact = false,
  label,
  doneMessage = "You're on the list. We'll email you when it drops.",
}: WaitlistFormProps) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  // Flips synchronously, before React re-renders the disabled button, so a
  // second click or Enter during the request is ignored.
  const inFlight = useRef(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || status === 'done') return
    inFlight.current = true
    setStatus('sending')
    setMessage('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dropId, productSlug, [HONEYPOT_FIELD]: trap }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (res.ok) {
        setStatus('done')
        setMessage(doneMessage)
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Could not join the waitlist. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    } finally {
      inFlight.current = false
    }
  }

  return (
    <form className={styles.form} data-compact={compact ? 'true' : 'false'} onSubmit={onSubmit}>
      <label htmlFor={`${id}-email`} className={styles.label}>
        {label ?? (compact ? 'Email for drop alerts' : 'Get notified when it drops')}
      </label>
      <div className={styles.row}>
        <input
          id={`${id}-email`}
          className={styles.input}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'done'}
          aria-describedby={`${id}-status`}
          aria-invalid={status === 'error' ? true : undefined}
        />
        <Button type="submit" variant="accent" loading={status === 'sending'} disabled={status === 'done'}>
          Notify me
        </Button>
      </div>
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${id}-trap`}>Company</label>
        <input
          id={`${id}-trap`}
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
        />
      </div>
      <p id={`${id}-status`} className={styles.status} role="status" aria-live="polite" data-status={status}>
        {message}
      </p>
    </form>
  )
}
