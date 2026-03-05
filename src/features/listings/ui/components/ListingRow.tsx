import { QrCode } from 'lucide-react'
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
  readonly onOpenQr?: (item: DonorListingItem) => void
  readonly showQrAction?: boolean
  readonly onRemove: (listingId: string) => void
}

export function ListingRow({
  item,
  removingId,
  onOpenActive,
  onOpenDetails,
  onOpenQr,
  showQrAction = false,
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
      <>
        {showQrAction && onOpenQr ? (
          <Button
            variant="primary"
            className="h-10 w-10 rounded-xl p-0"
            onClick={() => onOpenQr(item)}
            aria-label="Open item QR code"
            title="Open item QR code"
          >
            <QrCode size={18} />
          </Button>
        ) : null}
        <Button onClick={() => onOpenDetails(item)}>
          View Details
        </Button>
      </>
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
