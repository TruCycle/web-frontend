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
    <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
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
