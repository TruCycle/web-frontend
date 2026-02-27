import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchNearbyShops } from '@/features/partner-shops/api/shopsApi'
import type { Shop } from '@/features/partner-shops/types'

const fallbackPostcode = 'SW1A 2AA'

export function useNearbyShops(initialPostcode?: string) {
  const [shops, setShops] = useState<Shop[]>([])
  const [locationPostcode, setLocationPostcode] = useState(
    initialPostcode?.trim() || fallbackPostcode,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadShops = useCallback(async (postcode?: string) => {
    const resolvedPostcode = postcode?.trim() || locationPostcode.trim() || fallbackPostcode

    try {
      setIsLoading(true)
      setError(null)
      const nextShops = await fetchNearbyShops({ postcode: resolvedPostcode })
      setShops(nextShops)
    } catch {
      setError('Unable to load nearby partner shops right now.')
    } finally {
      setIsLoading(false)
    }
  }, [locationPostcode])

  useEffect(() => {
    void loadShops(locationPostcode)
  }, [loadShops, locationPostcode])

  const searchByPostcode = useCallback((nextPostcode: string) => {
    const normalized = nextPostcode.trim()
    setLocationPostcode(normalized || fallbackPostcode)
  }, [])

  const filteredShops = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return shops
    }

    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) ||
        shop.address.toLowerCase().includes(query) ||
        shop.postcode.toLowerCase().includes(query),
    )
  }, [searchQuery, shops])

  return {
    shops,
    filteredShops,
    locationPostcode,
    setLocationPostcode,
    searchByPostcode,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    reload: loadShops,
  }
}
