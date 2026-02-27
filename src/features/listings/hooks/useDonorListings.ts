import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchDonorListings,
  removeDonorListing,
} from '@/features/listings/api/listingsApi'
import type { DonorListingItem } from '@/features/listings/types'

export function useDonorListings(enabled: boolean = true) {
  const [listings, setListings] = useState<DonorListingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadListings = useCallback(async () => {
    if (!enabled) {
      setListings([])
      setIsLoading(false)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchDonorListings({ limit: 20 })
      setListings(response)
    } catch {
      setError('Unable to load your listings right now.')
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void loadListings()
  }, [loadListings])

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

  return {
    listings,
    summary,
    isLoading,
    error,
    removingId,
    reload: loadListings,
    removeListing,
  }
}
