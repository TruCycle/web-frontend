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
  const sequence = useRef(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const currentKey = JSON.stringify([itemId, viewerId])

  const refresh = useCallback(async () => {
    const requestId = ++sequence.current
    setItem(null); setClaims([]); setViewerClaim(null)
    if (!itemId) {
      setItem(null)
      setClaims([])
      setViewerClaim(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchFoundItemById(itemId, viewerId)
      if (requestId !== sequence.current) return
      setLoadedKey(JSON.stringify([itemId, viewerId]))
      setItem(response.item)
      setClaims(response.claims)
      setViewerClaim(response.viewerClaim)
    } catch {
      if (requestId !== sequence.current) return
      setError('Unable to load that item right now.')
    } finally {
      if (requestId === sequence.current) setIsLoading(false)
    }
  }, [itemId, viewerId])

  useEffect(() => {
    void refresh()
    return () => { sequence.current += 1 }
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
