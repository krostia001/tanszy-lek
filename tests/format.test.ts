import { describe, expect, it } from 'vitest'
import { capitalize, describeCategory, formatDate, formatPln, nameWithStrength, plural, sentenceEnd } from '../src/utils/format'
import { normalizeText } from '../src/shared/utils/text'

describe('formatting for Polish readers', () => {
  it('formats money in złoty', () => {
    expect(formatPln(2.49).replace(/\s/g, ' ')).toBe('2,49 zł')
  })

  it('never shows "NaN zł" for a missing price', () => {
    expect(formatPln(undefined)).toBe('—')
    expect(formatPln(null)).toBe('—')
    expect(formatPln(Number.NaN)).toBe('—')
  })

  it('formats dates the Polish way', () => {
    expect(formatDate('2026-11-16')).toBe('16.11.2026')
  })

  it.each([
    [1, '1 odpowiednik'],
    [3, '3 odpowiedniki'],
    [5, '5 odpowiedników'],
    [12, '12 odpowiedników'],
    [22, '22 odpowiedniki'],
  ])('uses the right plural form for %i', (count, expected) => {
    expect(plural(count, ['odpowiednik', 'odpowiedniki', 'odpowiedników'])).toBe(expected)
  })

  it('adds the strength to a name only when the name does not have it', () => {
    expect(nameWithStrength('Atoris', '40 mg')).toBe('Atoris 40 mg')
    expect(nameWithStrength('Torvacard 40', '40 mg')).toBe('Torvacard 40')
    expect(nameWithStrength('Nolpaza 40 mg tabletki dojelitowe', '40 mg')).toBe('Nolpaza 40 mg tabletki dojelitowe')
    expect(nameWithStrength('Euthyrox N 100', '100 mcg')).toBe('Euthyrox N 100')
    expect(nameWithStrength('Ibuprofen', null)).toBe('Ibuprofen')
  })

  it('ends sentences without doubling the full stop', () => {
    expect(sentenceEnd('30 tabl.')).toBe('30 tabl.')
    expect(sentenceEnd('1 fiol. 5 ml')).toBe('1 fiol. 5 ml.')
  })

  it('describes availability categories in plain words', () => {
    expect(describeCategory('OTC')).toBe('bez recepty')
    expect(describeCategory('Rp')).toBe('na receptę')
  })

  it('capitalizes the first letter', () => {
    expect(capitalize('obwieszczenie z 16.09.2026')).toBe('Obwieszczenie z 16.09.2026')
  })
})

describe('search text normalisation', () => {
  it('ignores case, Polish letters and extra spaces', () => {
    expect(normalizeText('  Łagodny   ŻEL ')).toBe('lagodny zel')
    expect(normalizeText('Atorvasterol')).toBe('atorvasterol')
  })
})
