const itemIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getSpaRoute(pathname, paths) {
  if (/%2f|%5c/i.test(pathname)) return null
  let normalized
  try { normalized = decodeURIComponent(pathname).replace(/\/+$/, '') || '/' } catch { return null }
  if (/[\\\u0000-\u001f]/.test(normalized)) return null
  const actual = normalized.split('/')
  const matched = paths.find(route => {
    const parts = route.split('/')
    return parts.length === actual.length && parts.every((part, index) => part.startsWith(':') ? actual[index].length > 0 : part === actual[index])
  })
  if (!matched) return null
  if (matched !== '/items/:id') return { status: 200 }
  if (!itemIdPattern.test(actual[2])) return { status: 404 }
  return { status: 200, itemId: actual[2].toLowerCase() }
}

/** Prepared only: never enabled by the staging Worker or an unverified host list. */
export function canonicalHostRedirect(request, { verified = false, canonicalOrigin, aliases = [] } = {}) {
  if (!verified) return null
  let target
  try { target = new URL(canonicalOrigin) } catch { throw Error('Canonical origin must be an explicit HTTPS origin') }
  if (target.protocol !== 'https:' || target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw Error('Canonical origin must be an explicit HTTPS origin')
  const incoming = new URL(request.url)
  if (!aliases.includes(incoming.hostname) || incoming.origin === target.origin) return null
  incoming.protocol = target.protocol; incoming.host = target.host
  return new Response(null, { status: 308, headers: { Location: incoming.href } })
}
