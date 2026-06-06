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
      className="group flex w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-[#34DA45] hover:shadow-md"
    >
      <div className="h-[120px] w-[120px] shrink-0 overflow-hidden bg-[#EEF5E3] sm:h-[140px] sm:w-[140px]">
        {primaryImage ? (
          <img
            src={primaryImage.thumbnailUrl || primaryImage.url}
            alt={item.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-3 sm:p-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#F2F7E8] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#55741D]">
              {categoryLabel}
            </span>
            <FoundItemStatusBadge status={item.status} />
          </div>
          <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-slate-950">
            {item.title}
          </h3>
          {distanceLabel ? (
            <p className="inline-flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} />
              {distanceLabel} away
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[0.78rem]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5DC] px-2 py-1 font-semibold text-[#3A5C12]">
              <Leaf size={12} />
              {item.estimatedCo2eKg.toFixed(1)} kg CO2e
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4D6] px-2 py-1 font-semibold text-[#8A6A00]">
              <Award size={12} />
              {item.impactPoints} pts
            </span>
          </div>
          <ArrowUpRight size={16} className="text-slate-400 transition group-hover:text-slate-700" />
        </div>
      </div>
    </button>
  )
}
