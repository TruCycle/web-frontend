import { env } from '@/shared/lib/config/env'
import { getStoredAccessToken } from '@/shared/lib/auth/session'
import { ApiError } from '@/shared/types/network'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<TBody> {
  readonly method?: HttpMethod
  readonly body?: TBody
  readonly headers?: Record<string, string>
  readonly signal?: AbortSignal
}

function buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const authToken = getStoredAccessToken()

  return {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...customHeaders,
  }
}

export async function apiRequest<TResponse, TBody = never>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: buildHeaders(options.headers),
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`

    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) {
        errorMessage = payload.message
      }
    } catch {
      // Keep fallback error message when response body is not JSON.
    }

    throw new ApiError(errorMessage, response.status)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}
