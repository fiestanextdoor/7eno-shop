import { classify } from '@/lib/product-classify'

export const CATEGORIES = [
  { value: 'tees', label: 'Tees' },
  { value: 'knits', label: 'Knits' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'bags', label: 'Bags' },
] as const
export type Category = (typeof CATEGORIES)[number]['value']

/** Every piece sits in exactly one category: a knitted tee is a knit, not a tee. */
export function matchesCategory(name: string, category: Category): boolean {
  const kind = classify(name)
  switch (category) {
    case 'tees':
      return kind.isTee && !kind.isKnit
    case 'knits':
      return kind.isKnit
    case 'hoodies':
      return kind.isHoodie
    case 'bags':
      return kind.isBag
  }
}

/** The one category a name falls in, or null for pieces outside the four. */
export function categoryOf(name: string): Category | null {
  return CATEGORIES.find((c) => matchesCategory(name, c.value))?.value ?? null
}
