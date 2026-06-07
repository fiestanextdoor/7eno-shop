import type { Bundle } from './bundles'

export interface BundleMemberItem {
  bundleId: string
  productId: string
  /** Whether the item's variant resolved to a real, available product variant. */
  resolved: boolean
}

/**
 * Sum of discounts for every complete & valid bundle present in the items,
 * clamped to the subtotal so the order can never go negative.
 *
 * A group (items sharing a bundleId) is valid iff the bundle exists, every
 * member resolved, and the set of member productIds exactly equals the set of
 * the bundle's product ids (one item per product, no extras, none missing).
 */
export function resolveBundleDiscountCents(
  items: BundleMemberItem[],
  subtotalCents: number,
  getBundle: (id: string) => Bundle | null,
): number {
  const groups = new Map<string, BundleMemberItem[]>()
  for (const item of items) {
    const group = groups.get(item.bundleId) ?? []
    group.push(item)
    groups.set(item.bundleId, group)
  }

  let discount = 0
  for (const [bundleId, members] of groups) {
    const bundle = getBundle(bundleId)
    if (!bundle) continue
    if (members.some((m) => !m.resolved)) continue

    // Reject duplicate items for the same product within one set instance.
    const haveSet = new Set(members.map((m) => m.productId))
    if (haveSet.size !== members.length) continue
    const have = [...haveSet].sort()
    const need = bundle.products.map((p) => p.productId).sort()
    if (have.length !== need.length) continue
    if (!need.every((id, i) => id === have[i])) continue

    discount += bundle.discountCents
  }

  // Source-of-truth money function: guarantee a non-negative result even if an
  // upstream bug passes a negative subtotal.
  const safeSubtotal = Math.max(0, subtotalCents)
  return Math.min(Math.max(discount, 0), safeSubtotal)
}
