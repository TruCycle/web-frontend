import { useMemo, useState } from 'react'
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
  const [searchParams] = useSearchParams()
  return searchParams.get('compose') === '1'
    ? <Navigate replace to="/found-items/post" />
    : <FoundItemsBoard />
}

function FoundItemsBoard() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const {
    items,
    isLoading,
    error: itemsError,
    filters,
    updateFilters,
    refresh,
    pagination,
    loadMore,
  } = useFoundItems({
    includeRecentClosed: true,
    sortBy: user?.postcode ? 'nearest' : 'newest',
    maxDistance: user?.postcode ? 5 : undefined,
    postcode: user?.postcode || undefined,
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
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.02em] text-tc-brand-ink">Found Items</h1>
          <p className="text-base leading-6 text-tc-brand-body">Nearby curb alerts and community pickups.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/found-items/my-posts"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 py-3 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft"
          >
            My Posts
          </Link>
          <Link
            to="/found-items/post"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md bg-tc-brand-deep px-4 py-3 text-sm font-semibold text-white transition hover:bg-tc-brand-hover"
          >
            Post Item
          </Link>
        </div>
      </div>

      <FoundItemsFilterBar filters={filters} onUpdate={updateFilters} />

      {itemsError ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{itemsError}</p> : null}
      {detailsError ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{detailsError}</p> : null}

      <div className="flex flex-col gap-4">
        {isLoading ? <p className="rounded-tc-lg border border-tc-brand-line bg-white p-6 text-sm text-tc-brand-body">Loading board...</p> : null}

        {!isLoading && items.length === 0 ? (
          <p className="rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center text-sm text-tc-brand-body">
            Nothing nearby yet.
          </p>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
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

      {pagination && pagination.page < pagination.totalPages ? <button disabled={isLoading} onClick={() => { void loadMore() }} className="self-center inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 py-3 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50">Load more spots</button> : null}
      <FoundItemDetailsPanel
        isOpen={Boolean(selectedItemId)}
        onClose={() => setSelectedItemId(null)}
        onLifecycleChange={() => { void Promise.all([refresh(), refreshDetails()]) }}
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
