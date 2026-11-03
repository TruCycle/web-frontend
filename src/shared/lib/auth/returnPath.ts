export function authReturnPath(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/dashboard'
  const from = state.from
  if (!from || typeof from !== 'object' || !('pathname' in from) || typeof from.pathname !== 'string') return '/dashboard'
  const pathname = from.pathname
  const search = 'search' in from && typeof from.search === 'string' ? from.search : ''
  const hash = 'hash' in from && typeof from.hash === 'string' ? from.hash : ''
  try {
    const decoded = decodeURIComponent(pathname)
    const unsafe = [...decoded].some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127 || character === '\\')
    if (!pathname.startsWith('/') || decoded.startsWith('//') || unsafe || decoded.includes('%') ||
        /[?#]/.test(pathname) || (search && !search.startsWith('?')) || (hash && !hash.startsWith('#')) ||
        /[\r\n\\]/.test(search + hash)) return '/dashboard'
    const resolved = new URL(pathname + search + hash, 'https://return.invalid')
    if (resolved.origin !== 'https://return.invalid' || /^\/(?:login|signup|auth|reset-password)(?:\/|$)/.test(decodeURIComponent(resolved.pathname))) return '/dashboard'
    return resolved.pathname + resolved.search + resolved.hash
  } catch { return '/dashboard' }
}
