import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import type {
  Badge,
  BadgeCategory,
  BadgeRarity,
  CommunityBoardSnapshot,
  CommunityBoardWindow,
  FoundItemImpactSummary,
  PointTransaction,
  Streak,
  UserBadge,
  UserProgress,
} from '../types'

const badgeCategorySet = new Set<BadgeCategory>([
  'milestone',
  'streak',
  'impact',
  'community',
  'special',
])

const badgeRaritySet = new Set<BadgeRarity>(['common', 'rare', 'epic', 'legendary'])

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeBadgeCategory(value: unknown): BadgeCategory {
  return badgeCategorySet.has(value as BadgeCategory)
    ? (value as BadgeCategory)
    : 'milestone'
}

function normalizeBadgeRarity(value: unknown): BadgeRarity {
  return badgeRaritySet.has(value as BadgeRarity)
    ? (value as BadgeRarity)
    : 'common'
}

function normalizeUserProgress(value: unknown): UserProgress | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const userId = readString(record.userId)
  if (!userId) {
    return null
  }

  return {
    userId,
    totalPoints: readNumber(record.totalPoints) ?? 0,
    currentLevel: readNumber(record.currentLevel) ?? 1,
    pointsToNextLevel: readNumber(record.pointsToNextLevel) ?? 0,
    levelProgressPercent: readNumber(record.levelProgressPercent) ?? 0,
  }
}

function normalizeStreak(value: unknown): Streak | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const userId = readString(record.userId)
  const streakType = readString(record.streakType)
  if (!userId || (streakType !== 'daily' && streakType !== 'weekly')) {
    return null
  }

  return {
    userId,
    currentStreak: readNumber(record.currentStreak) ?? 0,
    longestStreak: readNumber(record.longestStreak) ?? 0,
    lastActivityDate: readString(record.lastActivityDate) ?? '',
    streakType,
    isActive: Boolean(record.isActive),
    expiresAt: readString(record.expiresAt),
  }
}

function normalizeBadge(value: unknown): Badge | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const id = readString(record.id)
  const name = readString(record.name)
  if (!id || !name) {
    return null
  }

  return {
    id,
    name,
    description: readString(record.description) ?? '',
    category: normalizeBadgeCategory(record.category),
    rarity: normalizeBadgeRarity(record.rarity),
    iconUrl: readString(record.iconUrl) ?? '',
    requirement: readString(record.requirement) ?? '',
    pointsAwarded: readNumber(record.pointsAwarded) ?? 0,
  }
}

function normalizeUserBadge(value: unknown): UserBadge | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const badge = normalizeBadge(record.badge)
  if (!badge) {
    return null
  }

  return {
    badge,
    earnedAt: readString(record.earnedAt) ?? new Date().toISOString(),
    isNew: Boolean(record.isNew),
  }
}

function normalizePointTransaction(value: unknown): PointTransaction | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const id = readString(record.id)
  const userId = readString(record.userId)
  const reason = readString(record.reason)
  const actionType = readString(record.actionType)
  if (!id || !userId || !reason || !actionType) {
    return null
  }

  return {
    id,
    userId,
    points: readNumber(record.points) ?? 0,
    reason,
    actionType,
    actionId: readString(record.actionId),
    createdAt: readString(record.createdAt) ?? new Date().toISOString(),
  }
}

function normalizeCommunityBoardSnapshot(value: unknown): CommunityBoardSnapshot | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  const window = readString(record.window)
  const currentUser = asRecord(record.currentUser)
  if (window !== 'week' && window !== 'month' && window !== 'all') {
    return null
  }

  return {
    window,
    userArea: readString(record.userArea),
    activeArea: readString(record.activeArea),
    postcodes: Array.isArray(record.postcodes)
      ? record.postcodes
          .map((entry) => {
            const postcodeRecord = asRecord(entry)
            const postcode = readString(postcodeRecord?.postcode)
            if (!postcode) {
              return null
            }

            return {
              postcode,
              spots: readNumber(postcodeRecord?.spots) ?? 0,
              rescues: readNumber(postcodeRecord?.rescues) ?? 0,
              activeSpots: readNumber(postcodeRecord?.activeSpots) ?? 0,
              totalCo2eKg: readNumber(postcodeRecord?.totalCo2eKg) ?? 0,
              impactPoints: readNumber(postcodeRecord?.impactPoints) ?? 0,
            }
          })
          .filter((entry): entry is CommunityBoardSnapshot['postcodes'][number] => entry !== null)
      : [],
    localSpotters: Array.isArray(record.localSpotters)
      ? record.localSpotters
          .map((entry) => {
            const spotterRecord = asRecord(entry)
            const userId = readString(spotterRecord?.userId)
            const name = readString(spotterRecord?.name)
            if (!userId || !name) {
              return null
            }

            return {
              userId,
              name,
              postcode: readString(spotterRecord?.postcode),
              spotsPosted: readNumber(spotterRecord?.spotsPosted) ?? 0,
              rescues: readNumber(spotterRecord?.rescues) ?? 0,
              totalCo2eKg: readNumber(spotterRecord?.totalCo2eKg) ?? 0,
              impactPoints: readNumber(spotterRecord?.impactPoints) ?? 0,
            }
          })
          .filter((entry): entry is CommunityBoardSnapshot['localSpotters'][number] => entry !== null)
      : [],
    currentUser: {
      areaRank: readNumber(currentUser?.areaRank),
      localSpotterRank: readNumber(currentUser?.localSpotterRank),
      impactPoints: readNumber(currentUser?.impactPoints) ?? 0,
      spotsPosted: readNumber(currentUser?.spotsPosted) ?? 0,
      totalCo2eKg: readNumber(currentUser?.totalCo2eKg) ?? 0,
    },
  }
}

