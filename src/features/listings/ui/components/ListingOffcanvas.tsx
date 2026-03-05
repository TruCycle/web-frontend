import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import type { DonorListingItem, ListingClaim } from '@/features/listings/types'
import { classNames } from '@/shared/utils/classNames'
import { approveDonorListingClaim } from '@/features/listings/api/listingsApi'
import { createOrFindRoom } from '@/features/messaging/api/messagingApi'
import { useToast } from '@/shared/ui/toast/useToast'

type PanelView = 'details' | 'requests' | 'approved'

interface CollectorRequest {
  readonly id: string
  readonly collectorId: string | null
  readonly name: string
  readonly message: string
  readonly timeLabel: string
  readonly status: 'Pending' | 'Approved'
}

interface ListingOffcanvasProps {
  readonly isOpen: boolean
  readonly item: DonorListingItem | null
  readonly onClose: () => void
}

function toInitials(name: string): string {
  const [first = '', second = ''] = name.split(' ')
  return `${first[0] ?? ''}${second[0] ?? ''}`.toUpperCase() || 'NA'
}

function toTitleCase(value: string): string {
  return value
    .split('_')
    .map((entry) => entry.charAt(0).toUpperCase() + entry.slice(1).toLowerCase())
    .join(' ')
}

function statusTone(status: DonorListingItem['status']): string {
  if (status === 'Active') {
    return 'bg-[#A4F5A6] text-[#121212]'
  }

  if (status === 'Claimed') {
    return 'bg-slate-200 text-slate-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return 'Recently'
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return 'Recently'
  }

  const elapsedMs = Date.now() - timestamp
  const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / 60_000))
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} ago`
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60)
  if (elapsedHours < 24) {
    return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`
  }

  const elapsedDays = Math.floor(elapsedHours / 24)
  return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`
}

function formatListedDate(value: string | null): string {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase()
}

function formatReward(item: DonorListingItem): string {
  if (item.reward === null) {
    return 'Pending'
  }

  const normalizedReward =
    Math.abs(item.reward - Math.trunc(item.reward)) < 0.001
      ? String(Math.trunc(item.reward))
      : item.reward.toFixed(1)

  return item.rewardCurrency
    ? `${normalizedReward} ${item.rewardCurrency}`
    : normalizedReward
}

function isPendingClaimStatus(status: string): boolean {
  const normalized = status.toLowerCase()
  return normalized === 'pending' || normalized === 'pending_approval'
}

function isRejectedClaimStatus(status: string): boolean {
  const normalized = status.toLowerCase()
  return (
    normalized === 'rejected' ||
    normalized === 'declined' ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  )
}

function toCollectorRequest(item: DonorListingItem, claim: ListingClaim): CollectorRequest {
  const isPending = isPendingClaimStatus(claim.status)
  return {
    id: claim.id,
    collectorId: claim.collector?.id ?? null,
    name: claim.collector?.name ?? 'Unknown collector',
    message:
      claim.message ??
      `Interested in collecting "${item.title}".`,
    timeLabel: formatRelativeTime(
      claim.createdAt ?? claim.approvedAt ?? claim.completedAt,
    ),
    status: isPending ? 'Pending' : 'Approved',
  }
}

function splitRequests(item: DonorListingItem): {
  readonly pending: CollectorRequest[]
  readonly approved: CollectorRequest[]
} {
  return item.claims.reduce<{
    pending: CollectorRequest[]
    approved: CollectorRequest[]
  }>(
    (current, claim) => {
      if (isRejectedClaimStatus(claim.status)) {
        return current
      }

      const request = toCollectorRequest(item, claim)
      if (request.status === 'Pending') {
        current.pending.push(request)
      } else {
        current.approved.push(request)
      }
      return current
    },
    { pending: [], approved: [] },
  )
}

function CollectorCard({
  request,
  actionSlot,
}: {
  readonly request: CollectorRequest
  readonly actionSlot: ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#A4F5A61A] p-4 text-xl font-bold text-[#15A119]">
            {toInitials(request.name)}
          </span>
          <div className="min-w-0">
            <p className="text-base font-medium text-[#121212]">{request.name}</p>
            <p className="text-sm tracking-wide text-[#121212BF]">{request.message}</p>
            <p className="mt-1 text-[11px] tracking-wide text-[#121212BF]">{request.timeLabel}</p>
          </div>
        </div>
        <span
          className={classNames(
            'rounded-full px-2.5 py-0.5 text-[11px] tracking-wide',
            request.status === 'Pending'
              ? 'bg-[#FBBC051A] text-[#FBBC05]'
              : 'bg-[#A4F5A61A] text-[#15A119]',
          )}
        >
          {request.status}
        </span>
      </div>
      <div className="mt-3">{actionSlot}</div>
    </div>
  )
}

export function ListingOffcanvas({ isOpen, item, onClose }: ListingOffcanvasProps) {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [view, setView] = useState<PanelView>('details')
  const [pendingRequests, setPendingRequests] = useState<CollectorRequest[]>([])
  const [approvedRequests, setApprovedRequests] = useState<CollectorRequest[]>([])
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null)
  const [openingChatRequestId, setOpeningChatRequestId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!item) {
      setPendingRequests([])
      setApprovedRequests([])
      return
    }

    const requests = splitRequests(item)
    setPendingRequests(requests.pending)
    setApprovedRequests(requests.approved)
    setView('details')
  }, [item])

  const conditionLabel = useMemo(
    () => (item ? toTitleCase(item.condition) : ''),
    [item],
  )

  if (!isOpen || !item) {
    return null
  }

  const approveRequest = async (requestId: string) => {
    const request = pendingRequests.find((entry) => entry.id === requestId)
    if (!request) {
      return
    }

    try {
      setApprovingRequestId(requestId)
      await approveDonorListingClaim(request.id)
      setPendingRequests((currentPending) =>
        currentPending.filter((entry) => entry.id !== request.id),
      )
      setApprovedRequests((currentApproved) => [
        ...currentApproved,
        { ...request, status: 'Approved' },
      ])
      success('Claim approved', `${request.name} can now coordinate the handoff.`)
    } catch {
      error('Approval failed', 'Unable to approve this claim right now.')
    } finally {
      setApprovingRequestId(null)
    }
  }

  const rejectRequest = (requestId: string) => {
    setPendingRequests((currentPending) =>
      currentPending.filter((entry) => entry.id !== requestId),
    )
  }

  const openCollectorChat = async (request: CollectorRequest) => {
    if (!request.collectorId) {
      error('Chat unavailable', 'Collector information is unavailable for this request.')
      return
    }

    try {
      setOpeningChatRequestId(request.id)
      const room = await createOrFindRoom(request.collectorId)
      onClose()
      navigate(`/messages?roomId=${encodeURIComponent(room.id)}`)
    } catch {
      error('Unable to open chat', 'Please try again in a moment.')
    } finally {
      setOpeningChatRequestId(null)
    }
  }

  const panelTitle =
    view === 'details'
      ? 'Item Details'
      : view === 'requests'
        ? 'Collector Requests'
        : 'Approved Collectors'
  const panelSubtitle =
    view === 'details'
      ? 'Review the full listing, manage collector requests, and keep track of hand-offs.'
      : item.title

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[180] bg-[#E2E8F080]"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed right-10 top-[72px] z-[181] h-[90vh] w-full max-w-[600px] rounded-lg bg-white p-6 shadow-[0px_4px_20px_0px_#E2E8F080]">
        <div className="flex h-full flex-col gap-5">
          <header className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#121212]">{panelTitle}</h2>
              <p className="max-w-[58ch] text-md text-[#12121299]">{panelSubtitle}</p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#222222BF] hover:bg-slate-200"
              onClick={onClose}
              aria-label="Close listing panel"
            >
              <X size={20} />
            </button>
          </header>

          <hr />

          <div className="flex-1 overflow-y-auto">
            {view === 'details' ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="h-60 w-full object-cover" />
                  ) : (
                    <div className="flex h-60 items-center justify-center text-sm text-[#222222BF]">
                      No image available
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-[#121212]">{item.title}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-[#A4F5A61A] p-2 text-xs font-medium uppercase tracking-wide text-[#15A119]">
                      {conditionLabel}
                    </span>
                    <span className="text-sm text-[#121212BF]">{item.category}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#A4F5A6] bg-[#F8FAFC] px-6 py-5">
                    <p className="text-xs tracking-wide text-[#222222BF]">LISTED</p>
                    <p className="mt-2 text-sm text-[#121212]">{formatListedDate(item.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-[#A4F5A6] bg-[#F8FAFC] px-6 py-5">
                    <p className="text-xs tracking-wide text-[#222222BF]">STATUS</p>
                    <p
                      className={classNames(
                        'mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                        statusTone(item.status),
                      )}
                    >
                      {item.status}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#A4F5A6] bg-[#F8FAFC] px-6 py-5">
                    <p className="text-xs tracking-wide text-[#222222BF]">REWARD</p>
                    <p className="mt-2 inline-flex rounded-full border border-[#E2E8F0] px-2.5 py-1 text-xs font-semibold text-[#121212]">
                      {formatReward(item)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-3">
                  <h4 className="text-lg font-semibold text-[#121212]">Description</h4>
                  <p className="text-sm text-[#121212BF]">{item.description ?? item.meta}</p>
                </div>

                <div className="space-y-3 pb-5 pt-1">
                  <Button variant="primary" className="w-full" onClick={() => setView('requests')}>
                    View Collector Requests
                  </Button>
                  <Button className="w-full" variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}

            {view === 'requests' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#121212]">
                    Pending Requests ({pendingRequests.length})
                  </h3>
                </div>

                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <CollectorCard
                      key={request.id}
                      request={request}
                      actionSlot={
                        <div className="flex gap-3">
                          <Button
                            variant="primary"
                            className="min-w-[130px]"
                            disabled={approvingRequestId === request.id}
                            onClick={() => {
                              void approveRequest(request.id)
                            }}
                          >
                            {approvingRequestId === request.id ? 'Approving...' : 'Approve'}
                          </Button>
                          <Button
                            className="min-w-[130px]"
                            variant="secondary"
                            onClick={() => rejectRequest(request.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    No pending collector requests for this listing.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setView('details')}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setView('approved')}
                    disabled={approvedRequests.length === 0}
                  >
                    View Approved Collectors
                  </Button>
                </div>
              </div>
            ) : null}

            {view === 'approved' ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-[#121212]">
                  Approved Collectors ({approvedRequests.length})
                </h3>
                {approvedRequests.length > 0 ? (
                  approvedRequests.map((request) => (
                    <CollectorCard
                      key={request.id}
                      request={request}
                      actionSlot={
                        <Button
                          variant="primary"
                          className="w-full"
                          disabled={openingChatRequestId === request.id || !request.collectorId}
                          onClick={() => {
                            void openCollectorChat(request)
                          }}
                        >
                          {openingChatRequestId === request.id ? 'Opening chat...' : 'Chat'}
                        </Button>
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    No approved collectors yet.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setView('requests')}>
                    Back
                  </Button>
                  <Button onClick={onClose}>Close</Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>,
    document.body,
  )
}
