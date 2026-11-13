import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFoundItemById } from '../api/foundItemsApi'
import type { FoundItem, FoundItemClaim } from '../types'

interface UseFoundItemDetailsResult {
  readonly item: FoundItem | null
  readonly claims: FoundItemClaim[]
  readonly viewerClaim: FoundItemClaim | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
}

export function useFoundItemDetails(
  itemId: string | null,
  viewerId?: string,
): UseFoundItemDetailsResult {
  const [item, setItem] = useState<FoundItem | null>(null)
  const [claims, setClaims] = useState<FoundItemClaim[]>([])
  const [viewerClaim, setViewerClaim] = useState<FoundItemClaim | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const currentKey = JSON.stringify([itemId, viewerId])

  const refresh = useCallback(async () => {
    activeRequest.current?.abort()
    activeRequest.current = null
    setItem(null)
    setClaims([])
    setViewerClaim(null)
    setError(null)
    if (!itemId) {
      setIsLoading(false)
      return
    }

    const request = new AbortController()
    activeRequest.current = request
    try {
      setIsLoading(true)
      const response = await fetchFoundItemById(itemId, viewerId, request.signal)
      if (request.signal.aborted) return
      setLoadedKey(JSON.stringify([itemId, viewerId]))
      setItem(response.item)
      setClaims(response.claims)
      setViewerClaim(response.viewerClaim)
    } catch {
      if (request.signal.aborted) return
      setError('Unable to load that item right now.')
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null
        if (!request.signal.aborted) setIsLoading(false)
      }
    }
  }, [itemId, viewerId])

  useEffect(() => {
    void refresh()
    return () => { activeRequest.current?.abort() }
  }, [refresh])

  return {
    item: loadedKey === currentKey ? item : null,
    claims: loadedKey === currentKey ? claims : [],
    viewerClaim: loadedKey === currentKey ? viewerClaim : null,
    isLoading,
    error,
    refresh,
  }
}
