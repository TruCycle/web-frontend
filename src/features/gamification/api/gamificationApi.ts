import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit, toQueryString } from '@/shared/lib/api/query'
import type {
  Badge,
  BadgeCategory,
  BadgeRarity,
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

export async function markBadgeSeen(badgeId: string): Promise<void> {
  await apiRequest<void>(`/gamification/badges/${encodeURIComponent(badgeId.trim())}/seen`, {
    method: 'POST',
  })
}