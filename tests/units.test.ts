import { describe, expect, it } from 'vitest'
import { doseUnits, unitPrice } from '../src/shared/utils/units'
import { countUnits, oneUnit } from '../src/utils/format'

describe('tablets and capsules in a package', () => {
  // sizes copied from the register
  it.each([
    ['30 tabl.', { count: 30, unit: 'tabl' }],
    ['28 tabl. (2 x 14)', { count: 28, unit: 'tabl' }],
    ['90 tabl. w blistrze', { count: 90, unit: 'tabl' }],
    ['30 tabl. (30 x 1 tabl.)', { count: 30, unit: 'tabl' }],
    ['50 kaps.', { count: 50, unit: 'kaps' }],
    ['28 szt. w blistrach', { count: 28, unit: 'szt' }],
  ])('reads %s', (size, expected) => {
    expect(doseUnits(size)).toEqual(expected)
  })

  it.each([
    '1 butelka 75 ml',
    '10 amp.-strzyk. 0,2 ml',
    '1 inhalator 200 dawek proszkowy',
    '20 sasz. 3 g',
    '31 tabl. (3 tabl. 100 IR + 28 tabl. 300 IR)',
    '0 tabl.',
  ])('does not count pieces in %s', (size) => {
    expect(doseUnits(size)).toBeNull()
  })

  it('gives the price of one tablet', () => {
    expect(unitPrice(22.33, '90 tabl. w blistrze')).toBeCloseTo(0.2481, 4)
  })

  it('has no price per tablet without a package price or countable pieces', () => {
    expect(unitPrice(null, '30 tabl.')).toBeNull()
    expect(unitPrice(12.5, '1 butelka 75 ml')).toBeNull()
  })

  it('names the unit the Polish way', () => {
    expect(oneUnit('tabl')).toBe('tabletkę')
    expect(oneUnit('kaps')).toBe('kapsułkę')
    expect(countUnits(30, 'tabl')).toBe('30 tabletek')
    expect(countUnits(22, 'kaps')).toBe('22 kapsułki')
    expect(countUnits(1, 'szt')).toBe('1 sztukę')
  })
})
