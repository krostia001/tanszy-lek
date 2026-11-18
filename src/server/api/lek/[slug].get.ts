// GET /api/lek/atorvasterol-20-mg-100181168: a medicine, its packages with prices and its substitutes.

interface Product extends ProductInfo {
  id: string
  groupKey: string | null
}

interface MedicinePage {
  product: ProductInfo
  packs: Pack[]
  substitutes: SubstituteOffer[]
}

// Cached on the server for a day, one entry per medicine. Unknown addresses give null.
const loadMedicine = defineCachedFunction(async (slug: string): Promise<MedicinePage | null> => {
  const [product] = await queryRows<Product>(`
    SELECT id, slug, name, inn, strength, form, route, atc, holder,
      parallel_import AS parallelImport, leaflet_url AS leafletUrl, spc_url AS spcUrl, group_key AS groupKey
    FROM products WHERE slug = $slug
  `, { slug })

  if (!product) {
    return null
  }

  // The price is the official pharmacy price of the package from the Ministry of Health list.
  const packs = await queryRows<Pack>(`
    SELECT
      packages.gtin, packages.size, packages.pack_count AS packCount, packages.category,
      prices.retail_price::DOUBLE AS price
    FROM packages
    LEFT JOIN prices ON prices.gtin = packages.gtin AND prices.is_primary
    WHERE packages.product_id = $id
    ORDER BY packages.pack_count NULLS LAST, packages.size
  `, { id: product.id })

  const substitutes = product.groupKey
    ? await queryRows<SubstituteOffer>(`
        SELECT
          products.slug, products.name, products.strength, products.form, products.holder,
          products.parallel_import AS parallelImport,
          packages.size, packages.pack_count AS packCount, packages.category,
          prices.retail_price::DOUBLE AS price
        FROM products
        JOIN packages ON packages.product_id = products.id
        LEFT JOIN prices ON prices.gtin = packages.gtin AND prices.is_primary
        WHERE products.group_key = $groupKey AND products.id <> $id
        -- the same brand from several parallel importers at the same price is shown once
        QUALIFY row_number() OVER (
          PARTITION BY lower(products.name), packages.pack_count, prices.retail_price
          ORDER BY products.parallel_import, products.id
        ) = 1
        ORDER BY prices.retail_price NULLS LAST, products.name
      `, { groupKey: product.groupKey, id: product.id })
    : []

  const { groupKey: _groupKey, id: _id, ...info } = product
  return { product: info, packs, substitutes }
}, {
  name: 'medicine',
  maxAge: 60 * 60 * 24,
  getKey: (slug: string) => slug,
})

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const page = /^[a-z0-9-]{1,200}$/.test(slug) ? await loadMedicine(slug) : null
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono leku' })
  }
  return page
})
