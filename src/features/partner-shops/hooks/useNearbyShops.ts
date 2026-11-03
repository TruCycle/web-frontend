import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchNearbyShops } from '@/features/partner-shops/api/shopsApi'
import type { Shop } from '@/features/partner-shops/types'

export function useNearbyShops(initialPostcode?: string) {
  const [shops, setShops] = useState<Shop[]>([])
  const [postcodeInput, setPostcodeInput] = useState<string | null>(null)
  const [submittedPostcode, setSubmittedPostcode] = useState<string | null>(null)
  const savedPostcode = initialPostcode?.trim() || ''
  const locationPostcode = postcodeInput ?? savedPostcode
  const searchPostcode = submittedPostcode ?? savedPostcode
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(savedPostcode))
  const [error, setError] = useState<string | null>(null)
  const requestGeneration = useRef(0)

  const loadShops = useCallback(async () => {
    const generation = ++requestGeneration.current
    const resolvedPostcode = searchPostcode.trim()
    setShops([])
    setError(null)

    if (!resolvedPostcode) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const nextShops = await fetchNearbyShops({ postcode: resolvedPostcode })
      if (generation === requestGeneration.current) {
        setShops(nextShops)
      }
    } catch {
      if (generation === requestGeneration.current) {
        setError('Unable to load nearby partner shops right now.')
      }
    } finally {
      if (generation === requestGeneration.current) {
        setIsLoading(false)
      }
    }
  }, [searchPostcode])

  useEffect(() => {
    void loadShops()
    return () => {
      requestGeneration.current += 1
    }
  }, [loadShops])

  const setLocationPostcode = useCallback((nextPostcode: string) => {
    requestGeneration.current += 1
    setPostcodeInput(nextPostcode)
    setSubmittedPostcode('')
    setShops([])
    setError(null)
    setIsLoading(false)
  }, [])

  const searchByPostcode = useCallback((nextPostcode: string) => {
    const normalized = nextPostcode.trim()
    if (normalized !== searchPostcode) {
      requestGeneration.current += 1
      setShops([])
      setError(null)
      setIsLoading(false)
    }
    setPostcodeInput(normalized)
    setSubmittedPostcode(normalized)
    if (normalized && normalized === searchPostcode) {
      void loadShops()
    }
  }, [loadShops, searchPostcode])

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
    needsLocation: !searchPostcode.trim(),
    reload: loadShops,
  }
}
