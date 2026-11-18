// Measures response times of the running app: first (cold) request and percentiles under load.
// Usage: start the app (`bun run build && node .output/server/index.mjs` or `docker compose up`), then
//   bun scripts/benchmark.ts [base URL]          default: http://localhost:3000
// Environment: BENCH_REQUESTS (default 200), BENCH_CONCURRENCY (default 10).

const BASE = process.argv[2] ?? process.env.BENCH_URL ?? 'http://localhost:3000'
const REQUESTS = Number(process.env.BENCH_REQUESTS ?? 200)
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY ?? 10)

const TARGETS = [
  { name: 'Strona główna', path: '/' },
  { name: 'Strona leku', path: '/lek/atorvasterol-20-mg-100181168' },
  { name: 'API: wyszukiwanie', path: '/api/szukaj?q=atorv&limit=8' },
  { name: 'API: lek z odpowiednikami', path: '/api/lek/atorvasterol-20-mg-100181168' },
  { name: 'API: przykłady', path: '/api/przyklady' },
]

const HEADERS = { 'Accept': 'text/html,application/json', 'Accept-Encoding': 'br, gzip' }

async function timedRequest(url: string) {
  const started = performance.now()
  const response = await fetch(url, { headers: HEADERS })
  const body = await response.arrayBuffer()
  return {
    ms: performance.now() - started,
    status: response.status,
    // fetch decompresses the body, so the size on the wire comes from Content-Length when present
    bytes: Number(response.headers.get('content-length') ?? body.byteLength),
    encoding: response.headers.get('content-encoding') ?? 'brak',
  }
}

function percentile(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]!
}

const format = (ms: number) => `${ms.toFixed(1)} ms`
const rows: string[] = []

for (const target of TARGETS) {
  const url = `${BASE}${target.path}`
  const first = await timedRequest(url)
  if (first.status !== 200) {
    throw new Error(`${url} answered ${first.status}`)
  }

  const times: number[] = []
  let next = 0
  const worker = async () => {
    while (next < REQUESTS) {
      next++
      times.push((await timedRequest(url)).ms)
    }
  }
  const started = performance.now()
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  const seconds = (performance.now() - started) / 1000
  times.sort((a, b) => a - b)

  rows.push(`| ${target.name} | ${format(first.ms)} | ${format(percentile(times, 50))} | ${format(percentile(times, 95))} | ${Math.round(REQUESTS / seconds)} | ${(first.bytes / 1024).toFixed(1)} kB (${first.encoding}) |`)
}

console.log(`\nBase URL: ${BASE}, ${REQUESTS} requests per target, concurrency ${CONCURRENCY}\n`)
console.log('| Adres | Pierwsze żądanie | p50 | p95 | Żądań/s | Rozmiar odpowiedzi |')
console.log('|---|---|---|---|---|---|')
console.log(rows.join('\n'))
