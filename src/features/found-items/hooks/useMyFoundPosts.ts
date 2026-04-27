import { useCallback, useEffect, useState } from 'react'
import type { PaginationMeta } from '@/shared/types/pagination'
import {
  deleteFoundItem,
  fetchMyFoundPosts,
  updateFoundItemStatus,
} from '../api/foundItemsApi'
import type { FoundItem, FoundItemStatus } from '../types'

interface UseMyFoundPostsResult {
  readonly items: FoundItem[]
  readonly pagination: PaginationMeta | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
  readonly updateStatus: (itemId: string, status: FoundItemStatus) => Promise<void>
  readonly remove: (itemId: string) => Promise<void>
}

export function useMyFoundPosts(
  userId?: string,
  status?: FoundItemStatus,
): UseMyFoundPostsResult {
  const [items, setItems] = useState<FoundItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchMyFoundPosts(userId, status)
      setItems(response.items)
      setPagination(response.pagination)
    } catch {
      setError('Unable to load your posts right now.')
    } finally {
      setIsLoading(false)
    }
  }, [status, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateStatus = useCallback(
    async (itemId: string, nextStatus: FoundItemStatus) => {
      await updateFoundItemStatus(itemId, nextStatus)
      await refresh()
    },
    [refresh],
  )

  const remove = useCallback(
    async (itemId: string) => {
      await deleteFoundItem(itemId)
      await refresh()
    },
    [refresh],
  )

  return {
    items,
    pagination,
    isLoading,
    error,
    refresh,
    updateStatus,
    remove,
  }
}
