import { Button } from '@/shared/ui/button/Button'
import { ItemRowCard } from '@/shared/ui/item/ItemRowCard'
import type { DonorListingItem, ListingStatus } from '@/features/listings/types'

function statusTone(status: ListingStatus): 'active' | 'claimed' | 'collected' {
  if (status === 'Active') return 'active'
  if (status === 'Claimed') return 'claimed'
  return 'collected'
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
  const actions =
    item.status === 'Active' ? (
      <>
        <Button className="bg-[#F8FAFC] text-[#222222] ring-0 hover:bg-slate-100" onClick={() => onOpenActive(item)}>
          View
        </Button>
        <Button
          variant="danger"
          disabled={removingId === item.id}
          onClick={() => onRemove(item.id)}
        >
          {removingId === item.id ? 'Removing...' : 'Remove'}
        </Button>
      </>
    ) : (
      <Button onClick={() => onOpenDetails(item)}>
        View Details
      </Button>
    )

  return (
    <ItemRowCard
      title={item.title}
      subtitle={`${item.category} - Condition: ${item.condition} - ${item.meta}`}
      statusLabel={item.status}
      statusTone={statusTone(item.status)}
      imageUrl={item.imageUrl}
      imageAlt={item.title}
      actions={actions}
    />
  )
}
