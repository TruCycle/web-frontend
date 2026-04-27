import { Clock3, Eye, MapPin, Users } from 'lucide-react'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'
import type { FoundItem } from '../../types'
import { FoundItemStatusBadge } from './FoundItemStatusBadge'

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
      className={`w-full overflow-hidden rounded-2xl border bg-white text-left transition ${
        isSelected
          ? 'border-[#34DA45] shadow-[0_0_0_4px_rgba(52,218,69,0.12)]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      {primaryImage ? (
        <img
          src={primaryImage.thumbnailUrl || primaryImage.url}
          alt={item.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">
          No image
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
          </div>
          <FoundItemStatusBadge status={item.status} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} />
            {item.location.neighborhood || item.location.postcode}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={12} />
            {formatRelativeTime(item.postedAt)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Eye size={12} />
            {item.viewCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            {item.claimCount}
          </span>
          {item.location.approximateDistance !== null ? (
            <span>{item.location.approximateDistance.toFixed(1)} km</span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
