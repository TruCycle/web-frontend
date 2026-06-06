import { useCallback, useEffect, useState } from 'react'
import { fetchUserProgress } from '../api/gamificationApi'
import type { UserProgress } from '../types'

interface UseUserProgressResult {
  readonly progress: UserProgress | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
}

export function useUserProgress(): UseUserProgressResult {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextProgress = await fetchUserProgress()
      setProgress(nextProgress)
    } catch {
      setError('Unable to load your progress right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { progress, isLoading, error, refresh }
}
