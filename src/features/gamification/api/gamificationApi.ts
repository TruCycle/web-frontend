import type {
  Badge,
  BadgeCategory,
  PointTransaction,
  Streak,
  UserBadge,
  UserProgress,
} from '../types'

interface GamificationSnapshot {
  progress: UserProgress
  streaks: Streak[]
  badges: Badge[]
  earnedBadges: UserBadge[]
  transactions: PointTransaction[]
}

const baseBadges: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first exchange',
    category: 'milestone',
    rarity: 'common',
    iconUrl: '',
    requirement: '1 exchange',
    pointsAwarded: 40,
  },
  {
    id: 'warming-up',
    name: 'Warming Up',
    description: 'Keep a 3 day streak alive',
    category: 'streak',
    rarity: 'common',
    iconUrl: '',
    requirement: '3 day streak',
    pointsAwarded: 30,
  },
  {
    id: 'earth-saver',
    name: 'Earth Saver',
    description: 'Save 10 kg of CO2',
    category: 'impact',
    rarity: 'rare',
    iconUrl: '',
    requirement: '10 kg CO2 saved',
    pointsAwarded: 75,
  },
  {
    id: 'good-samaritan',
    name: 'Good Samaritan',
    description: 'Post your first found item',
    category: 'community',
    rarity: 'rare',
    iconUrl: '',
    requirement: '1 found item',
    pointsAwarded: 50,
  },
  {
    id: 'community-helper',
    name: 'Community Helper',
    description: 'Help 5 items find a new home',
    category: 'community',
    rarity: 'epic',
    iconUrl: '',
    requirement: '5 pickups',
    pointsAwarded: 120,
  },
  {
    id: 'app-explorer',
    name: 'App Explorer',
    description: 'Try every core flow in TruCycle',
    category: 'special',
    rarity: 'legendary',
    iconUrl: '',
    requirement: 'All core flows',
    pointsAwarded: 160,
  },
]

let snapshot: GamificationSnapshot = {
  progress: {
    userId: 'current-user',
    totalPoints: 1240,
    currentLevel: 7,
    pointsToNextLevel: 160,
    levelProgressPercent: 61,
  },
  streaks: [
    {
      userId: 'current-user',
      currentStreak: 7,
      longestStreak: 18,
      lastActivityDate: '2026-04-26T14:00:00.000Z',
      streakType: 'daily',
      isActive: true,
      expiresAt: '2026-04-28T00:00:00.000Z',
    },
    {
      userId: 'current-user',
      currentStreak: 2,
      longestStreak: 6,
      lastActivityDate: '2026-04-20T14:00:00.000Z',
      streakType: 'weekly',
      isActive: true,
      expiresAt: '2026-05-01T00:00:00.000Z',
    },
  ],
  badges: baseBadges,
  earnedBadges: [
    {
      badge: baseBadges[0],
      earnedAt: '2026-03-05T10:30:00.000Z',
      isNew: false,
    },
    {
      badge: baseBadges[1],
      earnedAt: '2026-04-04T08:10:00.000Z',
      isNew: false,
    },
    {
      badge: baseBadges[2],
      earnedAt: '2026-04-22T15:30:00.000Z',
      isNew: true,
    },
  ],
  transactions: [
    {
      id: 'pt-1',
      userId: 'current-user',
      points: 35,
      reason: 'Picked up an item',
      actionType: 'pickup',
      actionId: 'item-14',
      createdAt: '2026-04-26T14:10:00.000Z',
    },
    {
      id: 'pt-2',
      userId: 'current-user',
      points: 60,
      reason: 'Completed exchange streak',
      actionType: 'streak',
      actionId: null,
      createdAt: '2026-04-24T09:20:00.000Z',
    },
    {
      id: 'pt-3',
      userId: 'current-user',
      points: 50,
      reason: 'Impact milestone reached',
      actionType: 'badge',
      actionId: 'earth-saver',
      createdAt: '2026-04-22T15:30:00.000Z',
    },
  ],
}

function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function respond<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(cloneSnapshot(value)), 120)
  })
}

export async function fetchUserProgress(): Promise<UserProgress> {
  return respond(snapshot.progress)
}

export async function fetchStreaks(): Promise<Streak[]> {
  return respond(snapshot.streaks)
}

export async function fetchBadges(
  filter: 'all' | 'earned' | 'available' = 'all',
  category?: BadgeCategory,
): Promise<{ badges: Badge[]; earnedBadges: UserBadge[] }> {
  const earnedBadgeIds = new Set(snapshot.earnedBadges.map((entry) => entry.badge.id))
  const badges = snapshot.badges.filter((badge) => {
    if (category && badge.category !== category) {
      return false
    }

    if (filter === 'earned') {
      return earnedBadgeIds.has(badge.id)
    }

    if (filter === 'available') {
      return !earnedBadgeIds.has(badge.id)
    }

    return true
  })

  const earnedBadges = snapshot.earnedBadges.filter((entry) =>
    category ? entry.badge.category === category : true,
  )

  return respond({ badges, earnedBadges })
}

export async function fetchPointHistory(
  page: number = 1,
  limit: number = 8,
): Promise<{
  transactions: PointTransaction[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}> {
  const total = snapshot.transactions.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startIndex = (page - 1) * limit
  const transactions = snapshot.transactions.slice(startIndex, startIndex + limit)

  return respond({
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  })
}

export async function markBadgeSeen(badgeId: string): Promise<void> {
  snapshot = {
    ...snapshot,
    earnedBadges: snapshot.earnedBadges.map((entry) =>
      entry.badge.id === badgeId ? { ...entry, isNew: false } : entry,
    ),
  }

  await respond(undefined)
}
