import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReactElement } from 'react'
import { BRAND_COLOURS, OLYMPN_SPORT_WORDMARK, WORDMARK, widthAt, type BrandImage } from './brand'
import { formatEdition, getDropBySlug } from './drops'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_FONT_FILE = 'app/_fonts/Archivo-ExpandedBlackItalic.ttf'
export const OG_FONT_FAMILY = 'Archivo'

export interface OgFont {
  name: string
  data: Buffer
  weight: 900
  style: 'italic'
}

export interface OgCardProps {
  label: string
  title: string
  tagline: string
  tone: 'light' | 'dark'
  /** `src` is a data URI: ImageResponse cannot fetch site-relative paths. */
  logo: BrandImage
}

async function inline(image: BrandImage): Promise<BrandImage> {
  const bytes = await readFile(path.join(process.cwd(), 'public', image.src))
  return { ...image, src: `data:image/png;base64,${bytes.toString('base64')}` }
}

export async function loadOgFont(): Promise<OgFont> {
  const data = await readFile(path.join(process.cwd(), OG_FONT_FILE))
  return { name: OG_FONT_FAMILY, data, weight: 900, style: 'italic' }
}

/** What the card for `slug` shows; the site-wide card when the slug is not an edition. */
export async function ogCardProps(slug?: string): Promise<OgCardProps> {
  const drop = slug ? getDropBySlug(slug) : null
  if (!drop) {
    return {
      label: 'Pronounced Zeno',
      title: 'Olympian and OLYMPN Sport',
      tagline: 'Numbered streetwear editions by Abra Entertainment',
      tone: 'light',
      logo: await inline(WORDMARK.navy),
    }
  }
  const logo = drop.id === 'olympn-sport' ? OLYMPN_SPORT_WORDMARK : drop.tone === 'dark' ? WORDMARK.cream : WORDMARK.navy
  return {
    label: formatEdition(drop.edition),
    title: drop.title,
    tagline: drop.intro,
    tone: drop.tone,
    logo: await inline(logo),
  }
}

/** The 1200x630 card: logo top left, edition label, big title, tagline, a colour bar. Flexbox only. */
export function OgCard({ label, title, tagline, tone, logo }: OgCardProps): ReactElement {
  const dark = tone === 'dark'
  const background = dark ? BRAND_COLOURS.navy : BRAND_COLOURS.cream
  const colour = dark ? BRAND_COLOURS.cream : BRAND_COLOURS.navy
  const logoHeight = logo.width / logo.height > 2 ? 96 : 120
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background,
        color: colour,
        fontFamily: OG_FONT_FAMILY,
        fontStyle: 'italic',
        fontWeight: 900,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img */}
      <img src={logo.src} alt="" width={widthAt(logo, logoHeight)} height={logoHeight} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 92, lineHeight: 0.95, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ display: 'flex', marginTop: 24, maxWidth: 960, fontSize: 26, lineHeight: 1.3 }}>{tagline}</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 16,
          display: 'flex',
          background: dark ? BRAND_COLOURS.orange : BRAND_COLOURS.periwinkle,
        }}
      />
    </div>
  )
}
