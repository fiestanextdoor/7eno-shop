import { FLAT_SHIPPING_RATE, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { CATEGORIES, matchesCategory } from '@/lib/shop-query'

/** One accordion section on the product page. */
export interface InfoSection {
  title: string
  lines: string[]
}

/**
 * Standard care for 7ENO's printed apparel. Printful exposes no care field,
 * so this is the recommended care for DTF and all-over prints (moved from the
 * old ProductDetail).
 */
export const CARE_INSTRUCTIONS = [
  'Machine wash cold, inside out, gentle cycle',
  'Use mild detergent, do not bleach',
  'Tumble dry low or hang to dry',
  'Do not iron directly on the print',
  'Do not dry clean',
]

/** "Hoodies": the shop category, used as the size guide title. */
export function categoryLabel(name: string): string {
  return CATEGORIES.find((c) => matchesCategory(name, c.value))?.label ?? 'Product'
}

/** Only what the product name itself says about the fit; no invented claims. */
export function fitFromName(name: string): string | null {
  if (/\boversized\b/i.test(name)) return 'Oversized fit: roomy through the body and sleeves.'
  if (/\brelaxed\b/i.test(name)) return 'Relaxed fit: an easy, slightly loose cut.'
  return null
}

export interface ProductInfoInput {
  productName: string
  materials: string[]
  modelNote?: string
  dropTitle: string
  editionLabel: string
}

/** Details, Fit, Shipping and returns (spec section 5). */
export function productInfoSections({
  productName,
  materials,
  modelNote,
  dropTitle,
  editionLabel,
}: ProductInfoInput): InfoSection[] {
  const fit = [fitFromName(productName), modelNote ?? null, 'Body measurements per size are in the size guide.'].filter(
    (line): line is string => line !== null
  )
  return [
    {
      title: 'Details',
      lines: [`${dropTitle}, ${editionLabel}. Made to order by 7ENO, Abra Entertainment.`, ...materials, ...CARE_INSTRUCTIONS],
    },
    { title: 'Fit', lines: fit },
    {
      title: 'Shipping and returns',
      lines: [
        `Flat €${FLAT_SHIPPING_RATE.toFixed(2)} shipping, free on orders over €${FREE_SHIPPING_THRESHOLD.toFixed(0)}.`,
        'Made to order: delivered in 5 to 10 business days.',
        'Returns within 14 days, see the returns policy.',
      ],
    },
  ]
}
