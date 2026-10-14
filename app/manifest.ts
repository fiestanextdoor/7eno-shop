import type { MetadataRoute } from 'next'
import { APP_ICONS } from '@/lib/brand'
import { BACKGROUND_COLOR, BRAND, SITE_DESCRIPTION, THEME_COLOR } from '@/lib/seo'

// Web app manifest: lets the store be installed to a home screen and gives
// Android and Chrome the brand name. `name` carries the spoken spelling so
// on-device search for "Zeno" finds it too. Icons declare their real pixel
// size: Chrome rejects a PNG whose declared size does not match.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} (Zeno) · Numbered streetwear editions`,
    short_name: BRAND.name,
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    categories: ['shopping', 'lifestyle'],
    icons: APP_ICONS.map((icon) => ({
      src: icon.src,
      sizes: `${icon.width}x${icon.height}`,
      type: 'image/png',
      purpose: icon.purpose,
    })),
  }
}
