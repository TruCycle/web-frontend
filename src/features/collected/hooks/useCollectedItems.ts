import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const collecting = useRef(false)
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
          item.claimStatus.toLowerCase() === 'approved' &&
          item.item.pickupOption.toLowerCase() === 'donate',
      ),
    [items],
  )

  const completeCollection = useCallback(
    async (payload: {
      readonly itemId: string
      readonly qrPayload?: string
      readonly shopId?: string
    }) => {
      if (collecting.current) throw new Error('Collection is already being recorded')
      const selected = items.find(item => item.item.id === payload.itemId)
      if (!payload.qrPayload && (!selected || selected.claimStatus.toLowerCase() !== 'approved' ||
          selected.item.pickupOption.toLowerCase() !== 'exchange')) {
        throw new Error('Only approved exchanges can be confirmed manually')
      }
      collecting.current = true
      try {
        setIsCollecting(true)
        setError(null)
        if (payload.qrPayload) {
          const scan = await scanQrCode({
            qrPayload: payload.qrPayload,
            direction: 'out',
            shopId: payload.shopId,
          })
          if (!scan.accepted) throw new Error('The QR scan was not accepted')
        }
        await collectItem(payload.itemId, payload.shopId)
        await loadCollectedItems(page)
      } catch {
        setError('Collection could not be confirmed. Check the item status before retrying.')
        throw new Error('Collection failed')
      } finally {
        collecting.current = false
        setIsCollecting(false)
      }
    },
    [items, loadCollectedItems, page],
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
