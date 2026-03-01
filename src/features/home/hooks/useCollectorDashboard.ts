import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createItemClaim,
  fetchBrowseItems,
  fetchImpactMetrics,
  fetchWalletBalance,
} from '@/features/items/api/itemsApi'
import type { BrowseItem } from '@/features/items/types'

interface CollectorDashboardFilters {
  readonly search: string
  readonly category: string
  readonly condition: string
  readonly location: string
}

export function useCollectorDashboard(enabled: boolean = true, postcode?: string) {
  const [filters, setFilters] = useState<CollectorDashboardFilters>({
    search: '',
    category: 'All Items',
    condition: 'All condition',
    location: '',
  })
  const [items, setItems] = useState<BrowseItem[]>([])
  const [allCategories, setAllCategories] = useState<string[]>(['All Items'])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isClaimingItemId, setIsClaimingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    itemsCollected: 0,
    itemsExchanged: 0,
    totalCo2SavedKg: 0,
    rewardsEarned: 0,
    rewardsCurrency: '£',
  })

  const loadItems = useCallback(async () => {
    try {
      setIsLoadingItems(true)
      setError(null)
      const result = await fetchBrowseItems({
        category: filters.category,
        search: filters.search,
        postcode,
      })
      setItems(result)
      if (filters.category === 'All Items' && filters.search.trim().length === 0) {
        const computedCategories = new Set<string>(['All Items'])
        result.forEach((item) => {
          const category = item.category.trim()
          if (category.length > 0) {
            computedCategories.add(category)
          }
        })
        setAllCategories([...computedCategories])
      }
    } catch {
      setError('Unable to load available items right now.')
    } finally {
      setIsLoadingItems(false)
    }
  }, [filters.category, filters.search, postcode])

  const loadStats = useCallback(async () => {
    try {
      setIsLoadingStats(true)
      const [impact, wallet] = await Promise.all([fetchImpactMetrics(), fetchWalletBalance()])
      setStats({
        itemsCollected: impact.itemsDonated + impact.itemsExchanged,
        itemsExchanged: impact.itemsExchanged,
        totalCo2SavedKg: impact.totalCo2SavedKg,
        rewardsEarned: wallet.balance,
        rewardsCurrency: wallet.currency,
      })
    } catch {
      setError('Unable to load your impact metrics right now.')
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }
    void loadItems()
  }, [enabled, loadItems])

  useEffect(() => {
    if (!enabled) {
      return
    }
    void loadStats()
  }, [enabled, loadStats])

  const categoriesFromItems = useMemo(() => {
    const computedCategories = new Set<string>(['All Items'])
    items.forEach((item) => {
      const category = item.category.trim()
      if (category.length > 0) {
        computedCategories.add(category)
      }
    })
    return [...computedCategories]
  }, [items])
  const categories = allCategories.length > 1 ? allCategories : categoriesFromItems

  const conditions = useMemo(() => {
    const computedConditions = new Set<string>(['All condition'])
    items.forEach((item) => {
      const condition = item.condition.trim()
      if (condition.length > 0) {
        computedConditions.add(condition)
      }
    })
    return [...computedConditions]
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedCondition = filters.condition.trim().toLowerCase()
    const normalizedLocation = filters.location.trim().toLowerCase()

    return items.filter((item) => {
      const conditionMatches =
        !normalizedCondition ||
        normalizedCondition === 'all condition' ||
        item.condition.toLowerCase() === normalizedCondition
      const locationMatches =
        !normalizedLocation ||
        item.locationLabel.toLowerCase().includes(normalizedLocation)

      return conditionMatches && locationMatches
    })
  }, [filters.condition, filters.location, items])

  const updateSearch = useCallback((nextSearch: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, search: nextSearch }))
  }, [])

  const updateCategory = useCallback((nextCategory: string) => {
    const normalizedCategory = nextCategory.trim()
    setFilters((currentFilters) => ({
      ...currentFilters,
      category: normalizedCategory.length > 0 ? normalizedCategory : 'All Items',
    }))
  }, [])

  const updateCondition = useCallback((nextCondition: string) => {
    const normalizedCondition = nextCondition.trim()
    setFilters((currentFilters) => ({
      ...currentFilters,
      condition: normalizedCondition.length > 0 ? normalizedCondition : 'All condition',
    }))
  }, [])

  const updateLocation = useCallback((nextLocation: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, location: nextLocation }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'All Items',
      condition: 'All condition',
      location: '',
    })
  }, [])

  const claimItem = useCallback(async (itemId: string) => {
    try {
      setIsClaimingItemId(itemId)
      setError(null)
      await createItemClaim(itemId)
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, claimStatus: 'pending_approval' } : item,
        ),
      )
    } catch {
      setError('Unable to create claim request right now.')
      throw new Error('Claim creation failed.')
    } finally {
      setIsClaimingItemId(null)
    }
  }, [])

  return {
    filters,
    items: filteredItems,
    categories,
    conditions,
    stats,
    isLoadingItems,
    isLoadingStats,
    isClaimingItemId,
    error,
    reloadItems: loadItems,
    reloadStats: loadStats,
    updateSearch,
    updateCategory,
    updateCondition,
    updateLocation,
    clearFilters,
    claimItem,
  }
}
