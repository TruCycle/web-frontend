import { ArrowUpRight, MapPin, Leaf, Award } from 'lucide-react'
import type { FoundItem, FoundItemCategory } from '../../types'
import { FoundItemStatusBadge } from './FoundItemStatusBadge'

const categoryLabels: Record<FoundItemCategory, string> = {
  furniture: 'Furniture',
  electronics: 'Electronics',
  clothing: 'Clothing',
  books: 'Books',
  appliances: 'Appliances',
  outdoor: 'Outdoor',
  toys: 'Toys',
  other: 'Other',
}

interface NearbyCardProps {
  readonly item: FoundItem
  readonly onClick?: () => void
}

function formatDistanceKm(distanceKm: number | null): string | null {
  if (distanceKm === null || !Number.isFinite(distanceKm)) return null
  if (distanceKm < 1) return `${Math.max(50, Math.round(distanceKm * 1000))} m`
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`
  return `${Math.round(distanceKm)} km`
}

export function NearbyCard({ item, onClick }: NearbyCardProps) {
  const primaryImage = item.images[0]
  const distanceLabel = formatDistanceKm(item.location.approximateDistance)
  const categoryLabel = categoryLabels[item.category]

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white text-left transition hover:-translate-y-0.5 hover:border-tc-brand-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tc-brand-mint"
    >
      <div className="h-[120px] w-[120px] shrink-0 overflow-hidden bg-tc-brand-soft sm:h-[140px] sm:w-[140px]">
        {primaryImage ? (
          <img
            src={primaryImage.thumbnailUrl || primaryImage.url}
            alt={item.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-tc-brand-muted">No image</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-tc-brand-soft px-2.5 py-1 text-xs leading-4 font-semibold text-tc-brand-body">
              {categoryLabel}
            </span>
            <FoundItemStatusBadge status={item.status} />
          </div>
          <h3 className="truncate text-base leading-6 font-semibold text-tc-brand-ink">
            {item.title}
          </h3>
          {distanceLabel ? (
            <p className="inline-flex items-center gap-1 text-[13px] leading-5 text-tc-brand-muted">
              <MapPin size={12} />
              {distanceLabel} away
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-tc-brand-mintSoft px-2.5 py-1 font-semibold tabular-nums text-tc-brand-deep">
              <Leaf size={12} />
              {item.estimatedCo2eKg.toFixed(1)} kg CO2e
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-tc-brand-soft px-2.5 py-1 font-semibold tabular-nums text-tc-brand-body">
              <Award size={12} />
              {item.impactPoints} pts
            </span>
          </div>
          <ArrowUpRight size={16} className="text-tc-brand-muted transition group-hover:text-tc-brand-ink" />
        </div>
      </div>
    </button>
  )
}
