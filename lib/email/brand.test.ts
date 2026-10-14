import { WORDMARK, BEELDMERK } from '../brand'
import {
  ACCENT, ACCENT_INK, BODY, BONE, DISPLAY, EMAIL_MARK, EMAIL_WORDMARK, INK, MONO, MUTED, RULE, SURFACE, escapeHtml,
} from './brand'

describe('email brand', () => {
  it('uses the official palette, with a darker accent for text', () => {
    expect({ INK, BONE, SURFACE, ACCENT, ACCENT_INK, MUTED, RULE }).toEqual({
      INK: '#2D3A4F', BONE: '#F7F1DA', SURFACE: '#FFFFFF', ACCENT: '#7995C7',
      ACCENT_INK: '#3E5A8F', MUTED: '#5B5A58', RULE: '#C4C4B5',
    })
  })

  it('uses web-safe faces from spec section 8', () => {
    expect(DISPLAY).toBe("'Arial Black', Arial, sans-serif")
    expect(BODY).toBe('Arial, Helvetica, sans-serif')
    expect(MONO).toBe("'Courier New', Courier, monospace")
  })

  it('sizes the logos for a 600px mail column, keeping their ratio', () => {
    expect(EMAIL_WORDMARK).toEqual({
      src: WORDMARK.navy.src, width: 120, height: Math.round((120 * WORDMARK.navy.height) / WORDMARK.navy.width),
    })
    expect(EMAIL_MARK.src).toBe(BEELDMERK.navy.src)
    expect(EMAIL_MARK.width).toBe(28)
  })

  it('escapes each special character once', () => {
    expect(escapeHtml('Tee & Towel "Set" <b>')).toBe('Tee &amp; Towel &quot;Set&quot; &lt;b&gt;')
  })
})
