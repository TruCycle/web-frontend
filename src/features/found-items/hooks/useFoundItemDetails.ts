import { useCallback, useEffect, useState } from 'react'
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

  const refresh = useCallback(async () => {
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
      setItem(response.item)
      setClaims(response.claims)
      setViewerClaim(response.viewerClaim)
    } catch {
      setError('Unable to load that item right now.')
    } finally {
      setIsLoading(false)
    }
  }, [itemId, viewerId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    item,
    claims,
    viewerClaim,
    isLoading,
    error,
    refresh,
  }
}
