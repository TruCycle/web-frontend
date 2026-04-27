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
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Badge Shelf</h2>
        <span className="text-sm text-slate-500">{earnedBadges.length} earned</span>
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Loading badges...</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

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
          <p className="text-sm text-slate-500">Your next badge will land here.</p>
        )
      ) : null}
    </section>
  )
}
