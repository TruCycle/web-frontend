import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [filterState, setFilterState] = useState(() => ({ initialKey: JSON.stringify(initialFilters), value: initialFilters }))
  const initialKey = JSON.stringify(initialFilters)
  const filters = filterState.initialKey === initialKey ? filterState.value : initialFilters
  if (filterState.initialKey !== initialKey) {
    setFilterState({ initialKey, value: initialFilters })
  }
  const requestSequence = useRef(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(
    async (page: number = 1, append: boolean = false) => {
      const requestId = ++requestSequence.current
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchFoundItems(filters, page)
        if (requestId !== requestSequence.current) return
        setLoadedKey(JSON.stringify(filters))
        setItems((currentItems) => (append ? [...currentItems, ...response.items] : response.items))
        setPagination(response.pagination)
      } catch {
        if (requestId !== requestSequence.current) return
        setItems([])
        setPagination(null)
        setError('Unable to load the board right now.')
      } finally {
        if (requestId === requestSequence.current) setIsLoading(false)
      }
    },
    [filters],
  )

  useEffect(() => {
    void loadItems()
    return () => { requestSequence.current += 1 }
  }, [loadItems])

  const updateFilters = useCallback((updates: Partial<FoundItemsFilter>) => {
    setFilterState((current) => ({ ...current, value: { ...current.value, ...updates } }))
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
    items: loadedKey === JSON.stringify(filters) ? items : [],
    pagination: loadedKey === JSON.stringify(filters) ? pagination : null,
    isLoading,
    error,
    filters,
    updateFilters,
    loadMore,
    refresh,
  }
}
