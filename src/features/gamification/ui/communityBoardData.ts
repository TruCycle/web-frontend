import type { CommunityBoardWindow } from '../types'

export type { CommunityBoardWindow } from '../types'

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

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
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
