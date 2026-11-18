import { existsSync } from 'node:fs'
import { DuckDBInstance, type DuckDBConnection, type DuckDBValue } from '@duckdb/node-api'

let connection: Promise<DuckDBConnection> | undefined

/**
 * Shared read-only connection to the database built by scripts/build-db.ts.
 * The app never writes data, so one connection opened once is enough.
 */
export function useDuckDB(): Promise<DuckDBConnection> {
  connection ??= open().catch((error) => {
    connection = undefined // allow a retry, e.g. after `bun run data` finishes
    throw error
  })
  return connection
}

async function open(): Promise<DuckDBConnection> {
  const { duckdbPath } = useRuntimeConfig()
  if (!existsSync(duckdbPath)) {
    throw createError({
      statusCode: 503,
      statusMessage: `Database not found at ${duckdbPath}. Run \`bun run data\` first.`,
    })
  }
  const instance = await DuckDBInstance.fromCache(duckdbPath, { access_mode: 'READ_ONLY' })
  return instance.connect()
}

/**
 * Runs a query with named parameters ($name) and returns rows as JSON-safe objects.
 * Always pass user input as a parameter, never by building the SQL string.
 */
export async function queryRows<T = Record<string, unknown>>(
  sql: string,
  params?: Record<string, DuckDBValue>,
): Promise<T[]> {
  const db = await useDuckDB()
  const reader = await db.runAndReadAll(sql, params)
  return reader.getRowObjectsJson() as T[]
}
