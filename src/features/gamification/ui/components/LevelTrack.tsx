import type { UserProgress } from '../../types'

interface LevelTrackProps {
  readonly progress: UserProgress
  readonly maxLevel?: number
}

export function LevelTrack({ progress, maxLevel = 10 }: LevelTrackProps) {
  const current = Math.max(1, Math.min(progress.currentLevel, maxLevel))
  const levels = Array.from({ length: maxLevel }, (_, index) => index + 1)

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {levels.map((level) => {
        const isPassed = level < current
        const isCurrent = level === current
        const isActive = isPassed || isCurrent

        const base =
          'flex h-12 items-center justify-center rounded-tc-md text-sm font-semibold tabular-nums transition'
        const active = isCurrent
          ? 'bg-tc-brand-deep text-white'
          : 'bg-tc-brand-mintSoft text-tc-brand-deep'
        const inactive = 'bg-tc-brand-soft text-tc-brand-muted'

        return (
          <div
            key={level}
            aria-current={isCurrent || undefined}
            className={`${base} ${isActive ? active : inactive}`}
          >
            L{level}
          </div>
        )
      })}
    </div>
  )
}
