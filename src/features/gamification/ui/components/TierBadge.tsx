import { Sprout, Trees } from 'lucide-react'

interface TierBadgeProps {
  readonly tier: string
  readonly nextTier?: string | null
  readonly pointsToNextTier?: number
  readonly progressPercent?: number
}

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  Seedling: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  Sprout: { bg: 'bg-emerald-100', text: 'text-emerald-800', ring: 'ring-emerald-300' },
  Sapling: { bg: 'bg-lime-100', text: 'text-lime-800', ring: 'ring-lime-300' },
  Grove: { bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-300' },
  Forest: { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-300' },
  Canopy: { bg: 'bg-rose-100', text: 'text-rose-800', ring: 'ring-rose-300' },
}

export function TierBadge({ tier, nextTier, pointsToNextTier, progressPercent }: TierBadgeProps) {
  const styles = TIER_STYLES[tier] ?? TIER_STYLES.Seedling
  const Icon = tier === 'Forest' || tier === 'Canopy' ? Trees : Sprout

  return (
    <div className={`flex items-center gap-3 rounded-2xl ${styles.bg} px-4 py-3 ring-1 ${styles.ring}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/70 ${styles.text}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${styles.text}`}>Tier</p>
        <p className={`text-base font-semibold ${styles.text}`}>{tier}</p>
        {nextTier ? (
          <p className="text-xs text-slate-600">
            {pointsToNextTier ?? 0} pts to {nextTier}
            {typeof progressPercent === 'number' ? ` · ${progressPercent}%` : ''}
          </p>
        ) : (
          <p className="text-xs text-slate-600">Top tier reached</p>
        )}
      </div>
    </div>
  )
}
