// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/fonts'],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'pl' },
      titleTemplate: '%s · TańszyLek',
      meta: [
        { name: 'description', content: 'Znajdź tańszy odpowiednik swojego leku i porównaj ceny w aptece. Dane z dane.gov.pl i Ministerstwa Zdrowia.' },
        { name: 'theme-color', content: '#00843D' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  css: ['~/assets/css/main.css'],

  // Overridable with NUXT_* environment variables, e.g. NUXT_DUCKDB_PATH.
  runtimeConfig: {
    duckdbPath: 'data/app.duckdb',
    public: {
      // Link to the public repository, shown in the footer (NUXT_PUBLIC_REPO_URL).
      repoUrl: 'https://github.com/krostia001/tanszy-lek',
    },
  },
  dir: { shared: 'src/shared' },

  // All application code lives in src/ (repository convention: src/, tests/, docs/).
  srcDir: 'src/',
  serverDir: 'src/server',
  compatibilityDate: '2026-11-01',

  nitro: {
    // JS, CSS and other static files are compressed once at build time (gzip and brotli),
    // so the server sends the smaller file without compressing it on every request.
    compressPublicAssets: true,
    // API responses are cached. In development keep that cache in memory, so restarting
    // the dev server after `bun run data` always serves fresh data.
    devStorage: {
      cache: { driver: 'memory' },
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  eslint: {
    config: {
      // ESLint also formats the code (no Prettier needed).
      stylistic: true,
    },
  },

  // Fonts are downloaded at build time and served from our own domain.
  // Only the weights the design uses are included.
  fonts: {
    defaults: {
      subsets: ['latin', 'latin-ext'],
    },
    families: [
      { name: 'Barlow', weights: [400, 500, 600, 700] },
      // The headline font is needed for the first paint, so the browser fetches it early.
      { name: 'Barlow Semi Condensed', weights: [700], preload: true },
    ],
  },
})
