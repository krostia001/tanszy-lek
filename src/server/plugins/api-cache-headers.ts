// Query results are cached on the server (defineCachedFunction in src/server/api).
// Browsers must not keep API answers on their own: after a data update they would show
// old answers (or answers in an old shape) for a long time. "no-cache" makes them ask
// the server every time, which answers from its cache in a few milliseconds.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.path.startsWith('/api/')) {
      setResponseHeader(event, 'cache-control', 'no-cache')
    }
  })
})
