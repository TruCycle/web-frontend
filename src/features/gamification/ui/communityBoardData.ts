import type { AuthUser } from '@/features/auth/types'
import type { CommunityBoardWindow } from '../types'

export type { CommunityBoardWindow } from '../types'

interface PostcodeStanding {
  readonly postcode: string
  readonly rescues: number
  readonly spots: number
  readonly co2eTonnes: number
  readonly trend: number
}

interface SpotterStanding {
  readonly name: string
  readonly spotsPosted: number
  readonly points: number
}

interface CommunityBoardDataset {
  readonly postcodes: readonly PostcodeStanding[]
  readonly spotters: readonly SpotterStanding[]
}

export const communityBoardWindows: readonly {
  readonly key: CommunityBoardWindow
  readonly label: string
  readonly descriptor: string
}[] = [
  {
    key: 'week',
    label: 'This week',
    descriptor: 'this week',
  },
  {
    key: 'month',
    label: 'This month',
    descriptor: 'this month',
  },
  {
    key: 'all',
    label: 'All-time',
    descriptor: 'all-time',
  },
] as const

export const communityBoardData: Record<CommunityBoardWindow, CommunityBoardDataset> = {
  week: {
    postcodes: [
      { postcode: 'E15', rescues: 36, spots: 58, co2eTonnes: 2.1, trend: 5 },
      { postcode: 'E6', rescues: 31, spots: 49, co2eTonnes: 1.8, trend: 3 },
      { postcode: 'SE13', rescues: 26, spots: 40, co2eTonnes: 1.6, trend: 2 },
      { postcode: 'E13', rescues: 22, spots: 35, co2eTonnes: 1.3, trend: 1 },
      { postcode: 'IG11', rescues: 18, spots: 31, co2eTonnes: 1.1, trend: 6 },
      { postcode: 'E2', rescues: 16, spots: 27, co2eTonnes: 0.9, trend: 0 },
      { postcode: 'SE8', rescues: 14, spots: 22, co2eTonnes: 0.8, trend: -1 },
    ],
    spotters: [
      { name: 'Sarah K', spotsPosted: 12, points: 840 },
      { name: 'Marcus O', spotsPosted: 10, points: 760 },
      { name: 'Priya B', spotsPosted: 9, points: 690 },
      { name: 'Ade A', spotsPosted: 5, points: 420 },
      { name: 'Tom H', spotsPosted: 4, points: 360 },
    ],
  },
  month: {
    postcodes: [
      { postcode: 'E15', rescues: 142, spots: 203, co2eTonnes: 8.4, trend: 12 },
      { postcode: 'E6', rescues: 118, spots: 167, co2eTonnes: 6.9, trend: 8 },
      { postcode: 'E3', rescues: 94, spots: 134, co2eTonnes: 5.2, trend: 2 },
      { postcode: 'SE13', rescues: 81, spots: 118, co2eTonnes: 4.4, trend: -3 },
      { postcode: 'E13', rescues: 76, spots: 110, co2eTonnes: 4.1, trend: 5 },
      { postcode: 'IG11', rescues: 68, spots: 97, co2eTonnes: 3.7, trend: 14 },
      { postcode: 'E2', rescues: 54, spots: 81, co2eTonnes: 2.9, trend: 0 },
      { postcode: 'SE8', rescues: 49, spots: 72, co2eTonnes: 2.5, trend: -1 },
    ],
    spotters: [
      { name: 'Sarah K', spotsPosted: 34, points: 2840 },
      { name: 'Marcus O', spotsPosted: 29, points: 2410 },
      { name: 'Priya B', spotsPosted: 26, points: 2180 },
      { name: 'Ade A', spotsPosted: 9, points: 1284 },
      { name: 'Tom H', spotsPosted: 14, points: 1120 },
    ],
  },
  all: {
    postcodes: [
      { postcode: 'E15', rescues: 620, spots: 920, co2eTonnes: 34.8, trend: 18 },
      { postcode: 'SE13', rescues: 582, spots: 871, co2eTonnes: 31.5, trend: 9 },
      { postcode: 'E6', rescues: 566, spots: 842, co2eTonnes: 30.6, trend: 7 },
      { postcode: 'E3', rescues: 510, spots: 788, co2eTonnes: 27.1, trend: 4 },
      { postcode: 'IG11', rescues: 466, spots: 706, co2eTonnes: 24.9, trend: 11 },
      { postcode: 'E13', rescues: 431, spots: 645, co2eTonnes: 22.7, trend: 6 },
      { postcode: 'E2', rescues: 388, spots: 588, co2eTonnes: 20.4, trend: 2 },
      { postcode: 'SE8', rescues: 354, spots: 541, co2eTonnes: 18.9, trend: -2 },
    ],
    spotters: [
      { name: 'Sarah K', spotsPosted: 142, points: 9420 },
      { name: 'Marcus O', spotsPosted: 128, points: 8610 },
      { name: 'Priya B', spotsPosted: 116, points: 7920 },
      { name: 'Ade A', spotsPosted: 51, points: 4480 },
      { name: 'Tom H', spotsPosted: 48, points: 4210 },
    ],
  },
}

const featuredSpotterIndex = 3

export function resolveOutwardPostcode(postcode?: string): string | null {
  if (!postcode) {
    return null
  }

  const normalized = postcode.trim().toUpperCase().replace(/\s+/g, ' ')
  return normalized.split(' ')[0] || null
}

export function formatSpotterName(user: AuthUser | null): string {
  if (!user) {
    return 'Ade A'
  }

  const lastInitial = user.lastName.trim().charAt(0).toUpperCase()
  return lastInitial ? `${user.firstName} ${lastInitial}` : user.firstName
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function formatTrend(trend: number): string {
  if (trend === 0) {
    return '-'
  }

  return `${trend > 0 ? '+' : ''}${trend}`
}

export function rankPillClassName(rank: number): string {
  if (rank === 0) {
    return 'bg-amber-100 text-amber-700'
  }

  if (rank === 1) {
    return 'bg-slate-200 text-slate-700'
  }

  if (rank === 2) {
    return 'bg-orange-100 text-orange-700'
  }

  return 'bg-slate-100 text-slate-500'
}

export function resolveCommunityBoardContext(
  user: AuthUser | null,
  activeWindow: CommunityBoardWindow,
) {
  const leaderboard = communityBoardData[activeWindow]
  const requestedArea = resolveOutwardPostcode(user?.postcode)
  const localArea = leaderboard.postcodes.some((entry) => entry.postcode === requestedArea)
    ? requestedArea ?? leaderboard.postcodes[0]?.postcode ?? 'E15'
    : leaderboard.postcodes[0]?.postcode ?? 'E15'
  const activeDescriptor =
    communityBoardWindows.find((entry) => entry.key === activeWindow)?.descriptor ?? 'this month'
  const currentUserName = formatSpotterName(user)

  return {
    leaderboard,
    localArea,
    activeDescriptor,
    currentUserName,
    currentUserRank: Math.min(featuredSpotterIndex + 1, leaderboard.spotters.length),
    currentUserPoints: leaderboard.spotters[featuredSpotterIndex]?.points ?? 0,
  }
}
