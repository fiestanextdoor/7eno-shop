import type { MetadataRoute } from 'next'
import { BRAND } from '@/lib/seo'

// Web app manifest: lets the store be installed/added to a home screen and
// gives Android and Chrome an explicit, correct brand name. `name` carries the
// spoken spelling so on-device search for "Zeno" finds it too.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} (Zeno) — Premium Streetwear`,
    short_name: BRAND.name,
    description:
      '7ENO (pronounced "Zeno") is the official online streetwear store by Abra Entertainment. Shop the OG and Olympian collections.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7EED6',
    theme_color: '#297d95',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/logos/beeldmerk-zwart.png', sizes: 'any', type: 'image/png' },
    ],
  }
}
