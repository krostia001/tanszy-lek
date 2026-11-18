// Step 2 of the data pipeline: builds data/app.duckdb from the files in data/raw/.
// Usage: bun run data:build (run `bun run data:fetch` first)

import { existsSync } from 'node:fs'
import { rename, rm } from 'node:fs/promises'
import { DuckDBInstance } from '@duckdb/node-api'
import { buildModel, loadProductsRaw, loadRefundRaw, loadSourcesMeta, modelStats } from './lib/load'
import { DB_FILE, RAW_DIR, SOURCES, SOURCES_META_FILE } from './lib/sources'

for (const file of [...SOURCES.map(s => `${RAW_DIR}/${s.file}`), SOURCES_META_FILE]) {
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Run \`bun run data:fetch\` first.`)
    process.exit(1)
  }
}

// Build into a temporary file and swap it in at the end,
// so the app never reads a half-built database.
const tmpFile = `${DB_FILE}.tmp`
await rm(tmpFile, { force: true })

const started = performance.now()
const instance = await DuckDBInstance.create(tmpFile)
const connection = await instance.connect()

await loadSourcesMeta(connection, SOURCES_META_FILE)
await loadProductsRaw(connection, `${RAW_DIR}/rpl.csv`)
await loadRefundRaw(connection, `${RAW_DIR}/mz-refundacja.xlsx`)
await buildModel(connection)
const stats = await modelStats(connection)

// Raw tables are only needed during the build.
await connection.run('DROP TABLE products_raw; DROP TABLE refund_raw; CHECKPOINT;')

connection.closeSync()
instance.closeSync()
await rm(DB_FILE, { force: true })
await rename(tmpFile, DB_FILE)

console.log(`✓ ${DB_FILE} built in ${Math.round(performance.now() - started)} ms`)
console.table(stats)
