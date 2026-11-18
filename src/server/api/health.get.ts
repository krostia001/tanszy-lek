// GET /api/health: confirms the app can read the database. Used by Docker and for monitoring.
export default defineEventHandler(async () => {
  const [counts] = await queryRows<{ products: number, pricedPackages: number }>(`
    SELECT
      (SELECT count(*) FROM products)::INTEGER AS products,
      (SELECT count(*) FROM packages JOIN prices USING (gtin) WHERE is_primary)::INTEGER AS pricedPackages
  `)
  return { status: 'ok', ...counts }
})
