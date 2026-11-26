/** Countable dose units in a package: tablets, capsules or pieces. */
export type DoseUnit = 'tabl' | 'kaps' | 'szt'

export interface DoseUnits {
  count: number
  unit: DoseUnit
}

/**
 * Number of tablets or capsules in a package, read from its size in the register:
 * "30 tabl." -> 30 tablets, "28 tabl. (2 x 14)" -> 28 tablets, "50 kaps." -> 50 capsules.
 *
 * Gives null when a price per piece says nothing about the dose: liquids ("1 butelka 75 ml"),
 * injections ("10 amp.-strzyk. 0,2 ml"), inhalers and packs that mix strengths
 * ("31 tabl. (3 tabl. 100 IR + 28 tabl. 300 IR)").
 */
export function doseUnits(size: string): DoseUnits | null {
  if (size.includes('+')) {
    return null
  }
  const match = size.match(/^\s*(\d+)\s*(tabl|kaps|szt)\./)
  const count = Number(match?.[1])
  return match && count > 0 ? { count, unit: match[2] as DoseUnit } : null
}

/** Price of one tablet or capsule, or null when the package has no price or no countable units. */
export function unitPrice(price: number | null, size: string): number | null {
  const units = doseUnits(size)
  return price === null || !units ? null : price / units.count
}
