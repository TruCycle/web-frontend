import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { cancelFoundItemClaim, claimFoundItem, reportFoundItem } from '../api/foundItemsApi'
import { useFoundItemDetails } from '../hooks/useFoundItemDetails'
import { useFoundItems } from '../hooks/useFoundItems'
import { FoundItemCard } from './components/FoundItemCard'
import { FoundItemDetailsPanel } from './components/FoundItemDetailsPanel'
import { FoundItemsFilterBar } from './components/FoundItemsFilterBar'
import { useToast } from '@/shared/ui/toast/useToast'
import { useAuthSession } from '@/shared/context/useAuthSession'

export default function FoundItemsPage() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const [searchParams] = useSearchParams()
  const {
    items,
    isLoading,
    error: itemsError,
    filters,
    updateFilters,
    refresh,
  } = useFoundItems({
    status: 'available',
    sortBy: 'nearest',
    maxDistance: 5,
  })
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null)
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null)
  const [isReportingId, setIsReportingId] = useState<string | null>(null)
  const {
    item: selectedItem,
    claims,
    viewerClaim,
    isLoading: isLoadingDetails,
    error: detailsError,
    refresh: refreshDetails,
  } = useFoundItemDetails(selectedItemId, user?.id)

  if (searchParams.get('compose') === '1') {
    return <Navigate replace to="/found-items/post" />
  }

  useEffect(() => {
    if (user?.postcode) {
      updateFilters({ postcode: user.postcode })
    }
  }, [updateFilters, user?.postcode])

  const actor = useMemo(
    () => ({
      id: user?.id ?? 'current-user',
      name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
      avatarUrl: null,
    }),
    [user?.firstName, user?.id, user?.lastName],
  )

  const handleClaim = async (itemId: string, message?: string) => {
    try {
      setIsClaimingId(itemId)
      await claimFoundItem(itemId, actor, message)
      await Promise.all([refresh(), refreshDetails()])
      success('Interest sent', 'The poster can now see your request.')
    } catch {
      error('Unable to send request', 'Please try again in a moment.')
    } finally {
      setIsClaimingId(null)
    }
  }

  const handleCancelClaim = async (itemId: string) => {
    try {
      setIsCancellingId(itemId)
      await cancelFoundItemClaim(itemId, user?.id)
      await Promise.all([refresh(), refreshDetails()])
      success('Request cancelled', 'This spot is back on your board as available.')
    } catch {
      error('Unable to cancel request', 'Please try again in a moment.')
    } finally {
      setIsCancellingId(null)
    }
  }

  const handleReport = async (itemId: string, reason: string, details?: string) => {
    try {
      setIsReportingId(itemId)
      await reportFoundItem(itemId, reason, details)
      await Promise.all([refresh(), refreshDetails()])
      success('Report sent', 'We have flagged this spot for review.')
    } catch {
      error('Unable to send report', 'Please try again in a moment.')
    } finally {
      setIsReportingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Found Items</h1>
          <p className="text-slate-500">Nearby curb alerts and community pickups.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/found-items/my-posts"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            My Posts
          </Link>
          <Link
            to="/found-items/post"
            className="inline-flex items-center rounded-xl bg-tc-action-primary px-4 py-3 text-sm font-medium text-tc-action-primaryText transition hover:bg-tc-action-primaryHover"
          >
            Post Item
          </Link>
        </div>
      </div>

      <FoundItemsFilterBar filters={filters} onUpdate={updateFilters} />

      {itemsError ? <p className="text-sm text-rose-600">{itemsError}</p> : null}
      {detailsError ? <p className="text-sm text-rose-600">{detailsError}</p> : null}

      <div className="space-y-4">
        {isLoading ? <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">Loading board...</p> : null}

        {!isLoading && items.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
            Nothing nearby yet.
          </p>
        ) : null}

        <div className="space-y-3">
          {items.map((item) => (
            <FoundItemCard
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onClick={() => setSelectedItemId(item.id)}
            />
          ))}
        </div>
      </div>

      <FoundItemDetailsPanel
        isOpen={Boolean(selectedItemId)}
        onClose={() => setSelectedItemId(null)}
        item={selectedItem}
        claims={claims}
        viewerClaim={viewerClaim}
        currentUserId={user?.id}
        isLoading={isLoadingDetails}
        isClaiming={isClaimingId === selectedItem?.id}
        isCancelling={isCancellingId === selectedItem?.id}
        isReporting={isReportingId === selectedItem?.id}
        onClaim={(itemId, message) => {
          void handleClaim(itemId, message)
        }}
        onCancelClaim={(itemId) => {
          void handleCancelClaim(itemId)
        }}
        onReport={(itemId, reason, details) => {
          void handleReport(itemId, reason, details)
        }}
      />
    </div>
  )
}
