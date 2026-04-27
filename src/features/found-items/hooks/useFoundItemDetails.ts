import { useCallback, useEffect, useState } from 'react'
import { fetchFoundItemById } from '../api/foundItemsApi'
import type { FoundItem, FoundItemClaim } from '../types'

interface UseFoundItemDetailsResult {
  readonly item: FoundItem | null
  readonly claims: FoundItemClaim[]
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!itemId) {
      setItem(null)
      setClaims([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchFoundItemById(itemId, viewerId)
      setItem(response.item)
      setClaims(response.claims)
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
    isLoading,
    error,
    refresh,
  }
}
