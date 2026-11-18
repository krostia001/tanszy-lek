// Compresses HTML pages and JSON answers (brotli, or gzip for older browsers).
// Static files (JS, CSS) are compressed once at build time instead: nitro.compressPublicAssets.
// A medicine page shrinks from about 35 kB to about 6 kB, which matters on a slow phone connection.

import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const MIN_SIZE = 1024 // smaller answers are not worth compressing

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    const { req, res } = event.node
    if (req.method === 'HEAD' || res.statusCode === 204 || res.statusCode === 304 || res.getHeader('content-encoding')) {
      return
    }

    // Only bodies h3 would turn into text: HTML strings and JSON objects.
    let text: string
    let type: string
    if (typeof response.body === 'string') {
      text = response.body
      type = String(res.getHeader('content-type') ?? 'text/html; charset=utf-8')
    }
    else if (response.body !== null && typeof response.body === 'object' && !Buffer.isBuffer(response.body)
      && !('pipe' in response.body) && !(response.body instanceof Response)) {
      text = JSON.stringify(response.body)
      type = String(res.getHeader('content-type') ?? 'application/json')
    }
    else {
      return
    }

    const accepted = String(req.headers['accept-encoding'] ?? '')
    const encoding = /\bbr\b/.test(accepted) ? 'br' : /\bgzip\b/.test(accepted) ? 'gzip' : null
    const raw = Buffer.from(text)
    if (!encoding || raw.length < MIN_SIZE) {
      return
    }

    const compressed = encoding === 'br'
      // Quality 5 is a good trade-off: much smaller than gzip, still about a millisecond per page.
      ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 5, [constants.BROTLI_PARAM_SIZE_HINT]: raw.length } })
      : gzipSync(raw, { level: 6 })

    res.setHeader('content-type', type)
    res.setHeader('content-encoding', encoding)
    res.setHeader('content-length', compressed.length)
    res.setHeader('vary', 'accept-encoding')
    response.body = compressed
  })
})
