import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog'
import { ActiveListingDialog } from '@/shared/ui/modal/ActiveListingDialog'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { ListingsLoadingState } from '@/features/listings/ui/components/ListingsLoadingState'
import { ListingRow } from '@/features/listings/ui/components/ListingRow'
import { useDonorListings } from '@/features/listings/hooks/useDonorListings'
import type { DonorListingItem } from '@/features/listings/types'
import { useToast } from '@/shared/ui/toast/useToast'
import { NewItemButton } from '@/shared/ui/button/NewItemButton'

export default function YourListingsPage() {
  const { success, error: toastError } = useToast()
  const { listings, isLoading, error, removingId, removeListing, reload } = useDonorListings(true)
  const [selectedItem, setSelectedItem] = useState<DonorListingItem | null>(null)
  const [selectedActiveItem, setSelectedActiveItem] = useState<DonorListingItem | null>(null)
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)

  const hasListings = listings.length > 0

  const itemDetailsDialogItem = useMemo(() => {
    if (!selectedItem) {
      return null
    }

    return {
      title: selectedItem.title,
      image: selectedItem.imageUrl ?? undefined,
      status: selectedItem.status,
      category: selectedItem.category,
      condition: selectedItem.condition,
    }
  }, [selectedItem])

  const activeListingDialogItem = useMemo(() => {
    if (!selectedActiveItem) {
      return null
    }

    return {
      title: selectedActiveItem.title,
      status: selectedActiveItem.status,
      category: selectedActiveItem.category,
      condition: selectedActiveItem.condition,
      image: selectedActiveItem.imageUrl ?? undefined,
    }
  }, [selectedActiveItem])

  const handleRemoveListing = async (listingId: string) => {
    try {
      await removeListing(listingId)
      success('Listing removed', 'The item listing has been removed successfully.')
    } catch {
      toastError('Remove failed', 'Unable to remove listing right now.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Listed Items</h1>
          <p className="text-slate-500">Manage active, claimed and completed donor listings.</p>
        </div>
        <NewItemButton onClick={() => setIsListItemDialogOpen(true)} />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ListingsLoadingState count={3} showHeading />
        </div>
      ) : !hasListings ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-lime-700">
            <Plus size={24} />
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-900">Your listed items will be displayed here</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <NewItemButton onClick={() => setIsListItemDialogOpen(true)} />
            <Button
              variant="secondary"
              onClick={() => {
                void reload()
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Your Listings</h2>
          {listings.map((item) => (
            <ListingRow
              key={item.id}
              item={item}
              removingId={removingId}
              onOpenActive={setSelectedActiveItem}
              onOpenDetails={setSelectedItem}
              onRemove={(listingId) => {
                void handleRemoveListing(listingId)
              }}
            />
          ))}

          <div className="flex items-center justify-between pt-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="flex items-center gap-1">
              <span className="rounded-md bg-lime-100 px-3 py-1 text-sm font-semibold text-slate-800">1</span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ItemDetailsDialog
        isOpen={Boolean(itemDetailsDialogItem)}
        onClose={() => setSelectedItem(null)}
        item={itemDetailsDialogItem}
      />

      <ActiveListingDialog
        isOpen={Boolean(activeListingDialogItem)}
        onClose={() => setSelectedActiveItem(null)}
        item={activeListingDialogItem}
      />

      <ListItemDialog
        isOpen={isListItemDialogOpen}
        onClose={() => {
          setIsListItemDialogOpen(false)
          void reload()
        }}
      />
    </div>
  )
}
