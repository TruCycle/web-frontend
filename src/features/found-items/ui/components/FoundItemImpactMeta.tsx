import { classNames } from '@/shared/utils/classNames'

interface FoundItemImpactMetaProps {
  readonly estimatedCo2eKg: number
  readonly impactPoints: number
  readonly align?: 'start' | 'end'
  readonly compact?: boolean
}

export function FoundItemImpactMeta({
  estimatedCo2eKg,
  impactPoints,
  align = 'end',
  compact = false,
}: FoundItemImpactMetaProps) {
  return (
    <div className={classNames('space-y-0.5', align === 'end' && 'text-right')}>
      <p
        className={classNames(
          compact ? 'text-sm font-semibold text-[#597B1C]' : 'text-2xl font-semibold text-slate-900',
        )}
      >
        {estimatedCo2eKg} kg CO2e
      </p>
      <p className={classNames(compact ? 'text-sm text-slate-400' : 'text-sm text-slate-500')}>
        {impactPoints} pts
      </p>
    </div>
  )
}