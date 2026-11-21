import type { UserProgress } from '../../types'

interface LevelBadgeProps {
  readonly progress: UserProgress
}

export function LevelBadge({ progress }: LevelBadgeProps) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-full border border-tc-brand-line bg-white px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-ink">
      Level {progress.currentLevel}
    </div>
  )
}
