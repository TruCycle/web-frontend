import { useCallback, useEffect, useState } from 'react'
import {
  createPartnerShop,
  fetchMyPartnerShops,
  updatePartnerShop,
} from '@/features/partner/api/partnerApi'
import type {
  CreatePartnerShopPayload,
  PartnerShop,
  UpdatePartnerShopPayload,
} from '@/features/partner/types'

export function usePartnerShops() {
  const [shops, setShops] = useState<readonly PartnerShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadShops = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedShops = await fetchMyPartnerShops()
      setShops(fetchedShops)
    } catch {
      setError('Unable to load your shops right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadShops()
  }, [loadShops])

  const createShop = useCallback(async (payload: CreatePartnerShopPayload) => {
    setIsSaving(true)
    try {
      const createdShop = await createPartnerShop(payload)
      setShops((currentShops) => [createdShop, ...currentShops])
      return createdShop
    } finally {
      setIsSaving(false)
    }
  }, [])

  const updateShop = useCallback(async (shopId: string, payload: UpdatePartnerShopPayload) => {
    setIsSaving(true)
    try {
      const updated = await updatePartnerShop(shopId, payload)
      setShops((currentShops) =>
        currentShops.map((shop) => (shop.id === shopId ? updated : shop)),
      )
      return updated
    } finally {
      setIsSaving(false)
    }
  }, [])

  const toggleShopActive = useCallback(async (shopId: string, active: boolean) => {
    return updateShop(shopId, { active })
  }, [updateShop])

  const reload = useCallback(async () => {
    await loadShops()
  }, [loadShops])

  return {
    shops,
    isLoading,
    isSaving,
    error,
    createShop,
    updateShop,
    toggleShopActive,
    reload,
  }
}
