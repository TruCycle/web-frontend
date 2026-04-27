import {
  Flame,
  Leaf,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { classNames } from '@/shared/utils/classNames'
import type { Badge, BadgeCategory, BadgeRarity, UserBadge } from '../../types'

interface BadgeCardProps {
  readonly badge: Badge
  readonly earnedBadge?: UserBadge
  readonly compact?: boolean
  readonly onDismissNew?: (badgeId: string) => void
}

function rarityClassName(rarity: BadgeRarity): string {
  if (rarity === 'legendary') return 'bg-amber-100 text-amber-700'
  if (rarity === 'epic') return 'bg-sky-100 text-sky-700'
  if (rarity === 'rare') return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-100 text-slate-600'
}

function CategoryIcon({ category }: { readonly category: BadgeCategory }) {
  if (category === 'streak') {
    return <Flame size={18} />
  }

  if (category === 'impact') {
    return <Leaf size={18} />
  }

  if (category === 'community') {
    return <Users size={18} />
  }

  if (category === 'special') {
    return <Star size={18} />
  }

  return <Sparkles size={18} />
}

export function BadgeCard({
  badge,
  earnedBadge,
  compact = false,
  onDismissNew,
}: BadgeCardProps) {
  const isEarned = Boolean(earnedBadge)

  return (
    <article
      className={classNames(
        'rounded-2xl border border-slate-200 bg-white',
        compact ? 'p-3' : 'p-4',
        !isEarned ? 'opacity-70' : 'shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F4FBEF] text-[#1A7F37]">
          <CategoryIcon category={badge.category} />
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${rarityClassName(badge.rarity)}`}>
          {badge.rarity}
        </span>
      </div>

      <div className={compact ? 'mt-3 space-y-1' : 'mt-4 space-y-2'}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{badge.name}</h3>
          {earnedBadge?.isNew ? (
            <button
              type="button"
              className="rounded-full bg-[#E9FCE8] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#166534]"
              onClick={() => onDismissNew?.(badge.id)}
            >
              New
            </button>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">{badge.description}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{badge.requirement}</span>
          <span>+{badge.pointsAwarded} pts</span>
        </div>
      </div>
    </article>
  )
}
