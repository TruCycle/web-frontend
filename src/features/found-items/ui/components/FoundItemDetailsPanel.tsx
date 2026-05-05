import { useEffect, useState, type ReactNode } from 'react'
import { Clock3, Flag, MapPin, Scale, Sparkles, Users } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'
import type { FoundItem, FoundItemClaim } from '../../types'
import { FoundItemStatusBadge } from './FoundItemStatusBadge'
import { formatFoundItemAttribution, formatFoundItemLocationSummary } from './foundItemDisplay'

function StatTile({
  label,
  value,
  icon,
}: {
  readonly label: string
  readonly value: string
  readonly icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-slate-950 sm:text-xl">{value}</p>
    </div>
  )
}

interface FoundItemDetailsPanelProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly item: FoundItem | null
  readonly claims: FoundItemClaim[]
  readonly viewerClaim?: FoundItemClaim | null
  readonly currentUserId?: string
  readonly isLoading?: boolean
  readonly isClaiming?: boolean
  readonly isCancelling?: boolean
  readonly isReporting?: boolean
  readonly onClaim?: (itemId: string, message?: string) => void
  readonly onCancelClaim?: (itemId: string) => void
  readonly onReport?: (itemId: string, reason: string, details?: string) => void
}

export function FoundItemDetailsPanel({
  isOpen,
  onClose,
  item,
  claims,
  viewerClaim = null,
  currentUserId,
  isLoading = false,
  isClaiming = false,
  isCancelling = false,
  isReporting = false,
  onClaim,
  onCancelClaim,
  onReport,
}: FoundItemDetailsPanelProps) {
  const [claimMessage, setClaimMessage] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')

  useEffect(() => {
    setClaimMessage(viewerClaim?.message ?? '')
    setReportReason('')
    setReportDetails('')
  }, [item?.id, viewerClaim?.id, viewerClaim?.message])

  if (!isOpen) {
    return null
  }

  const primaryImage = item?.images[0]
  const isOwnPost = item ? currentUserId === item.poster.id : false
  const isClosed =
    item?.status === 'picked_up' || item?.status === 'expired' || item?.status === 'reported'
  const hasActiveViewerClaim =
    viewerClaim !== null && (viewerClaim.status === 'pending' || viewerClaim.status === 'acknowledged')

  return (
    <Modal isOpen={isOpen} onClose={onClose} containerClassName="max-w-[860px]">
      <div className="space-y-5 p-5 sm:p-6">
        {isLoading ? <p className="text-sm text-slate-500">Loading item...</p> : null}

        {!isLoading && !item ? <p className="text-sm text-slate-500">Choose an item to inspect.</p> : null}

        {!isLoading && item ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.95fr)]">
              <div className="space-y-5">
                {primaryImage ? (
                  <img src={primaryImage.url} alt={item.title} className="h-72 w-full rounded-[28px] object-cover" />
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-[28px] bg-slate-100 text-sm text-slate-500">
                    No image
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <StatTile
                    label="Impact"
                    value={`${item.estimatedCo2eKg} kg CO2e`}
                    icon={<Sparkles size={16} />}
                  />
                  <StatTile
                    label="Community score"
                    value={`${item.impactPoints} pts`}
                    icon={<Users size={16} />}
                  />
                  <StatTile
                    label="Estimated weight"
                    value={`${item.weightKg ?? 0} kg`}
                    icon={<Scale size={16} />}
                  />
                  <StatTile
                    label="Postcode"
                    value={item.location.postcode}
                    icon={<MapPin size={16} />}
                  />
                </div>

                {isOwnPost ? (
                  <div className="space-y-3 rounded-[24px] bg-[#F8FAFC] p-4">
                    <p className="text-sm font-medium text-slate-900">Your post</p>
                    {claims.length > 0 ? (
                      <div className="space-y-2">
                        {claims.map((claim) => (
                          <div key={claim.id} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                            <p className="text-sm font-medium text-slate-900">{claim.claimerName}</p>
                            <p className="text-xs text-slate-500">{claim.message || 'No note added.'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No pickup requests yet.</p>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">
                        {item.title}
                      </h2>
                      <FoundItemStatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{formatFoundItemAttribution(item)}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-[24px] border border-slate-200 p-5 text-sm text-slate-500">
                  <div className="flex items-start gap-2 leading-6">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>{formatFoundItemLocationSummary(item)}</span>
                  </div>
                  <div className="flex items-center gap-2 leading-6">
                    <Clock3 size={16} />
                    {formatRelativeTime(item.postedAt)}
                  </div>
                  <div className="flex items-center gap-2 leading-6">
                    <Users size={16} />
                    {item.claimCount} interested · {item.viewCount} views
                  </div>
                  <div className="flex items-center gap-2 leading-6">
                    <Flag size={16} />
                    {item.isFlyTipped ? 'Marked as fly-tipped' : 'Standard public-space post'}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Notes
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>

                {!isOwnPost ? (
                  <div className="space-y-4 rounded-[24px] border border-slate-200 bg-[#F8FAFC] p-4">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Pickup note
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {hasActiveViewerClaim
                          ? 'Your request is live. You can cancel it here while the spot is still open.'
                          : 'Add a short note so the poster knows what you need before pickup.'}
                      </p>
                    </div>

                    <textarea
                      value={claimMessage}
                      onChange={(event) => setClaimMessage(event.target.value)}
                      disabled={hasActiveViewerClaim}
                      className="min-h-[104px] w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA] disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Interested in picking this up today. Happy to message before I head over."
                    />

                    {!hasActiveViewerClaim ? (
                      <Button
                        variant="primary"
                        className="w-full"
                        disabled={isClaiming || isClosed || item.status === 'claimed'}
                        onClick={() => {
                          onClaim?.(item.id, claimMessage)
                        }}
                      >
                        {item.status === 'claimed'
                          ? 'Interest sent'
                          : isClaiming
                            ? 'Sending...'
                            : 'Send pickup request'}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full"
                        disabled={isCancelling || isClosed}
                        onClick={() => {
                          onCancelClaim?.(item.id)
                        }}
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel request'}
                      </Button>
                    )}

                    {item.status !== 'reported' ? (
                      <div className="space-y-3 rounded-[20px] border border-slate-200 bg-white p-4">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Report this post
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Flag unsafe, misleading or duplicate spots so they can be reviewed.
                          </p>
                        </div>

                        <input
                          value={reportReason}
                          onChange={(event) => setReportReason(event.target.value)}
                          className="h-12 w-full rounded-[16px] border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                          placeholder="Reason for reporting"
                        />

                        <textarea
                          value={reportDetails}
                          onChange={(event) => setReportDetails(event.target.value)}
                          className="min-h-[96px] w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                          placeholder="Extra details (optional)"
                        />

                        <Button
                          variant="danger"
                          className="w-full"
                          disabled={isReporting || !reportReason.trim() || isClosed}
                          onClick={() => {
                            onReport?.(item.id, reportReason, reportDetails)
                          }}
                        >
                          {isReporting ? 'Sending report...' : 'Send report'}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  )
}
