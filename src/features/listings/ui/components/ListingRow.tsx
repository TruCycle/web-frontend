import { Button } from '@/shared/ui/button/Button'
import type { DonorListingItem, ListingStatus } from '@/features/listings/types'

function statusClass(status: ListingStatus): string {
  if (status === 'Active') return 'bg-lime-100 text-lime-700'
  if (status === 'Claimed') return 'bg-amber-100 text-amber-700'
  return 'bg-sky-100 text-sky-700'
}

interface ListingRowProps {
  readonly item: DonorListingItem
  readonly removingId: string | null
  readonly onOpenActive: (item: DonorListingItem) => void
  readonly onOpenDetails: (item: DonorListingItem) => void
  readonly onRemove: (listingId: string) => void
}

export function ListingRow({
  item,
  removingId,
  onOpenActive,
  onOpenDetails,
  onRemove,
}: ListingRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-[11px] text-slate-500">
            No image
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
              {item.status}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {item.category} - Condition: {item.condition} - {item.meta}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.status === 'Active' ? (
          <>
            <Button variant="secondary" onClick={() => onOpenActive(item)}>
              View
            </Button>
            <Button
              variant="secondary"
              disabled={removingId === item.id}
              onClick={() => onRemove(item.id)}
              className="text-rose-600 ring-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              {removingId === item.id ? 'Removing...' : 'Remove'}
            </Button>
          </>
        ) : item.status === 'Claimed' ? (
          <Button variant="secondary" onClick={() => onOpenDetails(item)}>
            View Claim
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => onOpenDetails(item)}>
            View Details
          </Button>
        )}
      </div>
    </div>
  )
}
