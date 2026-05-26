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
    return 'bg-tc-app-primary text-tc-app-text'
  }

  if (rank === 1) {
    return 'bg-tc-app-canvas text-tc-app-secondary'
  }

  if (rank === 2) {
    return 'bg-tc-app-primary/25 text-tc-app-text'
  }

  return 'bg-tc-app-canvas text-tc-app-slate500'
}
