import type { AuthTokens, AuthUser } from '@/features/auth/types'

export type PersistMode = 'local' | 'session'
export interface StoredSession {
  readonly version: 1
  readonly tokens: AuthTokens
  readonly user: AuthUser
  readonly persistMode: PersistMode
}
export interface SessionCapture {
  readonly generation: number
  readonly session: StoredSession
}
interface StoreSessionOptions {
  readonly tokens: AuthTokens
  readonly user: AuthUser
  readonly persistMode: PersistMode
  readonly keepRefreshToken: boolean
}

export const sessionStorageKey = 'tc-auth-session-v1'
const legacyKeys = ['auth_token', 'refresh_token', 'auth_user', 'auth_token_expires_at', 'refresh_token_expires_at'] as const
let generation = 0
let suppressed = false

export class SessionStorageError extends Error {
  constructor() { super('Your saved sign-in could not be accessed. Please retry.'); this.name = 'SessionStorageError' }
}
export class SessionChangedError extends Error {
  constructor() { super('The sign-in changed while this request was running.'); this.name = 'AbortError' }
}
export function getSessionGeneration(): number { return generation }
export function invalidateSessionOperations(): number { return ++generation }
export function isSessionStorageKey(key: string | null): boolean {
  return key === null || key === sessionStorageKey || legacyKeys.some((value) => value === key)
}

function storage(mode: PersistMode): Storage { return mode === 'local' ? window.localStorage : window.sessionStorage }
function tokenPayload(token: string): { exp?: unknown; sub?: unknown } | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))) as { exp?: unknown; sub?: unknown }
  } catch { return null }
}
function expiry(token: string | undefined, explicit?: string): number | null {
  const parsed = explicit ? Date.parse(explicit) : NaN
  if (Number.isFinite(parsed)) return parsed
  const exp = token ? tokenPayload(token)?.exp : undefined
  return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null
}
function validate(value: unknown, mode: PersistMode): StoredSession {
  if (!value || typeof value !== 'object') throw new SessionStorageError()
  const record = value as Partial<StoredSession>
  const user = record.user
  const tokens = record.tokens
  if (record.version !== 1 || !user || typeof user.id !== 'string' || !user.id ||
      typeof user.email !== 'string' || !tokens || typeof tokens.accessToken !== 'string' || !tokens.accessToken.trim() ||
      (tokens.refreshToken !== undefined && (typeof tokens.refreshToken !== 'string' || !tokens.refreshToken.trim()))) {
    throw new SessionStorageError()
  }
  // Untrusted JWT claims only reject inconsistent cache records. The API still
  // validates signatures and account state; this is never authorization.
  for (const token of [tokens.accessToken, tokens.refreshToken]) {
    const subject = token ? tokenPayload(token)?.sub : undefined
    if (typeof subject === 'string' && subject !== user.id) throw new SessionStorageError()
  }
  return { version: 1, user, tokens, persistMode: mode }
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === 'undefined' || suppressed) return null
  try {
    // Select one complete record/mode. Never fill fields from the other store.
    for (const mode of ['local', 'session'] as const) {
      const raw = storage(mode).getItem(sessionStorageKey)
      if (raw) return validate(JSON.parse(raw), mode)
    }
    for (const mode of ['local', 'session'] as const) {
      const area = storage(mode)
      const accessToken = area.getItem('auth_token')
      if (!accessToken) continue
      const rawUser = area.getItem('auth_user')
      if (!rawUser) throw new SessionStorageError()
      const asIso = (key: string) => {
        const raw = area.getItem(key)
        const value = raw ? Number(raw) : NaN
        return Number.isFinite(value) ? new Date(value).toISOString() : undefined
      }
      return validate({ version: 1, user: JSON.parse(rawUser), tokens: {
        accessToken, refreshToken: area.getItem('refresh_token') ?? undefined,
        accessTokenExpiry: asIso('auth_token_expires_at'),
        refreshTokenExpiry: asIso('refresh_token_expires_at'),
      } }, mode)
    }
    return null
  } catch { throw new SessionStorageError() }
}
export function captureStoredSession(): SessionCapture | null {
  const session = getStoredSession()
  return session ? { generation, session } : null
}
export function isSameSessionIdentity(capture: SessionCapture): boolean {
  const current = getStoredSession()
  return capture.generation === generation && current?.user.id === capture.session.user.id
}
export function isCurrentSession(capture: SessionCapture): boolean {
  const current = getStoredSession()
  return isSameSessionIdentity(capture) && current?.tokens.accessToken === capture.session.tokens.accessToken &&
    current.tokens.refreshToken === capture.session.tokens.refreshToken
}
export function getStoredAccessToken(): string | null { return getStoredSession()?.tokens.accessToken ?? null }
export function getStoredRefreshToken(): string | null { return getStoredSession()?.tokens.refreshToken ?? null }
export function getStoredAccessTokenExpiresAt(): number | null {
  const tokens = getStoredSession()?.tokens
  return tokens ? expiry(tokens.accessToken, tokens.accessTokenExpiry) : null
}
export function getAccessTokenExpiry(tokens: AuthTokens): number | null {
  return expiry(tokens.accessToken, tokens.accessTokenExpiry)
}
export function getStoredRefreshTokenExpiresAt(): number | null {
  const tokens = getStoredSession()?.tokens
  return tokens ? expiry(tokens.refreshToken, tokens.refreshTokenExpiry) : null
}
export function getStoredPersistMode(): PersistMode | null { return getStoredSession()?.persistMode ?? null }
export function getStoredUser(): AuthUser | null { return getStoredSession()?.user ?? null }
export function hasStoredSession(): boolean { return getStoredSession() !== null }

