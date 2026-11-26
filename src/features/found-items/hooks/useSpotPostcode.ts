import { useCallback, useEffect, useState } from 'react'

interface SpotPoint {
  readonly latitude: number
  readonly longitude: number
}

type LookupResult =
  | { readonly key: string; readonly status: 'resolved'; readonly postcode: string; readonly error: null }
  | { readonly key: string; readonly status: 'error'; readonly postcode: null; readonly error: string }

type PostcodeStatus = 'idle' | 'loading' | 'resolved' | 'error'
const LOOKUP_TIMEOUT_MS = 8_000

function readPostcode(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('result' in payload)) return null
  const result = payload.result
  if (!Array.isArray(result) || typeof result[0] !== 'object' || result[0] === null) return null
  const postcode: unknown = result[0].postcode
  if (typeof postcode !== 'string') return null
  const compact = postcode.replace(/\s/g, '').toUpperCase()
  if (!/^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(compact)) return null
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`
}

export function useSpotPostcode(point: SpotPoint | null): {
  readonly postcode: string | null
  readonly status: PostcodeStatus
  readonly error: string | null
  readonly retry: () => void
} {
  const latitude = point?.latitude ?? null
  const longitude = point?.longitude ?? null
  const validPoint = latitude !== null && longitude !== null && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
  const coordinateKey = validPoint ? JSON.stringify([latitude, longitude]) : null
  const [request, setRequest] = useState({ coordinateKey, generation: 0 })
  const [result, setResult] = useState<LookupResult | null>(null)

  // A new point gets a new identity before committing UI. In particular A→B→A
  // cannot revive the first A request/result while its replacement is pending.
  if (request.coordinateKey !== coordinateKey) {
    setRequest({ coordinateKey, generation: request.generation + 1 })
  }
  const requestKey = coordinateKey === null ? null : JSON.stringify([coordinateKey, request.generation])
  const retry = useCallback(() => {
    setRequest((current) => ({ ...current, generation: current.generation + 1 }))
  }, [setRequest])

  useEffect(() => {
    if (requestKey === null) return
    let isCurrent = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      if (!isCurrent) return
      controller.abort()
      setResult({ key: requestKey, status: 'error', postcode: null,
        error: 'Postcode lookup took too long. Please retry.' })
    }, LOOKUP_TIMEOUT_MS)
    const query = new URLSearchParams({ lon: String(longitude), lat: String(latitude), limit: '1' })
    void fetch(`https://api.postcodes.io/postcodes?${query}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Postcode lookup failed')
        return response.json() as Promise<unknown>
      })
      .then((payload) => {
        if (!isCurrent || controller.signal.aborted) return
        const postcode = readPostcode(payload)
        if (!postcode) throw new Error('No postcode at this point')
        setResult({ key: requestKey, status: 'resolved', postcode, error: null })
      })
      .catch(() => {
        if (!isCurrent || controller.signal.aborted) return
        setResult({ key: requestKey, status: 'error', postcode: null,
          error: 'We could not identify a postcode for this location. Please retry.' })
      })
      .finally(() => window.clearTimeout(timeout))
    return () => {
      isCurrent = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [latitude, longitude, requestKey])

  const currentResult = result?.key === requestKey ? result : null
  const status: PostcodeStatus = requestKey === null ? 'idle' : currentResult?.status ?? 'loading'
  return {
    postcode: status === 'resolved' ? currentResult?.postcode ?? null : null,
    status,
    error: status === 'error' ? currentResult?.error ?? null : null,
    retry,
  }
}
