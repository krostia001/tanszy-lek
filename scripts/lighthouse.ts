// Runs Lighthouse (mobile profile, as on PageSpeed Insights) on the main pages and prints a summary.
// Usage: start the app, then
//   bun scripts/lighthouse.ts [base URL]          default: http://localhost:3000
// Needs Google Chrome installed. Full JSON reports are written to data/lighthouse/ (not in git).

import { mkdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const OUT = 'data/lighthouse'
const PAGES = [
  { name: 'Strona główna', path: '/' },
  { name: 'Strona leku', path: '/lek/atorvasterol-20-mg-100181168' },
  { name: 'O projekcie', path: '/o-projekcie' },
]

await mkdir(OUT, { recursive: true })

const rows: string[] = []
for (const page of PAGES) {
  const file = `${OUT}/${page.path.replace(/[^a-z0-9]+/gi, '_') || 'home'}.json`
  const run = spawnSync('bunx', [
    'lighthouse@13.6.0', `${BASE}${page.path}`,
    '--output=json', `--output-path=${file}`, '--quiet',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--chrome-flags=--headless=new',
  ], { stdio: 'inherit', shell: process.platform === 'win32' })
  if (run.status !== 0) {
    throw new Error(`Lighthouse failed for ${page.path}`)
  }

  const report = JSON.parse(await readFile(file, 'utf8'))
  const score = (key: string) => Math.round(report.categories[key].score * 100)
  const audit = (key: string) => report.audits[key].displayValue
  rows.push(`| ${page.name} | ${score('performance')} | ${score('accessibility')} | ${score('best-practices')} | ${score('seo')} | ${audit('first-contentful-paint')} | ${audit('largest-contentful-paint')} | ${audit('total-blocking-time')} | ${audit('cumulative-layout-shift')} | ${audit('total-byte-weight')} |`)
}

console.log('\n| Strona | Wydajność | Dostępność | Dobre praktyki | SEO | FCP | LCP | TBT | CLS | Waga strony |')
console.log('|---|---|---|---|---|---|---|---|---|---|')
console.log(rows.join('\n'))
