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
    <div className={classNames('space-y-1', align === 'end' && 'text-right')}>
      <p
        className={classNames(
          compact ? 'inline-flex rounded-full bg-tc-brand-mintSoft px-2.5 py-1 text-[13px] leading-5 font-semibold tabular-nums text-tc-brand-deep' : 'text-xl leading-7 font-semibold tracking-[-0.015em] tabular-nums text-tc-brand-ink',
        )}
      >
        {estimatedCo2eKg} kg CO2e
      </p>
      <p className={classNames(compact ? 'text-xs leading-4 tabular-nums text-tc-brand-muted' : 'text-[13px] leading-5 tabular-nums text-tc-brand-muted')}>
        {impactPoints} pts
      </p>
    </div>
  )
}