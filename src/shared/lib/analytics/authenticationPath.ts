export function isAuthenticationPath(pathname: string): boolean {
  return /^\/(?:auth|login|signup|reset-password)(?:\/|$)/i.test(pathname)
}

export function isCurrentAuthenticationPath(): boolean {
  return typeof window !== 'undefined' && isAuthenticationPath(window.location.pathname)
}
