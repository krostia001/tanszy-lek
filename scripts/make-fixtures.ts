// Cuts small samples of the real data into tests/fixtures/, so tests run without downloading anything.
// Usage (after `bun run data:fetch`): bun scripts/make-fixtures.ts

import { copyFile } from 'node:fs/promises'
import { DuckDBInstance } from '@duckdb/node-api'
import { loadProductsRaw } from './lib/load'
import { RAW_DIR, SOURCES_META_FILE } from './lib/sources'

const OUT = 'tests/fixtures'

// Atorvastatin 20 mg and 80 mg from several makers (prices, routes written two ways),
// Sortis 20 (parallel imports, cancelled packages), levothyroxine (µg vs mcg) and a few edge cases.
const PRODUCT_NAMES = ['Atorvasterol', 'Atorvox', 'Atorvastatin Teva Pharmaceuticals Polska', 'Apo-Atorva', 'Sortis 20', 'Euthyrox N 100', 'Letrox 100']

const instance = await DuckDBInstance.create(':memory:')
const connection = await instance.connect()
await connection.run('INSTALL excel; LOAD excel;')
await loadProductsRaw(connection, `${RAW_DIR}/rpl.csv`)

await connection.run(`
  CREATE TABLE sample AS
  SELECT * FROM products_raw
  WHERE ("Nazwa Produktu Leczniczego" IN (${PRODUCT_NAMES.map(name => `'${name}'`).join(', ')})
      AND "Moc" IN ('20 mg', '80 mg', '100 mcg', '100 µg'))
    -- two veterinary products and one with an expired permit
    OR "Identyfikator Produktu Leczniczego" IN (
      SELECT "Identyfikator Produktu Leczniczego" FROM products_raw WHERE "Rodzaj preparatu" <> 'Ludzki'
      ORDER BY 1 LIMIT 2)
    OR "Identyfikator Produktu Leczniczego" = (
      SELECT min("Identyfikator Produktu Leczniczego") FROM products_raw
      WHERE "Rodzaj preparatu" = 'Ludzki' AND try_cast("Ważność pozwolenia" AS DATE) < DATE '2025-01-01'
        AND "Nazwa powszechnie stosowana" = 'Atorvastatinum')
`)
await connection.run(`COPY sample TO '${OUT}/rpl-sample.csv' (DELIMITER ';', HEADER, QUOTE '"', FORCE_QUOTE *)`)

// The refund XLSX keeps its real layout: title in row 1, header in row 2.
await connection.run(`
  CREATE TABLE refund AS
  SELECT row_number() OVER () AS row_no, *
  FROM read_xlsx('${RAW_DIR}/mz-refundacja.xlsx', sheet = 'A1', range = 'A1:Q200000', header = false, all_varchar = true)
`)
const gtinColumn = (await connection.runAndReadAll('SELECT * FROM refund LIMIT 0')).columnNames()[5]
await connection.run(`
  COPY (
    SELECT * EXCLUDE (row_no) FROM refund
    WHERE row_no <= 2 OR "${gtinColumn}" IN (
      SELECT unnest(regexp_extract_all("Opakowanie", '([0-9]{8,14}) ¦', 1)) FROM sample)
    ORDER BY row_no
  ) TO '${OUT}/mz-sample.xlsx' (FORMAT xlsx, HEADER false, SHEET 'A1')
`)

await copyFile(SOURCES_META_FILE, `${OUT}/sources.json`)

const counts = await connection.runAndReadAll(`
  SELECT (SELECT count(*) FROM sample)::INTEGER AS products,
    (SELECT count(*) FROM read_xlsx('${OUT}/mz-sample.xlsx', header = false, all_varchar = true))::INTEGER AS refundRows
`)
console.log('✓ fixtures written:', counts.getRowObjectsJson()[0])
