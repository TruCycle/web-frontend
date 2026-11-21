import { useMemo } from 'react'
import { useBadges } from '../hooks/useBadges'
import { BadgeCard } from './components/BadgeCard'

interface ProfileBadgesProps {
  readonly limit?: number
}

export function ProfileBadges({ limit = 3 }: ProfileBadgesProps) {
  const { earnedBadges, isLoading, error, dismissNew } = useBadges('earned')

  const visibleBadges = useMemo(() => earnedBadges.slice(0, limit), [earnedBadges, limit])

  return (
    <section className="space-y-4 rounded-tc-lg border border-tc-brand-line bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Badge Shelf</h2>
        <span className="text-[13px] leading-5 text-tc-brand-muted">{earnedBadges.length} earned</span>
      </div>

      {isLoading ? <p className="text-sm text-tc-brand-body">Loading badges...</p> : null}
      {error ? <p className="text-sm text-tc-brand-danger">{error}</p> : null}

      {!isLoading && !error ? (
        visibleBadges.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {visibleBadges.map((entry) => (
              <BadgeCard
                key={entry.badge.id}
                badge={entry.badge}
                earnedBadge={entry}
                compact
                onDismissNew={(badgeId) => {
                  void dismissNew(badgeId)
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-tc-brand-body">Your next badge will land here.</p>
        )
      ) : null}
    </section>
  )
}
