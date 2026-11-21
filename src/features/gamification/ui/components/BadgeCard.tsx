import {
  Flame,
  Leaf,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { classNames } from '@/shared/utils/classNames'
import type { Badge, BadgeCategory, UserBadge } from '../../types'

interface BadgeCardProps {
  readonly badge: Badge
  readonly earnedBadge?: UserBadge
  readonly compact?: boolean
  readonly onDismissNew?: (badgeId: string) => void
}

const ICON_GRADIENTS = [
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
  'bg-tc-brand-mintSoft',
] as const

function gradientFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return ICON_GRADIENTS[hash % ICON_GRADIENTS.length]
}

function CategoryIcon({ category }: { readonly category: BadgeCategory }) {
  if (category === 'streak') return <Flame size={28} />
  if (category === 'impact') return <Leaf size={28} />
  if (category === 'community') return <Users size={28} />
  if (category === 'special') return <Star size={28} />
  return <Sparkles size={28} />
}

export function BadgeCard({
  badge,
  earnedBadge,
  compact = false,
  onDismissNew,
}: BadgeCardProps) {
  const isEarned = Boolean(earnedBadge)
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(badge.iconUrl) && !imageFailed
  const gradientClass = isEarned ? gradientFor(badge.id || badge.name) : 'bg-tc-brand-soft'

  return (
    <article
      className={classNames(
        'relative flex min-w-0 flex-col items-center text-center transition',
        compact ? 'p-2' : 'p-0 sm:p-1',
        isEarned ? 'text-tc-brand-ink' : '',
      )}
    >
      {earnedBadge?.isNew ? (
        <button
          type="button"
          className="absolute right-0 top-0 rounded-full bg-tc-brand-deep px-2 py-0.5 text-[11px] font-semibold leading-4 text-white transition hover:bg-tc-brand-hover"
          onClick={() => onDismissNew?.(badge.id)}
        >
          New
        </button>
      ) : null}

      <div
        className={classNames(
          'flex items-center justify-center overflow-hidden rounded-full',
          gradientClass,
          isEarned ? 'text-tc-brand-deep' : 'text-tc-brand-muted grayscale',
          compact ? 'h-16 w-16' : 'h-16 w-16 sm:h-[72px] sm:w-[72px]',
        )}
      >
        {showImage ? (
          <img
            src={badge.iconUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CategoryIcon category={badge.category} />
        )}
      </div>

      <h3
        className={classNames(
          'font-semibold',
          isEarned ? 'text-tc-brand-ink' : 'text-tc-brand-muted',
          compact ? 'mt-2 text-[13px] leading-5' : 'mt-2 text-xs leading-4 sm:text-[13px] sm:leading-5',
        )}
      >
        {badge.name}
      </h3>
    </article>
  )
}
