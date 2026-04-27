import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { claimFoundItem, createFoundItem } from '../api/foundItemsApi'
import { useFoundItemDetails } from '../hooks/useFoundItemDetails'
import { useFoundItems } from '../hooks/useFoundItems'
import type { CreateFoundItemPayload } from '../types'
import { FoundItemCard } from './components/FoundItemCard'
import { FoundItemDetailsPanel } from './components/FoundItemDetailsPanel'
import { FoundItemsFilterBar } from './components/FoundItemsFilterBar'
import { PostFoundItemForm } from './components/PostFoundItemForm'
import { useToast } from '@/shared/ui/toast/useToast'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { Modal } from '@/shared/ui/modal/Modal'
import { env } from '@/shared/lib/config/env'

export default function FoundItemsPage() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    item: selectedItem,
    claims,
    isLoading: isLoadingDetails,
    error: detailsError,
    refresh: refreshDetails,
  } = useFoundItemDetails(selectedItemId, user?.id)
  const isComposeOpen = searchParams.get('compose') === '1'

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
  const defaultPostcode = user?.postcode?.trim() || env.defaultSearchPostcode

  const setComposeOpen = (nextOpen: boolean) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextOpen) {
      nextSearchParams.set('compose', '1')
    } else {
      nextSearchParams.delete('compose')
    }
    setSearchParams(nextSearchParams)
  }

  const handleClaim = async (itemId: string) => {
    try {
      setIsClaimingId(itemId)
      await claimFoundItem(itemId, actor)
      await Promise.all([refresh(), refreshDetails()])
      success('Interest sent', 'The poster can now see your request.')
    } catch {
      error('Unable to send request', 'Please try again in a moment.')
    } finally {
      setIsClaimingId(null)
    }
  }

  const handleCreateFoundItem = async (payload: CreateFoundItemPayload) => {
    try {
      setIsSubmitting(true)
      await createFoundItem(payload, actor)
      setComposeOpen(false)
      await refresh()
      success('Posted', 'Your item is live on the board.')
    } catch {
      error('Post failed', 'Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
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
          <button
            type="button"
            className="inline-flex items-center rounded-xl bg-tc-action-primary px-4 py-3 text-sm font-medium text-tc-action-primaryText transition hover:bg-tc-action-primaryHover"
            onClick={() => setComposeOpen(true)}
          >
            Post Item
          </button>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        currentUserId={user?.id}
        isLoading={isLoadingDetails}
        isClaiming={isClaimingId === selectedItem?.id}
        onClaim={(itemId) => {
          void handleClaim(itemId)
        }}
      />

      <Modal
        isOpen={isComposeOpen}
        onClose={() => setComposeOpen(false)}
        closeOnOverlayClick={!isSubmitting}
        containerClassName="max-w-[720px]"
      >
        <div className="space-y-5 p-6 sm:p-7">
          <div className="pr-9">
            <h2 className="text-xl font-semibold text-slate-900">Post Found Item</h2>
            <p className="text-sm text-slate-500">Quick, clear, nearby.</p>
          </div>

          <PostFoundItemForm
            defaultPostcode={defaultPostcode}
            isSubmitting={isSubmitting}
            onSubmit={handleCreateFoundItem}
          />
        </div>
      </Modal>
    </div>
  )
}
