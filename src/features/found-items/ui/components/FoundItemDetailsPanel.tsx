import { Clock3, MapPin, Users } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'
import type { FoundItem, FoundItemClaim } from '../../types'
import { FoundItemStatusBadge } from './FoundItemStatusBadge'

interface FoundItemDetailsPanelProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly item: FoundItem | null
  readonly claims: FoundItemClaim[]
  readonly currentUserId?: string
  readonly isLoading?: boolean
  readonly isClaiming?: boolean
  readonly onClaim?: (itemId: string) => void
}

export function FoundItemDetailsPanel({
  isOpen,
  onClose,
  item,
  claims,
  currentUserId,
  isLoading = false,
  isClaiming = false,
  onClaim,
}: FoundItemDetailsPanelProps) {
  if (!isOpen) {
    return null
  }

  const primaryImage = item?.images[0]
  const isOwnPost = item ? currentUserId === item.poster.id : false
  const isClosed =
    item?.status === 'picked_up' || item?.status === 'expired' || item?.status === 'reported'

  return (
    <Modal isOpen={isOpen} onClose={onClose} containerClassName="max-w-[720px]">
      <div className="space-y-4 p-5 sm:p-6">
        {isLoading ? <p className="text-sm text-slate-500">Loading item...</p> : null}

        {!isLoading && !item ? <p className="text-sm text-slate-500">Choose an item to inspect.</p> : null}

        {!isLoading && item ? (
          <>
            {primaryImage ? (
              <img src={primaryImage.url} alt={item.title} className="h-64 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                No image
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-500">Shared by {item.poster.name}</p>
              </div>
              <FoundItemStatusBadge status={item.status} />
            </div>

            <p className="text-sm leading-6 text-slate-600">{item.description}</p>

            <div className="grid gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <MapPin size={15} />
                {item.location.address || item.location.neighborhood || item.location.postcode}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={15} />
                {formatRelativeTime(item.postedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={15} />
                {item.claimCount} interested
              </span>
            </div>

            {isOwnPost ? (
              <div className="space-y-3 rounded-xl bg-[#F8FAFC] p-4">
                <p className="text-sm font-medium text-slate-900">Your post</p>
                {claims.length > 0 ? (
                  <div className="space-y-2">
                    {claims.map((claim) => (
                      <div key={claim.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{claim.claimerName}</p>
                        <p className="text-xs text-slate-500">{claim.message || 'No note added.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No pickup requests yet.</p>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                disabled={isClaiming || isClosed || item.status === 'claimed'}
                onClick={() => {
                  onClaim?.(item.id)
                }}
              >
                {item.status === 'claimed'
                  ? 'Interest sent'
                  : isClaiming
                    ? 'Sending...'
                    : 'I’ll Pick This Up'}
              </Button>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  )
}
