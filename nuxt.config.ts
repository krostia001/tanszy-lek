// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

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

  ui: {
    // The site has a single, light theme. Without the color-mode module nothing adds
    // the "dark" class, so a dark system theme cannot switch components to dark colours.
    colorMode: false,
    // Only the components and icons we actually use end up in the bundle.
    theme: { colors: ['primary', 'neutral', 'error'] },
  },

  // Overridable with NUXT_* environment variables, e.g. NUXT_DUCKDB_PATH.
  runtimeConfig: {
    duckdbPath: 'data/app.duckdb',
    public: {
      // Link to the public repository, shown in the footer (NUXT_PUBLIC_REPO_URL).
      repoUrl: '',
    },
  },
  dir: { shared: 'src/shared' },

  // All application code lives in src/ (repository convention: src/, tests/, docs/).
  srcDir: 'src/',
  serverDir: 'src/server',
  compatibilityDate: '2026-11-01',

  nitro: {
    // API responses are cached. In development keep that cache in memory, so restarting
    // the dev server after `bun run data` always serves fresh data.
    devStorage: {
      cache: { driver: 'memory' },
    },
  },

  eslint: {
    config: {
      // ESLint also formats the code (no Prettier needed).
      stylistic: true,
    },
  },

  // Fonts are downloaded at build time and served from our own domain.
  fonts: {
    defaults: {
      weights: [400, 500, 700],
      subsets: ['latin', 'latin-ext'],
    },
  },

  icon: {
    // Icons are bundled from the installed @iconify-json collection, no runtime API calls.
    serverBundle: 'local',
    clientBundle: { scan: true },
  },
})
