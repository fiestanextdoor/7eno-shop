import { cookies } from 'next/headers'
import { PREVIEW_COOKIE, isPreviewCookieValue, isPreviewEnabled } from '@/lib/preview'

/**
 * Whether this request carries a valid preview cookie. Reads cookies() only
 * when preview is enabled: cookies() opts the route into dynamic rendering,
 * which production (preview disabled) never pays for.
 */
export async function isPreviewSession(): Promise<boolean> {
  if (!isPreviewEnabled()) return false
  const store = await cookies()
  return isPreviewCookieValue(store.get(PREVIEW_COOKIE)?.value)
}
