// Shapes of the JSON returned by src/server/api. Shared by the server and the pages.

export interface SearchResult {
  slug: string
  name: string
  strength: string | null
  form: string | null
  inn: string | null
  refunded: boolean
  substitutes: number
}

export interface ProductInfo {
  slug: string
  name: string
  inn: string | null
  strength: string | null
  form: string | null
  route: string | null
  atc: string | null
  holder: string | null
  parallelImport: boolean
  leafletUrl: string | null
  spcUrl: string | null
}

export interface Pack {
  gtin: string
  size: string
  packCount: number | null
  /** Availability category from the register: Rp, OTC, Rpz, Rpw, Lz. */
  category: string
  /** Official pharmacy price from the Ministry of Health list, null when the package is not on it. */
  price: number | null
}

export interface SubstituteOffer {
  slug: string
  name: string
  strength: string | null
  form: string | null
  holder: string | null
  parallelImport: boolean
  size: string
  packCount: number | null
  category: string
  price: number | null
}

export interface Example {
  slug: string
  name: string
  strength: string | null
  size: string
  price: number
  bestPrice: number
  saving: number
}

export interface DataSource {
  key: string
  name: string
  publisher: string
  edition: string | null
  dataDate: string | null
  pageUrl: string
  downloadedAt: string
}
