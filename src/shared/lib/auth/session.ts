import type { AuthTokens, AuthUser } from '@/features/auth/types'

export type PersistMode = 'local' | 'session'

interface StoreSessionOptions {
  readonly tokens: AuthTokens
  readonly user: AuthUser
  readonly persistMode: PersistMode
  readonly keepRefreshToken: boolean
}

const accessTokenKey = 'auth_token'
const refreshTokenKey = 'refresh_token'
const userKey = 'auth_user'
const accessTokenExpiryKey = 'auth_token_expires_at'
const refreshTokenExpiryKey = 'refresh_token_expires_at'

function hasWindow() {
  return typeof window !== 'undefined'
}

function readFromStorage(key: string): string | null {
  if (!hasWindow()) {
    return null
  }

  const localValue = window.localStorage.getItem(key)
  if (localValue) {
    return localValue
  }

  return window.sessionStorage.getItem(key)
}

function removeFromStorage(key: string): void {
  if (!hasWindow()) {
    return
  }

  window.localStorage.removeItem(key)
  window.sessionStorage.removeItem(key)
}

function setInStorage(key: string, value: string, persistMode: PersistMode): void {
  if (!hasWindow()) {
    return
  }

  if (persistMode === 'local') {
    window.localStorage.setItem(key, value)
    window.sessionStorage.removeItem(key)
    return
  }

  window.sessionStorage.setItem(key, value)
  window.localStorage.removeItem(key)
}

function readNumberFromStorage(key: string): number | null {
  const rawValue = readFromStorage(key)
  if (!rawValue) {
    return null
  }

  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function decodeJwtExpiryMs(token: string): number | null {
  const segments = token.split('.')
  if (segments.length < 2) {
    return null
  }

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
    const payload = JSON.parse(window.atob(padded)) as { exp?: number }
    if (typeof payload.exp !== 'number') {
      return null
    }
    return payload.exp * 1000
  } catch {
    return null
  }
}

function resolveTokenExpiryMs(
  token: string,
  explicitExpiryIso?: string,
): number | null {
  if (explicitExpiryIso) {
    const explicitExpiryMs = Date.parse(explicitExpiryIso)
    if (Number.isFinite(explicitExpiryMs)) {
      return explicitExpiryMs
    }
  }

  return decodeJwtExpiryMs(token)
}

export function getStoredAccessToken(): string | null {
  return readFromStorage(accessTokenKey)
}

export function getStoredRefreshToken(): string | null {
  return readFromStorage(refreshTokenKey)
}

export function getStoredAccessTokenExpiresAt(): number | null {
  return readNumberFromStorage(accessTokenExpiryKey)
}

export function getStoredRefreshTokenExpiresAt(): number | null {
  return readNumberFromStorage(refreshTokenExpiryKey)
}

export function getStoredPersistMode(): PersistMode | null {
  if (!hasWindow()) {
    return null
  }

  if (window.localStorage.getItem(accessTokenKey)) {
    return 'local'
  }

  if (window.sessionStorage.getItem(accessTokenKey)) {
    return 'session'
  }

  return null
}

export function getStoredUser(): AuthUser | null {
  const rawValue = readFromStorage(userKey)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthUser
  } catch {
    return null
  }
}

export function hasStoredSession(): boolean {
  return Boolean(getStoredAccessToken())
}

export function storeSession(options: StoreSessionOptions): void {
  const persistMode = options.persistMode
  setInStorage(accessTokenKey, options.tokens.accessToken, persistMode)
  const accessTokenExpiryMs = resolveTokenExpiryMs(
    options.tokens.accessToken,
    options.tokens.accessTokenExpiry,
  )
  if (accessTokenExpiryMs !== null) {
    setInStorage(accessTokenExpiryKey, String(accessTokenExpiryMs), persistMode)
  } else {
    removeFromStorage(accessTokenExpiryKey)
  }

  if (options.keepRefreshToken && options.tokens.refreshToken) {
    setInStorage(refreshTokenKey, options.tokens.refreshToken, persistMode)
    const refreshTokenExpiryMs = resolveTokenExpiryMs(
      options.tokens.refreshToken,
      options.tokens.refreshTokenExpiry,
    )
    if (refreshTokenExpiryMs !== null) {
      setInStorage(refreshTokenExpiryKey, String(refreshTokenExpiryMs), persistMode)
    } else {
      removeFromStorage(refreshTokenExpiryKey)
    }
  } else {
    removeFromStorage(refreshTokenKey)
    removeFromStorage(refreshTokenExpiryKey)
  }

  setInStorage(userKey, JSON.stringify(options.user), persistMode)
}

export function storeUser(user: AuthUser, persistMode: PersistMode): void {
  setInStorage(userKey, JSON.stringify(user), persistMode)
}

export function clearSession(): void {
  removeFromStorage(accessTokenKey)
  removeFromStorage(refreshTokenKey)
  removeFromStorage(userKey)
  removeFromStorage(accessTokenExpiryKey)
  removeFromStorage(refreshTokenExpiryKey)
}
