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
}

export function useCollectorDashboard(enabled: boolean = true, postcode?: string) {
  const [filters, setFilters] = useState<CollectorDashboardFilters>({
    search: '',
    category: 'All Items',
  })
  const [items, setItems] = useState<BrowseItem[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isClaimingItemId, setIsClaimingItemId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    itemsCollected: 0,
    itemsExchanged: 0,
    totalCo2SavedKg: 0,
    rewardsEarned: 0,
    rewardsCurrency: 'PTS',
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

  const categories = useMemo(() => {
    const computedCategories = new Set<string>(['All Items'])
    items.forEach((item) => {
      computedCategories.add(item.category)
    })
    return [...computedCategories]
  }, [items])

  const updateSearch = useCallback((nextSearch: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, search: nextSearch }))
  }, [])

  const updateCategory = useCallback((nextCategory: string) => {
    setFilters((currentFilters) => ({ ...currentFilters, category: nextCategory }))
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
    items,
    categories,
    stats,
    isLoadingItems,
    isLoadingStats,
    isClaimingItemId,
    error,
    reloadItems: loadItems,
    reloadStats: loadStats,
    updateSearch,
    updateCategory,
    claimItem,
  }
}
