import { useCallback, useEffect, useState } from 'react'
import { fetchCommunityBoard } from '../api/gamificationApi'
import type { CommunityBoardSnapshot, CommunityBoardWindow } from '../types'

interface UseCommunityBoardResult {
  readonly board: CommunityBoardSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
}

export function useCommunityBoard(window: CommunityBoardWindow): UseCommunityBoardResult {
  const [board, setBoard] = useState<CommunityBoardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextBoard = await fetchCommunityBoard(window)
      setBoard(nextBoard)
    } catch {
      setError('Unable to load the community board right now.')
    } finally {
      setIsLoading(false)
    }
  }, [window])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    board,
    isLoading,
    error,
    refresh,
  }
}