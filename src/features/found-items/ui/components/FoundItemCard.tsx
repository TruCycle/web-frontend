import { ArrowUpRight, MapPin } from 'lucide-react'
import type { FoundItem } from '../../types'
import { FoundItemImpactMeta } from './FoundItemImpactMeta'
import { FoundItemStatusBadge } from './FoundItemStatusBadge'
import { formatFoundItemAttribution, formatFoundItemLocationSummary } from './foundItemDisplay'

interface FoundItemCardProps {
  readonly item: FoundItem
  readonly isSelected?: boolean
  readonly onClick?: () => void
}

export function FoundItemCard({ item, isSelected = false, onClick }: FoundItemCardProps) {
  const primaryImage = item.images[0]

  return (
    <button
      type="button"
      className={`w-full overflow-hidden rounded-[24px] border bg-white text-left transition ${
        isSelected
          ? 'border-[#34DA45] shadow-[0_0_0_4px_rgba(52,218,69,0.12)]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:gap-5 sm:p-4">
        <div className="h-[92px] w-full shrink-0 overflow-hidden rounded-[18px] bg-[#EEF5E3] sm:w-[126px]">
          {primaryImage ? (
            <img
              src={primaryImage.thumbnailUrl || primaryImage.url}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.5rem]">
              {item.title}
            </h3>
            <FoundItemStatusBadge status={item.status} />
          </div>

          <p className="text-[0.97rem] text-slate-500">{formatFoundItemLocationSummary(item)}</p>
          <p className="text-[0.97rem] text-slate-500">{formatFoundItemAttribution(item)}</p>
        </div>

        <div className="flex shrink-0 items-end justify-between gap-4 sm:block sm:min-w-[126px]">
          {item.location.approximateDistance !== null ? (
            <div className="text-right">
              <p className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-slate-950">
                {item.location.approximateDistance.toFixed(1)} km
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 sm:justify-end">
                <MapPin size={12} />
                nearby
              </p>
            </div>
          ) : null}
          <FoundItemImpactMeta
            estimatedCo2eKg={item.estimatedCo2eKg}
            impactPoints={item.impactPoints}
            compact
          />
        </div>

        <span className="hidden items-center gap-1 text-xs text-slate-400 sm:inline-flex">
          View
          <ArrowUpRight size={12} />
        </span>
      </div>
    </button>
  )
}
