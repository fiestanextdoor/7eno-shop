// Gedeelde bouwstenen voor transactionele e-mails (order-confirmation,
// order-shipped, …). Eén bron voor het brand-palet en de HTML-helpers zodat een
// kleurwijziging of een escaping-fix niet in meerdere templates hoeft te worden
// nagelopen.

// ── Brand palette (mirrors styles/globals.css) ──────────────────────────────
export const INK = '#111111'
export const BONE = '#F6F3EC'
export const PAPER = '#EDE8DD'
export const OXBLOOD = '#5C1A1B'
export const STONE = '#8A8275'
export const RULE = '#C8C1B2'
// Web-safe serif: real Cormorant won't load in mail clients, Georgia carries
// the same high-contrast, "divine" feel.
export const SERIF = "Georgia, 'Times New Roman', Times, serif"
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

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}
