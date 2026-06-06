import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchBadges,
  markBadgeSeen,
} from '../api/gamificationApi'
import type { Badge, BadgeCategory, UserBadge } from '../types'

interface UseBadgesResult {
  readonly badges: Badge[]
  readonly earnedBadges: UserBadge[]
  readonly earnedCount: number
  readonly availableCount: number
  readonly isLoading: boolean
  readonly error: string | null
  readonly refresh: () => Promise<void>
  readonly dismissNew: (badgeId: string) => Promise<void>
}

export function useBadges(
  filter: 'all' | 'earned' | 'available' = 'all',
  category?: BadgeCategory,
): UseBadgesResult {
  const [badges, setBadges] = useState<Badge[]>([])
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const nextBadges = await fetchBadges(filter, category)
      setBadges(nextBadges.badges)
      setEarnedBadges(nextBadges.earnedBadges)
    } catch {
      setError('Unable to load badges right now.')
    } finally {
      setIsLoading(false)
    }
  }, [category, filter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const dismissNew = useCallback(
    async (badgeId: string) => {
      await markBadgeSeen(badgeId)
      await refresh()
    },
    [refresh],
  )

  const earnedIds = useMemo(
    () => new Set(earnedBadges.map((entry) => entry.badge.id)),
    [earnedBadges],
  )

  return {
    badges,
    earnedBadges,
    earnedCount: earnedIds.size,
    availableCount: badges.filter((badge) => !earnedIds.has(badge.id)).length,
    isLoading,
    error,
    refresh,
    dismissNew,
  }
}
