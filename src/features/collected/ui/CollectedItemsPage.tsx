import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, QrCode } from 'lucide-react'
import cautionIcon from '@/assets/icons/caution-icon.svg'
import { useCollectedItems } from '@/features/collected/hooks/useCollectedItems'
import type { CollectedItem } from '@/features/items/types'
import { useToast } from '@/shared/ui/toast/useToast'
import { Button } from '@/shared/ui/button/Button'
import { ItemRowCard } from '@/shared/ui/item/ItemRowCard'
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog'
import { ItemQrCodeDialog } from '@/shared/ui/modal/ItemQrCodeDialog'
import { QRCodeDialog } from '@/shared/ui/modal/QRCodeDialog'
import { CollectionSuccessDialog } from '@/shared/ui/modal/CollectionSuccessDialog'
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls'

function statusLabel(claimStatus: string): 'Collected' | 'Claimed' {
  if (claimStatus === 'complete' || claimStatus === 'completed') {
    return 'Collected'
  }
  return 'Claimed'
}

function statusTone(claimStatus: string): 'claimed' | 'collected' {
  return statusLabel(claimStatus) === 'Claimed' ? 'claimed' : 'collected'
}

export default function CollectedItemsPage() {
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const {
    items,
    pendingCollectionItems,
    isLoading,
    isCollecting,
    error,
    currentPage,
    totalPages,
    canGoPrevious,
    canGoNext,
    previousPage,
    nextPage,
    goToPage,
    completeCollection,
  } = useCollectedItems({ limit: 6 })
  const [selectedItem, setSelectedItem] = useState<CollectedItem | null>(null)
  const [selectedQrPreviewItem, setSelectedQrPreviewItem] = useState<CollectedItem | null>(null)
  const [qrItem, setQrItem] = useState<CollectedItem | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [collectedItemName, setCollectedItemName] = useState('')

  const hasItems = items.length > 0
  const bannerItem = pendingCollectionItems[0] ?? null

  const dialogItem = useMemo(() => {
    if (!selectedItem) {
      return null
    }

    return {
      title: selectedItem.item.title,
      image: selectedItem.item.image?.url ?? '',
      status: statusLabel(selectedItem.claimStatus),
      category: selectedItem.item.category,
      condition: selectedItem.item.condition,
      location: selectedItem.item.locationLabel,
    }
  }, [selectedItem])

  const handleCollectSuccess = async (payload: string) => {
    if (!qrItem) {
      return
    }

    try {
      await completeCollection({
        itemId: qrItem.item.id,
        qrPayload: payload,
        shopId: qrItem.item.dropoffLocationId ?? undefined,
      })
      setCollectedItemName(qrItem.item.title)
      setQrItem(null)
      setShowSuccessDialog(true)
      success('Collection recorded', 'The handoff has been completed successfully.')
    } catch {
      toastError('Collection failed', 'Please verify the QR and try again.')
    }
  }

  const shouldShowQrPreviewAction = (item: CollectedItem): boolean => {
    return (
      item.claimStatus.toLowerCase() === 'approved' &&
      item.item.pickupOption.toLowerCase() === 'donate' &&
      Boolean(item.item.qrCode)
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Selected Items</h1>
        <p className="text-slate-500">Track your claimed items and complete collections.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {isLoading ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`collected-item-shimmer-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="tc-shimmer-block block h-16 w-16 rounded-lg" />
                <div className="space-y-2">
                  <span className="tc-shimmer-block block h-5 w-40 rounded-md" />
                  <span className="tc-shimmer-block block h-4 w-48 rounded-md" />
                </div>
              </div>
              <div className="flex gap-2">
                <span className="tc-shimmer-block block h-9 w-24 rounded-xl" />
                <span className="tc-shimmer-block block h-9 w-32 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {bannerItem ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#A6F4A5A6] bg-[#A4F5A60D] p-3">
          <div className="flex items-start gap-3 ms-3">
            <div className="inline-flex items-center justify-center rounded-full text-[#A4F5A6]">
              <CircleAlert size={20} strokeWidth={2} />
            </div>
            <div>
              <h4 className="font-medium text-[#222222]">
                Item {bannerItem.item.title} is ready for pickup
              </h4>
              <p className="text-sm text-[#222222BF]">
                Scan at pickup location to complete this collection.
              </p>
            </div>
          </div>
          <Button variant='primary' onClick={() => setQrItem(bannerItem)}>Open QR Scanner</Button>
        </div>
      ) : null}

      {!isLoading && !hasItems ? (
        <div className="rounded-2xl bg-white p-8 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
            <img src={cautionIcon} alt="Caution" className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">No items collected yet</h2>
          <p className="mx-auto mt-2 max-w-[45ch] text-sm text-slate-500">
            Once you claim an item and it&apos;s approved by the donor, it will appear here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/browse')}>Browse Items</Button>
          </div>
        </div>
      ) : null}

      {!isLoading && hasItems ? (
        <div className="space-y-3 rounded-2xl bg-white p-4">
          {items.map((item) => (
            <ItemRowCard
              key={item.claimId}
              title={item.item.title}
              subtitle={`${item.item.category} - From ${item.item.ownerName}`}
              statusLabel={statusLabel(item.claimStatus)}
              statusTone={statusTone(item.claimStatus)}
              imageUrl={item.item.image?.url ?? null}
              imageAlt={item.item.title}
              actions={
                <>
                  {shouldShowQrPreviewAction(item) ? (
                    <Button
                      variant="primary"
                      className="h-10 w-10 rounded-xl p-0"
                      onClick={() => setSelectedQrPreviewItem(item)}
                      aria-label="Open item QR code"
                      title="Open item QR code"
                    >
                      <QrCode size={18} />
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    className="bg-[#F8FAFC] text-[#222222] ring-0 hover:bg-slate-100"
                    onClick={() => setSelectedItem(item)}
                  >
                    View Details
                  </Button>
                </>
              }
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
        </div>
      ) : null}

      <ItemDetailsDialog
        isOpen={Boolean(dialogItem)}
        onClose={() => setSelectedItem(null)}
        item={dialogItem}
      />

      <ItemQrCodeDialog
        isOpen={Boolean(selectedQrPreviewItem)}
        onClose={() => setSelectedQrPreviewItem(null)}
        itemTitle={selectedQrPreviewItem?.item.title ?? 'Item'}
        qrCodeUrl={selectedQrPreviewItem?.item.qrCode ?? null}
      />

      <QRCodeDialog
        isOpen={Boolean(qrItem)}
        onClose={() => setQrItem(null)}
        item={qrItem}
        onCollect={handleCollectSuccess}
        isCollecting={isCollecting}
      />

      <CollectionSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        itemName={collectedItemName}
      />
    </div>
  )
}
