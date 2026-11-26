import type { DoseUnit } from '../shared/utils/units'

const pln = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })
const pluralRules = new Intl.PluralRules('pl-PL')

/** 2.49 -> "2,49 zł". A missing or broken number is shown as a dash, never as "NaN zł". */
export function formatPln(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? pln.format(value) : '—'
}

/** "2026-11-16" -> "16.11.2026" */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

/** Polish plural forms: plural(5, ['odpowiednik', 'odpowiedniki', 'odpowiedników']) -> "5 odpowiedników" */
export function plural(count: number, [one, few, many]: [string, string, string]): string {
  const form = pluralRules.select(count)
  const word = form === 'one' ? one : form === 'few' ? few : many
  return `${count} ${word}`
}

/** Word forms after "za" and "na" (accusative): za tabletkę, na 3 tabletki, na 30 tabletek. */
const UNIT_WORDS: Record<DoseUnit, [string, string, string]> = {
  tabl: ['tabletkę', 'tabletki', 'tabletek'],
  kaps: ['kapsułkę', 'kapsułki', 'kapsułek'],
  szt: ['sztukę', 'sztuki', 'sztuk'],
}

/** "tabl" -> "tabletkę", as in "0,28 zł za tabletkę". */
export function oneUnit(unit: DoseUnit): string {
  return UNIT_WORDS[unit][0]
}

/** (30, "tabl") -> "30 tabletek", as in "w przeliczeniu na 30 tabletek". */
export function countUnits(count: number, unit: DoseUnit): string {
  return plural(count, UNIT_WORDS[unit])
}

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '').replace('mcg', 'µg')

/**
 * "Atoris" + "40 mg" -> "Atoris 40 mg".
 * Names that already carry the dose stay as they are: "Torvacard 40", "Nolpaza 40 mg tabletki".
 */
export function nameWithStrength(name: string, strength: string | null): string {
  if (!strength || normalize(name).includes(normalize(strength))) {
    return name
  }
  const amount = strength.match(/^\d+(?:[.,]\d+)?/)?.[0]
  if (amount && new RegExp(`(^|\\s)${amount.replace('.', '\\.')}(\\s|$)`).test(name)) {
    return name
  }
  return `${name} ${strength}`
}

/** Adds a full stop unless the text already ends with one ("30 tabl."). */
export function sentenceEnd(text: string): string {
  return text.endsWith('.') ? text : `${text}.`
}

/** "obwieszczenie z 16.09.2026" -> "Obwieszczenie z 16.09.2026" */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const CATEGORIES: Record<string, string> = {
  OTC: 'bez recepty',
  Rp: 'na receptę',
  Rpz: 'na receptę, do zastrzeżonego stosowania',
  Rpw: 'na receptę, zawiera substancje kontrolowane',
  Lz: 'tylko w szpitalu',
  LzRp: 'w szpitalu lub na receptę',
}

/** Availability category of a package in plain words. */
export function describeCategory(category: string): string {
  return CATEGORIES[category] ?? category
}
