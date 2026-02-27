import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react'
import cautionIcon from '@/assets/icons/caution-icon.svg'
import { Button } from '@/shared/ui/button/Button'
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog'
import { QRCodeDialog } from '@/shared/ui/modal/QRCodeDialog'
import { CollectionSuccessDialog } from '@/shared/ui/modal/CollectionSuccessDialog'
import { useCollectedItems } from '@/features/collected/hooks/useCollectedItems'
import type { CollectedItem } from '@/features/items/types'
import { useToast } from '@/shared/ui/toast/useToast'

function statusLabel(claimStatus: string): 'Collected' | 'Claimed' {
  if (claimStatus === 'complete' || claimStatus === 'completed') {
    return 'Collected'
  }
  return 'Claimed'
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
    completeCollection,
  } = useCollectedItems()
  const [selectedItem, setSelectedItem] = useState<CollectedItem | null>(null)
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Selected Items</h1>
        <p className="text-slate-500">Track your claimed items and complete collections.</p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {isLoading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Loading collected items...
        </p>
      ) : null}

      {bannerItem ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lime-700">
              <CircleAlert size={20} strokeWidth={2} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">
                Item {bannerItem.item.title} is ready for pickup
              </h4>
              <p className="text-sm text-slate-600">
                Scan at pickup location to complete this collection.
              </p>
            </div>
          </div>
          <Button onClick={() => setQrItem(bannerItem)}>Open QR Scanner</Button>
        </div>
      ) : null}

      {!isLoading && !hasItems ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
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
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {items.map((item) => (
            <div
              key={item.claimId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-center gap-3">
                {item.item.image ? (
                  <img
                    src={item.item.image.url}
                    alt={item.item.title}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                    No image
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{item.item.title}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusLabel(item.claimStatus) === 'Claimed'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {statusLabel(item.claimStatus)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {item.item.category} · From {item.item.ownerName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setSelectedItem(item)}>
                  View Details
                </Button>
                {statusLabel(item.claimStatus) === 'Claimed' ? (
                  <Button onClick={() => setQrItem(item)}>Open QR Scanner</Button>
                ) : null}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="rounded-md bg-lime-100 px-3 py-1 text-sm font-semibold text-slate-800">
              1
            </span>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}

      <ItemDetailsDialog
        isOpen={Boolean(dialogItem)}
        onClose={() => setSelectedItem(null)}
        item={dialogItem}
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
