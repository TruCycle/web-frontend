import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collectItem,
  fetchCollectedItems,
  scanQrCode,
} from '@/features/items/api/itemsApi'
import type { CollectedItem } from '@/features/items/types'
import type { PaginationMeta } from '@/shared/types/pagination'

interface UseCollectedItemsOptions {
  readonly limit?: number
}

const defaultLimit = 10

export function useCollectedItems(options: UseCollectedItemsOptions = {}) {
  const limit = options.limit ?? defaultLimit
  const [items, setItems] = useState<CollectedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCollecting, setIsCollecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  })

  const loadCollectedItems = useCallback(async (targetPage: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchCollectedItems({ page: targetPage, limit })
      setItems(response.items)
      setPagination(response.pagination)
      if (response.pagination.page !== targetPage) {
        setPage(response.pagination.page)
      }
    } catch {
      setError('Unable to load collected items right now.')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void loadCollectedItems(page)
  }, [loadCollectedItems, page])

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
        await loadCollectedItems(page)
      } catch {
        setError('Collection failed. Please rescan and try again.')
        throw new Error('Collection failed')
      } finally {
        setIsCollecting(false)
      }
    },
    [loadCollectedItems, page],
  )

  const canGoPrevious = pagination.page > 1
  const canGoNext = pagination.page < pagination.totalPages

  const goToPage = useCallback((nextPage: number) => {
    const normalizedPage = Math.max(1, Math.min(nextPage, pagination.totalPages))
    setPage(normalizedPage)
  }, [pagination.totalPages])

  const nextPage = useCallback(() => {
    if (!canGoNext) {
      return
    }

    setPage((currentPage) => currentPage + 1)
  }, [canGoNext])

  const previousPage = useCallback(() => {
    if (!canGoPrevious) {
      return
    }

    setPage((currentPage) => Math.max(1, currentPage - 1))
  }, [canGoPrevious])

  const reload = useCallback(async () => {
    await loadCollectedItems(page)
  }, [loadCollectedItems, page])

  return {
    items,
    pendingCollectionItems,
    isLoading,
    isCollecting,
    error,
    reload,
    completeCollection,
    pagination,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    canGoPrevious,
    canGoNext,
    goToPage,
    nextPage,
    previousPage,
  }
}
