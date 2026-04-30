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

export type CommunityBoardWindow = 'week' | 'month' | 'all'

export interface CommunityBoardPostcodeEntry {
  readonly postcode: string
  readonly spots: number
  readonly rescues: number
  readonly activeSpots: number
  readonly totalCo2eKg: number
  readonly impactPoints: number
}

export interface CommunityBoardSpotterEntry {
  readonly userId: string
  readonly name: string
  readonly postcode: string | null
  readonly spotsPosted: number
  readonly rescues: number
  readonly totalCo2eKg: number
  readonly impactPoints: number
}

export interface CommunityBoardSnapshot {
  readonly window: CommunityBoardWindow
  readonly userArea: string | null
  readonly activeArea: string | null
  readonly postcodes: CommunityBoardPostcodeEntry[]
  readonly localSpotters: CommunityBoardSpotterEntry[]
  readonly currentUser: {
    readonly areaRank: number | null
    readonly localSpotterRank: number | null
    readonly impactPoints: number
    readonly spotsPosted: number
    readonly totalCo2eKg: number
  }
}

export interface FoundItemImpactRecentPost {
  readonly id: string
  readonly title: string
  readonly postcode: string
  readonly status: 'available' | 'claimed' | 'picked_up' | 'expired' | 'reported'
  readonly estimatedCo2eKg: number
  readonly impactPoints: number
  readonly postedAt: string
}

export interface FoundItemImpactSummary {
  readonly spotsPosted: number
  readonly liveSpots: number
  readonly rescuedSpots: number
  readonly reportedSpots: number
  readonly totalCo2eKg: number
  readonly totalImpactPoints: number
  readonly topArea: string | null
  readonly userArea: string | null
  readonly currentMonthAreaRank: number | null
  readonly recentPosts: FoundItemImpactRecentPost[]
}
