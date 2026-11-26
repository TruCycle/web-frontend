// Remove only these SDKs' first-party cookies, preserving auth and consent choices.
export function clearAnalyticsCookies(matches: (name: string) => boolean): void {
  if (typeof document === 'undefined') return
  try {
    const domains = window.location.hostname.split('.')
    for (const entry of document.cookie.split(';')) {
      const name = entry.trim().split('=')[0]
      if (!name || !matches(name)) continue
      const expired = `${name}=; Max-Age=0; path=/; SameSite=Lax`
      document.cookie = expired
      for (let index = 0; index < domains.length - 1; index += 1) {
        document.cookie = `${expired}; domain=${domains.slice(index).join('.')}`
      }
    }
  } catch {
    // Blocked cookie access must not prevent the other SDKs being disabled.
  }
}
