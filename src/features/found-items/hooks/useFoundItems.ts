import { useCallback, useEffect, useState } from 'react'
import type { PaginationMeta } from '@/shared/types/pagination'
import { fetchFoundItems } from '../api/foundItemsApi'
import type { FoundItem, FoundItemsFilter } from '../types'

interface UseFoundItemsResult {
  readonly items: FoundItem[]
  readonly pagination: PaginationMeta | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly filters: FoundItemsFilter
  readonly updateFilters: (updates: Partial<FoundItemsFilter>) => void
  readonly loadMore: () => Promise<void>
  readonly refresh: () => Promise<void>
}

export function useFoundItems(initialFilters: FoundItemsFilter = {}): UseFoundItemsResult {
  const [items, setItems] = useState<FoundItem[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [filters, setFilters] = useState<FoundItemsFilter>(initialFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchFoundItems(filters, page)
        setItems((currentItems) => (append ? [...currentItems, ...response.items] : response.items))
        setPagination(response.pagination)
      } catch {
        setError('Unable to load the board right now.')
      } finally {
        setIsLoading(false)
      }
    },
    [filters],
  )

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const updateFilters = useCallback((updates: Partial<FoundItemsFilter>) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...updates,
    }))
  }, [])

  const loadMore = useCallback(async () => {
    if (!pagination || pagination.page >= pagination.totalPages) {
      return
    }

    await loadItems(pagination.page + 1, true)
  }, [loadItems, pagination])

  const refresh = useCallback(async () => {
    await loadItems()
  }, [loadItems])

  return {
    items,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    loadMore,
    refresh,
  }
}
