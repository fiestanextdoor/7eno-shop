/**
 * The v2 brand outside CSS: palette values and the files in public/brand, with
 * their pixel sizes. Mail, the manifest, the favicon, the OG images and the
 * logo component read from here, so a new export from Joep changes one place.
 * Generated sizes come from scripts/build-brand-assets.mjs.
 */
import generated from './brand-assets.json'

export const BRAND_COLOURS = {
  navy: '#2D3A4F',
  cream: '#F7F1DA',
  periwinkle: '#7995C7',
  orange: '#FEAB27',
} as const

export type BrandTone = 'navy' | 'cream'

export interface BrandImage {
  src: string
  width: number
  height: number
}

export interface BrandIcon extends BrandImage {
  purpose: 'any' | 'maskable'
}

export interface BrandVideo extends BrandImage {
  poster: string
  label: string
}

function generatedImage(name: keyof typeof generated): BrandImage {
  return { src: `/brand/${name}`, width: generated[name].width, height: generated[name].height }
}

/** The 7ENO wordmark on a transparent ground: navy on cream, cream on navy. */
export const WORDMARK: Record<BrandTone, BrandImage> = {
  navy: generatedImage('7eno-wordmark-navy.png'),
  cream: generatedImage('7eno-wordmark-cream.png'),
}

/** The 7 with the lightning bolt, the favicon and footer mark. */
export const BEELDMERK: Record<BrandTone, BrandImage> = {
  navy: generatedImage('beeldmerk-navy.png'),
  cream: generatedImage('beeldmerk-cream.png'),
}

export const APP_ICONS: BrandIcon[] = [
  { ...generatedImage('icon-192.png'), purpose: 'any' },
  { ...generatedImage('icon-512.png'), purpose: 'any' },
  { ...generatedImage('icon-maskable-512.png'), purpose: 'maskable' },
]

export const OLYMPN_SPORT_WORDMARK: BrandImage = { src: '/brand/olympn-sport-wordmark-orange.png', width: 1600, height: 519 }
export const OLYMPN_BADGE: BrandImage = { src: '/brand/olympn-badge-orange.png', width: 800, height: 238 }
export const SOMETHING_IS_COMING: BrandImage = { src: '/brand/something-is-coming.webp', width: 1080, height: 1080 }
export const MODEL_DUNE: BrandImage = { src: '/brand/model-dune.webp', width: 1381, height: 2000 }
/** Square 7ENO tile (periwinkle on navy): the schema.org organisation logo. */
export const SEVENO_TILE: BrandImage = { src: '/brand/instagram-logo-nieuw.webp', width: 750, height: 750 }

export const SPORT_ADS: BrandVideo[] = [
  { src: '/brand/ad-dune.mp4', poster: '/brand/ad-dune-poster.jpg', width: 720, height: 1280, label: 'OLYMPN Sport ad in Dune' },
  { src: '/brand/ad-pistachio.mp4', poster: '/brand/ad-pistachio-poster.jpg', width: 720, height: 1280, label: 'OLYMPN Sport ad in Pistachio' },
]

/** Height of `image` drawn `width` wide, keeping its ratio. */
export function heightAt(image: BrandImage, width: number): number {
  return Math.round((width * image.height) / image.width)
}

/** Width of `image` drawn `height` tall, keeping its ratio. */
export function widthAt(image: BrandImage, height: number): number {
  return Math.round((height * image.width) / image.height)
}
