import { useEffect, useState } from 'react'
import { fetchBrowseItems } from '@/features/items/api/itemsApi'
import type { BrowseItem } from '@/features/items/types'

export function useLandingBrowseItems(limit: number = 10) {
  const [items, setItems] = useState<BrowseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadItems() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchBrowseItems({
          limit,
          includeAuth: false,
        })
        if (!isActive) {
          return
        }

        setItems(response.slice(0, limit))
      } catch {
        if (!isActive) {
          return
        }

        setItems([])
        setError('Unable to load live items right now.')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadItems()

    return () => {
      isActive = false
    }
  }, [limit])

  return {
    items,
    isLoading,
    error,
  }
}