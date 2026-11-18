// SQL steps of the data pipeline. They live apart from build-db.ts so tests can run them
// against the small samples in tests/fixtures/.

import type { DuckDBConnection } from '@duckdb/node-api'

const sqlString = (value: string) => `'${value.replaceAll('\'', '\'\'')}'`

/**
 * One package line of the register's "Opakowanie" field, e.g.
 *   05909990784714 ¦ Rp ¦ 151\n30 tabl.
 *   05909990784721 ¦ Rp ¦ Skasowane ¦ 19693\n14 tabl.
 * Groups: 1 GTIN, 2 availability category, 3 "Skasowane" marker, 4 package id, 5 size.
 */
const PACKAGE_REGEX = sqlString('([0-9]{8,14}) ¦ ([^¦\\r\\n]+?) ¦ (Skasowane ¦ )?([0-9]+)\\r?\\n([^\\r\\n]*)')

/** Forms a pharmacist may swap without clinical significance (immediate-release oral solids). */
const INTERCHANGEABLE_ORAL_FORMS = ['tabletki', 'tabletki powlekane', 'tabletki drażowane', 'kapsułki', 'kapsułki twarde']

/** Substances of widely used chronic medicines, used to pick examples for the home page. */
const COMMON_SUBSTANCES = [
  'atorvastatinum', 'rosuvastatinum', 'metformini hydrochloridum', 'bisoprololi fumaras', 'ramiprilum',
  'amlodipinum', 'losartanum kalicum', 'levothyroxinum natricum', 'pantoprazolum', 'sertralinum',
  'escitalopramum', 'clopidogrelum', 'metoprololi succinas', 'perindoprilum', 'acidum acetylsalicylicum',
]

/** Helpers used by the steps below. TEMP macros live only for the current connection. */
export async function createMacros(connection: DuckDBConnection) {
  await connection.run(`
    -- lower-case, no Polish diacritics: "Łagodny Żel" -> "lagodny zel"
    CREATE OR REPLACE TEMP MACRO norm(s) AS strip_accents(replace(lower(s), 'ł', 'l'));

    CREATE OR REPLACE TEMP MACRO slugify(s) AS
      trim(regexp_replace(norm(replace(replace(s, 'µ', 'u'), 'μ', 'u')), '[^a-z0-9]+', '-', 'g'), '-');

    -- "0,5 mg" / "0.5mg" -> "0.5mg", "100 mcg" -> "100µg"
    CREATE OR REPLACE TEMP MACRO norm_strength(s) AS
      regexp_replace(replace(replace(lower(trim(s)), 'mcg', 'µg'), ',', '.'), '\\s+', '', 'g');

    -- "podanie doustne" -> "doustna", several routes (one per line) are sorted -> "dożylna,podskórna"
    CREATE OR REPLACE TEMP MACRO norm_route(r) AS
      array_to_string(list_sort(list_distinct(list_transform(
        string_split(lower(coalesce(r, '')), chr(10)),
        lambda x: replace(replace(trim(x), 'podanie ', ''), 'doustne', 'doustna')
      ))), ',');

    CREATE OR REPLACE TEMP MACRO form_group(f) AS
      CASE WHEN lower(trim(f)) IN (${INTERCHANGEABLE_ORAL_FORMS.map(sqlString).join(', ')})
        THEN 'doustna-stala' ELSE lower(trim(f)) END;

    -- Polish money format "1 234,56" -> 1234.56
    CREATE OR REPLACE TEMP MACRO pln(x) AS
      try_cast(replace(replace(trim(x), ' ', ''), ',', '.') AS DECIMAL(10, 2));
  `)
}

/** Loads the Rejestr Produktów Leczniczych CSV as-is (all columns as text). */
export async function loadProductsRaw(connection: DuckDBConnection, csvPath: string) {
  await connection.run(`
    CREATE OR REPLACE TABLE products_raw AS
    SELECT * FROM read_csv(${sqlString(csvPath)}, delim = ';', quote = '"', header = true, all_varchar = true)
  `)
}

/** Loads sheet A1 (drugs refunded in pharmacies) of the Ministry of Health XLSX as-is. */
export async function loadRefundRaw(connection: DuckDBConnection, xlsxPath: string) {
  await connection.run('INSTALL excel; LOAD excel;')
  // Row 1 holds the sheet title, the header is in row 2.
  await connection.run(`
    CREATE OR REPLACE TABLE refund_raw AS
    SELECT * FROM read_xlsx(${sqlString(xlsxPath)}, sheet = 'A1', range = 'A2:Q200000',
      header = true, all_varchar = true, stop_at_empty = true)
  `)
}

