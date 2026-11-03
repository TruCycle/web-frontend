import { useCallback, useEffect, useRef, useState } from 'react'
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
  readonly loadMore: () => Promise<void>
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
  const sequence = useRef(0)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const currentKey = JSON.stringify([userId, status])

  const loadPage = useCallback(async (page = 1, append = false) => {
    const requestId = ++sequence.current
    if (!userId) { setItems([]); setPagination(null); setIsLoading(false); return }
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchMyFoundPosts(userId, status, page)
      if (requestId !== sequence.current) return
      setLoadedKey(JSON.stringify([userId, status]))
      setItems(current => append ? [...current, ...response.items] : response.items)
      setPagination(response.pagination)
    } catch {
      if (requestId !== sequence.current) return
      setItems([]); setPagination(null)
      setError('Unable to load your posts right now.')
    } finally {
      if (requestId === sequence.current) setIsLoading(false)
    }
  }, [status, userId])

  const refresh = useCallback(() => loadPage(), [loadPage])
  const loadMore = useCallback(async () => {
    if (!isLoading && pagination && pagination.page < pagination.totalPages) await loadPage(pagination.page + 1, true)
  }, [isLoading, loadPage, pagination])

  useEffect(() => {
    void refresh()
    return () => { sequence.current += 1 }
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
    items: loadedKey === currentKey ? items : [],
    pagination: loadedKey === currentKey ? pagination : null,
    isLoading,
    error,
    refresh,
    loadMore,
    updateStatus,
    remove,
  }
}
