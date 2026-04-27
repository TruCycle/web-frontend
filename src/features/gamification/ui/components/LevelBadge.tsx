import type { UserProgress } from '../../types'

interface LevelBadgeProps {
  readonly progress: UserProgress
}

export function LevelBadge({ progress }: LevelBadgeProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-[#E9FCE8] px-3 py-1 text-sm font-semibold text-[#14532D]">
      Level {progress.currentLevel}
    </div>
  )
}
