// Data sources of the project. Everything is downloaded by scripts/fetch-data.ts,
// so anyone can rebuild the database from scratch.

interface BaseSource {
  key: string
  name: string
  publisher: string
  /** File name inside data/raw/ */
  file: string
  /** Human-readable page describing the data. */
  pageUrl: string
}

/** A dataset fetched through the dane.gov.pl API. */
export interface DaneGovSource extends BaseSource {
  kind: 'dane.gov.pl'
  datasetId: number
  format: string
}

/** A file published outside dane.gov.pl, pinned to an exact URL for reproducibility. */
export interface UrlSource extends BaseSource {
  kind: 'url'
  url: string
  /** Which edition of the document the URL points to. */
  edition: string
}

export type Source = DaneGovSource | UrlSource

export const SOURCES: Source[] = [
  {
    kind: 'dane.gov.pl',
    key: 'rpl',
    name: 'Rejestr Produktów Leczniczych',
    publisher: 'Centrum e-Zdrowia',
    datasetId: 397,
    format: 'csv',
    file: 'rpl.csv',
    pageUrl: 'https://dane.gov.pl/pl/dataset/397',
  },
  {
    // Patient prices are not published on dane.gov.pl. The Ministry of Health publishes
    // them as an attachment to each "obwieszczenie refundacyjne" (every 2-3 months).
    // To update: point MZ_REFUND_XLSX_URL (or this default) at the newest XLSX attachment.
    kind: 'url',
    key: 'mz',
    name: 'Wykaz refundowanych leków',
    publisher: 'Ministerstwo Zdrowia',
    url: process.env.MZ_REFUND_XLSX_URL ?? 'https://www.gov.pl/attachment/b199bf14-e4b8-49cc-99cf-d446c5e0a9d1',
    edition: process.env.MZ_REFUND_EDITION ?? 'obwieszczenie z 16.09.2026, obowiązuje od 1.10.2026',
    file: 'mz-refundacja.xlsx',
    pageUrl: 'https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych',
  },
]

export const RAW_DIR = 'data/raw'
export const SOURCES_META_FILE = `${RAW_DIR}/sources.json`
export const DB_FILE = 'data/app.duckdb'