/** Stores information about the data sources (from data/raw/sources.json). */
export async function loadSourcesMeta(connection: DuckDBConnection, jsonPath: string) {
  await connection.run(`
    CREATE OR REPLACE TABLE sources AS
    SELECT
      key,
      name,
      publisher,
      datasetId::INTEGER AS datasetId,
      edition,
      dataDate::DATE AS dataDate,
      pageUrl,
      url,
      bytes::BIGINT AS bytes,
      downloadedAt::TIMESTAMPTZ AS downloadedAt
    FROM read_json(${sqlString(jsonPath)}, columns = {
      key: 'VARCHAR', name: 'VARCHAR', publisher: 'VARCHAR', datasetId: 'INTEGER', edition: 'VARCHAR',
      dataDate: 'VARCHAR', pageUrl: 'VARCHAR', url: 'VARCHAR', bytes: 'BIGINT', downloadedAt: 'VARCHAR'
    })
  `)
}

/**
 * Builds the tables the app reads from the raw tables:
 * - products: medicines for humans with a valid permit
 * - packages: one row per active package (GTIN) of a product
 * - prices: patient prices of refunded packages
 * - search_index: one row per distinct name + strength + form
 */
export async function buildModel(connection: DuckDBConnection) {
  await createMacros(connection)

  await connection.run(`
    CREATE OR REPLACE TABLE products AS
    WITH base AS (
      SELECT
        "Identyfikator Produktu Leczniczego" AS id,
        trim("Nazwa Produktu Leczniczego") AS name,
        nullif(trim("Nazwa powszechnie stosowana"), '') AS inn,
        nullif(nullif(trim("Moc"), '-'), '') AS strength,
        nullif(trim("Postać farmaceutyczna"), '') AS form,
        nullif(trim("Droga podania - Gatunek - Tkanka - Okres karencji"), '') AS route,
        nullif(trim("Kod ATC"), '') AS atc,
        nullif(trim("Podmiot odpowiedzialny"), '') AS holder,
        "Typ procedury" = 'IR' AS parallel_import,
        nullif(trim("Ulotka"), '') AS leaflet_url,
        nullif(trim("Charakterystyka"), '') AS spc_url,
        "Opakowanie" AS packages_raw
      FROM products_raw
      WHERE "Rodzaj preparatu" = 'Ludzki'
        -- drop products whose marketing authorisation expired before the data snapshot
        AND coalesce(
          try_cast("Ważność pozwolenia" AS DATE) >= (SELECT max(dataDate) FROM sources WHERE key = 'rpl'),
          true)
    )
    SELECT
      *,
      -- "Atoris" + "40 mg" -> "atoris-40-mg-100164721" (strength is skipped when the name already has it)
      slugify(CASE WHEN contains(norm(name), norm(coalesce(strength, ''))) THEN name
        ELSE name || ' ' || coalesce(strength, '') END) || '-' || id AS slug,
      -- Products with the same key are substitutes: same active substance, strength,
      -- interchangeable form and route.
      CASE WHEN inn IS NOT NULL AND strength IS NOT NULL AND form IS NOT NULL THEN
        lower(inn) || '|' || norm_strength(strength) || '|' || form_group(form) || '|' || norm_route(route)
      END AS group_key
    FROM base
  `)

  await connection.run(`
    CREATE OR REPLACE TABLE packages AS
    WITH lists AS (
      SELECT
        id AS product_id,
        regexp_extract_all(packages_raw, ${PACKAGE_REGEX}, 1) AS gtins,
        regexp_extract_all(packages_raw, ${PACKAGE_REGEX}, 2) AS categories,
        regexp_extract_all(packages_raw, ${PACKAGE_REGEX}, 3) AS cancelled,
        regexp_extract_all(packages_raw, ${PACKAGE_REGEX}, 5) AS sizes
      FROM products
    ), rows AS (
      SELECT product_id, unnest(gtins) AS gtin, unnest(categories) AS category,
        unnest(cancelled) AS cancelled, unnest(sizes) AS size
      FROM lists
    )
    SELECT
      product_id,
      gtin,
      trim(category) AS category,
      trim(size) AS size,
      try_cast(regexp_extract(size, '^\\s*([0-9]+)', 1) AS INTEGER) AS pack_count
    FROM rows
    -- the optional "Skasowane" group is NULL or '' when it did not match
    WHERE coalesce(cancelled, '') = '' AND trim(category) <> 'Skasowane'
  `)

  await connection.run(`
    CREATE OR REPLACE TABLE prices AS
    WITH r AS (
      SELECT
        trim("Numer GTIN lub inny kod jednoznacznie identyfikujący produkt") AS gtin,
        coalesce(trim("Grupa limitowa"), '') AS limit_group,
        coalesce(trim("Zakres wskazań objętych refundacją"), '') AS indication,
        trim("Poziom odpłatności") AS level,
        pln("Cena detaliczna") AS retail_price,
        pln("Wysokość limitu finansowania") AS refund_limit,
        pln("Wysokość dopłaty świadczeniobiorcy") AS patient_payment
      FROM refund_raw
    ), valid AS (
      SELECT * FROM r WHERE regexp_full_match(gtin, '[0-9]{8,14}') AND patient_payment IS NOT NULL
    ), indication_frequency AS (
      SELECT limit_group, indication, count(*) AS n FROM valid GROUP BY ALL
    )
    -- A package can be refunded at different levels for different indications.
    -- The "primary" price is the one for the indication most common in its limit group,
    -- so substitutes are compared for the same indication.
    SELECT
      valid.*,
      row_number() OVER (
        PARTITION BY valid.gtin ORDER BY indication_frequency.n DESC, valid.patient_payment DESC
      ) = 1 AS is_primary
    FROM valid JOIN indication_frequency USING (limit_group, indication)
  `)

  await connection.run(`
    CREATE OR REPLACE TABLE search_index AS
    WITH refunded AS (
      SELECT DISTINCT packages.product_id FROM packages JOIN prices USING (gtin)
    ), group_sizes AS (
      SELECT group_key, count(DISTINCT lower(name)) AS names FROM products
      WHERE group_key IS NOT NULL GROUP BY 1
    ), ranked AS (
      SELECT
        products.*,
        refunded.product_id IS NOT NULL AS refunded,
        row_number() OVER (
          PARTITION BY lower(products.name), products.strength, products.form
          ORDER BY refunded.product_id IS NULL, products.parallel_import, products.id
        ) AS rank
      FROM products LEFT JOIN refunded ON refunded.product_id = products.id
    )
    SELECT
      slug, name, strength, form, inn, refunded,
      coalesce(group_sizes.names - 1, 0)::INTEGER AS substitutes,
      norm(name) AS name_norm,
      norm(coalesce(inn, '')) AS inn_norm
    FROM ranked LEFT JOIN group_sizes USING (group_key)
    WHERE rank = 1
  `)

  // Examples for the home page: well-known medicines where a cheaper substitute
  // saves the most. Computed from the data, so they stay true after every update.
  await connection.run(`
    CREATE OR REPLACE TABLE examples AS
    WITH offers AS (
      SELECT products.slug, products.name, products.strength, products.inn, products.group_key,
        packages.pack_count, packages.size, prices.retail_price AS price
      FROM products
      JOIN packages ON packages.product_id = products.id
      JOIN prices ON prices.gtin = packages.gtin AND prices.is_primary
    ), best AS (
      SELECT group_key, pack_count, min(price) AS best_price FROM offers GROUP BY ALL
    )
    SELECT slug, name, strength, size, price, best_price, price - best_price AS saving
    FROM offers JOIN best USING (group_key, pack_count)
    WHERE lower(inn) IN (${COMMON_SUBSTANCES.map(sqlString).join(', ')})
      AND price - best_price >= 3
    QUALIFY row_number() OVER (PARTITION BY lower(inn) ORDER BY saving DESC, name) = 1
    ORDER BY saving DESC
    LIMIT 4
  `)

  await connection.run(`
    CREATE INDEX products_slug ON products (slug);
    CREATE INDEX products_group ON products (group_key);
    CREATE INDEX packages_product ON packages (product_id);
    CREATE INDEX prices_gtin ON prices (gtin);
  `)
}

/** Row counts printed by build-db.ts and checked by tests. */
export async function modelStats(connection: DuckDBConnection) {
  const reader = await connection.runAndReadAll(`
    SELECT
      (SELECT count(*) FROM products)::INTEGER AS products,
      (SELECT count(*) FROM packages)::INTEGER AS packages,
      (SELECT count(DISTINCT gtin) FROM prices)::INTEGER AS pricedGtins,
      (SELECT count(*) FROM packages JOIN prices USING (gtin) WHERE is_primary)::INTEGER AS pricedPackages,
      (SELECT count(*) FROM search_index)::INTEGER AS searchable,
      (SELECT count(*) FROM search_index WHERE substitutes > 0)::INTEGER AS withSubstitutes
  `)
  return reader.getRowObjectsJson()[0] as Record<string, number>
}
