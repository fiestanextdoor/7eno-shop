import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgFont, ogCardProps } from '@/lib/og'

// Default social preview for every page that sets no image of its own
// (product pages pass their own photo). Rendered at build time.
export const alt = '7ENO (Zeno): Olympian and OLYMPN Sport, numbered streetwear editions by Abra Entertainment'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const [props, font] = await Promise.all([ogCardProps(), loadOgFont()])
  return new ImageResponse(<OgCard {...props} />, { ...size, fonts: [font] })
}
