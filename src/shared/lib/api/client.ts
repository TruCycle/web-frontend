import { env } from '@/shared/lib/config/env'
import { captureStoredSession, getStoredAccessTokenExpiresAt, isSameSessionIdentity, SessionChangedError } from '@/shared/lib/auth/session'
import type { RecoveryResult } from '@/shared/lib/auth/recovery'
import { ApiError } from '@/shared/types/network'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
interface RequestOptions<TBody> {
  readonly method?: HttpMethod
  readonly body?: TBody
  readonly headers?: Record<string, string>
  readonly signal?: AbortSignal
  readonly includeAuth?: boolean
  readonly skipSessionRecovery?: boolean
  readonly timeoutMs?: number
}
let recoveryHandler: (() => Promise<RecoveryResult>) | null = null
export function registerSessionRecovery(handler: () => Promise<RecoveryResult>): () => void {
  recoveryHandler = handler
  return () => { if (recoveryHandler === handler) recoveryHandler = null }
}
export class RequestTimeoutError extends Error {
  constructor() { super('The request timed out. Please retry.'); this.name = 'RequestTimeoutError' }
}
export class SessionUnavailableError extends Error {
  constructor() { super('Your sign-in could not be checked. Please retry.'); this.name = 'SessionUnavailableError' }
}
export class ActionRetryRequiredError extends Error {
  constructor() { super('Your sign-in was renewed. Please retry this action.'); this.name = 'ActionRetryRequiredError' }
}
async function recover() {
  const result = await recoveryHandler?.()
  if (result?.kind === 'refreshed') return
  if (result?.kind === 'superseded') throw new SessionChangedError()
  if (result?.kind === 'terminal') throw new ApiError('Sign in again to continue.', 401)
  throw new SessionUnavailableError()
}

// Timeout covers both headers and response-body parsing, even if a mocked or
// non-conforming transport ignores abort. Late completion cannot reach callers.
async function requestOnce<T>(url: string, init: RequestInit, signal: AbortSignal | undefined, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let abort = () => {}
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => { controller.abort(); reject(new DOMException('Request cancelled', 'AbortError')) }
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => { controller.abort(); reject(new RequestTimeoutError()) }, timeoutMs)
  })
  const operation = async () => {
    if (controller.signal.aborted) throw new DOMException('Request cancelled', 'AbortError')
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) {
      let message = 'Request failed with status ' + response.status
      try {
        const payload: unknown = await response.json()
        if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') message = payload.message
        else if (payload && typeof payload === 'object' && 'message' in payload && Array.isArray(payload.message)) {
          const messages = payload.message.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
          if (messages.length) message = messages.slice(0, 10).map((value) => value.slice(0, 300)).join('; ')
        }
      } catch { /* Retain status when an error body is unavailable. */ }
      throw new ApiError(message, response.status)
    }
    return response.status === 204 ? undefined as T : await response.json() as T
  }
  try { return await Promise.race([operation(), cancelled]) }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

export async function apiRequest<TResponse, TBody = never>(path: string, options: RequestOptions<TBody> = {}): Promise<TResponse> {
  if (options.signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
  const method = options.method ?? 'GET'
  const authenticated = options.includeAuth ?? true
  const original = authenticated ? captureStoredSession() : null
  const canRecover = Boolean(original && !options.skipSessionRecovery && recoveryHandler)
  const assertIdentity = () => { if (original && !isSameSessionIdentity(original)) throw new SessionChangedError() }
  if (canRecover && getStoredAccessTokenExpiresAt() !== null && getStoredAccessTokenExpiresAt()! <= Date.now()) {
    await recover()
    assertIdentity()
  }
  // A mutation may refresh before it is sent, but is never automatically replayed.
  for (let attempt = 0; ; attempt++) {
    assertIdentity()
    const current = authenticated ? captureStoredSession() : null
    try {
      const response = await requestOnce<TResponse>(env.apiBaseUrl + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(current ? { Authorization: 'Bearer ' + current.session.tokens.accessToken } : {}), ...options.headers },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }, options.signal, Math.min(60_000, Math.max(1, options.timeoutMs ?? 10_000)))
      assertIdentity()
      return response
    } catch (error) {
      assertIdentity()
      if (attempt === 0 && canRecover && error instanceof ApiError && error.statusCode === 401) {
        await recover()
        assertIdentity()
        if (method !== 'GET') throw new ActionRetryRequiredError()
        continue
      }
      throw error
    }
  }
}
