'use client'

import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './GoogleSignIn.module.css'

// Public Web-application OAuth client ID. When set, the sign-in flow uses
// Google Identity Services on our own domain, so the Google consent screen
// shows "7eno.shop" instead of the Supabase project URL. When unset (e.g. a
// preview build without the env var) we fall back to the Supabase redirect
// flow so login keeps working.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

const GSI_SRC = 'https://accounts.google.com/gsi/client'

type GoogleCredentialResponse = { credential: string }

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            nonce?: string
          }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

type Props = {
  /** Where to send the user after a successful sign-in. */
  redirectTo: string
  /** Label variant for the native Google button. */
  text?: GoogleButtonText
  /** Label for the fallback button (used only when CLIENT_ID is unset). */
  fallbackLabel?: string
  /** Class applied to the fallback button so it matches the page styling. */
  fallbackClassName?: string
  /** Surface a user-facing error message. */
  onError?: (message: string) => void
}

/** Hex-encoded SHA-256 of `input`, using the Web Crypto API (browser only). */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default function GoogleSignIn({
  redirectTo,
  text = 'continue_with',
  fallbackLabel = 'Continue with Google',
  fallbackClassName,
  onError,
}: Props) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const nonceRef = useRef<{ raw: string; hashed: string } | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [nonceReady, setNonceReady] = useState(false)

  // Prepare a one-time nonce: Google embeds the SHA-256 hash in the ID token,
  // while Supabase receives the raw value and hashes-and-compares it. This binds
  // the token to this exact sign-in attempt and blocks replay.
  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    const raw = crypto.randomUUID()
    sha256Hex(raw).then((hashed) => {
      if (cancelled) return
      nonceRef.current = { raw, hashed }
      setNonceReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      const nonce = nonceRef.current
      if (!nonce) return
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: nonce.raw,
      })
      if (error) {
        onError?.('Google sign-in failed. Please try again.')
        return
      }
      router.push(redirectTo)
      router.refresh()
    },
    [router, redirectTo, onError]
  )

  // Once the GIS script and the nonce are both ready, initialise and render the
  // official Google button into our container.
  useEffect(() => {
    if (!CLIENT_ID || !scriptReady || !nonceReady) return
    const google = window.google
    const container = containerRef.current
    if (!google || !container) return

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
      nonce: nonceRef.current!.hashed,
    })
    container.replaceChildren()
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text,
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 320,
    })
  }, [scriptReady, nonceReady, handleCredential, text])

  // Fallback: no client ID configured, keep the original Supabase redirect flow.
  if (!CLIENT_ID) {
    const handleFallback = async () => {
      const supabase = createClient()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
      })
    }
    return (
      <button type="button" className={fallbackClassName} onClick={handleFallback}>
        <GoogleGlyph />
        {fallbackLabel}
      </button>
    )
  }

  return (
    <>
      <Script src={GSI_SRC} strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} className={styles.button} />
    </>
  )
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}