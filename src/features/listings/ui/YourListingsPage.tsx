import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { ListingsLoadingState } from '@/features/listings/ui/components/ListingsLoadingState'
import { ListingRow } from '@/features/listings/ui/components/ListingRow'
import { ListingOffcanvas } from '@/features/listings/ui/components/ListingOffcanvas'
import { useDonorListings } from '@/features/listings/hooks/useDonorListings'
import type { DonorListingItem } from '@/features/listings/types'
import { useToast } from '@/shared/ui/toast/useToast'
import { NewItemButton } from '@/shared/ui/button/NewItemButton'
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls'

export default function YourListingsPage() {
  const { success, error: toastError } = useToast()
  const {
    listings,
    isLoading,
    error,
    removingId,
    removeListing,
    reload,
    currentPage,
    totalPages,
    canGoPrevious,
    canGoNext,
    previousPage,
    nextPage,
    goToPage,
  } = useDonorListings({ enabled: true, limit: 6 })
  const [selectedListing, setSelectedListing] = useState<DonorListingItem | null>(null)
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)

  const hasListings = listings.length > 0

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
              variant="danger"
              onClick={() => {
                void reload()
              }}
            >
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative space-y-3 rounded-2xl bg-white p-5 px-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Your Listings</h2>
          {listings.map((item) => (
            <ListingRow
              key={item.id}
              item={item}
              removingId={removingId}
              onOpenActive={setSelectedListing}
              onOpenDetails={setSelectedListing}
              onRemove={(listingId) => {
                void handleRemoveListing(listingId)
              }}
            />
          ))}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={previousPage}
            onNext={nextPage}
            onPageChange={goToPage}
          />

          <ListingOffcanvas
            key={selectedListing?.id ?? 'closed'}
            isOpen={Boolean(selectedListing)}
            item={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        </div>
      )}

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
