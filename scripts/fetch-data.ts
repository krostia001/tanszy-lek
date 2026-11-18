// Step 1 of the data pipeline: downloads the source files into data/raw/.
// Usage: bun run data:fetch

import { mkdir, writeFile } from 'node:fs/promises'
import { listResources, pickResource } from './lib/dane-gov'
import { RAW_DIR, SOURCES, SOURCES_META_FILE, type Source } from './lib/sources'

/** Resolves where to download a source from and which snapshot it is. */
async function locate(source: Source) {
  if (source.kind === 'url') {
    return { url: source.url, dataDate: null, resourceId: null, edition: source.edition }
  }
  const resource = pickResource(await listResources(source.datasetId), source.format)
  return { url: resource.downloadUrl!, dataDate: resource.dataDate, resourceId: resource.id, edition: resource.title }
}

await mkdir(RAW_DIR, { recursive: true })

const fetched = []

for (const source of SOURCES) {
  console.log(`→ ${source.name} (${source.publisher})`)
  const { url, dataDate, resourceId, edition } = await locate(source)

  const started = performance.now()
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${url}`)
  }
  const body = Buffer.from(await response.arrayBuffer())
  await writeFile(`${RAW_DIR}/${source.file}`, body)

  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(`  ✓ ${source.file}: ${(body.length / 1e6).toFixed(1)} MB, ${dataDate ? `data as of ${dataDate}` : edition} (${seconds}s)`)

  fetched.push({
    key: source.key,
    name: source.name,
    publisher: source.publisher,
    datasetId: source.kind === 'dane.gov.pl' ? source.datasetId : null,
    resourceId,
    edition,
    dataDate,
    pageUrl: source.pageUrl,
    url,
    bytes: body.length,
    downloadedAt: new Date().toISOString(),
  })
}

await writeFile(SOURCES_META_FILE, JSON.stringify(fetched, null, 2))
console.log(`Saved metadata to ${SOURCES_META_FILE}`)
