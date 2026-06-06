import type { UserProgress } from '../../types'

interface LevelBadgeProps {
  readonly progress: UserProgress
}

export function LevelBadge({ progress }: LevelBadgeProps) {
  return (
    <div className="inline-flex items-center rounded-full bg-tc-app-primary/18 px-3 py-1 text-sm font-semibold text-tc-app-text ring-1 ring-tc-app-primary/30">
      Level {progress.currentLevel}
    </div>
  )
}
