import paths from './routes.generated.js'
import { getSpaRoute } from './route-policy.js'

const robots = 'noindex, nofollow, noarchive'
const itemApiOrigin = 'https://api-staging.trucycle.co.uk'
const itemStatusTimeoutMs = 2500

function protectedResponse(response, method = 'GET', status = response.status) {
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', robots)
  headers.set('Cache-Control', 'no-store')
  headers.set('Referrer-Policy', 'strict-origin')
  if (status !== response.status) {
    headers.delete('ETag')
    headers.delete('Last-Modified')
  }
  if (method === 'HEAD' && response.body) void response.body.cancel().catch(() => {})
  return new Response(method === 'HEAD' ? null : response.body, { status, headers })
}

async function getItemDocumentStatus(itemId) {
  try {
    const response = await fetch(new URL(`/items/${itemId}`, itemApiOrigin).href, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(itemStatusTimeoutMs),
    })
    // The public API decides visibility. Discard the payload and upstream headers.
    if (response.body) void response.body.cancel().catch(() => {})
    return [200, 404].includes(response.status) ? response.status : 503
  } catch {
    return 503
  }
}

// The anonymous item lookup supplies only the staging document status.
export default {
  async fetch(request, environment) {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) return protectedResponse(new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } }), request.method)
      const url = new URL(request.url)
      if (url.pathname === '/index.html') {
        url.pathname = '/'
        return protectedResponse(new Response(null, { status: 308, headers: { Location: url.href } }), request.method)
      }
      const route = getSpaRoute(url.pathname, paths)
      if (route) {
        const [shell, status] = await Promise.all([
          environment.ASSETS.fetch(new Request(new URL('/index.html', url), { method: 'GET', redirect: 'manual' })),
          route.itemId ? getItemDocumentStatus(route.itemId) : route.status,
        ])
        if (shell.status !== 200) {
          if (shell.body) void shell.body.cancel().catch(() => {})
          return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
        }
        return protectedResponse(shell, request.method, status)
      }
      const asset = await environment.ASSETS.fetch(new Request(request, { redirect: 'manual' }))
      if (asset.status >= 300 && asset.status < 400 && asset.status !== 304) return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
      const navigation = request.headers.get('Sec-Fetch-Mode') === 'navigate' || request.headers.get('Accept')?.includes('text/html')
      if (asset.status !== 404 || !navigation || /\.[^/]+$/.test(url.pathname)) return protectedResponse(asset, request.method)
      const shell = await environment.ASSETS.fetch(new Request(new URL('/index.html', url), { method: 'GET', redirect: 'manual' }))
      if (shell.status !== 200) {
        if (shell.body) void shell.body.cancel().catch(() => {})
        return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
      }
      return protectedResponse(shell, request.method, 404)
    } catch {
      return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
    }
  },
}
