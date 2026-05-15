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
  'bg-[linear-gradient(135deg,#A7F3D0_0%,#6EE7B7_50%,#34D399_100%)]',
  'bg-[linear-gradient(135deg,#BAE6FD_0%,#7DD3FC_50%,#38BDF8_100%)]',
  'bg-[linear-gradient(135deg,#FDE68A_0%,#FCD34D_50%,#F59E0B_100%)]',
  'bg-[linear-gradient(135deg,#FBCFE8_0%,#F9A8D4_50%,#EC4899_100%)]',
  'bg-[linear-gradient(135deg,#DDD6FE_0%,#C4B5FD_50%,#8B5CF6_100%)]',
  'bg-[linear-gradient(135deg,#FECACA_0%,#FCA5A5_50%,#F87171_100%)]',
  'bg-[linear-gradient(135deg,#FED7AA_0%,#FDBA74_50%,#FB923C_100%)]',
  'bg-[linear-gradient(135deg,#A5F3FC_0%,#67E8F9_50%,#22D3EE_100%)]',
  'bg-[linear-gradient(135deg,#D9F99D_0%,#BEF264_50%,#84CC16_100%)]',
  'bg-[linear-gradient(135deg,#E9D5FF_0%,#D8B4FE_50%,#A855F7_100%)]',
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
  const gradientClass = isEarned ? gradientFor(badge.id || badge.name) : 'bg-slate-200'

  return (
    <article
      className={classNames(
        'relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white text-center transition',
        compact ? 'p-3' : 'p-4 sm:p-5',
        isEarned ? 'shadow-sm hover:shadow-md' : '',
      )}
    >
      {earnedBadge?.isNew ? (
        <button
          type="button"
          className="absolute right-3 top-3 text-[0.7rem] font-semibold text-sky-500 hover:text-sky-600"
          onClick={() => onDismissNew?.(badge.id)}
        >
          New
        </button>
      ) : null}

      <div
        className={classNames(
          'flex items-center justify-center overflow-hidden rounded-full shadow-inner ring-1 ring-white/40',
          gradientClass,
          isEarned ? 'text-white' : 'text-slate-400 grayscale',
          compact ? 'h-16 w-16' : 'h-20 w-20 sm:h-24 sm:w-24',
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
          isEarned ? 'text-slate-900' : 'text-slate-400',
          compact ? 'mt-2 text-sm' : 'mt-3 text-sm sm:text-base',
        )}
      >
        {badge.name}
      </h3>
    </article>
  )
}
