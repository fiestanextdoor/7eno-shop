// Gedeelde bouwstenen voor transactionele e-mails (order-confirmation,
// order-shipped, …). Eén bron voor het brand-palet en de HTML-helpers zodat een
// kleurwijziging of een escaping-fix niet in meerdere templates hoeft te worden
// nagelopen.

import { BEELDMERK, WORDMARK, heightAt, type BrandImage } from '../brand'

// Brand palette for mail, the official v2 values from styles/tokens.css (mail
// clients cannot read CSS variables). Periwinkle fails text contrast on white
// and cream, so text that needs the accent uses ACCENT_INK.
export const INK = '#2D3A4F' // --c-text: all text, primary button
export const BONE = '#F7F1DA' // --c-bg: outer background, text on navy
export const SURFACE = '#FFFFFF' // --c-surface: the card
export const ACCENT = '#7995C7' // --c-accent: bars and rules, never text
export const ACCENT_INK = '#3E5A8F' // --c-accent-ink: references, labels, links
export const MUTED = '#5B5A58' // --c-text-muted
export const RULE = '#C4C4B5' // --c-stone: hairlines and borders
// Web-safe faces (spec section 8): the brand fonts do not load in mail clients.
export const DISPLAY = "'Arial Black', Arial, sans-serif"
export const BODY = 'Arial, Helvetica, sans-serif'
export const MONO = "'Courier New', Courier, monospace"

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function firstName(fullName: string): string {
  const token = fullName.trim().split(/\s+/)[0]
  return token || 'there'
}

/** Absolute origin for logos/links; mail clients can't resolve relative URLs. */
export function emailBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.7eno.shop').replace(/\/+$/, '')
}

/** Header wordmark sized for a 600px column; fixed attributes stop Outlook from scaling it. */
export const EMAIL_WORDMARK: BrandImage = { src: WORDMARK.navy.src, width: 120, height: heightAt(WORDMARK.navy, 120) }

/** Footer mark. */
export const EMAIL_MARK: BrandImage = { src: BEELDMERK.navy.src, width: 28, height: heightAt(BEELDMERK.navy, 28) }

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}
