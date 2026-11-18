// Minimal client for the public dane.gov.pl API (https://api.dane.gov.pl/doc).
// No API key is needed. The base URL can be overridden with DANE_API_URL.

export const DANE_API_URL = process.env.DANE_API_URL ?? 'https://api.dane.gov.pl/1.4'

export interface DaneResource {
  id: string
  title: string
  format: string
  /** Date of the data snapshot, YYYY-MM-DD. */
  dataDate: string | null
  downloadUrl: string | null
  fileSize: number | null
}

interface ApiResource {
  id: string
  attributes: {
    title: string
    format: string | null
    data_date: string | null
    download_url: string | null
    file_size: number | null
  }
}

/** Maps a JSON:API response of `/datasets/{id}/resources` to plain objects. */
export function parseResources(json: { data: ApiResource[] }): DaneResource[] {
  return json.data.map(({ id, attributes: a }) => ({
    id: String(id),
    title: a.title,
    format: (a.format ?? '').toLowerCase(),
    dataDate: a.data_date,
    downloadUrl: a.download_url || null,
    fileSize: a.file_size,
  }))
}

/** Picks the downloadable resource in the given format, e.g. 'csv'. */
export function pickResource(resources: DaneResource[], format: string): DaneResource {
  const match = resources.find(r => r.format === format && r.downloadUrl)
  if (!match) {
    throw new Error(`No downloadable "${format}" resource found (have: ${resources.map(r => r.format).join(', ')})`)
  }
  return match
}

export async function listResources(datasetId: number): Promise<DaneResource[]> {
  const url = `${DANE_API_URL}/datasets/${datasetId}/resources?per_page=100`
  const response = await fetch(url, { headers: { Accept: 'application/vnd.api+json' } })
  if (!response.ok) {
    throw new Error(`dane.gov.pl API responded ${response.status} for ${url}`)
  }
  return parseResources(await response.json())
}
