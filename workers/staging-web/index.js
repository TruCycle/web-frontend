import paths from './routes.generated.js'
import { isSpaPath } from './route-policy.js'

const robots = 'noindex, nofollow, noarchive'
function protectedResponse(response, method = 'GET', status = response.status) {
  const headers = new Headers(response.headers)
  headers.set('X-Robots-Tag', robots)
  headers.set('Cache-Control', 'no-store')
  return new Response(method === 'HEAD' ? null : response.body, { status, headers })
}

// Frontend assets only. This Worker never proxies API/auth/database traffic and
// never redirects staging visitors onto the production host.
export default {
  async fetch(request, environment) {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) return protectedResponse(new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } }), request.method)
      const url = new URL(request.url)
      if (url.pathname === '/index.html') {
        url.pathname = '/'
        return protectedResponse(new Response(null, { status: 308, headers: { Location: url.href } }), request.method)
      }
      if (isSpaPath(url.pathname, paths)) {
        const shell = await environment.ASSETS.fetch(new Request(new URL('/index.html', url), { method: 'GET', redirect: 'manual' }))
        if (shell.status !== 200) return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
        return protectedResponse(shell, request.method)
      }
      const asset = await environment.ASSETS.fetch(new Request(request, { redirect: 'manual' }))
      if (asset.status >= 300 && asset.status < 400 && asset.status !== 304) return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
      const navigation = request.headers.get('Sec-Fetch-Mode') === 'navigate' || request.headers.get('Accept')?.includes('text/html')
      if (asset.status !== 404 || !navigation || /\.[^/]+$/.test(url.pathname)) return protectedResponse(asset, request.method)
      const shell = await environment.ASSETS.fetch(new Request(new URL('/index.html', url), { method: 'GET', redirect: 'manual' }))
      return protectedResponse(shell.status === 200 ? shell : new Response('Not found', { status: 404 }), request.method, 404)
    } catch {
      return protectedResponse(new Response('Staging assets unavailable', { status: 503 }), request.method)
    }
  },
}
