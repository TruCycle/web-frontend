import { useCallback, useEffect, useState } from 'react'
import { fetchIndividualLeaderboard } from '../api/gamificationApi'
import type { IndividualLeaderboard } from '../types'

interface UseIndividualLeaderboardResult {
  readonly board: IndividualLeaderboard | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly reload: () => void
}

export function useIndividualLeaderboard(limit = 25): UseIndividualLeaderboardResult {
  const [board, setBoard] = useState<IndividualLeaderboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fetchIndividualLeaderboard({ limit })
      setBoard(result)
    } catch {
      setError('Unable to load the leaderboard right now.')
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void load()
  }, [load])

  return { board, isLoading, error, reload: () => void load() }
}
