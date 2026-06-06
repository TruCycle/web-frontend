import { Flame } from 'lucide-react'
import type { Streak } from '../../types'

interface StreakIndicatorProps {
  readonly streak: Streak
  readonly size?: 'sm' | 'md' | 'lg'
}

const sizeClassMap = {
  sm: {
    text: 'text-sm',
    icon: 14,
  },
  md: {
    text: 'text-base',
    icon: 18,
  },
  lg: {
    text: 'text-xl',
    icon: 24,
  },
} as const

export function StreakIndicator({ streak, size = 'md' }: StreakIndicatorProps) {
  const sizeConfig = sizeClassMap[size]

  return (
    <div className={`inline-flex items-center gap-2 ${sizeConfig.text}`}>
      <Flame
        size={sizeConfig.icon}
        className={streak.isActive ? 'text-[#F97316]' : 'text-slate-300'}
        fill={streak.isActive ? 'currentColor' : 'none'}
      />
      <span className="font-semibold text-slate-900">{streak.currentStreak}</span>
      <span className="text-slate-500">{streak.streakType === 'daily' ? 'day' : 'week'}</span>
    </div>
  )
}
