export interface UserProgress {
  readonly userId: string
  readonly totalPoints: number
  readonly currentLevel: number
  readonly pointsToNextLevel: number
  readonly levelProgressPercent: number
}

export interface Streak {
  readonly userId: string
  readonly currentStreak: number
  readonly longestStreak: number
  readonly lastActivityDate: string
  readonly streakType: 'daily' | 'weekly'
  readonly isActive: boolean
  readonly expiresAt: string | null
}

export type BadgeCategory =
  | 'milestone'
  | 'streak'
  | 'impact'
  | 'community'
  | 'special'

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Badge {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: BadgeCategory
  readonly rarity: BadgeRarity
  readonly iconUrl: string
  readonly requirement: string
  readonly pointsAwarded: number
}

export interface UserBadge {
  readonly badge: Badge
  readonly earnedAt: string
  readonly isNew: boolean
}

export interface PointTransaction {
  readonly id: string
  readonly userId: string
  readonly points: number
  readonly reason: string
  readonly actionType: string
  readonly actionId: string | null
  readonly createdAt: string
}
