import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collectItem,
  fetchCollectedItems,
  scanQrCode,
} from '@/features/items/api/itemsApi'
import type { CollectedItem } from '@/features/items/types'

export function useCollectedItems() {
  const [items, setItems] = useState<CollectedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCollecting, setIsCollecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCollectedItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchCollectedItems()
      setItems(response)
    } catch {
      setError('Unable to load collected items right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCollectedItems()
  }, [loadCollectedItems])

  const pendingCollectionItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.claimStatus === 'approved' ||
          item.claimStatus === 'pending_dropoff' ||
          item.claimStatus === 'pending_collection',
      ),
    [items],
  )

  const completeCollection = useCallback(
    async (payload: {
      readonly itemId: string
      readonly qrPayload: string
      readonly shopId?: string
    }) => {
      try {
        setIsCollecting(true)
        setError(null)
        await scanQrCode({
          qrPayload: payload.qrPayload,
          direction: 'out',
          shopId: payload.shopId,
        })
        await collectItem(payload.itemId, payload.shopId)
        await loadCollectedItems()
      } catch {
        setError('Collection failed. Please rescan and try again.')
        throw new Error('Collection failed')
      } finally {
        setIsCollecting(false)
      }
    },
    [loadCollectedItems],
  )

  return {
    items,
    pendingCollectionItems,
    isLoading,
    isCollecting,
    error,
    reload: loadCollectedItems,
    completeCollection,
  }
}
