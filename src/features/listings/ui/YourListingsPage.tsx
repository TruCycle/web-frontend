import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { ItemQrCodeDialog } from '@/shared/ui/modal/ItemQrCodeDialog'
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
  const [selectedQrListing, setSelectedQrListing] = useState<DonorListingItem | null>(null)
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

  const shouldShowQrAction = (item: DonorListingItem): boolean => {
    if (!item.qrCode) {
      return false
    }

    const normalizedPickupOption = item.pickupOption.toLowerCase()
    const hasApprovedClaim =
      item.claims.some((claim) => claim.status.toLowerCase() === 'approved') ||
      item.claimStatus?.toLowerCase() === 'approved'
    const isNonActive = item.status !== 'Active'

    if (normalizedPickupOption === 'exchange' && hasApprovedClaim) {
      return true
    }

    if ((normalizedPickupOption === 'donate' || normalizedPickupOption === 'donor') && isNonActive) {
      return true
    }

    return false
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">My Listed Items</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Manage active, claimed and completed donor listings.</p>
        </div>
        <NewItemButton onClick={() => setIsListItemDialogOpen(true)} />
      </div>

      {error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{error}</p> : null}

      {isLoading ? (
        <div className="rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
          <ListingsLoadingState count={3} showHeading />
        </div>
      ) : !hasListings ? (
        <div className="rounded-tc-lg border border-tc-brand-line bg-white px-6 py-12 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
            <Plus size={24} />
          </div>
          <p className="mt-3 text-lg font-semibold leading-7 text-tc-brand-ink">Your listed items will be displayed here</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <NewItemButton onClick={() => setIsListItemDialogOpen(true)} />
            <Button
              variant="secondary"
              className="h-11 w-11 p-0"
              aria-label="Refresh listings"
              title="Refresh listings"
              onClick={() => {
                void reload()
              }}
            >
              <RefreshCw size={18} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative space-y-3 rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
          <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Your Listings</h2>
          {listings.map((item) => (
            <ListingRow
              key={item.id}
              item={item}
              removingId={removingId}
              onOpenActive={setSelectedListing}
              onOpenDetails={setSelectedListing}
              onOpenQr={setSelectedQrListing}
              showQrAction={shouldShowQrAction(item)}
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

          <ItemQrCodeDialog
            isOpen={Boolean(selectedQrListing)}
            onClose={() => setSelectedQrListing(null)}
            itemTitle={selectedQrListing?.title ?? 'Item'}
            qrCodeUrl={selectedQrListing?.qrCode ?? null}
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
