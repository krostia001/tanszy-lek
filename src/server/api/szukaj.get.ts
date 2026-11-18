// GET /api/szukaj?q=atorvasterol&limit=8: medicines matching a name or an active substance.

const COLUMNS = 'slug, name, strength, form, inn, refunded, substitutes'

// Natural order of strengths: 25 mg before 100 mg.
const STRENGTH_ORDER = `try_cast(replace(regexp_extract(strength, '^[0-9]+([.,][0-9]+)?'), ',', '.') AS DOUBLE)`

// Query results are cached on the server, one entry per normalised search text and limit,
// so "Atorvasterol" and "atorvasterol " share an entry.
const search = defineCachedFunction(async (needle: string, max: number) => {
  const results = await queryRows<SearchResult>(`
    SELECT ${COLUMNS} FROM search_index
    WHERE name_norm LIKE $prefix OR name_norm LIKE $word OR inn_norm LIKE $prefix
    ORDER BY starts_with(name_norm, $needle) DESC, refunded DESC, name_norm, ${STRENGTH_ORDER}, form
    LIMIT ${max}
  `, { needle, prefix: `${needle}%`, word: `% ${needle}%` })

  if (results.length > 0) {
    return { results, fuzzy: false }
  }

  // Nothing matched: tolerate typos ("atorwasterol") by comparing the start of the name.
  const similar = await queryRows<SearchResult>(`
    SELECT ${COLUMNS} FROM search_index
    WHERE jaro_winkler_similarity(left(name_norm, length($needle)), $needle) >= 0.85
    ORDER BY jaro_winkler_similarity(left(name_norm, length($needle)), $needle) DESC, refunded DESC, name_norm, ${STRENGTH_ORDER}
    LIMIT ${max}
  `, { needle })

  return { results: similar, fuzzy: similar.length > 0 }
}, {
  name: 'search',
  maxAge: 60 * 60,
  getKey: (needle: string, max: number) => `${needle}:${max}`,
})

export default defineEventHandler(async (event) => {
  const { q, limit } = getQuery(event)
  const query = String(q ?? '').slice(0, 80).trim()
  const max = Math.min(Math.max(Number(limit) || 8, 1), 50)
  const needle = normalizeText(query)

  if (needle.length < 2) {
    return { query, results: [] as SearchResult[], fuzzy: false }
  }
  return { query, ...(await search(needle, max)) }
})
