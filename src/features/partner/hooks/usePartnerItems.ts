import { useCallback, useEffect, useState } from 'react'
import { fetchPartnerItems } from '@/features/partner/api/partnerApi'
import type { PartnerManagedItem } from '@/features/partner/types'

const defaultLimit = 10

interface PartnerItemsFilters {
  readonly status: string
  readonly pickupOption: string
}

const defaultFilters: PartnerItemsFilters = {
  status: 'all',
  pickupOption: 'all',
}

export function usePartnerItems(limit: number = defaultLimit) {
  const [items, setItems] = useState<readonly PartnerManagedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<PartnerItemsFilters>(defaultFilters)
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  })

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchPartnerItems({
        page,
        limit,
        status: filters.status === 'all' ? undefined : filters.status,
        pickupOption: filters.pickupOption === 'all' ? undefined : filters.pickupOption,
      })
      setItems(response.items)
      setPagination(response.pagination)
      if (response.pagination.page !== page) {
        setPage(response.pagination.page)
      }
    } catch {
      setError('Unable to load partner items right now.')
    } finally {
      setIsLoading(false)
    }
  }, [filters.pickupOption, filters.status, limit, page])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const setStatusFilter = useCallback((status: string) => {
    setFilters((current) => ({ ...current, status }))
    setPage(1)
  }, [])

  const setPickupOptionFilter = useCallback((pickupOption: string) => {
    setFilters((current) => ({ ...current, pickupOption }))
    setPage(1)
  }, [])

  const goToPage = useCallback((nextPage: number) => {
    const normalized = Math.max(1, Math.min(nextPage, pagination.totalPages))
    setPage(normalized)
  }, [pagination.totalPages])

  const nextPage = useCallback(() => {
    if (page >= pagination.totalPages) {
      return
    }

    setPage((current) => current + 1)
  }, [page, pagination.totalPages])

  const previousPage = useCallback(() => {
    if (page <= 1) {
      return
    }

    setPage((current) => current - 1)
  }, [page])

  const reload = useCallback(async () => {
    await loadItems()
  }, [loadItems])

  return {
    items,
    isLoading,
    error,
    filters,
    setStatusFilter,
    setPickupOptionFilter,
    reload,
    currentPage: pagination.page,
    pagination,
    totalPages: pagination.totalPages,
    canGoPrevious: pagination.page > 1,
    canGoNext: pagination.page < pagination.totalPages,
    goToPage,
    nextPage,
    previousPage,
  }
}
