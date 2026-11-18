import { DuckDBInstance, type DuckDBConnection } from '@duckdb/node-api'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildModel, loadProductsRaw, loadRefundRaw, loadSourcesMeta, modelStats } from '../scripts/lib/load'

// Small samples of the real data, made by scripts/make-fixtures.ts:
// atorvastatin and levothyroxine from several makers, parallel imports,
// two veterinary products and products with an expired permit.
const FIXTURES = 'tests/fixtures'

describe('data pipeline (DuckDB)', () => {
  let instance: DuckDBInstance
  let connection: DuckDBConnection

  const rows = async (sql: string) => (await connection.runAndReadAll(sql)).getRowObjectsJson()
  const value = async (sql: string) => Object.values((await rows(sql))[0] ?? {})[0]

  beforeAll(async () => {
    instance = await DuckDBInstance.create(':memory:')
    connection = await instance.connect()
    await loadSourcesMeta(connection, `${FIXTURES}/sources.json`)
    await loadProductsRaw(connection, `${FIXTURES}/rpl-sample.csv`)
    await loadRefundRaw(connection, `${FIXTURES}/mz-sample.xlsx`)
    await buildModel(connection)
  })

  afterAll(() => {
    connection.closeSync()
    instance.closeSync()
  })

  describe('raw data', () => {
    it('loads every row of the register sample', async () => {
      expect(await value('SELECT count(*)::INTEGER FROM products_raw')).toBe(21)
    })

    it('keeps multi-line package lists in a single field', async () => {
      const packages = await value(`SELECT "Opakowanie" FROM products_raw WHERE "Nazwa Produktu Leczniczego" = 'Atorvasterol' LIMIT 1`)
      expect(packages).toMatch(/\d{14} ¦ Rp ¦ \d+\n/)
    })

    it('reads the refund list header from row 2 of the XLSX', async () => {
      const columns = (await rows('DESCRIBE refund_raw')).map(column => column.column_name)
      expect(columns).toEqual(expect.arrayContaining([
        'Numer GTIN lub inny kod jednoznacznie identyfikujący produkt',
        'Cena detaliczna',
        'Wysokość dopłaty świadczeniobiorcy',
      ]))
    })

    it('stores the data sources with their dates', async () => {
      const sources = await rows('SELECT key, datasetId, dataDate::VARCHAR AS dataDate FROM sources ORDER BY key')
      expect(sources).toEqual([
        { key: 'mz', datasetId: null, dataDate: null },
        { key: 'rpl', datasetId: 397, dataDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
      ])
    })
  })

  describe('products', () => {
    it('skips veterinary products', async () => {
      expect(await value(`SELECT count(*)::INTEGER FROM products WHERE name IN ('AviPro Salmonella Duo', 'Parvoerysin')`)).toBe(0)
    })

    it('skips products whose permit expired before the data snapshot', async () => {
      expect(await value(`SELECT count(*)::INTEGER FROM products WHERE name = 'Torvalipin'`)).toBe(0)
    })

    it('gives every product a readable, unique address', async () => {
      expect(await value(`SELECT slug FROM products WHERE name = 'Atorvasterol' AND strength = '20 mg'`))
        .toBe('atorvasterol-20-mg-100181168')
      expect(await value('SELECT count(*) = count(DISTINCT slug) FROM products')).toBe(true)
    })

    it('marks parallel imports', async () => {
      expect(await value(`SELECT count(*)::INTEGER FROM products WHERE name = 'Sortis 20' AND parallel_import`)).toBeGreaterThan(0)
    })
  })

  describe('substitutes', () => {
    const groupOf = (name: string, strength: string) =>
      value(`SELECT group_key FROM products WHERE name = '${name}' AND strength = '${strength}' LIMIT 1`)

    it('groups the same substance, strength and form from different makers', async () => {
      const group = await groupOf('Atorvasterol', '20 mg')
      expect(await groupOf('Atorvox', '20 mg')).toBe(group)
      expect(await groupOf('Apo-Atorva', '20 mg')).toBe(group)
    })

    it('does not mix strengths', async () => {
      expect(await groupOf('Atorvasterol', '80 mg')).not.toBe(await groupOf('Atorvasterol', '20 mg'))
    })

    it('treats "100 mcg" and "100 µg" as the same strength', async () => {
      expect(await groupOf('Euthyrox N 100', '100 mcg')).toBe(await groupOf('Letrox 100', '100 mcg'))
      expect(await groupOf('Euthyrox N 100', '100 mcg')).toContain('100µg')
    })

    it('treats "podanie doustne" and "doustna" as the same route', async () => {
      expect(await groupOf('Atorvasterol', '80 mg')).toBe('atorvastatinum|80mg|doustna-stala|doustna')
    })

    it('keeps chewable tablets apart from ordinary tablets', async () => {
      const groups = await rows(`SELECT DISTINCT group_key FROM products WHERE name = 'Sortis 20'`)
      expect(groups.map(row => row.group_key)).toContain('atorvastatinum|20mg|tabletki do rozgryzania i żucia|doustna')
    })
  })

  describe('packages and prices', () => {
    it('drops packages cancelled in the register', async () => {
      const raw = await value(`SELECT "Opakowanie" FROM products_raw WHERE "Nazwa Produktu Leczniczego" = 'Sortis 20' AND "Opakowanie" LIKE '%Skasowane%' LIMIT 1`)
      const cancelled = String(raw).match(/(\d{14}) ¦ [^¦\n]+ ¦ Skasowane/)![1]
      expect(await value(`SELECT count(*)::INTEGER FROM packages WHERE gtin = '${cancelled}'`)).toBe(0)
    })

    it('parses Polish money format into numbers', async () => {
      const [price] = await rows(`
        SELECT retail_price::DOUBLE AS retail, patient_payment::DOUBLE AS payment, level
        FROM packages JOIN products ON products.id = packages.product_id JOIN prices USING (gtin)
        WHERE products.name = 'Atorvasterol' AND products.strength = '20 mg' AND packages.pack_count = 30
      `)
      expect(price).toEqual({ retail: 19.21, payment: 11.96, level: '30%' })
    })

    it('finds the cheapest substitute and the saving for the home page', async () => {
      // Atorvasterol 20 mg x30 costs 19.21 zł, the cheapest substitute (Atorvox) 8.30 zł.
      expect(await rows('SELECT name, price::DOUBLE AS price, best_price::DOUBLE AS best, saving::DOUBLE AS saving FROM examples')).toEqual([
        { name: 'Atorvasterol', price: 19.21, best: 8.3, saving: 10.91 },
      ])
    })
  })

  it('reports model statistics', async () => {
    const stats = await modelStats(connection)
    expect(stats.products).toBe(16)
    expect(stats.pricedPackages).toBe(8)
    expect(stats.withSubstitutes).toBeGreaterThan(0)
  })
})
