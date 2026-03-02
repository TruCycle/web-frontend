import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchDonorListings,
  removeDonorListing,
} from '@/features/listings/api/listingsApi'
import type { DonorListingItem, ListingsPagination } from '@/features/listings/types'

interface UseDonorListingsOptions {
  readonly enabled?: boolean
  readonly limit?: number
}

const defaultLimit = 20

function resolveOptions(
  options: boolean | UseDonorListingsOptions,
): Required<UseDonorListingsOptions> {
  if (typeof options === 'boolean') {
    return { enabled: options, limit: defaultLimit }
  }

  return {
    enabled: options.enabled ?? true,
    limit: options.limit ?? defaultLimit,
  }
}

export function useDonorListings(
  options: boolean | UseDonorListingsOptions = true,
) {
  const { enabled, limit } = resolveOptions(options)
  const [listings, setListings] = useState<DonorListingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<ListingsPagination>({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  })

  const loadListings = useCallback(async (targetPage: number) => {
    if (!enabled) {
      setListings([])
      setIsLoading(false)
      setError(null)
      setPagination({
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
      })
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchDonorListings({ limit, page: targetPage })
      setListings(response.items)
      setPagination(response.pagination)
      if (response.pagination.page !== targetPage) {
        setPage(response.pagination.page)
      }
    } catch {
      setError('Unable to load your listings right now.')
    } finally {
      setIsLoading(false)
    }
  }, [enabled, limit])

  useEffect(() => {
    void loadListings(page)
  }, [loadListings, page])

  const removeListing = useCallback(async (listingId: string) => {
    const currentListings = listings
    try {
      setRemovingId(listingId)
      setError(null)
      setListings((previousListings) =>
        previousListings.filter((listing) => listing.id !== listingId),
      )
      await removeDonorListing(listingId)
    } catch {
      setListings(currentListings)
      setError('Failed to remove the listing. Please try again.')
      throw new Error('Failed to remove listing')
    } finally {
      setRemovingId(null)
    }
  }, [listings])

  const summary = useMemo(() => {
    const active = listings.filter((listing) => listing.status === 'Active').length
    const claimed = listings.filter((listing) => listing.status === 'Claimed').length
    const completed = listings.filter((listing) => listing.status === 'Completed').length
    return { active, claimed, completed }
  }, [listings])

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
    await loadListings(page)
  }, [loadListings, page])

  return {
    listings,
    summary,
    isLoading,
    error,
    removingId,
    reload,
    removeListing,
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
