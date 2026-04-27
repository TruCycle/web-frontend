import type { Badge, UserBadge } from '../../types'
import { BadgeCard } from './BadgeCard'

interface BadgeGridProps {
  readonly badges: Badge[]
  readonly earnedBadges: UserBadge[]
  readonly onDismissNew?: (badgeId: string) => void
}

export function BadgeGrid({ badges, earnedBadges, onDismissNew }: BadgeGridProps) {
  const earnedBadgeMap = new Map(earnedBadges.map((entry) => [entry.badge.id, entry]))

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {badges.map((badge) => (
        <BadgeCard
          key={badge.id}
          badge={badge}
          earnedBadge={earnedBadgeMap.get(badge.id)}
          onDismissNew={onDismissNew}
        />
      ))}
    </div>
  )
}
