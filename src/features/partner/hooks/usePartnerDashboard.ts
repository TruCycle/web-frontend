import { useCallback, useEffect, useState } from 'react'
import { fetchMyPartnerShops, fetchPartnerItems } from '@/features/partner/api/partnerApi'
import type { PartnerManagedItem, PartnerShop } from '@/features/partner/types'

interface PartnerDashboardStats {
  readonly totalShops: number
  readonly totalItems: number
  readonly activeItems: number
  readonly pendingDropOffs: number
  readonly awaitingCollection: number
  readonly averageItemsPerShop: number
}

const initialStats: PartnerDashboardStats = {
  totalShops: 0,
  totalItems: 0,
  activeItems: 0,
  pendingDropOffs: 0,
  awaitingCollection: 0,
  averageItemsPerShop: 0,
}

export function usePartnerDashboard() {
  const [shops, setShops] = useState<readonly PartnerShop[]>([])
  const [stats, setStats] = useState<PartnerDashboardStats>(initialStats)
  const [recentItems, setRecentItems] = useState<readonly PartnerManagedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [shops, recent, allItems, activeItems, pendingDropOffs, awaitingCollection] =
        await Promise.all([
          fetchMyPartnerShops(),
          fetchPartnerItems({ page: 1, limit: 8 }),
          fetchPartnerItems({ page: 1, limit: 1 }),
          fetchPartnerItems({ page: 1, limit: 1, status: 'active' }),
          fetchPartnerItems({ page: 1, limit: 1, status: 'pending_dropoff' }),
          fetchPartnerItems({ page: 1, limit: 1, status: 'awaiting_collection' }),
        ])

      const totalShops = shops.length
      const totalItems = allItems.pagination.total
      setShops(shops)
      setStats({
        totalShops,
        totalItems,
        activeItems: activeItems.pagination.total,
        pendingDropOffs: pendingDropOffs.pagination.total,
        awaitingCollection: awaitingCollection.pagination.total,
        averageItemsPerShop:
          totalShops > 0 ? Number((totalItems / totalShops).toFixed(1)) : 0,
      })
      setRecentItems(recent.items)
    } catch {
      setError('Unable to load partner dashboard right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const reload = useCallback(async () => {
    await loadDashboard()
  }, [loadDashboard])

  return {
    shops,
    stats,
    recentItems,
    isLoading,
    error,
    reload,
  }
}
