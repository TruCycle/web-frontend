import type { AuthTokens, AuthUser } from '@/features/auth/types'
import { ApiError } from '@/shared/types/network'
import {
  captureStoredSession, clearSession, getSessionGeneration, invalidateSessionOperations,
  isCurrentSession, storeSession, getAccessTokenExpiry, type SessionCapture,
} from './session'

export type RecoveryResult =
  | { readonly kind: 'refreshed'; readonly capture: SessionCapture }
  | { readonly kind: 'terminal'; readonly generation: number }
  | { readonly kind: 'unavailable'; readonly capture: SessionCapture | null; readonly generation: number; readonly needsSignOut?: boolean }
  | { readonly kind: 'superseded' }

export function isRetryableSessionError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && error.name === 'RequestTimeoutError') ||
    (error instanceof ApiError && (error.statusCode === 408 || error.statusCode === 429 || error.statusCode >= 500))
}
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Superseded', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    if (signal.aborted) abort()
    else signal.addEventListener('abort', abort, { once: true })
  })
}
export async function withSessionRetry<T>(operation: () => Promise<T>, signal: AbortSignal,
  wait: (ms: number, signal: AbortSignal) => Promise<void> = sleep): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    if (signal.aborted) throw new DOMException('Superseded', 'AbortError')
    try { return await operation() } catch (error) {
      if (signal.aborted || attempt >= 2 || !isRetryableSessionError(error)) throw error
      await wait(attempt === 0 ? 1000 : 3000, signal)
    }
  }
}

export function createSessionRecovery(
  refresh: (token: string, signal: AbortSignal) => Promise<{ user: AuthUser; tokens: AuthTokens }>,
  wait?: (ms: number, signal: AbortSignal) => Promise<void>,
) {
  let flight: { capture: SessionCapture; controller: AbortController; promise: Promise<RecoveryResult> } | null = null
  function cancel() { flight?.controller.abort(); flight = null }
  function recover(): Promise<RecoveryResult> {
    let capture: SessionCapture | null
    try { capture = captureStoredSession() } catch { return Promise.resolve({ kind: 'unavailable', capture: null, generation: getSessionGeneration() }) }
    if (!capture) return Promise.resolve({ kind: 'terminal', generation: getSessionGeneration() })
    try { if (flight && isCurrentSession(flight.capture)) return flight.promise }
    catch { return Promise.resolve({ kind: 'unavailable', capture, generation: getSessionGeneration() }) }
    cancel()
    const current = capture
    const controller = new AbortController()
    const entry = { capture: current, controller, promise: Promise.resolve<RecoveryResult>({ kind: 'superseded' }) }
    entry.promise = (async (): Promise<RecoveryResult> => {
      try {
        const token = current.session.tokens.refreshToken
        if (!token) throw new ApiError('Sign in again to continue.', 401)
        // Cached expiry is not an early cutoff; the server decides validity.
        const next = await withSessionRetry(() => refresh(token, controller.signal), controller.signal, wait)
        if (controller.signal.aborted || !isCurrentSession(current)) return { kind: 'superseded' }
        if (next.user.id !== current.session.user.id) throw new Error('Invalid session response')
        const accessExpiry = getAccessTokenExpiry(next.tokens)
        if (accessExpiry !== null && accessExpiry <= Date.now()) throw new Error('Expired session response')
        storeSession({ ...next, persistMode: current.session.persistMode, keepRefreshToken: true })
        const stored = captureStoredSession()
        if (!stored) throw new Error('Session was not saved')
        return { kind: 'refreshed', capture: stored }
      } catch (error) {
        if (controller.signal.aborted || current.generation !== getSessionGeneration()) return { kind: 'superseded' }
        try {
          if (!isCurrentSession(current)) return { kind: 'superseded' }
          if (error instanceof ApiError && error.statusCode === 401) {
            invalidateSessionOperations()
            try { clearSession() }
            catch { return { kind: 'unavailable', capture: null, generation: getSessionGeneration(), needsSignOut: true } }
            return { kind: 'terminal', generation: getSessionGeneration() }
          }
        } catch { return { kind: 'unavailable', capture: null, generation: getSessionGeneration() } }
        return { kind: 'unavailable', capture: current, generation: current.generation }
      } finally { if (flight === entry) flight = null }
    })()
    flight = entry
    return entry.promise
  }
  return { recover, cancel }
}
