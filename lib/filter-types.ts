/** URL-state shape of the shop filters (spec section 5: ShopFilters provides it, FilterBar renders it). */
export interface FilterItem {
  label: string
  href: string
  active: boolean
}

export interface FilterGroup {
  label: string
  items: FilterItem[]
}
