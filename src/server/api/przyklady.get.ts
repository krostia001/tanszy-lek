// GET /api/przyklady: well-known medicines with the biggest savings (computed by scripts/build-db.ts).

const loadExamples = defineCachedFunction(() => queryRows<Example>(`
  SELECT slug, name, strength, size,
    price::DOUBLE AS price,
    best_price::DOUBLE AS bestPrice,
    saving::DOUBLE AS saving
  FROM examples ORDER BY saving DESC
`), { name: 'examples', maxAge: 60 * 60 * 24, getKey: () => 'all' })

export default defineEventHandler(() => loadExamples())
