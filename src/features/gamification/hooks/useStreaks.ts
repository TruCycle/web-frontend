import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchStreaks } from '../api/gamificationApi'
import type { Streak } from '../types'

interface UseStreaksResult {
  readonly streaks: Streak[]
  readonly primaryStreak: Streak | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
}

export function useStreaks(): UseStreaksResult {
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setStreaks(await fetchStreaks())
    } catch {
      setError('Unable to load streaks right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const primaryStreak = useMemo(
    () => streaks.find((streak) => streak.streakType === 'daily') ?? streaks[0] ?? null,
    [streaks],
  )

  return { streaks, primaryStreak, isLoading, error, refresh }
}
