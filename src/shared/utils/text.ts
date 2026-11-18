/**
 * Lower-case text without Polish diacritics, the same as the norm() macro in scripts/lib/load.ts:
 * "Łagodny ŻEL" -> "lagodny zel". Used to compare what people type with medicine names.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replaceAll('ł', 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}
