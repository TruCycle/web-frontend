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
function cancelledRequest(): DOMException {
  return new DOMException('Request cancelled', 'AbortError')
}

async function recover(signal?: AbortSignal) {
  if (signal?.aborted) throw cancelledRequest()
  // Recovery is shared across callers. Cancel only this caller's wait.
  const pending = recoveryHandler?.()
  let onAbort: (() => void) | undefined
  const cancellation = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(cancelledRequest())
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
  let result: RecoveryResult | undefined
  try {
    result = await Promise.race([pending, cancellation])
    if (signal?.aborted) throw cancelledRequest()
  } finally {
    if (onAbort) signal?.removeEventListener('abort', onAbort)
  }
  if (result?.kind === 'refreshed') return
  if (result?.kind === 'superseded') throw new SessionChangedError()
  if (result?.kind === 'terminal') throw new ApiError('Sign in again to continue.', 401)
  throw new SessionUnavailableError()
}

// Timeout covers both headers and response-body parsing, even if a mocked or
// non-conforming transport ignores abort. Late completion cannot reach callers.
async function requestOnce<T>(url: string, init: RequestInit, signal: AbortSignal | undefined, timeoutMs: number, readBody: (response: Response) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  let abort = () => {}
  const cancelled = new Promise<never>((_resolve, reject) => {
    abort = () => { controller.abort(); reject(cancelledRequest()) }
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => { controller.abort(); reject(new RequestTimeoutError()) }, timeoutMs)
  })
  const operation = async () => {
    if (controller.signal.aborted) throw cancelledRequest()
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
    return response.status === 204 ? undefined as T : await readBody(response)
  }
  try { return await Promise.race([operation(), cancelled]) }
  finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
}

export async function apiRequest<TResponse, TBody = never>(path: string, options: RequestOptions<TBody> = {}): Promise<TResponse> {
  return request(path, options, response => response.json() as Promise<TResponse>)
}

export async function apiRequestBlob(path: string, signal?: AbortSignal, maxBytes?: number): Promise<Blob> {
  return request(path, { signal }, async response => {
    if (maxBytes === undefined) return response.blob()
    if (Number(response.headers.get('Content-Length')) > maxBytes) {
      void response.body?.cancel().catch(() => {})
      throw new Error('Download exceeds the allowed size.')
    }
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Download body is unavailable.')

    const chunks: BlobPart[] = []
    let received = 0
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        received += value.byteLength
        if (received > maxBytes) {
          void reader.cancel().catch(() => {})
          throw new Error('Download exceeds the allowed size.')
        }
        chunks.push(new Uint8Array(value))
      }
    } finally {
      reader.releaseLock()
    }
    return new Blob(chunks, { type: response.headers.get('Content-Type') ?? '' })
  }, true)
}

async function request<TResponse, TBody>(
  path: string,
  options: RequestOptions<TBody>,
  readBody: (response: Response) => Promise<TResponse>,
  rejectRedirects = false,
): Promise<TResponse> {
  if (options.signal?.aborted) throw cancelledRequest()
  const method = options.method ?? 'GET'
  const authenticated = options.includeAuth ?? true
  const original = authenticated ? captureStoredSession() : null
  const canRecover = Boolean(original && !options.skipSessionRecovery && recoveryHandler)
  const assertIdentity = () => { if (original && !isSameSessionIdentity(original)) throw new SessionChangedError() }
  if (canRecover && getStoredAccessTokenExpiresAt() !== null && getStoredAccessTokenExpiresAt()! <= Date.now()) {
    await recover(options.signal)
    assertIdentity()
  }
  // A mutation may refresh before it is sent, but is never automatically replayed.
  for (let attempt = 0; ; attempt++) {
    if (options.signal?.aborted) throw cancelledRequest()
    assertIdentity()
    const current = authenticated ? captureStoredSession() : null
    try {
      const multipart = typeof FormData !== 'undefined' && options.body instanceof FormData ? options.body : undefined
      const response = await requestOnce<TResponse>(env.apiBaseUrl + path, {
        method,
        headers: { ...(multipart ? {} : { 'Content-Type': 'application/json' }), ...(current ? { Authorization: 'Bearer ' + current.session.tokens.accessToken } : {}), ...options.headers },
        body: multipart ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
        redirect: rejectRedirects || multipart ? 'error' : undefined,
      }, options.signal, Math.min(60_000, Math.max(1, options.timeoutMs ?? 10_000)), readBody)
      assertIdentity()
      if (options.signal?.aborted) throw cancelledRequest()
      return response
    } catch (error) {
      assertIdentity()
      if (options.signal?.aborted) throw cancelledRequest()
      if (attempt === 0 && canRecover && error instanceof ApiError && error.statusCode === 401) {
        await recover(options.signal)
        assertIdentity()
        if (method !== 'GET') throw new ActionRetryRequiredError()
        continue
      }
      throw error
    }
  }
}
