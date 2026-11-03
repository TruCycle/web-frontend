export function isSpaPath(pathname, paths) {
  if (/%2f|%5c/i.test(pathname)) return false
  let normalized
  try { normalized = decodeURIComponent(pathname).replace(/\/+$/, '') || '/' } catch { return false }
  if (/[\\\u0000-\u001f]/.test(normalized)) return false
  return paths.some(route => {
    const parts = route.split('/')
    const actual = normalized.split('/')
    return parts.length === actual.length && parts.every((part, index) => part.startsWith(':') ? actual[index].length > 0 : part === actual[index])
  })
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
