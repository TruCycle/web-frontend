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
      className={`w-full overflow-hidden rounded-tc-lg border bg-white text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tc-brand-mint ${
        isSelected
          ? 'border-tc-brand-deep ring-2 ring-tc-brand-mint'
          : 'border-tc-brand-line hover:border-tc-brand-control'
      }`}
      onClick={onClick}
    >
      <div className="flex h-full flex-col sm:grid sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:grid-rows-[1fr_auto]">
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-tc-brand-soft sm:row-span-2 sm:h-auto sm:min-h-[168px] sm:w-[180px]">
          {primaryImage ? (
            <img
              src={primaryImage.thumbnailUrl || primaryImage.url}
              alt={item.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-tc-brand-muted">No image</div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2 px-5 pt-5 sm:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="min-w-0 break-words text-base leading-6 font-semibold text-tc-brand-ink">
              {item.title}
            </h3>
            <FoundItemStatusBadge status={item.status} />
          </div>

          <p className="text-[13px] leading-5 text-tc-brand-muted">{formatFoundItemLocationSummary(item)}</p>
          <p className="text-[13px] leading-5 text-tc-brand-muted">{formatFoundItemAttribution(item)}</p>
          <p className="text-xs leading-4 text-tc-brand-muted">{item.lastSeenAt ? `Last seen ${new Date(item.lastSeenAt).toLocaleString()} · ` : 'Last seen not confirmed · '}{item.expiresAt ? `Expiry: ${new Date(item.expiresAt).toLocaleString()}` : 'No expiry scheduled'}</p>
        </div>

        <div className="flex shrink-0 items-end justify-between gap-4 px-5 pb-5 pt-4 sm:flex sm:min-w-[126px]">
          {item.location.approximateDistance !== null ? (
            <div className="text-left">
              <p className="text-base leading-6 font-semibold tabular-nums text-tc-brand-ink">
                {item.location.approximateDistance.toFixed(1)} km
              </p>
              <p className="inline-flex items-center gap-1 text-xs leading-4 text-tc-brand-muted sm:justify-start">
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

        <span className="mb-5 mr-5 hidden min-h-11 items-center gap-1.5 self-end rounded-tc-md border border-tc-brand-control bg-white px-4 text-sm font-semibold text-tc-brand-deep sm:inline-flex">
          View
          <ArrowUpRight size={12} />
        </span>
      </div>
    </button>
  )
}
