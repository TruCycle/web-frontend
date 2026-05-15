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
          'flex h-12 items-center justify-center rounded-2xl text-sm font-semibold tracking-wide transition'
        const active = isCurrent
          ? 'bg-[#BBF1C8] text-[#14532D] ring-2 ring-[#1A7F37]/40 shadow-sm'
          : 'bg-[#D7F5DE] text-[#14532D] ring-1 ring-[#1A7F37]/20'
        const inactive = 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'

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
