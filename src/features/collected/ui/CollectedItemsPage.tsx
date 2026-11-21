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
import { Modal } from '@/shared/ui/modal/Modal'

function statusLabel(claimStatus: string): string {
  const labels: Record<string, string> = {
    pending_approval: 'Awaiting approval',
    approved: 'Ready for collection',
    complete: 'Collected',
    completed: 'Collected',
    rejected: 'Request declined',
    cancelled: 'Request cancelled',
  }
  return labels[claimStatus.toLowerCase()] ?? 'Status unavailable'
}

function statusTone(claimStatus: string): 'claimed' | 'collected' {
  return statusLabel(claimStatus) === 'Collected' ? 'collected' : 'claimed'
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
  const [manualItem, setManualItem] = useState<CollectedItem | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)
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

  const confirmManualCollection = async () => {
    if (!manualItem || isCollecting) return
    setManualError(null)
    try {
      await completeCollection({ itemId: manualItem.item.id })
      setCollectedItemName(manualItem.item.title)
      setManualItem(null)
      setShowSuccessDialog(true)
      success('Collection recorded', 'The handoff has been completed successfully.')
    } catch {
      setManualError('Collection was not confirmed. Check the item status before retrying.')
      toastError('Collection could not be confirmed', 'Check the item status before retrying.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6">
      <div>
        <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">My Selected Items</h1>
        <p className="mt-1 text-base leading-6 text-tc-brand-body">Track your claimed items and complete collections.</p>
      </div>

      {error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{error}</p> : null}

      {isLoading ? (
        <div className="space-y-3 rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`collected-item-shimmer-${index}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-tc-md border border-tc-brand-line p-3"
            >
              <div className="flex items-center gap-3">
                <span className="tc-shimmer-block block h-16 w-16 rounded-tc-md" />
                <div className="space-y-2">
                  <span className="tc-shimmer-block block h-5 w-40 rounded-md" />
                  <span className="tc-shimmer-block block h-4 w-48 rounded-md" />
                </div>
              </div>
              <div className="flex gap-2">
                <span className="tc-shimmer-block block h-9 w-24 rounded-tc-md" />
                <span className="tc-shimmer-block block h-9 w-32 rounded-tc-md" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {bannerItem ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-tc-lg border border-tc-brand-mintLine bg-tc-brand-mintSoft p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center rounded-full text-tc-brand-deep">
              <CircleAlert size={20} strokeWidth={2} />
            </div>
            <div>
              <h4 className="font-semibold text-tc-brand-ink">
                Item {bannerItem.item.title} is ready for pickup
              </h4>
              <p className="text-sm text-tc-brand-body">
                Scan at pickup location to complete this collection.
              </p>
            </div>
          </div>
          <Button variant='primary' onClick={() => setQrItem(bannerItem)}>Open QR Scanner</Button>
        </div>
      ) : null}

      {!isLoading && !hasItems ? (
        <div className="rounded-tc-lg border border-tc-brand-line bg-white px-6 py-12 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-deep">
            <img src={cautionIcon} alt="Caution" className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-7 text-tc-brand-ink">No items collected yet</h2>
          <p className="mx-auto mt-1 max-w-[45ch] text-sm leading-5 text-tc-brand-body">
            Once you claim an item and it&apos;s approved by the donor, it will appear here.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/browse')}>Browse Items</Button>
          </div>
        </div>
      ) : null}

      {!isLoading && hasItems ? (
        <div className="space-y-3 rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
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
                  {item.claimStatus.toLowerCase() === 'approved' && item.item.pickupOption.toLowerCase() === 'exchange' ? (
                    <Button variant="primary" disabled={isCollecting} onClick={() => { setManualError(null); setManualItem(item) }}>
                      Confirm collection
                    </Button>
                  ) : null}
                  {shouldShowQrPreviewAction(item) ? (
                    <Button
                      variant="primary"
                      className="h-11 w-11 rounded-tc-md p-0"
                      onClick={() => setSelectedQrPreviewItem(item)}
                      aria-label="Open item QR code"
                      title="Open item QR code"
                    >
                      <QrCode size={22} />
                    </Button>
                  ) : null}
                  <Button
                    variant="secondary"
                    className="shrink-0"
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

      <Modal
        isOpen={Boolean(manualItem)}
        onClose={() => { if (!isCollecting) setManualItem(null) }}
        ariaLabel="Confirm collection"
      >
        <div className="space-y-5 p-6">
          <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Confirm collection</h2>
          <p>Confirm only after you have received {manualItem?.item.title} from the donor.</p>
          {manualError ? <p role="alert" className="text-sm text-tc-brand-danger">{manualError}</p> : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" disabled={isCollecting} onClick={() => setManualItem(null)}>Cancel</Button>
            <Button variant="primary" disabled={isCollecting} onClick={() => void confirmManualCollection()}>
              {isCollecting ? 'Recording collection…' : 'I have received this item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
