/**
 * Builds a URL slug from a Printful product name, e.g.
 * "7ENO Blood/Butter Loafers Women" -> "blood-butter-loafers-women".
 * The leading "7eno" brand token is dropped since it is implied by the domain.
 */
export function productSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^7eno\s+/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
