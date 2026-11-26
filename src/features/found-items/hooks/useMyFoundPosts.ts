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
  const activeRequest = useRef<AbortController | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const currentKey = JSON.stringify([userId, status])

  const loadPage = useCallback(async (page = 1, append = false) => {
    activeRequest.current?.abort()
    if (!userId) {
      activeRequest.current = null
      setItems([])
      setPagination(null)
      setError(null)
      setIsLoading(false)
      return
    }
    const request = new AbortController()
    activeRequest.current = request
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchMyFoundPosts(userId, status, page, undefined, request.signal)
      if (request.signal.aborted) return
      setLoadedKey(JSON.stringify([userId, status]))
      setItems(current => append ? [...current, ...response.items] : response.items)
      setPagination(response.pagination)
    } catch {
      if (request.signal.aborted) return
      setItems([]); setPagination(null)
      setError('Unable to load your posts right now.')
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null
        if (!request.signal.aborted) setIsLoading(false)
      }
    }
  }, [status, userId])

  const refresh = useCallback(() => loadPage(), [loadPage])
  const loadMore = useCallback(async () => {
    if (!activeRequest.current && loadedKey === currentKey && pagination && pagination.page < pagination.totalPages) {
      await loadPage(pagination.page + 1, true)
    }
  }, [currentKey, loadedKey, loadPage, pagination])

  const currentView = useRef<{ userId?: string; refresh: typeof refresh } | null>(null)
  useEffect(() => {
    currentView.current = { userId, refresh }
    void refresh()
    return () => {
      currentView.current = null
      activeRequest.current?.abort()
    }
  }, [refresh, userId])

  const updateStatus = useCallback(
    async (itemId: string, nextStatus: FoundItemStatus) => {
      await updateFoundItemStatus(itemId, nextStatus)
      const view = currentView.current
      if (view && view.userId === userId) await view.refresh()
    },
    [userId],
  )

  const remove = useCallback(
    async (itemId: string) => {
      await deleteFoundItem(itemId)
      const view = currentView.current
      if (view && view.userId === userId) await view.refresh()
    },
    [userId],
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
