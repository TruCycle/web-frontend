import { useCallback, useEffect, useState } from 'react'
import { fetchFoundItemImpact } from '../api/gamificationApi'
import type { FoundItemImpactSummary } from '../types'

interface UseFoundItemImpactResult {
  readonly summary: FoundItemImpactSummary | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
}

export function useFoundItemImpact(): UseFoundItemImpactResult {
  const [summary, setSummary] = useState<FoundItemImpactSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextSummary = await fetchFoundItemImpact()
      setSummary(nextSummary)
    } catch {
      setError('Unable to load your found-item impact right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    summary,
    isLoading,
    error,
    refresh,
  }
}