function normalizeFoundItemImpactSummary(value: unknown): FoundItemImpactSummary | null {
  const record = asRecord(value)
  if (!record) {
    return null
  }

  return {
    spotsPosted: readNumber(record.spotsPosted) ?? 0,
    liveSpots: readNumber(record.liveSpots) ?? 0,
    rescuedSpots: readNumber(record.rescuedSpots) ?? 0,
    reportedSpots: readNumber(record.reportedSpots) ?? 0,
    totalCo2eKg: readNumber(record.totalCo2eKg) ?? 0,
    totalImpactPoints: readNumber(record.totalImpactPoints) ?? 0,
    topArea: readString(record.topArea),
    userArea: readString(record.userArea),
    currentMonthAreaRank: readNumber(record.currentMonthAreaRank),
    recentPosts: Array.isArray(record.recentPosts)
      ? record.recentPosts
          .map((entry) => {
            const postRecord = asRecord(entry)
            const id = readString(postRecord?.id)
            const title = readString(postRecord?.title)
            const postcode = readString(postRecord?.postcode)
            const status = readString(postRecord?.status)
            if (
              !id ||
              !title ||
              !postcode ||
              (status !== 'available' &&
                status !== 'claimed' &&
                status !== 'picked_up' &&
                status !== 'expired' &&
                status !== 'reported')
            ) {
              return null
            }

            return {
              id,
              title,
              postcode,
              status,
              estimatedCo2eKg: readNumber(postRecord?.estimatedCo2eKg) ?? 0,
              impactPoints: readNumber(postRecord?.impactPoints) ?? 0,
              postedAt: readString(postRecord?.postedAt) ?? new Date().toISOString(),
            }
          })
          .filter((entry): entry is FoundItemImpactSummary['recentPosts'][number] => entry !== null)
      : [],
  }
}

function requireProgress(value: unknown): UserProgress {
  const progress = normalizeUserProgress(value)
  if (!progress) {
    throw new Error('Invalid progress response.')
  }

  return progress
}

export async function fetchUserProgress(): Promise<UserProgress> {
  const response = await apiRequest<unknown>('/gamification/progress')
  return requireProgress(unwrapApiData<unknown>(response))
}

export async function fetchStreaks(): Promise<Streak[]> {
  const response = await apiRequest<unknown>('/gamification/streaks')
  const data = unwrapApiData<unknown>(response)
  const collection = Array.isArray(data) ? data : []

  return collection
    .map((entry) => normalizeStreak(entry))
    .filter((entry): entry is Streak => entry !== null)
}

export async function fetchBadges(
  filter: 'all' | 'earned' | 'available' = 'all',
  category?: BadgeCategory,
): Promise<{ badges: Badge[]; earnedBadges: UserBadge[] }> {
  const query = toQueryString({
    filter,
    category,
  })
  const response = await apiRequest<unknown>(`/gamification/badges${query}`)
  const record = asRecord(unwrapApiData<unknown>(response))

  return {
    badges: Array.isArray(record?.badges)
      ? record.badges
          .map((entry) => normalizeBadge(entry))
          .filter((entry): entry is Badge => entry !== null)
      : [],
    earnedBadges: Array.isArray(record?.earnedBadges)
      ? record.earnedBadges
          .map((entry) => normalizeUserBadge(entry))
          .filter((entry): entry is UserBadge => entry !== null)
      : [],
  }
}

export async function fetchPointHistory(
  page: number = 1,
  limit: number = 8,
): Promise<{
  transactions: PointTransaction[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}> {
  const safeLimit = clampLimit(limit, 8)
  const query = toQueryString({
    page,
    limit: safeLimit,
  })
  const response = await apiRequest<unknown>(`/gamification/points/history${query}`)
  const record = asRecord(unwrapApiData<unknown>(response))
  const pagination = asRecord(record?.pagination)
  const total = readNumber(pagination?.total) ?? 0

  return {
    transactions: Array.isArray(record?.transactions)
      ? record.transactions
          .map((entry) => normalizePointTransaction(entry))
          .filter((entry): entry is PointTransaction => entry !== null)
      : [],
    pagination: {
      page: readNumber(pagination?.page) ?? page,
      limit: readNumber(pagination?.limit) ?? safeLimit,
      total,
      totalPages:
        readNumber(pagination?.totalPages) ?? Math.max(1, Math.ceil(total / safeLimit)),
    },
  }
}

export async function fetchCommunityBoard(
  window: CommunityBoardWindow = 'month',
): Promise<CommunityBoardSnapshot> {
  const query = toQueryString({ window })
  const response = await apiRequest<unknown>(`/gamification/community-board${query}`)
  const snapshot = normalizeCommunityBoardSnapshot(unwrapApiData<unknown>(response))

  if (!snapshot) {
    throw new Error('Invalid community board response.')
  }

  return snapshot
}

export async function fetchFoundItemImpact(): Promise<FoundItemImpactSummary> {
  const response = await apiRequest<unknown>('/gamification/impact/found-items')
  const summary = normalizeFoundItemImpactSummary(unwrapApiData<unknown>(response))

  if (!summary) {
    throw new Error('Invalid found-item impact response.')
  }

  return summary
}

export async function markBadgeSeen(badgeId: string): Promise<void> {
  await apiRequest<void>(`/gamification/badges/${encodeURIComponent(badgeId.trim())}/seen`, {
    method: 'POST',
  })
}