import { Sprout, Trees } from 'lucide-react'

interface TierBadgeProps {
  readonly tier: string
  readonly nextTier?: string | null
  readonly pointsToNextTier?: number
  readonly progressPercent?: number
}

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  Seedling: { bg: 'bg-tc-brand-mintSoft', text: 'text-tc-brand-ink', ring: 'ring-tc-brand-mintLine' },
  Sprout: { bg: 'bg-tc-brand-mintSoft', text: 'text-tc-brand-ink', ring: 'ring-tc-brand-mintLine' },
  Sapling: { bg: 'bg-tc-brand-mintSoft', text: 'text-tc-brand-ink', ring: 'ring-tc-brand-mintLine' },
  Grove: { bg: 'bg-tc-brand-mintSoft', text: 'text-tc-brand-ink', ring: 'ring-tc-brand-mintLine' },
  Forest: { bg: 'bg-tc-brand-mintSoft', text: 'text-tc-brand-ink', ring: 'ring-tc-brand-mintLine' },
  Canopy: { bg: 'bg-tc-brand-mintSoft', text: 'text-tc-brand-ink', ring: 'ring-tc-brand-mintLine' },
}

export function TierBadge({ tier, nextTier, pointsToNextTier, progressPercent }: TierBadgeProps) {
  const styles = TIER_STYLES[tier] ?? TIER_STYLES.Seedling
  const Icon = tier === 'Forest' || tier === 'Canopy' ? Trees : Sprout

  return (
    <div className={`flex items-center gap-3 rounded-tc-md ${styles.bg} px-4 py-4 ring-1 ${styles.ring}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ${styles.text}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase leading-4 tracking-[0.06em] ${styles.text}`}>Tier</p>
        <p className={`text-base font-semibold leading-6 ${styles.text}`}>{tier}</p>
        {nextTier ? (
          <p className="text-[13px] leading-5 tabular-nums text-tc-brand-body">
            {pointsToNextTier ?? 0} pts to {nextTier}
            {typeof progressPercent === 'number' ? ` · ${progressPercent}%` : ''}
          </p>
        ) : (
          <p className="text-[13px] leading-5 tabular-nums text-tc-brand-body">Top tier reached</p>
        )}
      </div>
    </div>
  )
}
