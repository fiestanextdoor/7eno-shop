/**
 * Fase 0-guard: producten die al in de Printful-store staan maar nog niet
 * uit zijn. Productie toont ze niet en de checkout weigert ze. Deze module
 * verdwijnt zodra de drop-logica (`lib/drops.ts`, redesign/v2) op master staat.
 *
 * De spatie na "Sport" is bewust: OG-namen als "Ink/Butter Sport Tee" en een
 * toekomstige "OLYMPN Sportswear" mogen niet geraakt worden.
 */
export const UNRELEASED_NAME_PREFIXES: readonly string[] = ['OLYMPN Sport ']

/** Witruimte gelijktrekken (ook non-breaking space) en hoofdletterongevoelig maken. */
function comparable(value: string): string {
  return value.replace(/\s+/g, ' ').trimStart().toLowerCase()
}

/** True wanneer de productnaam met een niet-vrijgegeven prefix begint. */
export function isUnreleasedProductName(name: string): boolean {
  const n = comparable(name)
  return UNRELEASED_NAME_PREFIXES.some((prefix) => n.startsWith(comparable(prefix)))
}
