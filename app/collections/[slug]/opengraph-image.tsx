import { ImageResponse } from 'next/og'
import { OG_SIZE, OgCard, loadOgFont, ogCardProps } from '@/lib/og'

// Per-collection social preview on the drop's own tone (spec section 8).
export const alt = 'A 7ENO edition: edition number, title and wordmark'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function CollectionOpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [props, font] = await Promise.all([ogCardProps(slug), loadOgFont()])
  return new ImageResponse(<OgCard {...props} />, { ...size, fonts: [font] })
}