export function storeSession(options: StoreSessionOptions): void {
  if (typeof window === 'undefined') throw new SessionStorageError()
  const record = validate({ version: 1, user: options.user, tokens: {
    ...options.tokens,
    refreshToken: options.keepRefreshToken ? options.tokens.refreshToken : undefined,
    refreshTokenExpiry: options.keepRefreshToken ? options.tokens.refreshTokenExpiry : undefined,
  } }, options.persistMode)
  const previous: Array<{ area: Storage; key: string; value: string | null }> = []
  let written = false
  try {
    for (const mode of ['local', 'session'] as const) {
      const area = storage(mode)
      for (const key of [sessionStorageKey, ...legacyKeys]) previous.push({ area, key, value: area.getItem(key) })
    }
    const selected = storage(options.persistMode)
    selected.setItem(sessionStorageKey, JSON.stringify(record))
    written = true
    storage(options.persistMode === 'local' ? 'session' : 'local').removeItem(sessionStorageKey)
    for (const mode of ['local', 'session'] as const) {
      for (const key of legacyKeys) storage(mode).removeItem(key)
    }
    suppressed = false
  } catch {
    // Failed cleanup must not look like successful account replacement.
    if (written) {
      for (const entry of previous) {
        try {
          if (entry.value === null) entry.area.removeItem(entry.key)
          else entry.area.setItem(entry.key, entry.value)
        } catch { suppressed = true }
      }
    }
    throw new SessionStorageError()
  }
}
export function storeUser(user: AuthUser, persistMode: PersistMode): void {
  const session = getStoredSession()
  if (!session || session.user.id !== user.id) throw new SessionChangedError()
  storeSession({ ...session, user, persistMode, keepRefreshToken: Boolean(session.tokens.refreshToken) })
}
export function clearSession(): void {
  // Stop this page using credentials even when the browser refuses deletion.
  suppressed = true
  if (typeof window === 'undefined') return
  let failed = false
  for (const mode of ['local', 'session'] as const) {
    for (const key of [sessionStorageKey, ...legacyKeys]) {
      try { storage(mode).removeItem(key) } catch { failed = true }
    }
  }
  if (failed) throw new SessionStorageError()
  suppressed = false
}
