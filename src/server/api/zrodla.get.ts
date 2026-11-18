// GET /api/zrodla: data sources with their editions and snapshot dates.

const loadSources = defineCachedFunction(() => queryRows<DataSource>(`
  SELECT key, name, publisher, edition, dataDate::VARCHAR AS dataDate, pageUrl,
    strftime(downloadedAt, '%Y-%m-%d') AS downloadedAt
  FROM sources ORDER BY key DESC
`), { name: 'sources', maxAge: 60 * 60, getKey: () => 'all' })

export default defineEventHandler(() => loadSources())
